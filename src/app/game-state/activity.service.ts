/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Injector } from '@angular/core';
import { BattleService } from './battle.service';
import { Activity, ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { AttributeType, CharacterAttribute, StatusType } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService, HomeType } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ImpossibleTaskService, ImpossibleTaskType } from './impossibleTask.service';
import { Follower, FollowersService } from './followers.service';
import { HellLevel, HellService } from './hell.service';

export interface ActivityProperties {
  autoRestart: boolean;
  pauseOnDeath: boolean;
  pauseBeforeDeath: boolean;
  activityLoop: ActivityLoopEntry[];
  unlockedActivities: ActivityType[];
  discoveredActivities: ActivityType[];
  openApprenticeships: number;
  spiritActivity: ActivityType | null;
  completedApprenticeships: ActivityType[];
  currentApprenticeship: ActivityType | undefined;
  savedActivityLoop: ActivityLoopEntry[];
  savedActivityLoop2: ActivityLoopEntry[];
  savedActivityLoop3: ActivityLoopEntry[];
  autoPauseUnlocked: boolean;
  autoRestUnlocked: boolean;
  pauseOnImpossibleFail: boolean;
  totalExhaustedDays: number;
  purifyGemsUnlocked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  savedActivityLoop: ActivityLoopEntry[] = [];
  savedActivityLoop2: ActivityLoopEntry[] = [];
  savedActivityLoop3: ActivityLoopEntry[] = [];
  spiritActivity: ActivityType | null = null;
  autoRestart = false;
  autoPauseUnlocked = false;
  pauseOnImpossibleFail = true;
  pauseOnDeath = true;
  pauseBeforeDeath = false;
  activities: Activity[];
  openApprenticeships = 1;
  oddJobDays = 0;
  beggingDays = 0;
  completedApprenticeships: ActivityType[] = [];
  currentIndex = 0;
  currentTickCount = 0;
  exhaustionDays = 0;
  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentApprenticeship: ActivityType | undefined = undefined;
  activityDeath = false; // Simpler to just check a flag for the achievement.
  autoRestUnlocked = false;
  totalExhaustedDays = 0;
  activityHeader = '';
  activityHeaderDescription = '';
  hellService?: HellService;
  spiritActivityProgress = false;
  purifyGemsUnlocked = false;
  private trainingFollowersDays = 0;
  private trainingPetsDays = 0;
  immediateActivity: Activity | null = null;

  constructor(
    private injector: Injector,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    public homeService: HomeService,
    reincarnationService: ReincarnationService,
    private mainLoopService: MainLoopService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService,
    private logService: LogService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService
  ) {
    this.defineActivities();
    this.activities = [];
    setTimeout(() => (this.activities = this.getActivityList()));

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

    mainLoopService.longTickSubject.subscribe(daysElapsed => {
      if (
        this.characterService.characterState.bloodlineRank >= 9 &&
        !(this.hellService?.inHell && this.hellService.currentHell === HellLevel.TreesOfKnives)
      ) {
        this.characterService.characterState.increaseAptitudeDaily(daysElapsed);
      }
    });

    const trainingActionTemplate = (attribute: number, trainingDays: number, follower: Follower): boolean => {
      let upgraded = false;

      const getDailyUpgradeChance = () =>
        (1 - Math.pow(follower.power / 100, 0.55)) /
        (36500000 / (3650 + follower.age * Math.log2(attribute / 1e10 + 1)));

      const getProbUpgradeAfterDayFunc = () => {
        const dailyFailureChance = 1 - getDailyUpgradeChance();
        return (days: number) => (days > 0 ? Math.pow(dailyFailureChance, days) : 1);
      };

      let availableDays = trainingDays;
      while (availableDays > 0) {
        const getProbUpgradeAfterDay = getProbUpgradeAfterDayFunc();
        const chance = Math.random();
        if (chance < getProbUpgradeAfterDay(availableDays)) {
          availableDays = 0;
          break;
        }

        upgraded = true;

        // Use logarithm to calculate exact day upgrade happens
        // rolledChance < dailyFailureChance^days -> log chance / log dailyFailureChance < days
        const daysNeeded = Math.max(1, Math.ceil(Math.log(chance) / Math.log(1 - getDailyUpgradeChance())));

        availableDays -= daysNeeded;

        // Softcap the increase
        follower.power++;
        if (follower.power > this.followerService.highestLevel) {
          this.followerService.highestLevel = follower.power;
        }
        follower.cost = 100 * follower.power;
        this.logService.log(LogTopic.FOLLOWER, follower.name + ' gains additional power as a ' + follower.job);
      }

      return upgraded;
    };

    mainLoopService.yearOrLongTickSubject.subscribe(() => {
      if (!(this.trainingFollowersDays + this.trainingPetsDays > 0 && this.followerService.followersUnlocked)) {
        return;
      }

      if (this.followerService.followersUnlocked) {
        let allFollowersMaxed = true;
        let allPetsMaxed = true;
        let anyUpgraded = false;

        for (const follower of this.followerService.followers) {
          const attribute = this.characterService.characterState.attributes.charisma.value;
          const trainingDays = this.trainingFollowersDays;

          if (follower.power >= 100) {
            follower.power = 100;
            continue;
          } else {
            allFollowersMaxed = false;
          }

          if (trainingDays === 0) {
            continue;
          }

          anyUpgraded ||= trainingActionTemplate(attribute, trainingDays, follower);
        }

        for (const follower of this.followerService.pets) {
          const attribute = this.characterService.characterState.attributes.animalHandling.value;
          const trainingDays = this.trainingPetsDays;

          if (follower.power >= 100) {
            follower.power = 100;
            continue;
          } else {
            allPetsMaxed = false;
          }

          if (trainingDays === 0) {
            continue;
          }

          anyUpgraded ||= trainingActionTemplate(attribute, trainingDays, follower);
        }

        if (allFollowersMaxed && this.trainingFollowersDays) {
          this.logService.log(
            LogTopic.FOLLOWER,
            'You try to train your followers, but they are all already as powerful as they can be. You pat them each on the back and tell them they are great.'
          );
        }

        if (allPetsMaxed && this.trainingPetsDays) {
          this.logService.log(
            LogTopic.FOLLOWER,
            'You try to train your pets, but they are all already as powerful as they can be. You give them all belly rubs and tell them they are great.'
          );
        }

        if (anyUpgraded) {
          this.followerService.updateFollowerTotalPower();
        }
      }

      this.trainingFollowersDays = 0;
      this.trainingPetsDays = 0;
    });

    mainLoopService.tickSubject.subscribe(() => {
      if (this.activityLoop.length === 0 && !this.immediateActivity) {
        this.mainLoopService.pause = true;
        return;
      }
      if (this.characterService.characterState.dead) {
        return;
      }
      if (
        this.pauseBeforeDeath &&
        this.characterService.characterState.age >= this.characterService.characterState.lifespan - 1 &&
        !this.characterService.characterState.immortal
      ) {
        this.logService.injury(LogTopic.EVENT, 'The end of your natural life is imminent. Game paused.');
        this.mainLoopService.pause = true;
      }
      if (this.exhaustionDays > 0) {
        this.totalExhaustedDays++;
        this.exhaustionDays--;
        if (this.immediateActivity) {
          this.logService.log(
            LogTopic.EVENT,
            'You were too exhausted to do ' +
              this.immediateActivity.name[this.immediateActivity.level] +
              ' today, but you are getting better.'
          );
        }
        return;
      }

      if (this.immediateActivity) {
        let activity = this.immediateActivity;
        if (this.autoRestUnlocked && this.checkResourceUse(activity) !== '') {
          // we can't do the activity because of resources, so rest instead
          activity = this.Resting;
        }
        activity.consequence[activity.level]();
        this.checkExhaustion();
        this.checkManaOveruse();
        // check for activity death
        this.activityDeath = false;
        if (this.characterService.characterState.status.health.value <= 0) {
          this.activityDeath = true;
        }
        this.handleSpiritActivity();
        if (this.characterService.characterState.money > this.characterService.characterState.maxMoney) {
          this.characterService.characterState.money = this.characterService.characterState.maxMoney;
        }
        return;
      }

      if (this.currentIndex < this.activityLoop.length) {
        this.currentLoopEntry = this.activityLoop[this.currentIndex];
        let activity = this.getActivityByType(this.currentLoopEntry.activity);
        // check if our current activity is zero-day
        if (activity === null || this.currentLoopEntry.disabled || this.currentLoopEntry.repeatTimes === 0) {
          // don't do the activity, instead see if there's a next one we can switch to
          let index = 0;
          if (this.currentIndex < this.activityLoop.length - 1) {
            index = this.currentIndex + 1;
          }
          while (
            index !== this.currentIndex &&
            (this.activityLoop[index].repeatTimes === 0 ||
              this.activityLoop[index].disabled ||
              this.getActivityByType(this.activityLoop[index].activity) === null)
          ) {
            index++;
            if (index >= this.activityLoop.length) {
              index = 0;
            }
          }
          if (index === this.currentIndex) {
            // we looped all the way around without getting any non-zero repeatTimes, pause the game and bail out
            this.mainLoopService.pause = true;
            return;
          } else {
            //switch to the found non-zero activity and restart the ticks for it
            this.currentIndex = index;
            this.currentLoopEntry = this.activityLoop[this.currentIndex];
            activity = this.getActivityByType(this.currentLoopEntry.activity);
            this.currentTickCount = 0;
          }
        }
        if (activity) {
          // this should always be true at this point
          if (this.autoRestUnlocked && this.checkResourceUse(activity) !== '') {
            // we can't do the activity because of resources, so rest instead
            activity = this.Resting;
          }
          activity.consequence[activity.level]();
        } else {
          console.log('Invalid activity, skipping activity for the day');
        }
        this.checkExhaustion();
        this.checkManaOveruse();
        // check for activity death
        this.activityDeath = false;
        if (this.characterService.characterState.status.health.value <= 0) {
          this.activityDeath = true;
        }
        this.currentTickCount++;
        if (this.currentTickCount >= this.currentLoopEntry.repeatTimes) {
          // hit the end of the current activity repeats, move on to the next
          this.currentTickCount = 0;
          this.currentIndex++;
          if (this.currentIndex >= this.activityLoop.length) {
            this.currentIndex = 0;
          }
          // skip to the next real available activity
          const startingIndex = this.currentIndex;
          while (
            this.activityLoop[this.currentIndex].repeatTimes === 0 ||
            this.activityLoop[this.currentIndex].disabled ||
            this.getActivityByType(this.activityLoop[this.currentIndex].activity) === null
          ) {
            this.currentIndex++;
            if (this.currentIndex >= this.activityLoop.length) {
              this.currentIndex = 0;
            }
            if (
              this.currentIndex === startingIndex &&
              (this.activityLoop[this.currentIndex].repeatTimes === 0 ||
                this.activityLoop[this.currentIndex].disabled ||
                this.getActivityByType(this.activityLoop[this.currentIndex].activity) === null)
            ) {
              // we looped all the way around without getting any valid activities, pause the game and bail out
              this.mainLoopService.pause = true;
              return;
            }
          }
        }
      } else {
        // make sure that we reset the current index if activities get removed so that we're past the end of the list
        this.currentIndex = 0;
      }
      this.handleSpiritActivity();
      if (this.characterService.characterState.money > this.characterService.characterState.maxMoney) {
        this.characterService.characterState.money = this.characterService.characterState.maxMoney;
      }
    });
    mainLoopService.longTickSubject.subscribe(() => {
      this.upgradeActivities(false);
      this.checkRequirements(false);
    });
  }

  checkExhaustion() {
    if (this.characterService.characterState.status.stamina.value < 0) {
      // take 5 days to recover, regain stamina, restart loop
      this.logService.injury(
        LogTopic.EVENT,
        'You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.'
      );
      this.exhaustionDays = 5;
      this.characterService.characterState.status.stamina.value = 100;
      this.characterService.characterState.status.health.value -=
        0.01 * this.characterService.characterState.status.health.max;
    }
  }

  checkManaOveruse() {
    if (this.characterService.characterState.status.mana.value < 0) {
      this.logService.injury(
        LogTopic.EVENT,
        'You overextend your mana and damage your mana channels. It takes you 10 days to recover.'
      );
      if (this.characterService.characterState.status.mana.max > 1) {
        this.characterService.characterState.status.mana.max -= 1;
      }
      this.exhaustionDays = 10;
      this.characterService.characterState.status.health.value -=
        0.01 * this.characterService.characterState.status.health.max;
    }
  }

  checkResourceUse(activity: Activity, spirit = false): string {
    if (!activity.resourceUse || !activity.resourceUse[activity.level]) {
      return '';
    }
    if (spirit) {
      if (!activity.resourceUse[activity.level]['mana']) {
        activity.resourceUse[activity.level]['mana'] = 0;
      }
      if (
        this.characterService.characterState.status['mana'].value <
        (activity.resourceUse[activity.level]?.['mana'] ?? 0) + 5
      ) {
        return 'mana';
      }
    }
    for (const key in activity.resourceUse[activity.level]) {
      if (
        this.characterService.characterState.status[key as StatusType].value <
        (activity.resourceUse?.[activity.level]?.[key as StatusType] ?? 0)
      ) {
        return key;
      }
    }
    return '';
  }

  handleSpiritActivity() {
    if (this.spiritActivity !== null && this.characterService.characterState.status.mana.value >= 5) {
      this.spiritActivityProgress = true;
      const activity = this.getActivityByType(this.spiritActivity);
      // if we don't have the resources for spirit activities, just don't do them
      if (activity !== null && this.checkResourceUse(activity, true) === '' && activity.unlocked) {
        activity.consequence[activity.level]();
        this.characterService.characterState.status.mana.value -= 5;
      } else {
        this.spiritActivityProgress = false;
      }
    } else {
      this.spiritActivityProgress = false;
    }
  }

  getProperties(): ActivityProperties {
    const unlockedActivities: ActivityType[] = [];
    const discoveredActivities: ActivityType[] = [];
    for (const activity of this.activities) {
      if (activity.unlocked) {
        unlockedActivities.push(activity.activityType);
      }
      if (activity.discovered) {
        discoveredActivities.push(activity.activityType);
      }
    }

    return {
      autoRestart: this.autoRestart,
      autoPauseUnlocked: this.autoPauseUnlocked,
      pauseOnDeath: this.pauseOnDeath,
      pauseBeforeDeath: this.pauseBeforeDeath,
      activityLoop: this.activityLoop,
      unlockedActivities: unlockedActivities,
      discoveredActivities: discoveredActivities,
      openApprenticeships: this.openApprenticeships,
      spiritActivity: this.spiritActivity,
      completedApprenticeships: this.completedApprenticeships,
      currentApprenticeship: this.currentApprenticeship,
      savedActivityLoop: this.savedActivityLoop,
      savedActivityLoop2: this.savedActivityLoop2,
      savedActivityLoop3: this.savedActivityLoop3,
      autoRestUnlocked: this.autoRestUnlocked,
      pauseOnImpossibleFail: this.pauseOnImpossibleFail,
      totalExhaustedDays: this.totalExhaustedDays,
      purifyGemsUnlocked: this.purifyGemsUnlocked,
    };
  }

  setProperties(properties: ActivityProperties) {
    this.reloadActivities();
    this.completedApprenticeships = properties.completedApprenticeships || [];
    const unlockedActivities = properties.unlockedActivities || [ActivityType.OddJobs, ActivityType.Resting];
    const discoveredActivities = properties.discoveredActivities || [ActivityType.OddJobs, ActivityType.Resting];
    for (const activity of this.activities) {
      activity.unlocked = unlockedActivities.includes(activity.activityType);
      if (!activity.discovered) {
        activity.discovered =
          discoveredActivities.includes(activity.activityType) || unlockedActivities.includes(activity.activityType);
      }
    }
    this.autoRestart = properties.autoRestart;
    this.autoPauseUnlocked = properties.autoPauseUnlocked || false;
    this.pauseOnDeath = properties.pauseOnDeath;
    this.pauseBeforeDeath = properties.pauseBeforeDeath || false;
    this.activityLoop = properties.activityLoop;
    this.spiritActivity = properties.spiritActivity ?? null;
    this.openApprenticeships = properties.openApprenticeships || 0;
    this.currentApprenticeship = properties.currentApprenticeship;
    this.savedActivityLoop = properties.savedActivityLoop || [];
    this.savedActivityLoop2 = properties.savedActivityLoop2 || [];
    this.savedActivityLoop3 = properties.savedActivityLoop3 || [];
    this.autoRestUnlocked = properties.autoRestUnlocked || false;
    this.purifyGemsUnlocked = properties.purifyGemsUnlocked || false;
    if (properties.pauseOnImpossibleFail === undefined) {
      this.pauseOnImpossibleFail = true;
    } else {
      this.pauseOnImpossibleFail = properties.pauseOnImpossibleFail;
    }
    this.totalExhaustedDays = properties.totalExhaustedDays || 0;
    for (let i = 0; i < 5; i++) {
      // upgrade to anything that the loaded attributes allow
      this.upgradeActivities(true);
    }
  }

  meetsRequirements(activity: Activity): boolean {
    if (this.meetsRequirementsByLevel(activity, activity.level)) {
      activity.unlocked = true;
      if (activity.discovered) {
        // re-unlocking loop entries for an already discovered, newly unlocked activity
        for (const entry of this.activityLoop) {
          if (entry.activity === activity.activityType && entry.disabled) {
            entry.disabled = false;
          }
        }
      } else {
        activity.discovered = true;
      }

      return true;
    }
    return false;
  }

  meetsRequirementsByLevel(activity: Activity, level: number): boolean {
    if (
      activity.skipApprenticeshipLevel > 0 &&
      this.openApprenticeships <= 0 &&
      activity.activityType !== this.currentApprenticeship &&
      !this.completedApprenticeships.includes(activity.activityType)
    ) {
      // we've never completed an apprenticeship in this job and it needs one
      return false;
    }
    const keys: (keyof CharacterAttribute)[] = Object.keys(
      activity.requirements[level]
    ) as (keyof CharacterAttribute)[];
    for (const keyIndex in keys) {
      const key = keys[keyIndex];
      let requirementValue = 0;
      if (activity.requirements[level][key] !== undefined) {
        requirementValue = activity.requirements[level][key] ?? 0;
      }
      if (this.characterService.characterState.attributes[key as AttributeType].value <= requirementValue) {
        return false;
      }
    }
    return true;
  }

  checkRequirements(squelchLogs: boolean): void {
    for (const activity of this.activities) {
      if (!activity.unlocked && this.meetsRequirements(activity)) {
        if (!squelchLogs) {
          this.logService.log(
            LogTopic.EVENT,
            'A new activity is available. Maybe you should try ' + activity.name[activity.level] + '.'
          );
        }
      }
    }
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      if (!this.getActivityByType(this.activityLoop[i].activity)?.unlocked) {
        this.activityLoop[i].disabled = true;
      }
    }
  }

  upgradeActivities(squelchLogs: boolean): void {
    for (const activity of this.activities) {
      if (activity.level < activity.description.length - 1) {
        if (this.meetsRequirementsByLevel(activity, activity.level + 1)) {
          if (!squelchLogs && activity.unlocked) {
            this.logService.log(
              LogTopic.EVENT,
              'Congratulations on your promotion! ' +
                activity.name[activity.level] +
                ' upgraded to ' +
                activity.name[activity.level + 1]
            );
          }
          activity.level++;
        }
      }
    }
  }

  reset(): void {
    // downgrade all activities to base level
    this.openApprenticeships = 1;
    this.currentApprenticeship = undefined;
    this.oddJobDays = 0;
    this.beggingDays = 0;
    for (const activity of this.activities) {
      activity.level = 0;
      activity.unlocked = false;
    }

    for (let i = 0; i < 5; i++) {
      // upgrade to anything that the starting attributes allow
      this.upgradeActivities(true);
    }

    if (this.impossibleTaskService.activeTaskIndex !== ImpossibleTaskType.Swim) {
      this.Resting.unlocked = true;
      this.OddJobs.unlocked = true;
    }
    if (this.autoRestart) {
      this.checkRequirements(true);
      if (this.pauseOnDeath && !this.characterService.characterState.immortal) {
        this.mainLoopService.pause = true;
      }
    } else {
      this.activityLoop = [];
    }
    this.currentTickCount = 0;
    this.currentIndex = 0;
  }

  getActivityByType(activityType: ActivityType): Activity | null {
    for (const activity of this.activities) {
      if (activity.activityType === activityType) {
        return activity;
      }
    }
    return null;
  }

  checkApprenticeship(activityType: ActivityType) {
    if (this.completedApprenticeships.includes(activityType)) {
      return;
    }
    if (this.currentApprenticeship === activityType) {
      // check for completed apprenticeship
      const activity = this.getActivityByType(activityType);
      if (activity) {
        if (activity.level >= activity.skipApprenticeshipLevel) {
          this.completedApprenticeships.push(activityType);
        }
      }
    } else if (this.openApprenticeships > 0) {
      // start an apprenticeship
      this.openApprenticeships--;
      this.currentApprenticeship = activityType;
      for (const activity of this.activities) {
        if (activity.skipApprenticeshipLevel > 0) {
          activity.unlocked = false;
        }
      }
      this.checkRequirements(true);
    }
  }

  reloadActivities() {
    this.activities = this.getActivityList();
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      let found = false;
      for (const activity of this.activities) {
        if (activity.activityType === this.activityLoop[i].activity) {
          found = true;
        }
        if (!activity.discovered) {
          this.meetsRequirements(activity);
        }
      }
      if (!found) {
        // the activity isn't available now, disable it
        this.activityLoop[i].disabled = true;
      }
    }
    if (this.spiritActivity) {
      let found = false;
      for (const activity of this.activities) {
        if (activity.activityType === this.spiritActivity) {
          found = true;
        }
      }
      if (!found) {
        this.spiritActivity = null;
      }
    }
    for (let i = 0; i < 5; i++) {
      // upgrade to anything that the current attributes allow
      this.upgradeActivities(true);
    }
    this.checkRequirements(true);
  }

  saveActivityLoop(index = 1) {
    if (index === 1) {
      this.savedActivityLoop = JSON.parse(JSON.stringify(this.activityLoop));
    } else if (index === 2) {
      this.savedActivityLoop2 = JSON.parse(JSON.stringify(this.activityLoop));
    } else if (index === 3) {
      this.savedActivityLoop3 = JSON.parse(JSON.stringify(this.activityLoop));
    }
  }

  loadActivityLoop(index = 1) {
    if (index === 1) {
      this.activityLoop = JSON.parse(JSON.stringify(this.savedActivityLoop));
    } else if (index === 2) {
      this.activityLoop = JSON.parse(JSON.stringify(this.savedActivityLoop2));
    } else if (index === 3) {
      this.activityLoop = JSON.parse(JSON.stringify(this.savedActivityLoop3));
    }
    this.checkRequirements(true);
  }

  getActivityList(): Activity[] {
    const newList: Activity[] = [];
    this.activityHeader = '';
    this.activityHeaderDescription = '';
    if (this.impossibleTaskService.activeTaskIndex >= 0) {
      this.activityHeader =
        'Do the impossible: ' + this.impossibleTaskService.tasks[this.impossibleTaskService.activeTaskIndex].name;
      this.activityHeaderDescription =
        this.impossibleTaskService.tasks[this.impossibleTaskService.activeTaskIndex].description;
    }

    if (!this.hellService) {
      this.hellService = this.injector.get(HellService);
    }
    if (this.hellService.inHell) {
      return this.hellService.getActivityList();
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.Swim) {
      newList.push(this.Swim);
      // don't include the rest of the activities
      return newList;
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.RaiseIsland) {
      newList.push(this.ForgeChains);
      newList.push(this.AttachChains);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.BuildTower) {
      newList.push(this.MakeBrick);
      newList.push(this.MakeMortar);
      newList.push(this.MakeScaffold);
      newList.push(this.BuildTower);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.TameWinds) {
      newList.push(this.ResearchWind);
      newList.push(this.TameWinds);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.LearnToFly) {
      newList.push(this.LearnToFly);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.BefriendDragon) {
      newList.push(this.OfferDragonFood);
      newList.push(this.OfferDragonWealth);
      newList.push(this.TalkToDragon);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.ConquerTheWorld) {
      newList.push(this.GatherArmies);
      newList.push(this.ConquerTheWorld);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.RearrangeTheStars) {
      newList.push(this.MoveStars);
    }

    newList.push(this.Resting);
    newList.push(this.OddJobs);
    newList.push(this.Begging);
    newList.push(this.Burning);
    newList.push(this.Taunting);
    newList.push(this.Farming);
    newList.push(this.Mining);
    newList.push(this.Smelting);
    newList.push(this.Blacksmithing);
    newList.push(this.ChopWood);
    newList.push(this.Woodworking);
    newList.push(this.Hunting);
    newList.push(this.Leatherworking);
    newList.push(this.Fishing);
    newList.push(this.GatherHerbs);
    newList.push(this.Alchemy);
    newList.push(this.BodyCultivation);
    newList.push(this.MindCultivation);
    newList.push(this.BalanceChi);
    if (this.characterService.characterState.manaUnlocked) {
      newList.push(this.CoreCultivation);
      newList.push(this.InfuseEquipment);
      newList.push(this.InfuseBody);
      newList.push(this.ExtendLife);
    }
    if (this.characterService.characterState.immortal) {
      newList.push(this.SoulCultivation);
    }
    if (this.purifyGemsUnlocked) {
      newList.push(this.PurifyGems);
    }
    newList.push(this.Recruiting);
    if (this.followerService.petsEnabled) {
      newList.push(this.PetRecruiting);
      newList.push(this.PetTraining);
    }
    newList.push(this.TrainingFollowers);
    newList.push(this.CombatTraining);

    for (const activity of newList) {
      // make sure we have no projectionOnly actvities if list is loaded from here
      activity.projectionOnly = false;
    }

    return newList;
  }

  // @ts-ignore
  OddJobs: Activity;
  // @ts-ignore
  Resting: Activity;
  // @ts-ignore
  Begging: Activity;
  // @ts-ignore
  Blacksmithing: Activity;
  // @ts-ignore
  GatherHerbs: Activity;
  // @ts-ignore
  ChopWood: Activity;
  // @ts-ignore
  Woodworking: Activity;
  // @ts-ignore
  Leatherworking: Activity;
  // @ts-ignore
  Farming: Activity;
  // @ts-ignore
  Mining: Activity;
  // @ts-ignore
  Smelting: Activity;
  // @ts-ignore
  Hunting: Activity;
  // @ts-ignore
  Fishing: Activity;
  // @ts-ignore
  Alchemy: Activity;
  // @ts-ignore
  Burning: Activity;
  // @ts-ignore
  BalanceChi: Activity;
  // @ts-ignore
  BodyCultivation: Activity;
  // @ts-ignore
  MindCultivation: Activity;
  // @ts-ignore
  CoreCultivation: Activity;
  // @ts-ignore
  SoulCultivation: Activity;
  // @ts-ignore
  InfuseEquipment: Activity;
  // @ts-ignore
  InfuseBody: Activity;
  // @ts-ignore
  ExtendLife: Activity;
  // @ts-ignore
  Recruiting: Activity;
  // @ts-ignore
  Swim: Activity;
  // @ts-ignore
  ForgeChains: Activity;
  // @ts-ignore
  AttachChains: Activity;
  // @ts-ignore
  MakeBrick: Activity;
  // @ts-ignore
  MakeMortar: Activity;
  // @ts-ignore
  MakeScaffold: Activity;
  // @ts-ignore
  BuildTower: Activity;
  // @ts-ignore
  TameWinds: Activity;
  // @ts-ignore
  ResearchWind: Activity;
  // @ts-ignore
  LearnToFly: Activity;
  // @ts-ignore
  OfferDragonFood: Activity;
  // @ts-ignore
  OfferDragonWealth: Activity;
  // @ts-ignore
  TalkToDragon: Activity;
  // @ts-ignore
  GatherArmies: Activity;
  // @ts-ignore
  ConquerTheWorld: Activity;
  // @ts-ignore
  MoveStars: Activity;
  // @ts-ignore
  TrainingFollowers: Activity;
  // @ts-ignore
  Taunting: Activity;
  // @ts-ignore
  CombatTraining: Activity;
  // @ts-ignore
  PetRecruiting: Activity;
  // @ts-ignore
  PetTraining: Activity;
  // @ts-ignore
  PurifyGems: Activity;

  defineActivities() {
    this.Swim = {
      level: 0,
      name: ['Swim Deeper'],
      imageBaseName: 'swim',
      activityType: ActivityType.Swim,
      description: ['Swim down further into the depths.'],
      consequenceDescription: ['Uses 20 Stamina. Reduce health by 100.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.status.health.value -= 100;
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].complete) {
            this.logService.log(
              LogTopic.STORY,
              'Your preparations were worthwhile! You dove all the way to the bottom of the ocean, through a hidden tunnel that led impossibly deep, and found a mythical sunken island.'
            );
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.ForgeChains = {
      level: 0,
      name: ['Forge Unbreakable Chain'],
      imageBaseName: 'forgechains',
      activityType: ActivityType.ForgeChains,
      description: ['Forge a chain strong enough to pull the island from the depths.'],
      consequenceDescription: [
        'Uses 100 Stamina. If you have the right facilities, materials, and knowledge you might be able to create an unbreakable chain.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          const metalValue = this.inventoryService.consume('metal');
          if (
            this.homeService.furniture.workbench &&
            this.homeService.furniture.workbench.id === 'anvil' &&
            metalValue >= 150 &&
            this.characterService.characterState.attributes.metalLore.value >= 1e9
          ) {
            if (Math.random() < 0.1) {
              this.logService.log(
                LogTopic.CRAFTING,
                'Your anvil gives off an ear-splitting ringing and echoes endlessly into the depths. The new chain glows with power!'
              );
              this.inventoryService.addItem(this.itemRepoService.items['unbreakableChain']);
            } else {
              this.logService.log(
                LogTopic.CRAFTING,
                'Your anvil rings and weakly echoes into the depths. You throw aside the useless dull chain.'
              );
            }
          } else if (this.characterService.characterState.attributes.metalLore.value < 1e9) {
            this.logService.injury(LogTopic.EVENT, 'You lack the necessary knowledge and cause a deadly explosion.');
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.6;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          } else {
            this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong tools and materials and hurt yourself.');
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.AttachChains = {
      level: 0,
      name: ['Attach Chains to the Island'],
      imageBaseName: 'attachchains',
      activityType: ActivityType.AttachChains,
      description: ['Swim deep and attach one of your chains to the island, then pull.'],
      consequenceDescription: [
        'Uses 1,000,000 Stamina. These chains are really, REALLY heavy. You better plan on having an Unbreakable Chain and a good place to rest afterwards.',
      ],
      consequence: [
        () => {
          if (
            this.characterService.characterState.status.stamina.value >= 1000000 &&
            this.inventoryService.consume('chain') > 0
          ) {
            this.characterService.characterState.status.stamina.value -= 1000000;
            this.logService.log(
              LogTopic.EVENT,
              'You attach a chain to the island, and give your chains a long, strenuous tug.'
            );
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].progress++;
            this.impossibleTaskService.checkCompletion();
            if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].complete) {
              this.logService.log(
                LogTopic.STORY,
                'With a mighty pull of 777 chains, the island comes loose. You haul it to the surface.'
              );
            }
          } else if (this.inventoryService.consume('chain', 0)) {
            this.logService.injury(
              LogTopic.EVENT,
              'You strain yourself trying to lug the chain to an anchor point and collapse.'
            );
            this.characterService.characterState.status.stamina.value -= 1000000;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          } else {
            this.logService.injury(
              LogTopic.EVENT,
              'You pass time exploring the hidden tunnels without a chain until a horror of the depths takes a nibble.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000000,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.MakeBrick = {
      level: 0,
      name: ['Create an Everlasting Brick'],
      imageBaseName: 'makebrick',
      activityType: ActivityType.MakeBrick,
      description: ['Create bricks sturdy enough to support the weight of your tower.'],
      consequenceDescription: [
        'Uses 100 Stamina. If you have the right followers and materials you will create some everlasting bricks.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          const oreValue = this.inventoryService.consume('ore', 200);
          const builderPower = Math.floor((this.followerService.jobs['builder'].totalPower + 10) / 10);
          if (oreValue >= 10) {
            this.inventoryService.addItem(this.itemRepoService.items['everlastingBrick'], builderPower);
            this.logService.log(
              LogTopic.CRAFTING,
              'You and your followers made ' +
                (1 + builderPower) +
                ' ' +
                this.itemRepoService.items['everlastingBrick'].name
            );
          } else {
            this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong materials and hurt yourself.');
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.MakeScaffold = {
      level: 0,
      name: ['Build Scaffolding'],
      imageBaseName: 'scaffolding',
      activityType: ActivityType.MakeScaffold,
      description: ['Set up the scaffolding for the next level of your tower.'],
      consequenceDescription: [
        'Uses 1000 Stamina. If you have the right materials you might succeed in setting up the scaffolding for the next level.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 1000;
          let woodValue = 0;
          woodValue = this.inventoryService.consume('wood', 200);
          if (woodValue >= 11) {
            this.inventoryService.addItem(this.itemRepoService.items['scaffolding']);
            this.logService.log(LogTopic.CRAFTING, 'You made ' + this.itemRepoService.items['scaffolding'].name);
          } else {
            this.logService.injury(
              LogTopic.EVENT,
              'You fumble with the wrong materials, hurt yourself, and break your weak attempt at scaffolding.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.MakeMortar = {
      level: 0,
      name: ['Mix Everlasting Mortar'],
      imageBaseName: 'makemortar',
      activityType: ActivityType.MakeMortar,
      description: ['Mix mortar powerful enough to hold your mighty tower together.'],
      consequenceDescription: [
        'Uses 100 Stamina. If you have the right followers, facilities, and materials you might succeed in mixing some proper mortar.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          const oreValue = this.inventoryService.consume('ore');
          const builderPower = Math.floor((this.followerService.jobs['builder'].totalPower + 100) / 100);
          if (
            this.homeService.furniture.workbench &&
            this.homeService.furniture.workbench.id === 'cauldron' &&
            oreValue >= 10
          ) {
            this.inventoryService.addItem(this.itemRepoService.items['everlastingMortar'], builderPower);
            this.logService.log(
              LogTopic.CRAFTING,
              'You and your followers made ' +
                (1 + builderPower) +
                ' ' +
                this.itemRepoService.items['everlastingMortar'].name
            );
          } else {
            this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong materials and hurt yourself.');
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.BuildTower = {
      level: 0,
      name: ['Build the Next Level'],
      imageBaseName: 'buildtower',
      activityType: ActivityType.BuildTower,
      description: [
        'Assemble 1000 bricks, 100 barrels of mortar, and your scaffolding to construct the next level of your tower. You will need a lot of expert help for this.',
      ],
      consequenceDescription: [
        'Uses 1000 Stamina. If you have the right followers and materials you will build the next level.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 1000;
          let numBuilders = 0;
          for (const follower of this.followerService.followers) {
            if (follower.job === 'builder') {
              numBuilders++;
            }
          }
          if (numBuilders < 10) {
            this.logService.injury(LogTopic.EVENT, 'You fumble without the proper help and hurt yourself.');
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.05;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          let value = 0;
          value = this.inventoryService.consume('scaffolding');
          if (value < 1) {
            this.logService.injury(
              LogTopic.EVENT,
              'You try building without a scaffolding, but it ends in a disaster and you are badly hurt.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.2;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          value = 0;
          value = this.inventoryService.consume('mortar', 100);
          if (value < 1) {
            this.logService.injury(
              LogTopic.EVENT,
              'You try building without enough mortar, but it ends in a disaster and you are badly hurt.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.2;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          value = 0;
          value = this.inventoryService.consume('brick', 1000);
          if (value < 1) {
            this.logService.injury(
              LogTopic.EVENT,
              'You try building without enough bricks, but it ends in a disaster and you are badly hurt.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.2;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].complete) {
            this.logService.log(
              LogTopic.STORY,
              'You have acheived the impossible and built a tower beyond the heavens.'
            );
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.ResearchWind = {
      level: 0,
      name: ['Research Wind Control'],
      imageBaseName: 'researchwind',
      activityType: ActivityType.ResearchWind,
      description: ['Delve deep into wind lore to understand how the neverending storm can be controlled.'],
      consequenceDescription: [
        'Uses 100 Stamina and Mana. Compile your research and if you have done enough you may produce a Tome of Wind Control.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          this.characterService.characterState.status.mana.value -= 100;
          if (
            this.characterService.characterState.status.stamina.value < 0 ||
            this.characterService.characterState.status.mana.value < 0
          ) {
            this.logService.log(LogTopic.EVENT, "You try to research, but you just don't have the energy.");
            return;
          }
          if (
            this.characterService.characterState.status.stamina.value >= 0 &&
            this.characterService.characterState.status.mana.value >= 0
          ) {
            if (Math.random() < 0.01) {
              this.logService.log(LogTopic.CRAFTING, 'Research breakthrough! You produce a tome!.');
              this.inventoryService.addItem(this.itemRepoService.items['windTome']);
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
          mana: 100,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.TameWinds = {
      level: 0,
      name: ['Tame Winds'],
      imageBaseName: 'tamewind',
      activityType: ActivityType.TameWinds,
      description: ['Use your research to tame the winds.'],
      consequenceDescription: ['Uses 100 Stamina. Use a Tome of Wind Control to tame the hurricane.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          let value = 0;
          value = this.inventoryService.consume('windTome');
          if (value > 0) {
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].progress++;
            this.impossibleTaskService.checkCompletion();
            if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].complete) {
              this.logService.log(LogTopic.STORY, 'You acheived the impossible and tamed a hurricane.');
            }
          } else {
            this.logService.injury(
              LogTopic.EVENT,
              'You try to tame the winds, but without the proper preparation you are blown off the top of the tower.'
            );
            this.characterService.characterState.status.health.value -=
              this.characterService.characterState.status.health.max * 0.5;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.LearnToFly = {
      level: 0,
      name: ['Learn To Fly'],
      imageBaseName: 'learntofly',
      activityType: ActivityType.LearnToFly,
      description: ['Jump off your tower and practice flying. This will definitely go well for you.'],
      consequenceDescription: ['You will certainly, probably, maybe not die doing this.'],
      consequence: [
        () => {
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress++;
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 2222) {
            this.logService.injury(
              LogTopic.EVENT,
              'Jumping off an impossibly tall tower ends about like you might expect. Your wounds may take a bit to heal, but at least you learned something.'
            );
            this.characterService.characterState.status.health.value -= 1000;
          } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 4444) {
            this.logService.injury(
              LogTopic.EVENT,
              'You feel like you might have flown a litte bit, somewhere near the time you hit the ground.'
            );
            this.characterService.characterState.status.health.value -= 500;
          } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 6666) {
            this.logService.injury(
              LogTopic.EVENT,
              'You definitely did better that time. You did some great flying but sticking the landing is still tricky.'
            );
            this.characterService.characterState.status.health.value -= 100;
          } else {
            this.logService.injury(LogTopic.EVENT, 'Almost there! Perfect landings are so hard.');
            this.characterService.characterState.status.health.value -= 10;
          }
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].complete) {
            this.logService.log(
              LogTopic.STORY,
              'You mastered flight! You can go anywhere in the world now, even where the ancient dragons live.'
            );
          }
        },
      ],
      resourceUse: [
        {
          health: 1001,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.OfferDragonFood = {
      level: 0,
      name: ['Offer Food'],
      imageBaseName: 'offerfood',
      activityType: ActivityType.OfferDragonFood,
      description: ['It turns out that dragons love peaches. Bring the dragon a bunch and he may be more friendly.'],
      consequenceDescription: ['You will need at least 1000 food for this to work.'],
      consequence: [
        () => {
          let value = 0;
          value = this.inventoryService.consume('food', 1000);
          if (value < 1) {
            this.logService.injury(
              LogTopic.EVENT,
              'The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.'
            );
            this.characterService.characterState.status.health.value -= 1000;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 2000) {
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
          } else {
            this.logService.log(LogTopic.EVENT, "The dragon doesn't seem interested in any more food.");
          }
        },
      ],
      resourceUse: [{}],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.OfferDragonWealth = {
      level: 0,
      name: ['Offer Wealth'],
      imageBaseName: 'offergold',
      activityType: ActivityType.OfferDragonWealth,
      description: ['You have heard that dragons like treasure. Bring the dragon a bunch and he may be more friendly.'],
      consequenceDescription: ['You will need at least a billion taels for this to work.'],
      consequence: [
        () => {
          if (this.characterService.characterState.money < 1e9) {
            this.logService.injury(
              LogTopic.EVENT,
              'The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.'
            );
            this.characterService.characterState.status.health.value -= 1000;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          this.characterService.characterState.updateMoney(1e9);
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 4000) {
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
          } else {
            this.logService.log(LogTopic.EVENT, "The dragon doesn't seem interested in any more money.");
          }
        },
      ],
      resourceUse: [{}],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.TalkToDragon = {
      level: 0,
      name: ['Talk to the Dragon'],
      imageBaseName: 'talktodragon',
      activityType: ActivityType.TalkToDragon,
      description: ['Try to strike up a conversation with the dragon.'],
      consequenceDescription: ['The dragon probably likes you enough to talk to you now, right?'],
      consequence: [
        () => {
          if (this.characterService.characterState.attributes.charisma.value < 1e10) {
            this.logService.injury(
              LogTopic.EVENT,
              "The dragon doesn't like the sound of your voice and takes a bite out of you. Maybe you should practice speaking with humans first."
            );
            this.characterService.characterState.status.health.value -= 1000;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 3500) {
            this.logService.log(
              LogTopic.EVENT,
              "The dragon doesn't like like you enough to talk to you, but at least he doesn't attack you."
            );
            return;
          }
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].complete) {
            this.logService.log(LogTopic.STORY, 'You did the impossible and made friends with a dragon!');
          }
        },
      ],
      resourceUse: [{}],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.GatherArmies = {
      level: 0,
      name: ['Gather Armies'],
      imageBaseName: 'gatherarmy',
      activityType: ActivityType.GatherArmies,
      description: ['Gather troops into armies. This will require vast amounts of food and money.'],
      consequenceDescription: ["You rule a country by now, right? If not, this isn't going to go well."],
      consequence: [
        () => {
          if (this.homeService.homeValue < HomeType.Capital) {
            this.logService.injury(
              LogTopic.EVENT,
              "You don't even have your own kingdom? What were you thinking? The nearby rulers send their forces against you."
            );
            for (let i = 0; i < 3; i++) {
              this.battleService.addEnemy({
                name: 'an angry army',
                baseName: 'army',
                health: 2e11,
                maxHealth: 2e11,
                accuracy: 0.9,
                attack: 1e7,
                defense: 1e7,
                loot: [],
              });
            }
            return;
          }
          let value = 0;
          value = this.inventoryService.consume('food', 10000);
          if (value < 1) {
            this.logService.injury(
              LogTopic.EVENT,
              "You don't have enough food to feed your army, so they revolt and fight you instead."
            );
            this.battleService.addEnemy({
              name: 'an angry army',
              baseName: 'army',
              health: 2e11,
              maxHealth: 2e11,
              accuracy: 0.9,
              attack: 1e7,
              defense: 1e7,
              loot: [],
            });
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          if (this.characterService.characterState.money < 1e10) {
            this.logService.injury(
              LogTopic.EVENT,
              "You don't have enough money to pay your army, so they revolt and fight you instead."
            );
            this.battleService.addEnemy({
              name: 'an angry army',
              baseName: 'army',
              health: 2e11,
              maxHealth: 2e11,
              accuracy: 0.9,
              attack: 1e7,
              defense: 1e7,
              loot: [],
            });
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          this.characterService.characterState.updateMoney(1e10);
          this.inventoryService.addItem(this.itemRepoService.items['army']);
        },
      ],
      resourceUse: [{}],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.ConquerTheWorld = {
      level: 0,
      name: ['Conquer More Territory'],
      imageBaseName: 'conquer',
      activityType: ActivityType.ConquerTheWorld,
      description: ['Send out your armies to conquer the world.'],
      consequenceDescription: [
        "I'm sure you have plenty of armies for this. You wouldn't try this without enough armies, that would end badly.",
      ],
      consequence: [
        () => {
          let value = 0;
          value = this.inventoryService.consume(
            'army',
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress + 1
          );
          if (value < 1) {
            for (let i = 0; i < 5; i++) {
              this.battleService.addEnemy({
                name: 'an angry army',
                baseName: 'army',
                health: 2e11,
                maxHealth: 2e11,
                accuracy: 0.9,
                attack: 1e7,
                defense: 1e7,
                loot: [],
              });
            }
            this.logService.log(
              LogTopic.EVENT,
              'Your armies failed you and you are forced to fight the enemy armies to a standstill.'
            );
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
            return;
          }
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].complete) {
            this.logService.log(
              LogTopic.STORY,
              'You did the impossible and conquered the world! Under your wise rule all human suffering ceases.'
            );
          }
        },
      ],
      resourceUse: [{}],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    this.MoveStars = {
      level: 0,
      name: ['Move Stars'],
      imageBaseName: 'movestars',
      activityType: ActivityType.MoveStars,
      description: ['Extend your vast magical powers into the heavens and force the stars into alignment.'],
      consequenceDescription: ['Uses 1000 Stamina and Mana.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 1000;
          this.characterService.characterState.status.mana.value -= 1000;
          if (
            this.characterService.characterState.status.stamina.value >= 0 &&
            this.characterService.characterState.status.mana.value >= 0
          ) {
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.RearrangeTheStars].progress++;
            this.impossibleTaskService.checkCompletion();
            if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.RearrangeTheStars].complete) {
              this.logService.log(
                LogTopic.STORY,
                'You did the impossible and rearranged the stars themselves. You are so near to achieving immortality you can almost taste it. It tastes like peaches.'
              );
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000,
          mana: 1000,
        },
      ],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0,
    };

    let oddJobsDescription =
      'Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Undignified work for a future immortal, but you have to eat to live.';
    if (this.hellService?.inHell) {
      oddJobsDescription =
        "Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Undignified work for an aspiring god, but you can't manage anything more profitable when you're projecting your spirit this far.";
    } else if (this.characterService.characterState.immortal) {
      oddJobsDescription =
        'Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Why would you stoop to jobs like this now that you are immortal?';
    }
    this.OddJobs = {
      level: 0,
      name: ['Odd Jobs'],
      imageBaseName: 'oddjobs',
      activityType: ActivityType.OddJobs,
      description: [oddJobsDescription],
      consequenceDescription: [
        'Uses 5 Stamina. Increases all your basic attributes by a small amount and provides a little money.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('strength', 0.02);
          this.characterService.characterState.increaseAttribute('toughness', 0.02);
          this.characterService.characterState.increaseAttribute('speed', 0.02);
          this.characterService.characterState.increaseAttribute('intelligence', 0.02);
          this.characterService.characterState.increaseAttribute('charisma', 0.02);
          this.characterService.characterState.status.stamina.value -= 5;
          this.characterService.characterState.updateMoney(3);
          this.OddJobs.lastIncome = 3;
          this.oddJobDays++;
        },
      ],
      resourceUse: [
        {
          stamina: 5,
        },
      ],
      requirements: [{}],
      unlocked: true,
      discovered: true,
      skipApprenticeshipLevel: 0,
    };

    this.Resting = {
      level: 0,
      name: ['Resting', 'Meditation', 'Communing With Divinity', 'Finding True Inner Peace'],
      imageBaseName: 'resting',
      activityType: ActivityType.Resting,
      description: [
        'Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
        'Enter a meditative state and begin your journey toward spritual enlightenment.',
        'Extend your senses beyond the mortal realm and connect to deeper realities.',
        'Turn your senses inward and find pure stillness within.',
      ],
      consequenceDescription: [
        'Restores 50 Stamina and 2 Health.',
        'Restores 100 Stamina, 10 Health, and 1 Mana (if unlocked).',
        'Restores 200 Stamina, 20 Health, and 10 Mana (if unlocked).',
        'Restores 300 Stamina, 30 Health, and 20 Mana (if unlocked).',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value += 50;
          this.characterService.characterState.status.health.value += 2;
          this.characterService.characterState.checkOverage();
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.characterService.characterState.status.stamina.value += 100;
          this.characterService.characterState.status.health.value += 10;
          this.characterService.characterState.increaseAttribute('spirituality', 0.001);
          if (this.characterService.characterState.manaUnlocked) {
            this.characterService.characterState.status.mana.value += 1;
          }
          this.characterService.characterState.checkOverage();
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.characterService.characterState.status.stamina.value += 200;
          this.characterService.characterState.status.health.value += 20;
          this.characterService.characterState.status.mana.value += 10;
          this.characterService.characterState.increaseAttribute('spirituality', 0.5);
          this.characterService.characterState.checkOverage();
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.characterService.characterState.status.stamina.value += 300;
          this.characterService.characterState.status.health.value += 30;
          this.characterService.characterState.status.mana.value += 20;
          this.characterService.characterState.increaseAttribute('spirituality', 1);
          this.characterService.characterState.checkOverage();
          if (this.characterService.characterState.yinYangUnlocked) {
            if (this.characterService.characterState.yin > this.characterService.characterState.yang) {
              this.characterService.characterState.yang++;
            } else {
              this.characterService.characterState.yin++;
            }
          }
        },
      ],
      resourceUse: [{}, {}, {}, {}],
      requirements: [
        {},
        {
          strength: 1000,
          speed: 1000,
          charisma: 1000,
          intelligence: 1000,
          toughness: 1000,
        },
        {
          strength: 1000000,
          speed: 1000000,
          charisma: 1000000,
          intelligence: 1000000,
          toughness: 1000000,
          spirituality: 100000,
          fireLore: 10000,
          waterLore: 10000,
          earthLore: 10000,
          metalLore: 10000,
          woodLore: 10000,
        },
        {
          strength: 1e21,
          speed: 1e21,
          charisma: 1e21,
          intelligence: 1e21,
          toughness: 1e21,
          spirituality: 1e21,
          fireLore: 1e18,
          waterLore: 1e18,
          earthLore: 1e18,
          metalLore: 1e18,
          woodLore: 1e18,
        },
      ],
      unlocked: true,
      discovered: true,
      skipApprenticeshipLevel: 0,
    };

    this.Begging = {
      level: 0,
      name: ['Begging', 'Street Performing', 'Oration', 'Politics'],
      imageBaseName: 'begging',
      activityType: ActivityType.Begging,
      description: [
        'Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.',
        'Add some musical flair to your begging.',
        'Move the crowds with your stirring speeches.',
        'Charm your way into civic leadership.',
      ],
      consequenceDescription: [
        'Uses 5 Stamina. Increases charisma and provides a little money.',
        'Uses 5 Stamina. Increases charisma and provides some money.',
        'Uses 5 Stamina. Increases charisma and provides money.',
        'Uses 5 Stamina. Increases charisma, provides money, and makes you wonder if there is more to life than just money and fame.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('charisma', 0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 3 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.updateMoney(money);
          this.Begging.lastIncome = money;
          this.beggingDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('charisma', 0.2);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 10 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.updateMoney(money);
          this.Begging.lastIncome = money;
          this.beggingDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('charisma', 0.3);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 20 + Math.log2(this.characterService.characterState.attributes.charisma.value * 2);
          this.characterService.characterState.updateMoney(money);
          this.Begging.lastIncome = money;
          this.beggingDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('charisma', 0.5);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 30 + Math.log2(this.characterService.characterState.attributes.charisma.value * 10);
          this.characterService.characterState.updateMoney(money);
          this.Begging.lastIncome = money;
          this.beggingDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 5,
        },
        {
          stamina: 5,
        },
        {
          stamina: 5,
        },
        {
          stamina: 5,
        },
      ],
      requirements: [
        {
          charisma: 3,
        },
        {
          charisma: 100,
        },
        {
          charisma: 5000,
        },
        {
          charisma: 10000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Blacksmithing = {
      level: 0,
      name: ['Apprentice Blacksmithing', 'Journeyman Blacksmithing', 'Blacksmithing', 'Master Blacksmithing'],
      imageBaseName: 'blacksmithing',
      activityType: ActivityType.Blacksmithing,
      description: [
        "Work for the local blacksmith. You mostly pump the bellows, but at least you're learning a trade.",
        'Mold metal into useful things. You might even produce something you want to keep now and then.',
        'Create useful and beautiful metal objects. You might produce a decent weapon occasionally.',
        'Work the forges like a true master.',
      ],
      consequenceDescription: [
        'Uses 25 Stamina. Increases strength and toughness and provides a little money.',
        'Uses 25 Stamina. Increases strength, toughness, and money.',
        'Uses 25 Stamina. Build your physical power, master your craft, and create weapons.',
        'Uses 50 Stamina. Bring down your mighty hammer and create works of metal wonder.',
      ],
      consequence: [
        // grade 0
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.status.stamina.value -= 25;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value
            ) + this.characterService.characterState.attributes.metalLore.value;
          this.characterService.characterState.updateMoney(money);
          this.Blacksmithing.lastIncome = money;
          let blacksmithSuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'anvil') {
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.1 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            this.inventoryService.addItem(this.itemRepoService.items['junk']);
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        // grade 1
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength', 0.2);
          this.characterService.characterState.increaseAttribute('toughness', 0.2);
          this.characterService.characterState.status.stamina.value -= 25;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.metalLore.value * 2;
          this.characterService.characterState.updateMoney(money);
          this.Blacksmithing.lastIncome = money;
          let blacksmithSuccessChance = 0.02;
          if (this.homeService.furniture.workbench?.id === 'anvil') {
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.2 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.02 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1) {
                // if the metal was found
                const metalLore = this.characterService.characterState.attributes.metalLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(metalLore), grade / 160), grade / 10)),
                    'metal',
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        // grade 2
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength', 0.5);
          this.characterService.characterState.increaseAttribute('toughness', 0.5);
          this.characterService.characterState.status.stamina.value -= 25;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.fireLore.value +
            this.characterService.characterState.attributes.metalLore.value * 5;
          this.characterService.characterState.updateMoney(money);
          this.Blacksmithing.lastIncome = money;
          let blacksmithSuccessChance = 0.05;
          if (this.homeService.furniture.workbench?.id === 'anvil') {
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.3 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.05 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1) {
                // if the metal was found
                const metalLore = this.characterService.characterState.attributes.metalLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(metalLore), grade / 160), grade / 10)),
                    'metal',
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        // grade 3
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength', 1);
          this.characterService.characterState.increaseAttribute('toughness', 1);
          this.characterService.characterState.status.stamina.value -= 50;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.fireLore.value +
            this.characterService.characterState.attributes.metalLore.value * 10;
          this.characterService.characterState.updateMoney(money);
          this.Blacksmithing.lastIncome = money;
          let blacksmithSuccessChance = 0.2;
          if (this.homeService.furniture.workbench?.id === 'anvil') {
            blacksmithSuccessChance += 0.2;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.5 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.1 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1) {
                // if the metal was found
                const metalLore = this.characterService.characterState.attributes.metalLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(metalLore), grade / 160), grade / 10)),
                    'metal',
                    true
                  )
                );
              }
            }
          }
          if (Math.random() < 0.001) {
            this.inventoryService.addItem(this.itemRepoService.items['pillMold']);
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 25,
        },
        {
          stamina: 25,
        },
        {
          stamina: 25,
        },
        {
          stamina: 50,
        },
      ],
      requirements: [
        {
          strength: 50,
          toughness: 50,
        },
        {
          strength: 400,
          toughness: 400,
          metalLore: 1,
        },
        {
          strength: 2000,
          toughness: 2000,
          metalLore: 10,
          fireLore: 1,
        },
        {
          strength: 10000,
          toughness: 10000,
          metalLore: 100,
          fireLore: 10,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2,
    };

    this.GatherHerbs = {
      level: 0,
      name: ['Gathering Herbs'],
      imageBaseName: 'herbs',
      activityType: ActivityType.GatherHerbs,
      description: ['Search the natural world for useful herbs.'],
      consequenceDescription: ['Uses 10 Stamina. Find herbs and learn about plants'],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          // the grade on herbs probably needs diminishing returns
          this.inventoryService.generateHerb();
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'herbGarden') {
            this.inventoryService.generateHerb();
          }
          this.characterService.characterState.increaseAttribute('woodLore', 0.003);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 10,
        },
      ],
      requirements: [
        {
          speed: 20,
          intelligence: 20,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Alchemy = {
      level: 0,
      name: ['Apprentice Alchemy', 'Journeyman Alchemy', 'Alchemy', 'Master Alchemy'],
      imageBaseName: 'alchemy',
      activityType: ActivityType.Alchemy,
      description: [
        "Get a job at the alchemist's workshop. It smells awful but you might learn a few things.",
        'Get a cauldron and do a little brewing of your own.',
        'Open up your own alchemy shop.',
        'Brew power, precipitate life, stir in some magic, and create consumable miracles.',
      ],
      consequenceDescription: [
        'Uses 10 Stamina. Get smarter, make a few taels, and learn the secrets of alchemy.',
        'Uses 10 Stamina. Get smarter, make money, practice your craft. If you have some herbs, you might make a usable potion or pill.',
        'Uses 10 Stamina. Get smarter, make money, and make some decent potions or pills.',
        'Uses 20 Stamina. Create amazing potions and pills.',
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          const money =
            Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value;
          this.characterService.characterState.updateMoney(money);
          this.Alchemy.lastIncome = money;
          let alchemySuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'cauldron') {
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore', 0.05 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore', 0.1 * alchemySuccessChance);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence', 0.2);
          this.characterService.characterState.status.stamina.value -= 10;
          const money =
            Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value * 2;
          this.characterService.characterState.updateMoney(money);
          this.Alchemy.lastIncome = money;
          let alchemySuccessChance = 0.02;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'cauldron') {
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore', 0.1 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore', 0.2 * alchemySuccessChance);
          if (Math.random() < alchemySuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0) {
              let grade = this.inventoryService.consume('ingredient');
              if (grade >= 1) {
                // if the ingredient was found
                grade = Math.floor(
                  grade * Math.log10(this.characterService.characterState.attributes.waterLore.value + 10)
                );
                this.inventoryService.generatePotion(grade, false);
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence', 0.5);
          this.characterService.characterState.status.stamina.value -= 10;
          const money =
            Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value * 5;
          this.characterService.characterState.updateMoney(money);
          this.Alchemy.lastIncome = money;
          let alchemySuccessChance =
            1 - Math.exp(0 - 0.025 * Math.log(this.characterService.characterState.attributes.waterLore.value));
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'cauldron') {
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore', 0.15 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore', 0.3 * alchemySuccessChance);
          if (Math.random() < alchemySuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0) {
              let grade = this.inventoryService.consume('ingredient');
              if (grade >= 1) {
                // if the ingredient was found
                grade = Math.floor(
                  grade * Math.log10(this.characterService.characterState.attributes.waterLore.value + 10)
                );
                this.inventoryService.generatePotion(grade + 1, false);
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence', 1);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value * 10;
          this.characterService.characterState.updateMoney(money);
          this.Alchemy.lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.2);
          this.characterService.characterState.increaseAttribute('waterLore', 0.6);
          if (this.inventoryService.openInventorySlots() > 0) {
            let grade = this.inventoryService.consume('ingredient');
            if (grade >= 1) {
              // if the ingredient was found
              grade = Math.floor(
                grade * Math.log10(this.characterService.characterState.attributes.waterLore.value + 10)
              );
              if (
                grade > 1000000 &&
                this.inventoryService.consumeById('divinePeach') >= 1 &&
                this.homeService.furniture.workbench &&
                this.homeService.furniture.workbench.id === 'cauldron'
              ) {
                this.inventoryService.addItem(this.itemRepoService.items['distilledPeachEssence']);
              } else {
                this.inventoryService.generatePotion(grade + 1, true);
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 10,
        },
        {
          stamina: 10,
        },
        {
          stamina: 10,
        },
        {
          stamina: 20,
        },
      ],
      requirements: [
        {
          intelligence: 200,
        },
        {
          intelligence: 1000,
          waterLore: 1,
        },
        {
          intelligence: 8000,
          waterLore: 10,
          woodLore: 1,
        },
        {
          intelligence: 100000,
          waterLore: 100,
          woodLore: 10,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2,
    };

    this.ChopWood = {
      level: 0,
      name: ['Chopping Wood'],
      imageBaseName: 'chopping',
      activityType: ActivityType.ChopWood,
      description: ['Work as a woodcutter, cutting logs in the forest.'],
      consequenceDescription: ['Uses 10 Stamina. Get a log and learn about plants.'],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          this.inventoryService.addItem(this.inventoryService.getWood());
          this.characterService.characterState.increaseAttribute('woodLore', 0.01);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 10,
        },
      ],
      requirements: [
        {
          strength: 100,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Woodworking = {
      level: 0,
      name: ['Apprentice Woodworking', 'Journeyman Woodworking', 'Woodworking', 'Master Woodworking'],
      imageBaseName: 'woodworking',
      activityType: ActivityType.Woodworking,
      description: [
        "Work in a woodcarver's shop.",
        'Carve wood into useful items.',
        'Open your own woodworking shop.',
        'Carve pure poetry in wooden form.',
      ],
      consequenceDescription: [
        'Uses 20 Stamina. Increases strength and intelligence and provides a little money.',
        'Uses 20 Stamina. Increases strength and intelligence and provides a little money. You may make something you want to keep now and then.',
        'Uses 20 Stamina. Increases strength and intelligence, earn some money, create wooden equipment.',
        'Uses 40 Stamina. Create the best of wooden weapons.',
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.intelligence.value
            ) + this.characterService.characterState.attributes.woodLore.value;
          this.characterService.characterState.updateMoney(money);
          this.Woodworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength', 0.2);
          this.characterService.characterState.increaseAttribute('intelligence', 0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.intelligence.value
            ) +
            this.characterService.characterState.attributes.woodLore.value * 2;
          this.characterService.characterState.updateMoney(money);
          this.Woodworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.005);
          if (Math.random() < 0.02) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1) {
                // if the wood was found
                const woodLore = this.characterService.characterState.attributes.woodLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(woodLore), grade / 16), grade)),
                    'wood',
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength', 0.5);
          this.characterService.characterState.increaseAttribute('intelligence', 0.5);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.intelligence.value
            ) +
            this.characterService.characterState.attributes.woodLore.value * 5;
          this.characterService.characterState.updateMoney(money);
          this.Woodworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.02);
          if (Math.random() < 0.05) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1) {
                // if the wood was found
                const woodLore = this.characterService.characterState.attributes.woodLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(woodLore), grade / 16), grade)),
                    'wood',
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength', 1);
          this.characterService.characterState.increaseAttribute('intelligence', 1);
          this.characterService.characterState.status.stamina.value -= 40;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.intelligence.value
            ) +
            this.characterService.characterState.attributes.woodLore.value * 10;
          this.characterService.characterState.updateMoney(money);
          this.Woodworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.6);
          if (Math.random() < 0.2) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1) {
                // if the wood was found
                const woodLore = this.characterService.characterState.attributes.woodLore.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateWeapon(
                    Math.floor(Math.max(Math.pow(Math.log2(woodLore), grade / 16), grade)),
                    'wood',
                    true
                  )
                );
              }
            }
          }
          if (Math.random() < 0.001) {
            this.inventoryService.addItem(this.itemRepoService.items['pillBox']);
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
        {
          stamina: 20,
        },
        {
          stamina: 20,
        },
        {
          stamina: 40,
        },
      ],
      requirements: [
        {
          strength: 100,
          intelligence: 100,
        },
        {
          strength: 800,
          intelligence: 800,
          woodLore: 1,
        },
        {
          strength: 2000,
          intelligence: 2000,
          woodLore: 10,
        },
        {
          strength: 10000,
          intelligence: 10000,
          woodLore: 100,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2,
    };

    this.Leatherworking = {
      level: 0,
      name: ['Apprentice Leatherworking', 'Journeyman Leatherworking', 'Leatherworking', 'Master Leatherworking'],
      imageBaseName: 'leatherworking',
      activityType: ActivityType.Leatherworking,
      description: [
        'Work in a tannery, where hides are turned into leather items.',
        'Convert hides into leather items.',
        'Open your own tannery.',
        'Fashion!',
      ],
      consequenceDescription: [
        'Uses 20 Stamina. Increases speed and toughness and provides a little money.',
        'Uses 20 Stamina. Increases speed and toughness and provides a little money. You may make something you want to keep now and then.',
        'Uses 20 Stamina. Increases speed and toughness, earn some money, create leather equipment.',
        'Uses 40 Stamina. Create the fanciest pants you can imagine. Maybe some boots, too.',
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.speed.value +
                this.characterService.characterState.attributes.toughness.value
            ) + this.characterService.characterState.attributes.animalHandling.value;
          this.characterService.characterState.updateMoney(money);
          this.Leatherworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed', 0.2);
          this.characterService.characterState.increaseAttribute('toughness', 0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.speed.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.animalHandling.value * 2;
          this.characterService.characterState.updateMoney(money);
          this.Leatherworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling', 0.002);
          if (Math.random() < 0.01) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1) {
                // if the hide was found
                const animalHandling = this.characterService.characterState.attributes.animalHandling.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateArmor(
                    Math.floor(Math.max(Math.pow(Math.log2(animalHandling), grade / 16), grade)),
                    'leather',
                    this.inventoryService.randomArmorSlot(),
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed', 0.5);
          this.characterService.characterState.increaseAttribute('toughness', 0.5);
          this.characterService.characterState.status.stamina.value -= 20;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.speed.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.animalHandling.value * 5;
          this.characterService.characterState.updateMoney(money);
          this.Leatherworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling', 0.003);
          if (Math.random() < 0.01) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1) {
                // if the hide was found
                const animalHandling = this.characterService.characterState.attributes.animalHandling.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateArmor(
                    Math.floor(Math.max(Math.pow(Math.log2(animalHandling), grade / 16), grade)),
                    'leather',
                    this.inventoryService.randomArmorSlot(),
                    true
                  )
                );
              }
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed', 1);
          this.characterService.characterState.increaseAttribute('toughness', 1);
          this.characterService.characterState.status.stamina.value -= 40;
          const money =
            Math.log2(
              this.characterService.characterState.attributes.speed.value +
                this.characterService.characterState.attributes.toughness.value
            ) +
            this.characterService.characterState.attributes.animalHandling.value * 10;
          this.characterService.characterState.updateMoney(money);
          this.Leatherworking.lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling', 0.1);
          if (Math.random() < 0.2) {
            if (this.inventoryService.openInventorySlots() > 0) {
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1) {
                // if the hide was found
                const animalHandling = this.characterService.characterState.attributes.animalHandling.value;
                this.inventoryService.addItem(
                  this.inventoryService.generateArmor(
                    Math.floor(Math.max(Math.pow(Math.log2(animalHandling), grade / 16), grade)),
                    'leather',
                    this.inventoryService.randomArmorSlot(),
                    true
                  )
                );
              }
            }
          }
          if (Math.random() < 0.001) {
            this.inventoryService.addItem(this.itemRepoService.items['pillPouch']);
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
        {
          stamina: 20,
        },
        {
          stamina: 20,
        },
        {
          stamina: 40,
        },
      ],
      requirements: [
        {
          speed: 100,
          toughness: 100,
        },
        {
          speed: 800,
          toughness: 800,
          animalHandling: 1,
        },
        {
          speed: 2000,
          toughness: 2000,
          animalHandling: 10,
        },
        {
          speed: 10000,
          toughness: 10000,
          animalHandling: 100,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2,
    };

    this.Farming = {
      level: 0,
      name: ['Farming'],
      imageBaseName: 'farming',
      activityType: ActivityType.Farming,
      description: ["Plant crops in your fields. This is a waste of time if you don't have some fields ready to work."],
      consequenceDescription: [
        'Uses 20 Stamina. Increases strength and speed and helps your fields to produce more food.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 20;
          let farmPower = Math.floor(
            Math.log10(
              this.characterService.characterState.attributes.woodLore.value +
                this.characterService.characterState.attributes.earthLore.value
            )
          );
          if (farmPower < 1) {
            farmPower = 1;
          }
          this.homeService.workFields(farmPower);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.increaseAttribute('woodLore', 0.001);
          this.characterService.characterState.increaseAttribute('earthLore', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
      ],
      requirements: [
        {
          strength: 10,
          speed: 10,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Mining = {
      level: 0,
      name: ['Mining'],
      imageBaseName: 'mining',
      activityType: ActivityType.Mining,
      description: ['Dig in the ground for usable minerals.'],
      consequenceDescription: ['Uses 20 Stamina. Increases strength and sometimes finds something useful.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('earthLore', 0.05);
          if (Math.random() < 0.5) {
            this.inventoryService.addItem(this.inventoryService.getOre());
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
      ],
      requirements: [
        {
          strength: 70,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Smelting = {
      level: 0,
      name: ['Smelting'],
      imageBaseName: 'smelting',
      activityType: ActivityType.Smelting,
      description: ['Smelt metal ores into usable metal.'],
      consequenceDescription: [
        'Uses 20 Stamina. Increases toughness and intelligence. If you have metal ores, you can make them into bars.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.increaseAttribute('metalLore', 0.01);
          if (this.inventoryService.openInventorySlots() > 0) {
            const grade = this.inventoryService.consume('ore');
            if (grade >= 1) {
              this.inventoryService.addItem(this.inventoryService.getBar(grade));
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 20,
        },
      ],
      requirements: [
        {
          toughness: 100,
          intelligence: 100,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Hunting = {
      level: 0,
      name: ['Hunting'],
      imageBaseName: 'hunting',
      activityType: ActivityType.Hunting,
      description: ['Hunt for animals in the nearby woods.'],
      consequenceDescription: [
        'Uses 50 Stamina. Increases speed and a good hunt provides some meat. It might draw unwanted attention to yourself.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 50;
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          let huntingSuccessChance = 0.1;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'dogKennel') {
            huntingSuccessChance += 0.4;
          }
          this.characterService.characterState.increaseAttribute('animalHandling', 0.1 * huntingSuccessChance);
          if (Math.random() < huntingSuccessChance) {
            this.inventoryService.addItem(this.itemRepoService.items['meat']);
            this.inventoryService.addItem(
              this.inventoryService.getHide(),
              Math.floor(this.followerService.jobs['hunter'].totalPower / 20)
            );
          }
          if (Math.random() < 0.01 && this.battleService.enemies.length === 0) {
            this.battleService.addEnemy({
              name: 'a hungry wolf',
              baseName: 'wolf',
              health: 20,
              maxHealth: 20,
              accuracy: 0.5,
              attack: 5,
              defense: 5,
              loot: [this.inventoryService.getHide()],
            });
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 50,
        },
      ],
      requirements: [
        {
          speed: 200,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Fishing = {
      level: 0,
      name: ['Fishing'],
      imageBaseName: 'fishing',
      // cormorant fishing later!
      activityType: ActivityType.Fishing,
      description: ['Grab your net and see if you can catch some fish.'],
      consequenceDescription: ['Uses 30 Stamina. Increases intelligence and strength and you might catch a fish.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 30;
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.increaseAttribute('animalHandling', 0.02);
          this.characterService.characterState.increaseAttribute('waterLore', 0.01);
          if (Math.random() < 0.2) {
            this.inventoryService.addItem(this.itemRepoService.items['carp']);
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 30,
        },
      ],
      requirements: [
        {
          strength: 15,
          intelligence: 15,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Burning = {
      level: 0,
      name: ['Burning Things'],
      imageBaseName: 'burning',
      activityType: ActivityType.Burning,
      description: ['Light things on fire and watch them burn.'],
      consequenceDescription: ['Uses 5 Stamina. You will be charged for what you burn. Teaches you to love fire.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 5;
          const moneyCost = this.characterService.characterState.increaseAttribute('fireLore', 0.1);
          this.characterService.characterState.updateMoney(0 - moneyCost);
          if (this.characterService.characterState.money < 0) {
            this.characterService.characterState.money = 0;
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 5,
        },
      ],
      requirements: [
        {
          intelligence: 10,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.BalanceChi = {
      level: 0,
      name: ['Balance Your Chi'],
      imageBaseName: 'balance',
      activityType: ActivityType.BalanceChi,
      description: ['Balance the flow of your chi and widen your meridians.'],
      consequenceDescription: ['Uses 100 Stamina. Increases your weakest lore.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          let lowStat = 'earthLore' as AttributeType;
          for (const attribute of ['metalLore', 'woodLore', 'waterLore', 'fireLore'] as AttributeType[]) {
            if (
              this.characterService.characterState.attributes[attribute].value <
              this.characterService.characterState.attributes[lowStat].value
            ) {
              lowStat = attribute;
            }
          }
          let value = 0.01;
          if (this.characterService.characterState.manaUnlocked || this.characterService.characterState.easyMode) {
            value = 0.1;
          }
          this.characterService.characterState.increaseAttribute(lowStat, value);
          this.characterService.characterState.increaseAttribute('spirituality', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            if (this.characterService.characterState.yin > this.characterService.characterState.yang) {
              this.characterService.characterState.yang++;
            } else {
              this.characterService.characterState.yin++;
            }
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [
        {
          strength: 1000,
          speed: 1000,
          toughness: 1000,
          charisma: 1000,
          intelligence: 1000,
          earthLore: 1000,
          metalLore: 1000,
          woodLore: 1000,
          waterLore: 1000,
          fireLore: 1000,
          spirituality: 1,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.BodyCultivation = {
      level: 0,
      name: ['Body Cultivation'],
      imageBaseName: 'bodycultivation',
      activityType: ActivityType.BodyCultivation,
      description: [
        'Focus on the development of your body. Unblock your meridians, let your chi flow, and prepare your body for immortality.',
      ],
      consequenceDescription: [
        'Uses 100 Stamina. Increases your physical abilities and strengthen your aptitudes in them.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          this.characterService.characterState.increaseAttribute('strength', 1);
          this.characterService.characterState.increaseAttribute('speed', 1);
          this.characterService.characterState.increaseAttribute('toughness', 1);
          this.characterService.characterState.attributes.strength.aptitude += 0.1;
          this.characterService.characterState.attributes.speed.aptitude += 0.1;
          this.characterService.characterState.attributes.toughness.aptitude += 0.1;
          this.characterService.characterState.increaseAttribute('spirituality', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [
        {
          strength: 5000,
          speed: 5000,
          toughness: 5000,
          spirituality: 1,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.MindCultivation = {
      level: 0,
      name: ['Mind Cultivation'],
      imageBaseName: 'mindcultivation',
      activityType: ActivityType.MindCultivation,
      description: [
        'Focus on the development of your mind. Unblock your meridians, let your chi flow, and prepare your mind for immortality.',
      ],
      consequenceDescription: [
        'Uses 100 Stamina. Increases your mental abilities and strengthen your aptitudes in them.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          this.characterService.characterState.increaseAttribute('intelligence', 1);
          this.characterService.characterState.increaseAttribute('charisma', 1);
          this.characterService.characterState.attributes.intelligence.aptitude += 0.1;
          this.characterService.characterState.attributes.charisma.aptitude += 0.1;
          this.characterService.characterState.increaseAttribute('spirituality', 0.001);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [
        {
          charisma: 5000,
          intelligence: 5000,
          spirituality: 1,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.CoreCultivation = {
      level: 0,
      name: ['Core Cultivation'],
      imageBaseName: 'corecultivation',
      activityType: ActivityType.CoreCultivation,
      description: ['Focus on the development of your soul core.'],
      consequenceDescription: [
        'Uses 200 Stamina. A very advanced cultivation technique. Make sure you have achieved a deep understanding of elemental balance before attempting this. Gives you a small chance of increasing your mana capabilities.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 200;
          if (this.characterService.characterState.manaUnlocked) {
            if (Math.random() < 0.01) {
              this.characterService.characterState.status.mana.max++;
              this.characterService.characterState.status.mana.value++;
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 200,
        },
      ],
      requirements: [
        {
          woodLore: 1000,
          waterLore: 1000,
          fireLore: 1000,
          metalLore: 1000,
          earthLore: 1000,
          spirituality: 1000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.SoulCultivation = {
      level: 0,
      name: ['Soul Cultivation'],
      imageBaseName: 'soulcultivation',
      activityType: ActivityType.SoulCultivation,
      description: ['Focus on the development of your immortal soul.'],
      consequenceDescription: [
        "Uses 1000 health. An immortal's cultivation technique. Balance your attributes and your lore, and improve yourself in every way.",
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.health.value -= 1000;
          let lowStat = 'earthLore' as AttributeType;
          for (const attribute of ['metalLore', 'woodLore', 'waterLore', 'fireLore'] as AttributeType[]) {
            if (
              this.characterService.characterState.attributes[attribute].value <
              this.characterService.characterState.attributes[lowStat].value
            ) {
              lowStat = attribute;
            }
          }
          this.characterService.characterState.increaseAttribute(lowStat, 1);

          lowStat = 'strength' as AttributeType;
          for (const attribute of ['speed', 'toughness', 'intelligence', 'charisma'] as AttributeType[]) {
            if (
              this.characterService.characterState.attributes[attribute].value <
              this.characterService.characterState.attributes[lowStat].value
            ) {
              lowStat = attribute;
            }
          }
          this.characterService.characterState.increaseAttribute(lowStat, 1);
          this.characterService.characterState.increaseAttribute('spirituality', 0.01);

          this.characterService.characterState.healthBonusSoul++;
          this.characterService.characterState.status.stamina.max++;
          this.characterService.characterState.status.mana.max++;
          this.characterService.characterState.checkOverage();
          if (this.characterService.characterState.yinYangUnlocked) {
            if (this.characterService.characterState.yin > this.characterService.characterState.yang) {
              this.characterService.characterState.yang++;
            } else {
              this.characterService.characterState.yin++;
            }
          }
        },
      ],
      resourceUse: [
        {
          health: 1000,
        },
      ],
      requirements: [
        {
          spirituality: 1e15,
          // also requires immortality in getActivityList
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.InfuseEquipment = {
      level: 0,
      name: ['Infuse Equipment'],
      imageBaseName: 'infuseequipment',
      activityType: ActivityType.InfuseEquipment,
      description: ['Infuse the power of a gem into your equipment.'],
      consequenceDescription: ['Uses 200 Stamina and 10 mana. An advanced magical technique.'],
      consequence: [
        () => {
          if (!this.characterService.characterState.manaUnlocked) {
            return;
          }
          this.characterService.characterState.status.stamina.value -= 200;
          this.characterService.characterState.status.mana.value -= 10;
          const gemValue = this.inventoryService.consume('spiritGem', 1, this.inventoryService.useCheapestSpiritGem);
          if (gemValue > 0 && this.characterService.characterState.status.mana.value >= 0) {
            this.inventoryService.upgradeEquppedEquipment(Math.floor(Math.pow(gemValue / 10, 2.4)));
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 200,
          mana: 10,
        },
      ],
      requirements: [
        {
          strength: 2e7,
          toughness: 2e7,
          speed: 2e7,
          spirituality: 10000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.InfuseBody = {
      level: 0,
      name: ['Infuse Body'],
      imageBaseName: 'infusebody',
      activityType: ActivityType.InfuseBody,
      description: [
        'Direct your magical energy into reinforcing your physical body, making it healthier and more able to sustain damage without falling.',
      ],
      consequenceDescription: [
        'Uses 10 Mana and 200 Stamina. Make sure you have enough magical power before attempting this.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 200;
          if (
            this.characterService.characterState.manaUnlocked &&
            this.characterService.characterState.status.mana.value >= 10
          ) {
            this.characterService.characterState.status.mana.value -= 10;
            this.characterService.characterState.healthBonusMagic++;
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 200,
          mana: 10,
        },
      ],
      requirements: [
        {
          woodLore: 1000,
          waterLore: 1000,
          fireLore: 1000,
          metalLore: 1000,
          earthLore: 1000,
          spirituality: 1000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.ExtendLife = {
      level: 0,
      name: ['Extending Life'],
      imageBaseName: 'extendlife',
      activityType: ActivityType.ExtendLife,
      description: ['Direct your magical energy into extending your lifespan, making you live longer.'],
      consequenceDescription: [
        'Uses 20 Mana and 400 Stamina. Make sure you have enough magical power before attempting this.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 400;
          if (
            this.characterService.characterState.manaUnlocked &&
            this.characterService.characterState.status.mana.value >= 20
          ) {
            this.characterService.characterState.status.mana.value -= 20;
            if (this.characterService.characterState.magicLifespan < 36500) {
              this.characterService.characterState.magicLifespan += 10;
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 400,
          mana: 20,
        },
      ],
      requirements: [
        {
          woodLore: 10000,
          waterLore: 10000,
          fireLore: 10000,
          metalLore: 10000,
          earthLore: 10000,
          spirituality: 10000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Recruiting = {
      level: 0,
      name: ['Recruiting Followers'],
      imageBaseName: 'recruiting',
      activityType: ActivityType.Recruiting,
      description: ['Look for followers willing to serve you.'],
      consequenceDescription: [
        'Uses 100 Stamina and 1M taels. Gives you a small chance of finding a follower, if you are powerful enough to attract any.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100;
          if (this.characterService.characterState.money <= 1000000) {
            return;
          }
          this.characterService.characterState.updateMoney(-1000000);
          if (this.followerService.followersUnlocked && this.characterService.characterState.money > 0) {
            if (Math.random() < 0.01) {
              this.followerService.generateFollower();
            }
          } else {
            this.logService.injury(
              LogTopic.EVENT,
              'All of your potential followers ignore your recruiting efforts after sensing your low cultivation.'
            );
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [
        {
          charisma: 5e7,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.TrainingFollowers = {
      level: 0,
      name: ['Training Followers'],
      imageBaseName: 'trainingfollowers',
      activityType: ActivityType.TrainingFollowers,
      description: ['Train your followers to make them more powerful.'],
      consequenceDescription: [
        'Uses 1000 Stamina. Gives you a small chance for each follower of increasing their power. They might learn more if you are a better leader.',
      ],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 1000;
          this.trainingFollowersDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000,
        },
      ],
      requirements: [
        {
          charisma: 1e10,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.Taunting = {
      level: 0,
      name: ['Taunting Enemies'],
      imageBaseName: 'taunting',
      activityType: ActivityType.Taunting,
      description: ['Rudely point at your enemies and call them out to battle.'],
      consequenceDescription: ['Incites a fight with your current enemy this very night.'],
      consequence: [
        () => {
          this.battleService.tickCounter = this.battleService.ticksPerFight;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [{}],
      requirements: [
        {
          strength: 1000,
          toughness: 1000,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.CombatTraining = {
      level: 0,
      name: ['Combat Training'],
      imageBaseName: 'combattraining',
      activityType: ActivityType.CombatTraining,
      description: [
        'Hone every fiber of your being to martial sepremacy. Your experience in the Hell of Mirrors allowed you to examine your own combat form and understand how to improve it. Now all you need is practice.',
      ],
      consequenceDescription: ['Uses 10000 stamina. Trains your Combat Mastery.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 10000;
          this.characterService.characterState.increaseAttribute('combatMastery', 0.01);
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
            this.characterService.characterState.yin++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 10000,
        },
      ],
      requirements: [
        {
          combatMastery: 1,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.PetRecruiting = {
      level: 0,
      name: ['Finding Pets'],
      imageBaseName: 'findingpets',
      activityType: ActivityType.PetRecruiting,
      description: ['Look for animals that want to be your pets.'],
      consequenceDescription: ['Uses 100 Stamina and 100,000 food. Gives you a small chance of finding a pet.'],
      consequence: [
        () => {
          if (this.inventoryService.getQuantityByType('food') < 100000) {
            return;
          }
          this.characterService.characterState.status.stamina.value -= 100;
          if (this.inventoryService.consume('food', 100000, true) <= 0) {
            return;
          }
          this.characterService.characterState.increaseAttribute('animalHandling', 1);
          if (this.followerService.followersUnlocked && this.followerService.petsEnabled) {
            if (Math.random() < 0.01) {
              this.followerService.generateFollower(true);
            }
          }
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100,
        },
      ],
      requirements: [
        {
          animalHandling: 1e15,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.PetTraining = {
      level: 0,
      name: ['Training Pets'],
      imageBaseName: 'trainingpets',
      activityType: ActivityType.PetTraining,
      description: ['Train your pets to make them more powerful.'],
      consequenceDescription: [
        'Uses 1000 Stamina and 100k food. Gives you a small chance for each pet of increasing their power. They might learn more if you are a better with animals.',
      ],
      consequence: [
        () => {
          if (this.inventoryService.getQuantityByType('food') < 100000) {
            return;
          }
          this.characterService.characterState.status.stamina.value -= 1000;
          // Consuming this food is kind of expensive performance wise, but since the stacks are so high
          // it would be impractical to ask players to keep so much in inventory. Maybe we can keep track of
          // a hidden temporary food value or something in the future?
          if (this.inventoryService.consume('food', 100000, true) <= 0) {
            return;
          }
          this.characterService.characterState.increaseAttribute('animalHandling', 1);
          this.trainingPetsDays++;
          if (this.characterService.characterState.yinYangUnlocked) {
            this.characterService.characterState.yang++;
          }
        },
      ],
      resourceUse: [
        {
          stamina: 1000,
        },
      ],
      requirements: [
        {
          animalHandling: 1e18,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };

    this.PurifyGems = {
      level: 0,
      name: ['Purifying Gems'],
      imageBaseName: 'purifyinggems',
      activityType: ActivityType.PurifyGems,
      description: ['Purify corrupted spirit gems into something more useful.'],
      consequenceDescription: ['Uses 100000 Stamina and a corrupted spirit gem.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value -= 100000;
          const value = this.inventoryService.consume('corruptionGem');
          if (value > 0) {
            // TODO: add more flavors of gems
            this.inventoryService.addItem(this.inventoryService.generateSpiritGem(value / 10, 'life'));
          }
        },
      ],
      resourceUse: [
        {
          stamina: 100000,
        },
      ],
      requirements: [
        {
          //TODO: tune this
          spirituality: 1e24,
        },
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0,
    };
  }
}
/* eslint-enable @typescript-eslint/ban-ts-comment */
