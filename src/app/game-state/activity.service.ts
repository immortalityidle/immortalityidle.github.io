import { Injectable, Injector, signal } from '@angular/core';
import { BattleService, EFFECT_CORRUPTION, LOOT_TYPE_GEM } from './battle.service';
import {
  Activity,
  ActivityLoopEntry,
  ActivityType,
  LocationType,
  LoopChangeTrigger,
  SavedActivityLoop,
  YinYangEffect,
} from '../game-state/activity';
import { AttributeType, CharacterAttribute, StatusType } from '../game-state/character.service';
import { CharacterService } from '../game-state/character.service';
import { HomeService, HomeType } from '../game-state/home.service';
import { Equipment, InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ImpossibleTaskService, ImpossibleTaskType } from './impossibleTask.service';
import { Follower, FollowersService } from './followers.service';
import { HellLevel, HellService } from './hell.service';
import { FarmService } from './farm.service';
import { LocationService } from './location.service';

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
  savedActivityLoops: SavedActivityLoop[];
  loopChangeTriggers: LoopChangeTrigger[];
  triggerIndex: number;
  autoPauseUnlocked: boolean;
  autoRestUnlocked: boolean;
  pauseOnImpossibleFail: boolean;
  totalExhaustedDays: number;
  purifyGemsUnlocked: boolean;
  lifeActivities: { [key in ActivityType]?: number };
  familySpecialty: ActivityType | null;
  miningCounter: number;
  huntingCounter: number;
  fishingCounter: number;
  tauntCounter: number;
  recruitingCounter: number;
  petRecruitingCounter: number;
  coreCultivationCounter: number;
  researchWindCounter: number;
  beforeDeathPauseUsed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  savedActivityLoops: SavedActivityLoop[] = [];
  loopChangeTriggers: LoopChangeTrigger[] = [];
  triggerIndex = 0;
  spiritActivity: ActivityType | null = null;
  autoRestart = false;
  autoPauseUnlocked = false;
  pauseOnImpossibleFail = true;
  pauseOnDeath = true;
  pauseBeforeDeath = false;
  beforeDeathPauseUsed = false;
  activities: Activity[];
  portals: Activity[];
  openApprenticeships = 1;
  oddJobDays = 0;
  beggingDays = 0;
  completedApprenticeships: ActivityType[] = [];
  currentIndex = 0;
  displayCurrentIndex = signal<number>(0);
  currentTickCount = 0;
  displayCurrentTickCount = signal<number>(0);
  exhaustionDays = 0;
  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentApprenticeship: ActivityType | undefined = undefined;
  activityDeath = false; // Simpler to just check a flag for the achievement.
  autoRestUnlocked = false;
  totalExhaustedDays = 0;
  spiritActivityProgress = false;
  purifyGemsUnlocked = false;
  private trainingFollowersDays = 0;
  private trainingPetsDays = 0;
  immediateActivity: Activity | null = null;
  lifeActivities: { [key in ActivityType]?: number } = {};
  familySpecialty: ActivityType | null = null;
  supportedSpecialties = [
    ActivityType.Begging,
    ActivityType.Cooking,
    ActivityType.Blacksmithing,
    ActivityType.Alchemy,
    ActivityType.Woodworking,
    ActivityType.Leatherworking,
  ];
  tauntCounter = 0;
  pillMoldCounter = 0;
  pillBoxCounter = 0;
  pillPouchCounter = 0;
  researchWindCounter = 0;
  miningCounter = 0;
  huntingCounter = 0;
  fishingCounter = 0;
  recruitingCounter = 0;
  petRecruitingCounter = 0;
  coreCultivationCounter = 0;
  locationService?: LocationService;
  hellService?: HellService;

  constructor(
    private injector: Injector,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    public homeService: HomeService,
    public farmService: FarmService,
    private mainLoopService: MainLoopService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService,
    private logService: LogService,
    private followerService: FollowersService,
    private impossibleTaskService: ImpossibleTaskService
  ) {
    this.activities = [
      this.Swim,
      this.ForgeChains,
      this.AttachChains,
      this.MakeBrick,
      this.MakeMortar,
      this.MakeScaffold,
      this.BuildTower,
      this.ResearchWind,
      this.TameWinds,
      this.LearnToFly,
      this.OfferDragonFood,
      this.OfferDragonWealth,
      this.TalkToDragon,
      this.GatherArmies,
      this.ConquerTheNation,
      this.MoveStars,
      this.Resting,
      this.Begging,
      this.Cooking,
      this.Blacksmithing,
      this.Woodworking,
      this.Leatherworking,
      this.Alchemy,
      this.FormationCreation,
      this.Plowing,
      this.Clearing,
      this.Farming,
      this.Mining,
      this.Smelting,
      this.ChopWood,
      this.Hunting,
      this.Fishing,
      this.GatherHerbs,
      this.Taunting,
      this.Burning,
      this.OddJobs,
      this.BodyCultivation,
      this.MindCultivation,
      this.BalanceChi,
      this.CoreCultivation,
      this.InfuseEquipment,
      this.InfuseBody,
      this.ExtendLife,
      this.SoulCultivation,
      this.PurifyGems,
      this.Recruiting,
      this.TrainingFollowers,
      this.PetRecruiting,
      this.PetTraining,
      this.CombatTraining,
    ];
    this.portals = [];
    setTimeout(() => (this.locationService = this.injector.get(LocationService)));
    setTimeout(() => (this.hellService = this.injector.get(HellService)));

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

    mainLoopService.longTickSubject.subscribe(daysElapsed => {
      if (
        this.characterService.bloodlineRank >= 9 &&
        !(this.hellService?.inHell() && this.hellService.currentHell === HellLevel.TreesOfKnives)
      ) {
        this.characterService.increaseAptitudeDaily(daysElapsed);
      }
      this.upgradeActivities(false);
      this.checkRequirements(false);
    });
    mainLoopService.displayValueTickSubject.subscribe(() => {
      this.displayCurrentIndex.set(this.currentIndex);
      this.displayCurrentTickCount.set(this.currentTickCount);
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
          const attribute = this.characterService.attributes.charisma.value;
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
          const attribute = this.characterService.attributes.animalHandling.value;
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

    mainLoopService.activityTickSubject.subscribe(() => {
      if (this.activityLoop.length === 0 && !this.immediateActivity) {
        this.mainLoopService.pause = true;
        return;
      }
      if (this.characterService.dead) {
        return;
      }
      if (
        this.pauseBeforeDeath &&
        !this.beforeDeathPauseUsed &&
        this.characterService.age >= this.characterService.lifespan - 1 &&
        !this.characterService.immortal()
      ) {
        this.logService.log(LogTopic.EVENT, 'The end of your natural life is imminent. Game paused.');
        this.mainLoopService.pause = true;
        this.beforeDeathPauseUsed = true;
        this.mainLoopService.autopauseTriggered = true;
        return;
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
        this.lifeActivities[activity.activityType] = (this.lifeActivities[activity.activityType] || 0) + 1;
        activity.consequence[activity.level]();
        this.homeService.triggerWorkstations(activity.activityType);
        this.checkExhaustion();
        this.checkQiOveruse();
        // check for activity death
        this.activityDeath = false;
        if (this.characterService.status.health.value <= 0) {
          this.activityDeath = true;
        }
        this.handleSpiritActivity();
        if (this.characterService.money > this.characterService.maxMoney) {
          this.characterService.updateMoney(this.characterService.maxMoney, true);
        }
        return;
      }

      this.checkTriggers();

      // TODO: at high tick speeds, don't call the consequences here, instead figure out a set of counters, then do the consequences as a batch

      if (this.currentIndex < this.activityLoop.length) {
        this.currentLoopEntry = this.activityLoop[this.currentIndex];
        let activity = this.getActivityByType(this.currentLoopEntry.activity);
        // check if our current activity is zero-day
        if (
          activity === null ||
          this.currentLoopEntry.disabled ||
          this.currentLoopEntry.userDisabled ||
          this.currentLoopEntry.repeatTimes === 0
        ) {
          // don't do the activity, instead see if there's a next one we can switch to
          let index = 0;
          if (this.currentIndex < this.activityLoop.length - 1) {
            index = this.currentIndex + 1;
          }
          while (
            index !== this.currentIndex &&
            (this.activityLoop[index].repeatTimes === 0 ||
              this.activityLoop[index].disabled ||
              this.activityLoop[index].userDisabled ||
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
          this.lifeActivities[activity.activityType] = (this.lifeActivities[activity.activityType] || 0) + 1;
          activity.consequence[activity.level]();
          this.homeService.triggerWorkstations(activity.activityType);
        } else {
          console.log('Invalid activity, skipping activity for the day');
        }
        this.checkExhaustion();
        this.checkQiOveruse();
        // check for activity death
        this.activityDeath = false;
        if (this.characterService.status.health.value <= 0) {
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
            this.activityLoop[this.currentIndex].userDisabled ||
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
                this.activityLoop[this.currentIndex].userDisabled ||
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
      if (this.characterService.money > this.characterService.maxMoney) {
        this.characterService.updateMoney(this.characterService.maxMoney, true);
      }
    });

    this.upgradeActivities(true);
    this.checkRequirements(true);
  }

  checkTriggers() {
    if (this.triggerIndex < this.loopChangeTriggers.length) {
      const trigger = this.loopChangeTriggers[this.triggerIndex];
      const attribute = trigger.attribute as AttributeType;
      if (this.characterService.attributes[attribute].value >= trigger.value) {
        this.triggerIndex++;
        this.loadActivityLoop(trigger.scheduleName);
      }
    }
  }

  checkExhaustion() {
    if (this.characterService.status.stamina.value < 0) {
      // take 5 days to recover, regain stamina, restart loop
      this.logService.injury(
        LogTopic.EVENT,
        'You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.'
      );
      this.exhaustionDays = 5;
      this.characterService.status.stamina.value = 100;
      this.characterService.status.health.value -= 0.01 * this.characterService.status.health.max;
    }
  }

  checkQiOveruse() {
    if (this.characterService.status.qi.value < 0) {
      this.logService.injury(
        LogTopic.EVENT,
        'You overextend your Qi and damage your Qi channels. It takes you 10 days to recover.'
      );
      if (this.characterService.status.qi.max > 1) {
        this.characterService.status.qi.max -= 1;
      }
      this.exhaustionDays = 10;
      this.characterService.status.health.value -= 0.01 * this.characterService.status.health.max;
    }
  }

  checkResourceUse(activity: Activity, spirit = false): string {
    if (!activity.resourceUse || !activity.resourceUse[activity.level]) {
      return '';
    }
    if (spirit) {
      if (!activity.resourceUse[activity.level]['qi']) {
        activity.resourceUse[activity.level]['qi'] = 0;
      }
      if (this.characterService.status['qi'].value < (activity.resourceUse[activity.level]?.['qi'] ?? 0) + 5) {
        return 'qi';
      }
    }
    for (const key in activity.resourceUse[activity.level]) {
      if (
        this.characterService.status[key as StatusType].value <
        (activity.resourceUse?.[activity.level]?.[key as StatusType] ?? 0)
      ) {
        return key;
      }
    }
    return '';
  }

  handleSpiritActivity() {
    if (this.spiritActivity !== null && this.characterService.status.qi.value >= 5) {
      this.spiritActivityProgress = true;
      const activity = this.getActivityByType(this.spiritActivity);
      // if we don't have the resources for spirit activities, just don't do them
      if (activity !== null && this.checkResourceUse(activity, true) === '' && activity.unlocked) {
        this.lifeActivities[activity.activityType] = (this.lifeActivities[activity.activityType] || 0) + 1;
        activity.consequence[activity.level]();
        this.homeService.triggerWorkstations(activity.activityType);
        this.characterService.status.qi.value -= 5;
      } else {
        this.spiritActivityProgress = false;
      }
    } else {
      this.spiritActivityProgress = false;
    }
  }

  getYinYangDescription(yinYangEffect: YinYangEffect) {
    if (yinYangEffect === YinYangEffect.Yang) {
      return '\n\nPromotes the development of Yang energy.';
    }
    if (yinYangEffect === YinYangEffect.Yin) {
      return '\n\nPromotes the development of Yin energy.';
    }
    if (yinYangEffect === YinYangEffect.Balance) {
      return '\n\nPromotes a balance of Yin and Yang energies.';
    }
    return '';
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
      savedActivityLoops: this.savedActivityLoops,
      loopChangeTriggers: this.loopChangeTriggers,
      triggerIndex: this.triggerIndex,
      autoRestUnlocked: this.autoRestUnlocked,
      pauseOnImpossibleFail: this.pauseOnImpossibleFail,
      totalExhaustedDays: this.totalExhaustedDays,
      purifyGemsUnlocked: this.purifyGemsUnlocked,
      lifeActivities: this.lifeActivities,
      familySpecialty: this.familySpecialty,
      tauntCounter: this.tauntCounter,
      researchWindCounter: this.researchWindCounter,
      miningCounter: this.miningCounter,
      huntingCounter: this.huntingCounter,
      fishingCounter: this.fishingCounter,
      recruitingCounter: this.recruitingCounter,
      petRecruitingCounter: this.petRecruitingCounter,
      coreCultivationCounter: this.coreCultivationCounter,
      beforeDeathPauseUsed: this.beforeDeathPauseUsed,
    };
  }

  setProperties(properties: ActivityProperties) {
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
    this.beforeDeathPauseUsed = properties.beforeDeathPauseUsed;
    this.activityLoop = properties.activityLoop;
    this.spiritActivity = properties.spiritActivity ?? null;
    this.openApprenticeships = properties.openApprenticeships || 0;
    this.currentApprenticeship = properties.currentApprenticeship;
    this.savedActivityLoops = properties.savedActivityLoops;
    this.loopChangeTriggers = properties.loopChangeTriggers;
    this.triggerIndex = properties.triggerIndex;
    this.autoRestUnlocked = properties.autoRestUnlocked || false;
    this.purifyGemsUnlocked = properties.purifyGemsUnlocked || false;
    this.lifeActivities = properties.lifeActivities;
    this.familySpecialty = properties.familySpecialty;
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
    this.tauntCounter = properties.tauntCounter;
    this.researchWindCounter = properties.researchWindCounter;
    this.miningCounter = properties.miningCounter;
    this.huntingCounter = properties.huntingCounter;
    this.fishingCounter = properties.fishingCounter;
    this.recruitingCounter = properties.recruitingCounter;
    this.petRecruitingCounter = properties.petRecruitingCounter;
    this.coreCultivationCounter = properties.coreCultivationCounter;
    this.checkRequirements(true);
  }

  meetsRequirements(activity: Activity): boolean {
    if (
      !this.hellService?.inHell() &&
      this.locationService &&
      !this.locationService.unlockedLocations.includes(activity.location)
    ) {
      activity.unlocked = false;
      return false;
    }
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
    if (activity.relockable) {
      activity.unlocked = false;
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
      if (this.characterService.attributes[key as AttributeType].value <= requirementValue) {
        return false;
      }
    }

    // max status value must be high enough to perform the activity
    const resourceUse = activity.resourceUse[level];
    for (const keyString in resourceUse) {
      const key = keyString as StatusType;
      const requiredMax = activity.resourceUse[level][key] || 0;
      if (this.characterService.status[key].max <= requiredMax) {
        return false;
      }
    }

    if (activity.landRequirements) {
      if (this.homeService.land < activity.landRequirements) {
        return false;
      }
    }
    if (activity.fallowLandRequirements) {
      if (this.farmService.fallowPlots < activity.fallowLandRequirements) {
        return false;
      }
    }
    if (activity.farmedLandRequirements) {
      if (this.farmService.farmedPlots < activity.farmedLandRequirements) {
        return false;
      }
    }
    return true;
  }

  checkRequirements(squelchLogs: boolean): void {
    // TODO: add hell task checking
    for (const activity of this.activities) {
      if (activity.impossibleTaskIndex !== undefined) {
        // impossible task activities only care if you are on the task
        activity.unlocked = activity.impossibleTaskIndex === this.impossibleTaskService.activeTaskIndex;
        activity.discovered = activity.impossibleTaskIndex === this.impossibleTaskService.activeTaskIndex;
        continue;
      } else if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.Swim) {
        activity.unlocked = false;
        continue;
      }
      activity.projectionOnly = false;
      if (this.hellService?.inHell()) {
        const hell = this.hellService?.hells[this.hellService.currentHell];
        if (hell?.activities.includes(activity)) {
          activity.discovered = true;
          this.meetsRequirements(activity);
        } else if (hell?.projectionActivities.includes(activity)) {
          activity.projectionOnly = true;
          activity.unlocked = true;
          activity.discovered = true;
        } else {
          activity.unlocked = false;
          activity.discovered = false;
        }
        continue;
      }
      if (this.meetsRequirements(activity) && !activity.unlocked) {
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

  getActivityName(activityType: ActivityType) {
    const activity = this.getActivityByType(activityType);
    if (activity) {
      return activity.name[activity.level];
    }
    return '';
  }

  reset(): void {
    this.beforeDeathPauseUsed = false;
    // determine family specialty
    let highest = 0;
    for (const key in this.lifeActivities) {
      const activityType = parseInt(key) as ActivityType;
      const value = this.lifeActivities[activityType] || 0;
      if (!activityType) {
        continue;
      }
      if (value > highest && this.supportedSpecialties.includes(activityType)) {
        highest = value;
        this.familySpecialty = activityType;
      }
    }
    this.lifeActivities = {};

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
      if (this.pauseOnDeath && !this.characterService.immortal()) {
        this.mainLoopService.pause = true;
      }
    } else {
      this.activityLoop = [];
    }
    this.currentTickCount = 0;
    this.currentIndex = 0;
    this.triggerIndex = 0;
    if (this.loopChangeTriggers.length > 0) {
      // trigger entry 0 is special, it always loads on rebirth regardless of attribute values
      this.loadActivityLoop(this.loopChangeTriggers[0].scheduleName);
      this.triggerIndex++;
    }
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

  saveActivityLoop(saveName: string = '') {
    const loop = this.savedActivityLoops.find(entry => entry.name === saveName);
    if (loop) {
      loop.activities = JSON.parse(JSON.stringify(this.activityLoop));
    } else {
      this.savedActivityLoops.push({
        name: saveName,
        activities: JSON.parse(JSON.stringify(this.activityLoop)),
      });
    }
  }

  loadActivityLoop(saveName: string) {
    const loop = this.savedActivityLoops.find(entry => entry.name === saveName);
    if (loop) {
      this.activityLoop = JSON.parse(JSON.stringify(loop.activities));
      this.checkRequirements(true);
      this.currentIndex = 0;
    }
  }

  removeActivityLoop(saveName: string) {
    const loopIndex = this.savedActivityLoops.findIndex(entry => entry.name === saveName);
    if (loopIndex >= 0) {
      this.savedActivityLoops.splice(loopIndex, 1);
    }
    // also clear any triggers that used that schedule
    for (let i = this.loopChangeTriggers.length - 1; i >= 0; i--) {
      if (this.loopChangeTriggers[i].scheduleName === saveName) {
        this.loopChangeTriggers.splice(i, 1);
      }
    }
  }

  Swim: Activity = {
    level: 0,
    name: ['Swim Deeper'],
    location: LocationType.DeepSea,
    impossibleTaskIndex: ImpossibleTaskType.Swim,
    imageBaseName: 'swim',
    activityType: ActivityType.Swim,
    description: ['Swim down further into the depths.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 20 Stamina. Reduce health by 100.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 20;
        this.characterService.status.health.value -= 100;
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

  ForgeChains: Activity = {
    level: 0,
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.RaiseIsland,
    name: ['Forge Unbreakable Chain'],
    imageBaseName: 'forgechains',
    activityType: ActivityType.ForgeChains,
    description: ['Forge a chain strong enough to pull the island from the depths.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 100 Stamina. If you have the right facilities, materials, and knowledge you might be able to create an unbreakable chain.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        const workstation = this.homeService.workstations.find(ws =>
          ws.triggerActivities.includes(ActivityType.ForgeChains)
        );
        if (workstation === undefined) {
          this.logService.log(
            LogTopic.EVENT,
            "You think about forging chains, but you don't have the right workstation to even get started."
          );
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

  AttachChains: Activity = {
    level: 0,
    name: ['Attach Chains to the Island'],
    location: LocationType.DeepSea,
    impossibleTaskIndex: ImpossibleTaskType.RaiseIsland,
    imageBaseName: 'attachchains',
    activityType: ActivityType.AttachChains,
    description: ['Swim deep and attach one of your chains to the island, then pull.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses nearly a million Stamina. These chains are really, REALLY heavy. You better plan on having an Unbreakable Chain and a good place to rest afterwards.',
    ],
    consequence: [
      () => {
        if (this.inventoryService.consume('chain') > 0) {
          if (this.characterService.status.stamina.value >= 999000) {
            this.characterService.status.stamina.value -= 999000;
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
          } else {
            this.logService.injury(
              LogTopic.EVENT,
              'You strain yourself trying to lug the chain to an anchor point and collapse.'
            );
            this.characterService.status.stamina.value -= 999000;
            if (this.pauseOnImpossibleFail) {
              this.mainLoopService.pause = true;
            }
          }
        } else {
          this.logService.injury(
            LogTopic.EVENT,
            'You pass time exploring the hidden tunnels without a chain until a horror of the depths takes a nibble.'
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
        }
      },
    ],
    resourceUse: [
      {
        stamina: 999000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  MakeBrick: Activity = {
    level: 0,
    name: ['Create an Everlasting Brick'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.BuildTower,
    imageBaseName: 'makebrick',
    activityType: ActivityType.MakeBrick,
    description: ['Create bricks sturdy enough to support the weight of your tower.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 100 Stamina. If you have the right followers and materials you will create some everlasting bricks.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        const workstation = this.homeService.workstations.find(ws =>
          ws.triggerActivities.includes(ActivityType.MakeBrick)
        );
        if (workstation === undefined) {
          this.logService.log(
            LogTopic.EVENT,
            "You think about making bricks, but you don't have the right workstation to even get started."
          );
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

  MakeScaffold: Activity = {
    level: 0,
    name: ['Build Scaffolding'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.BuildTower,
    imageBaseName: 'scaffolding',
    activityType: ActivityType.MakeScaffold,
    description: ['Set up the scaffolding for the next level of your tower.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 1000 Stamina. If you have the right materials you might succeed in setting up the scaffolding for the next level.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        const workstation = this.homeService.workstations.find(ws =>
          ws.triggerActivities.includes(ActivityType.MakeScaffold)
        );
        if (workstation === undefined) {
          this.logService.log(
            LogTopic.EVENT,
            "You think about making a scaffold, but you don't have the right workstation to even get started."
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

  MakeMortar: Activity = {
    level: 0,
    name: ['Mix Everlasting Mortar'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.BuildTower,
    imageBaseName: 'makemortar',
    activityType: ActivityType.MakeMortar,
    description: ['Mix mortar powerful enough to hold your mighty tower together.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 100 Stamina. If you have the right followers, facilities, and materials you might succeed in mixing some proper mortar.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        const workstation = this.homeService.workstations.find(ws =>
          ws.triggerActivities.includes(ActivityType.MakeMortar)
        );
        if (workstation === undefined) {
          this.logService.log(
            LogTopic.EVENT,
            "You think about making mortar, but you don't have the right workstation to even get started."
          );
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

  BuildTower: Activity = {
    level: 0,
    name: ['Build the Next Level'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.BuildTower,
    imageBaseName: 'buildtower',
    activityType: ActivityType.BuildTower,
    description: [
      'Assemble 1000 bricks, 100 barrels of mortar, and your scaffolding to construct the next level of your tower. You will need a lot of expert help for this.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 1000 Stamina. If you have the right followers and materials you will build the next level.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        let numBuilders = 0;
        for (const follower of this.followerService.followers) {
          if (follower.job === 'builder') {
            numBuilders++;
          }
        }
        if (numBuilders < 10) {
          this.logService.injury(LogTopic.EVENT, 'You fumble without the proper help and hurt yourself.');
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
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
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.2;
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
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.2;
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
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.2;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].complete) {
          this.logService.log(LogTopic.STORY, 'You have acheived the impossible and built a tower beyond the heavens.');
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

  ResearchWind: Activity = {
    level: 0,
    name: ['Research Wind Control'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.TameWinds,
    imageBaseName: 'researchwind',
    activityType: ActivityType.ResearchWind,
    description: ['Delve deep into wind lore to understand how the neverending storm can be controlled.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 1000 Stamina and Qi. Compile your research and if you have done enough you may produce a Tome of Wind Control.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        this.characterService.status.qi.value -= 1000;
        if (this.characterService.status.stamina.value < 0 || this.characterService.status.qi.value < 0) {
          this.logService.log(LogTopic.EVENT, "You try to research, but you just don't have the energy.");
          return;
        }
        if (this.characterService.status.stamina.value >= 0 && this.characterService.status.qi.value >= 0) {
          this.researchWindCounter++;
          if (this.researchWindCounter > 100) {
            this.logService.log(LogTopic.CRAFTING, 'Research breakthrough! You produce a tome!.');
            this.inventoryService.addItem(this.itemRepoService.items['windTome']);
            this.researchWindCounter = 0;
          }
        }
      },
    ],
    resourceUse: [
      {
        stamina: 1000,
        qi: 1000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  TameWinds: Activity = {
    level: 0,
    name: ['Tame Winds'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.TameWinds,
    imageBaseName: 'tamewind',
    activityType: ActivityType.TameWinds,
    description: ['Use your research to tame the winds.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 10000 Stamina and Qi and an obscene amount of money. Use a Tome of Wind Control to tame the hurricane.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 10000;
        this.characterService.status.qi.value -= 10000;
        if (this.characterService.money < 1e18) {
          this.logService.injury(
            LogTopic.EVENT,
            "You try to tame the winds, but without the proper funds you can't begin the magical ritual."
          );
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
        }
        this.characterService.updateMoney(0 - 1e18);
        let value = 0;
        value = this.inventoryService.consume('windTome');
        if (value > 0) {
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].progress++;
          this.logService.log(LogTopic.EVENT, 'You feel yourself drawing closer to mastery over the winds.');
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].complete) {
            this.logService.log(LogTopic.STORY, 'You acheived the impossible and tamed a hurricane.');
          }
        } else {
          this.logService.injury(
            LogTopic.EVENT,
            'You try to tame the winds, but without the proper preparation you are blown off the top of the tower.'
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.5;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
        }
      },
    ],
    resourceUse: [
      {
        stamina: 10000,
        qi: 10000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  LearnToFly: Activity = {
    level: 0,
    name: ['Learn To Fly'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.LearnToFly,
    imageBaseName: 'learntofly',
    activityType: ActivityType.LearnToFly,
    description: ['Jump off your tower and practice flying. This will definitely go well for you.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['You will certainly, probably, maybe not die doing this.'],
    consequence: [
      () => {
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress++;
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 2222) {
          this.logService.injury(
            LogTopic.EVENT,
            'Jumping off an impossibly tall tower ends about like you might expect. Your wounds may take a bit to heal, but at least you learned something.'
          );
          this.characterService.status.health.value -= 10000;
        } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 4444) {
          this.logService.injury(
            LogTopic.EVENT,
            'You feel like you might have flown a litte bit, somewhere near the time you hit the ground.'
          );
          this.characterService.status.health.value -= 5000;
        } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 6666) {
          this.logService.injury(
            LogTopic.EVENT,
            'You definitely did better that time. You did some great flying but sticking the landing is still tricky.'
          );
          this.characterService.status.health.value -= 1000;
        } else {
          this.logService.injury(LogTopic.EVENT, 'Almost there! Perfect landings are so hard.');
          this.characterService.status.health.value -= 100;
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

  OfferDragonFood: Activity = {
    level: 0,
    name: ['Offer Food'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.BefriendDragon,
    imageBaseName: 'offerfood',
    activityType: ActivityType.OfferDragonFood,
    description: [
      'It turns out that dragons love a well-prepared meal. Bring the dragon a bunch and he may be more friendly.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['You will need a great deal of fine food for this to work.'],
    consequence: [
      () => {
        let value = 0;
        value = this.inventoryService.consume('food', 1000);
        if (value < 50000) {
          this.logService.injury(
            LogTopic.EVENT,
            'The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.'
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.9;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 2000) {
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
          this.logService.log(
            LogTopic.EVENT,
            "The dragon accepts your offering. You think. It eats the food anyway, and doesn't attack you while doing it."
          );
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

  OfferDragonWealth: Activity = {
    level: 0,
    name: ['Offer Wealth'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.BefriendDragon,
    imageBaseName: 'offergold',
    activityType: ActivityType.OfferDragonWealth,
    description: ['You have heard that dragons like treasure. Bring the dragon a bunch and he may be more friendly.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['You will need a vast hoard of taels for this to work.'],
    consequence: [
      () => {
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 1000) {
          this.logService.log(
            LogTopic.EVENT,
            "The dragon is offended by your very presence and viciously attacks you. You'll need to warm him up with different offerings before you try this again."
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.9;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }

        if (this.characterService.money < 1e21) {
          this.logService.injury(
            LogTopic.EVENT,
            'The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.'
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.9;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.characterService.updateMoney(0 - 1e21);
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

  TalkToDragon: Activity = {
    level: 0,
    name: ['Talk to the Dragon'],
    location: LocationType.MountainTops,
    impossibleTaskIndex: ImpossibleTaskType.BefriendDragon,
    imageBaseName: 'talktodragon',
    activityType: ActivityType.TalkToDragon,
    description: ['Try to strike up a conversation with the dragon.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['The dragon probably likes you enough to talk to you now, right?'],
    consequence: [
      () => {
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 1000) {
          this.logService.log(
            LogTopic.EVENT,
            "The dragon is offended by your very presence and viciously attacks you. You'll need to warm him up with offerings before you try this again."
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.9;
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }

        if (this.characterService.attributes.charisma.value < 1e18) {
          this.logService.injury(
            LogTopic.EVENT,
            "The dragon doesn't like the sound of your voice and takes a bite out of you. Maybe you should practice speaking with humans first."
          );
          this.characterService.status.health.value -= 10000;
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

  GatherArmies: Activity = {
    level: 0,
    name: ['Gather Armies'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.ConquerTheNation,
    imageBaseName: 'gatherarmy',
    activityType: ActivityType.GatherArmies,
    description: ['Gather troops into armies. This will require vast amounts of food and money.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ["You rule a province by now, right? If not, this isn't going to go well."],
    consequence: [
      () => {
        if (this.homeService.homeValue < HomeType.Capital) {
          this.logService.injury(
            LogTopic.EVENT,
            "You don't even have your own province? What were you thinking? The nearby nobles send their forces against you."
          );
          for (let i = 0; i < 3; i++) {
            this.battleService.addArmy();
          }
          return;
        }
        let value = 0;
        value = this.inventoryService.consume('food', 100000, true);
        if (value < 1) {
          this.logService.injury(
            LogTopic.EVENT,
            "You don't have enough food to feed your army, so they revolt and fight you instead."
          );
          this.battleService.addArmy();
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        if (this.characterService.money < 1e22) {
          this.logService.injury(
            LogTopic.EVENT,
            "You don't have enough money to pay your army, so they revolt and fight you instead."
          );
          this.battleService.addArmy();
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.characterService.updateMoney(0 - 1e22);
        this.inventoryService.addItem(this.itemRepoService.items['army']);
      },
    ],
    resourceUse: [{}],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  ConquerTheNation: Activity = {
    level: 0,
    name: ['Conquer More Territory'],
    location: LocationType.LargeCity,
    impossibleTaskIndex: ImpossibleTaskType.ConquerTheNation,
    imageBaseName: 'conquer',
    activityType: ActivityType.ConquerTheNation,
    description: ['Send out your armies to conquer the nation.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      "I'm sure you have plenty of armies for this. You wouldn't try this without enough armies, that would end badly.",
    ],
    consequence: [
      () => {
        let value = 0;
        value = this.inventoryService.consume(
          'army',
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheNation].progress + 1
        );
        if (value < 1) {
          for (let i = 0; i < 5; i++) {
            this.battleService.addArmy();
          }
          this.logService.log(
            LogTopic.EVENT,
            'Your armies failed you, and you are forced to fight the enemy armies to a standstill.'
          );
          if (this.pauseOnImpossibleFail) {
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheNation].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheNation].complete) {
          this.logService.log(
            LogTopic.STORY,
            'You did the impossible and conquered the nation! You bring an end to cruelty and strife for all under your wise rule.'
          );
        }
      },
    ],
    resourceUse: [{}],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  MoveStars: Activity = {
    level: 0,
    name: ['Move Stars'],
    location: LocationType.Self,
    impossibleTaskIndex: ImpossibleTaskType.RearrangeTheStars,
    imageBaseName: 'movestars',
    activityType: ActivityType.MoveStars,
    description: ['Extend your vast magical powers into the heavens and force the stars into alignment.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 900,000 Stamina and 50,000 Qi.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 900000;
        this.characterService.status.qi.value -= 50000;
        if (this.characterService.status.stamina.value >= 0 && this.characterService.status.qi.value >= 0) {
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
        stamina: 900000,
        qi: 50000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };

  OddJobs: Activity = {
    level: 0,
    name: ['Odd Jobs'],
    location: LocationType.SmallTown,
    imageBaseName: 'oddjobs',
    activityType: ActivityType.OddJobs,
    description: [
      'Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Undignified work for a future immortal, but you have to eat to live.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 5 Stamina. Increases all your basic attributes by a small amount and provides a little money.',
    ],
    consequence: [
      () => {
        this.characterService.increaseAttribute('strength', 0.02);
        this.characterService.increaseAttribute('toughness', 0.02);
        this.characterService.increaseAttribute('speed', 0.02);
        this.characterService.increaseAttribute('intelligence', 0.02);
        this.characterService.increaseAttribute('charisma', 0.02);
        this.characterService.status.stamina.value -= 5;
        this.characterService.updateMoney(3);
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

  Resting: Activity = {
    level: 0,
    name: ['Resting', 'Meditation', 'Communing With Divinity', 'Finding True Inner Peace'],
    location: LocationType.Self,
    imageBaseName: 'resting',
    activityType: ActivityType.Resting,
    yinYangEffect: [YinYangEffect.Yin, YinYangEffect.Yin, YinYangEffect.Yin, YinYangEffect.Balance],
    description: [
      'Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
      'Enter a meditative state and begin your journey toward spritual enlightenment.',
      'Extend your senses beyond the mortal realm and connect to deeper realities.',
      'Turn your senses inward and find pure stillness within.',
    ],
    consequenceDescription: [
      'Restores 50 Stamina and 2 Health.',
      'Restores 100 Stamina, 10 Health, and 1 Qi (if unlocked).',
      'Restores 200 Stamina, 20 Health, and 10 Qi (if unlocked).',
      'Restores 300 Stamina, 30 Health, and 20 Qi (if unlocked).',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value += 50;
        this.characterService.status.health.value += 2;
        this.characterService.checkOverage();
        this.characterService.yin++;
      },
      () => {
        this.characterService.status.stamina.value += 100;
        this.characterService.status.health.value += 10;
        this.characterService.increaseAttribute('spirituality', 0.001);
        if (this.characterService.qiUnlocked) {
          this.characterService.status.qi.value += 1;
        }
        this.characterService.checkOverage();
        this.characterService.yin++;
      },
      () => {
        this.characterService.status.stamina.value += 200;
        this.characterService.status.health.value += 20;
        this.characterService.status.qi.value += 10;
        this.characterService.increaseAttribute('spirituality', 0.5);
        this.characterService.checkOverage();
        this.characterService.yin++;
      },
      () => {
        this.characterService.status.stamina.value += 300;
        this.characterService.status.health.value += 30;
        this.characterService.status.qi.value += 20;
        this.characterService.increaseAttribute('spirituality', 1);
        this.characterService.checkOverage();
        if (this.characterService.yin > this.characterService.yang) {
          this.characterService.yang++;
        } else {
          this.characterService.yin++;
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

  Begging: Activity = {
    level: 0,
    name: ['Begging', 'Street Performing', 'Oration', 'Politics'],
    location: LocationType.SmallTown,
    imageBaseName: 'begging',
    activityType: ActivityType.Begging,
    description: [
      'Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.',
      'Add some musical flair to your begging.',
      'Move the crowds with your stirring speeches.',
      'Charm your way into civic leadership.',
    ],
    yinYangEffect: [YinYangEffect.Yang, YinYangEffect.Yang, YinYangEffect.Yang, YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 5 Stamina. Increases charisma and provides a little money.',
      'Uses 5 Stamina. Increases charisma and provides some money.',
      'Uses 5 Stamina. Increases charisma and provides money.',
      'Uses 5 Stamina. Increases charisma, provides money, and makes you wonder if there is more to life than just money and fame.',
    ],
    consequence: [
      () => {
        this.characterService.increaseAttribute('charisma', 0.1);
        this.characterService.increaseAttribute('performance', 0.1);
        this.characterService.status.stamina.value -= 5;
        let money = 3 + Math.log2(this.characterService.attributes.charisma.value);
        if (this.familySpecialty === ActivityType.Begging) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Begging.lastIncome = money;
        this.beggingDays++;
        this.characterService.yang++;
      },
      () => {
        this.characterService.increaseAttribute('charisma', 0.2);
        this.characterService.increaseAttribute('performance', 0.1);
        this.characterService.status.stamina.value -= 5;
        let money = 10 + Math.log2(this.characterService.attributes.charisma.value);
        if (this.familySpecialty === ActivityType.Begging) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Begging.lastIncome = money;
        this.beggingDays++;
        this.characterService.yang++;
      },
      () => {
        this.characterService.increaseAttribute('charisma', 0.3);
        this.characterService.increaseAttribute('performance', 0.1);
        this.characterService.status.stamina.value -= 5;
        let money = 20 + Math.log2(this.characterService.attributes.charisma.value * 2);
        if (this.familySpecialty === ActivityType.Begging) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Begging.lastIncome = money;
        this.beggingDays++;
        this.characterService.yang++;
      },
      () => {
        this.characterService.increaseAttribute('charisma', 0.5);
        this.characterService.increaseAttribute('performance', 0.1);
        this.characterService.status.stamina.value -= 5;
        let money = 30 + Math.log2(this.characterService.attributes.charisma.value * 10);
        if (this.familySpecialty === ActivityType.Begging) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Begging.lastIncome = money;
        this.beggingDays++;
        this.characterService.yang++;
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
        performance: 100,
      },
      {
        charisma: 5000,
        performance: 10000,
      },
      {
        charisma: 10000,
        performance: 1000000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 0,
  };

  Cooking: Activity = {
    level: 0,
    name: ['Cooking', 'Soul Food Preparation'],
    location: LocationType.SmallTown,
    imageBaseName: 'cooking',
    activityType: ActivityType.Cooking,
    description: [
      'Work as a chef. If you have a cooking workstation of your own, you can even make some meals for yourself.',
      'Work as a spiritual chef, devoting great energy to creating food that feeds both body and soul. If you have a cooking workstation of your own, you can even make some meals for yourself.',
    ],
    yinYangEffect: [YinYangEffect.None, YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 10 Stamina. Increases charisma and intelligence and provides a little money.',
      'Uses 90 Stamina. Increases charisma, intelligence, and spirituality.',
    ],
    consequence: [
      () => {
        this.characterService.increaseAttribute('charisma', 0.05);
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('cooking', 0.1);
        this.characterService.status.stamina.value -= 10;
        let money =
          5 +
          Math.log2(
            (this.characterService.attributes.charisma.value +
              2 * this.characterService.attributes.intelligence.value) /
              3
          );
        if (this.familySpecialty === ActivityType.Cooking) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Cooking.lastIncome = money;
      },
      () => {
        this.characterService.increaseAttribute('charisma', 0.5);
        this.characterService.increaseAttribute('intelligence', 1);
        this.characterService.increaseAttribute('spirituality', 0.001);
        this.characterService.increaseAttribute('cooking', 0.1);
        this.characterService.status.stamina.value -= 90;
      },
    ],
    resourceUse: [
      {
        stamina: 10,
      },
      {
        stamina: 90,
      },
    ],
    requirements: [
      {
        charisma: 10,
        intelligence: 20,
      },
      {
        charisma: 10000,
        speed: 10000,
        intelligence: 20000,
        spirituality: 10,
        cooking: 1000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 0,
  };

  Blacksmithing: Activity = {
    level: 0,
    name: ['Apprentice Blacksmithing', 'Journeyman Blacksmithing', 'Blacksmithing', 'Master Blacksmithing'],
    location: LocationType.LargeCity,
    imageBaseName: 'blacksmithing',
    activityType: ActivityType.Blacksmithing,
    description: [
      "Work for the local blacksmith. You mostly pump the bellows, but at least you're learning a trade.",
      'Mold metal into useful things. You might even produce something you want to keep now and then.',
      'Create useful and beautiful metal objects. You might produce a decent weapon occasionally.',
      'Work the forges like a true master.',
    ],
    yinYangEffect: [YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance],
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
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('toughness', 0.1);
        this.characterService.increaseAttribute('smithing', 0.1);
        this.characterService.status.stamina.value -= 25;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.toughness.value
          ) + this.characterService.attributes.metalLore.value;
        if (this.familySpecialty === ActivityType.Blacksmithing) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Blacksmithing.lastIncome = money;
        this.characterService.increaseAttribute('metalLore', 0.1);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      // grade 1
      () => {
        this.checkApprenticeship(ActivityType.Blacksmithing);
        this.characterService.increaseAttribute('strength', 0.2);
        this.characterService.increaseAttribute('toughness', 0.2);
        this.characterService.increaseAttribute('smithing', 0.1);
        this.characterService.status.stamina.value -= 25;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.toughness.value
          ) +
          this.characterService.attributes.metalLore.value * 2;
        if (this.familySpecialty === ActivityType.Blacksmithing) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Blacksmithing.lastIncome = money;
        this.characterService.increaseAttribute('metalLore', 0.2);
        this.characterService.increaseAttribute('fireLore', 0.02);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      // grade 2
      () => {
        this.checkApprenticeship(ActivityType.Blacksmithing);
        this.characterService.increaseAttribute('strength', 0.5);
        this.characterService.increaseAttribute('toughness', 0.5);
        this.characterService.increaseAttribute('smithing', 0.1);
        this.characterService.status.stamina.value -= 25;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.toughness.value
          ) +
          this.characterService.attributes.fireLore.value +
          this.characterService.attributes.metalLore.value * 5;
        if (this.familySpecialty === ActivityType.Blacksmithing) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Blacksmithing.lastIncome = money;
        this.characterService.increaseAttribute('metalLore', 0.3);
        this.characterService.increaseAttribute('fireLore', 0.05);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      // grade 3
      () => {
        this.checkApprenticeship(ActivityType.Blacksmithing);
        this.characterService.increaseAttribute('strength', 1);
        this.characterService.increaseAttribute('toughness', 1);
        this.characterService.increaseAttribute('smithing', 0.1);
        this.characterService.status.stamina.value -= 50;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.toughness.value
          ) +
          this.characterService.attributes.fireLore.value +
          this.characterService.attributes.metalLore.value * 10;
        if (this.familySpecialty === ActivityType.Blacksmithing) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Blacksmithing.lastIncome = money;
        this.characterService.increaseAttribute('metalLore', 0.5);
        this.characterService.increaseAttribute('fireLore', 0.1);
        this.pillMoldCounter++;
        if (this.pillMoldCounter > 1000) {
          this.pillMoldCounter = 0;
          this.inventoryService.addItem(this.itemRepoService.items['pillMold']);
        }
        this.characterService.yin++;
        this.characterService.yang++;
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
        smithing: 100,
      },
      {
        strength: 2000,
        toughness: 2000,
        metalLore: 10,
        fireLore: 1,
        smithing: 10000,
      },
      {
        strength: 10000,
        toughness: 10000,
        metalLore: 100,
        fireLore: 10,
        smithing: 1000000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 2,
  };

  GatherHerbs: Activity = {
    level: 0,
    name: ['Gathering Herbs'],
    location: LocationType.SmallTown,
    imageBaseName: 'herbs',
    activityType: ActivityType.GatherHerbs,
    description: ['Search the natural world for useful herbs.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 10 Stamina. Find herbs and learn about plants'],
    consequence: [
      () => {
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('speed', 0.1);
        this.characterService.status.stamina.value -= 10;
        // the grade on herbs probably needs diminishing returns
        this.inventoryService.generateHerb();
        this.characterService.increaseAttribute('woodLore', 0.003);
        this.characterService.yang++;
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

  Alchemy: Activity = {
    level: 0,
    name: ['Apprentice Alchemy', 'Journeyman Alchemy', 'Alchemy', 'Master Alchemy'],
    location: LocationType.LargeCity,
    imageBaseName: 'alchemy',
    activityType: ActivityType.Alchemy,
    description: [
      "Get a job at the alchemist's workshop. It smells awful but you might learn a few things.",
      'Get a cauldron and do a little brewing of your own.',
      'Open up your own alchemy shop.',
      'Brew power, precipitate life, stir in some magic, and create consumable miracles.',
    ],
    yinYangEffect: [YinYangEffect.Yin, YinYangEffect.Yin, YinYangEffect.Yin, YinYangEffect.Yin],
    consequenceDescription: [
      'Uses 10 Stamina. Get smarter, make a few taels, and learn the secrets of alchemy.',
      'Uses 10 Stamina. Get smarter, make money, practice your craft. If you have some herbs, you might make a usable potion or pill.',
      'Uses 10 Stamina. Get smarter, make money, and make some decent potions or pills.',
      'Uses 20 Stamina. Create amazing potions and pills.',
    ],
    consequence: [
      () => {
        this.checkApprenticeship(ActivityType.Alchemy);
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('alchemy', 0.1);
        this.characterService.status.stamina.value -= 10;
        let money =
          Math.log2(this.characterService.attributes.intelligence.value) +
          this.characterService.attributes.waterLore.value;
        if (this.familySpecialty === ActivityType.Alchemy) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Alchemy.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.05);
        this.characterService.increaseAttribute('waterLore', 0.1);
        this.characterService.yin++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Alchemy);
        this.characterService.increaseAttribute('intelligence', 0.2);
        this.characterService.increaseAttribute('alchemy', 0.1);
        this.characterService.status.stamina.value -= 10;
        let money =
          Math.log2(this.characterService.attributes.intelligence.value) +
          this.characterService.attributes.waterLore.value * 2;
        if (this.familySpecialty === ActivityType.Alchemy) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Alchemy.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.1);
        this.characterService.increaseAttribute('waterLore', 0.2);
        this.characterService.yin++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Alchemy);
        this.characterService.increaseAttribute('intelligence', 0.5);
        this.characterService.increaseAttribute('alchemy', 0.1);
        this.characterService.status.stamina.value -= 10;
        let money =
          Math.log2(this.characterService.attributes.intelligence.value) +
          this.characterService.attributes.waterLore.value * 5;
        if (this.familySpecialty === ActivityType.Alchemy) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Alchemy.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.15);
        this.characterService.increaseAttribute('waterLore', 0.3);
        this.characterService.yin++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Alchemy);
        this.characterService.increaseAttribute('intelligence', 1);
        this.characterService.increaseAttribute('alchemy', 0.1);
        this.characterService.status.stamina.value -= 20;
        let money =
          Math.log2(this.characterService.attributes.intelligence.value) +
          this.characterService.attributes.waterLore.value * 10;
        if (this.familySpecialty === ActivityType.Alchemy) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Alchemy.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.2);
        this.characterService.increaseAttribute('waterLore', 0.6);
        this.characterService.yin++;
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
        alchemy: 100,
      },
      {
        intelligence: 8000,
        waterLore: 100,
        woodLore: 10,
        alchemy: 10000,
      },
      {
        intelligence: 100000,
        waterLore: 1000,
        woodLore: 100,
        fireLore: 10,
        alchemy: 1000000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 2,
  };

  ChopWood: Activity = {
    level: 0,
    name: ['Chopping Wood'],
    location: LocationType.Forest,
    imageBaseName: 'chopping',
    activityType: ActivityType.ChopWood,
    description: ['Work as a woodcutter, cutting logs in the forest.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 10 Stamina. Get a log and learn about plants.'],
    consequence: [
      () => {
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.status.stamina.value -= 10;
        this.inventoryService.addItem(this.inventoryService.getWood());
        this.characterService.increaseAttribute('woodLore', 0.01);
        this.characterService.yang++;
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

  Woodworking: Activity = {
    level: 0,
    name: ['Apprentice Woodworking', 'Journeyman Woodworking', 'Woodworking', 'Master Woodworking'],
    location: LocationType.SmallTown,
    imageBaseName: 'woodworking',
    activityType: ActivityType.Woodworking,
    description: [
      "Work in a woodcarver's shop.",
      'Carve wood into useful items.',
      'Open your own woodworking shop.',
      'Carve pure poetry in wooden form.',
    ],
    yinYangEffect: [YinYangEffect.Yang, YinYangEffect.Yang, YinYangEffect.Yang, YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 20 Stamina. Increases strength and intelligence and provides a little money.',
      'Uses 20 Stamina. Increases strength and intelligence and provides a little money. You may make something you want to keep now and then.',
      'Uses 20 Stamina. Increases strength and intelligence, earn some money, create wooden equipment.',
      'Uses 40 Stamina. Create the best of wooden weapons.',
    ],
    consequence: [
      () => {
        this.checkApprenticeship(ActivityType.Woodworking);
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('woodwork', 0.1);
        this.characterService.status.stamina.value -= 20;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.intelligence.value
          ) + this.characterService.attributes.woodLore.value;
        if (this.familySpecialty === ActivityType.Woodworking) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Woodworking.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.001);
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Woodworking);
        this.characterService.increaseAttribute('strength', 0.2);
        this.characterService.increaseAttribute('intelligence', 0.2);
        this.characterService.increaseAttribute('woodwork', 0.1);
        this.characterService.status.stamina.value -= 20;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.intelligence.value
          ) +
          this.characterService.attributes.woodLore.value * 2;
        if (this.familySpecialty === ActivityType.Woodworking) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Woodworking.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.005);
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Woodworking);
        this.characterService.increaseAttribute('strength', 0.5);
        this.characterService.increaseAttribute('intelligence', 0.5);
        this.characterService.increaseAttribute('woodwork', 0.1);
        this.characterService.status.stamina.value -= 20;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.intelligence.value
          ) +
          this.characterService.attributes.woodLore.value * 5;

        if (this.familySpecialty === ActivityType.Woodworking) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Woodworking.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.02);
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Woodworking);
        this.characterService.increaseAttribute('strength', 1);
        this.characterService.increaseAttribute('intelligence', 1);
        this.characterService.increaseAttribute('woodwork', 0.1);
        this.characterService.status.stamina.value -= 40;
        let money =
          Math.log2(
            this.characterService.attributes.strength.value + this.characterService.attributes.intelligence.value
          ) +
          this.characterService.attributes.woodLore.value * 10;
        if (this.familySpecialty === ActivityType.Woodworking) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Woodworking.lastIncome = money;
        this.characterService.increaseAttribute('woodLore', 0.6);
        this.pillBoxCounter++;
        if (this.pillBoxCounter > 1000) {
          this.pillBoxCounter = 0;
          this.inventoryService.addItem(this.itemRepoService.items['pillBox']);
        }
        this.characterService.yang++;
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
        woodwork: 100,
      },
      {
        strength: 2000,
        intelligence: 2000,
        woodLore: 10,
        woodwork: 10000,
      },
      {
        strength: 10000,
        intelligence: 10000,
        woodLore: 100,
        woodwork: 1000000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 2,
  };

  Leatherworking: Activity = {
    level: 0,
    name: ['Apprentice Leatherworking', 'Journeyman Leatherworking', 'Leatherworking', 'Master Leatherworking'],
    location: LocationType.SmallTown,
    imageBaseName: 'leatherworking',
    activityType: ActivityType.Leatherworking,
    description: [
      'Work in a tannery, where hides are turned into leather items.',
      'Convert hides into leather items.',
      'Open your own tannery.',
      'Fashion!',
    ],
    yinYangEffect: [YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 20 Stamina. Increases speed and toughness and provides a little money.',
      'Uses 20 Stamina. Increases speed and toughness and provides a little money. You may make something you want to keep now and then.',
      'Uses 20 Stamina. Increases speed and toughness, earn some money, create leather equipment.',
      'Uses 40 Stamina. Create the fanciest pants you can imagine. Maybe some boots, too.',
    ],
    consequence: [
      () => {
        this.checkApprenticeship(ActivityType.Leatherworking);
        this.characterService.increaseAttribute('speed', 0.1);
        this.characterService.increaseAttribute('toughness', 0.1);
        this.characterService.status.stamina.value -= 20;
        let money = Math.log2(
          this.characterService.attributes.speed.value +
            this.characterService.attributes.toughness.value +
            this.characterService.attributes.animalHandling.value
        );
        if (this.familySpecialty === ActivityType.Leatherworking) {
          money += money * 0.2;
        }

        this.characterService.updateMoney(money);
        this.Leatherworking.lastIncome = money;
        this.characterService.increaseAttribute('animalHandling', 0.001);
        this.characterService.increaseAttribute('leatherwork', 0.1);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Leatherworking);
        this.characterService.increaseAttribute('speed', 0.2);
        this.characterService.increaseAttribute('toughness', 0.2);
        this.characterService.status.stamina.value -= 20;
        let money = Math.log2(
          this.characterService.attributes.speed.value +
            this.characterService.attributes.toughness.value +
            this.characterService.attributes.animalHandling.value * 2
        );
        if (this.familySpecialty === ActivityType.Leatherworking) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Leatherworking.lastIncome = money;
        this.characterService.increaseAttribute('animalHandling', 0.002);
        this.characterService.increaseAttribute('leatherwork', 0.1);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Leatherworking);
        this.characterService.increaseAttribute('speed', 0.5);
        this.characterService.increaseAttribute('toughness', 0.5);
        this.characterService.status.stamina.value -= 20;
        let money = Math.log2(
          this.characterService.attributes.speed.value +
            this.characterService.attributes.toughness.value +
            this.characterService.attributes.animalHandling.value * 5
        );
        if (this.familySpecialty === ActivityType.Leatherworking) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Leatherworking.lastIncome = money;
        this.characterService.increaseAttribute('animalHandling', 0.003);
        this.characterService.increaseAttribute('leatherwork', 0.1);
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.Leatherworking);
        this.characterService.increaseAttribute('speed', 1);
        this.characterService.increaseAttribute('toughness', 1);
        this.characterService.status.stamina.value -= 40;
        let money = Math.log2(
          this.characterService.attributes.speed.value +
            this.characterService.attributes.toughness.value +
            this.characterService.attributes.animalHandling.value * 10
        );
        if (this.familySpecialty === ActivityType.Leatherworking) {
          money += money * 0.2;
        }
        this.characterService.updateMoney(money);
        this.Leatherworking.lastIncome = money;
        this.characterService.increaseAttribute('animalHandling', 0.1);
        this.characterService.increaseAttribute('leatherwork', 0.1);
        this.pillPouchCounter++;
        if (this.pillPouchCounter > 1000) {
          this.pillPouchCounter = 0;
          this.inventoryService.addItem(this.itemRepoService.items['pillPouch']);
        }
        this.characterService.yin++;
        this.characterService.yang++;
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
        leatherwork: 100,
      },
      {
        speed: 2000,
        toughness: 2000,
        animalHandling: 10,
        leatherwork: 10000,
      },
      {
        speed: 10000,
        toughness: 10000,
        animalHandling: 100,
        leatherwork: 1000000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 2,
  };

  FormationCreation: Activity = {
    level: 0,
    name: [
      'Apprentice Formation Creation',
      'Journeyman Formation Creation',
      'Formation Creation',
      'Master Formation Creation',
    ],
    location: LocationType.SmallTown,
    imageBaseName: 'formationCreation',
    activityType: ActivityType.FormationCreation,
    description: [
      'Work under a formation master to learn the basics of creating formation flags, talismans, arrays, and other essential parts of kits that can help you in battle.<br><br>This requires expertise in many other professions before you can even begin to practice it.',
      'Practice the essentials in creating formation flags, talismans, arrays, and other parts of kits that can help you in battle.<br><br>This requires expertise in many other professions.',
      'Work on your own in creating formation flags, talismans, arrays, and other essential parts of kits that can help you in battle.<br><br>This requires expertise in many other professions.',
      'Masterfully create formation flags, talismans, arrays, and other essential parts of kits that can help you in battle.',
    ],
    yinYangEffect: [YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance, YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 100 Stamina. If you have a formation workstation, you can make some weak formations kits.',
      'Uses 200 Stamina. If you have a formation workstation, you can make some simple formations kits.',
      'Uses 500 Stamina. If you have a formation workstation, you can make some formations kits.',
      'Uses 1000 Stamina. If you have a formation workstation, you can make some excellent formations kits.',
    ],
    consequence: [
      () => {
        this.checkApprenticeship(ActivityType.FormationCreation);
        this.characterService.increaseAttribute('formationMastery', 0.1);
        this.characterService.status.stamina.value -= 100;
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.FormationCreation);
        this.characterService.increaseAttribute('formationMastery', 0.1);
        this.characterService.status.stamina.value -= 200;
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.FormationCreation);
        this.characterService.increaseAttribute('formationMastery', 0.1);
        this.characterService.status.stamina.value -= 500;
        this.characterService.yin++;
        this.characterService.yang++;
      },
      () => {
        this.checkApprenticeship(ActivityType.FormationCreation);
        this.characterService.increaseAttribute('formationMastery', 0.1);
        this.characterService.status.stamina.value -= 1000;
        this.characterService.yin++;
        this.characterService.yang++;
      },
    ],
    resourceUse: [
      {
        stamina: 100,
      },
      {
        stamina: 200,
      },
      {
        stamina: 500,
      },
      {
        stamina: 1000,
      },
    ],
    requirements: [
      {
        smithing: 100,
        cooking: 100,
        alchemy: 100,
        woodwork: 100,
        leatherwork: 100,
      },
      {
        smithing: 10000,
        cooking: 10000,
        alchemy: 10000,
        woodwork: 10000,
        leatherwork: 10000,
        formationMastery: 1000,
      },
      {
        smithing: 1000000,
        cooking: 1000000,
        alchemy: 1000000,
        woodwork: 1000000,
        leatherwork: 1000000,
        formationMastery: 10000,
      },
      {
        smithing: 100000000,
        cooking: 100000000,
        alchemy: 100000000,
        woodwork: 100000000,
        leatherwork: 100000000,
        formationMastery: 100000,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 2,
  };

  Plowing: Activity = {
    level: 0,
    name: ['Plowing Land'],
    location: LocationType.SmallTown,
    imageBaseName: 'plowing',
    activityType: ActivityType.Plowing,
    description: ['Plow an unused plot of land into a field for growing crops.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 50 Stamina. Increases strength and speed.'],
    consequence: [
      () => {
        this.farmService.plowPlot();
        this.characterService.status.stamina.value -= 50;
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('speed', 0.1);
        this.characterService.increaseAttribute('woodLore', 0.001);
        this.characterService.increaseAttribute('earthLore', 0.001);
        this.characterService.yang++;
      },
    ],
    resourceUse: [
      {
        stamina: 50,
      },
    ],
    requirements: [
      {
        strength: 10,
        speed: 10,
      },
    ],
    landRequirements: 1,
    unlocked: false,
    relockable: true,
    skipApprenticeshipLevel: 0,
  };

  Clearing: Activity = {
    level: 0,
    name: ['Clearing Land'],
    location: LocationType.SmallTown,
    imageBaseName: 'clearing',
    activityType: ActivityType.Clearing,
    description: ['Clear a fallow plot of farmland into an empty plot of land.'],
    yinYangEffect: [YinYangEffect.Yin],
    consequenceDescription: ['Uses 50 Stamina. Increases strength and speed.'],
    consequence: [
      () => {
        this.farmService.clearPlot();
        this.characterService.status.stamina.value -= 50;
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('speed', 0.1);
        this.characterService.increaseAttribute('woodLore', 0.001);
        this.characterService.increaseAttribute('earthLore', 0.001);
        this.characterService.yin++;
      },
    ],
    resourceUse: [
      {
        stamina: 50,
      },
    ],
    requirements: [
      {
        strength: 10,
        speed: 10,
      },
    ],
    fallowLandRequirements: 1,
    unlocked: false,
    relockable: true,
    skipApprenticeshipLevel: 0,
  };

  Farming: Activity = {
    level: 0,
    name: ['Farming'],
    location: LocationType.SmallTown,
    imageBaseName: 'farming',
    activityType: ActivityType.Farming,
    description: [
      "Cultivate the crops in your fields. This is a waste of time if you don't have planted fields ready to work.",
    ],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 20 Stamina. Increases strength and speed and helps your fields to produce more food.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 20;
        let farmPower = Math.floor(
          Math.log10(this.characterService.attributes.woodLore.value + this.characterService.attributes.earthLore.value)
        );
        if (farmPower < 1) {
          farmPower = 1;
        }
        this.farmService.workFields(farmPower);
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('speed', 0.1);
        this.characterService.increaseAttribute('woodLore', 0.001);
        this.characterService.increaseAttribute('earthLore', 0.001);
        this.characterService.yang++;
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
    farmedLandRequirements: 1,
    unlocked: false,
    relockable: true,
    skipApprenticeshipLevel: 0,
  };

  Mining: Activity = {
    level: 0,
    name: ['Mining'],
    location: LocationType.SmallTown,
    imageBaseName: 'mining',
    activityType: ActivityType.Mining,
    description: ['Dig in the ground for usable minerals.'],
    yinYangEffect: [YinYangEffect.Yin],
    consequenceDescription: ['Uses 20 Stamina. Increases strength and sometimes finds something useful.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 20;
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('earthLore', 0.05);
        this.miningCounter++;
        if (this.miningCounter % 2 === 1) {
          this.inventoryService.addItem(this.itemRepoService.items['coal']);
        }
        if (this.miningCounter > 5) {
          this.miningCounter = 0;
          this.inventoryService.addItem(this.inventoryService.getOre());
        }
        this.characterService.yin++;
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

  Smelting: Activity = {
    level: 0,
    name: ['Smelting'],
    location: LocationType.SmallTown,
    imageBaseName: 'smelting',
    activityType: ActivityType.Smelting,
    description: [
      'Smelt metal ores and fuel into usable metal. You can even keep the metal bars if you have a smelter of your own.',
    ],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 20 Stamina. Increases toughness and intelligence. If you have metal ores, you can make them into bars.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 20;
        this.characterService.increaseAttribute('toughness', 0.1);
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('metalLore', 0.01);
        this.characterService.yin++;
        this.characterService.yang++;
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

  Hunting: Activity = {
    level: 0,
    name: ['Hunting'],
    location: LocationType.Forest,
    imageBaseName: 'hunting',
    activityType: ActivityType.Hunting,
    description: ['Hunt for animals in the nearby woods.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 50 Stamina. Increases speed and a good hunt provides some meat.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 50;
        this.characterService.increaseAttribute('speed', 0.1);
        let counterSatisfied = 10;
        if (this.homeService.bedroomFurniture.find(item => item?.id === 'dogKennel')) {
          counterSatisfied = 5;
        }
        this.characterService.increaseAttribute('animalHandling', 0.1);
        this.huntingCounter++;
        if (this.huntingCounter > counterSatisfied) {
          this.huntingCounter = 0;
          this.inventoryService.addItem(this.itemRepoService.items['meat']);
          this.inventoryService.addItem(
            this.inventoryService.getHide(),
            Math.floor(this.followerService.jobs['hunter'].totalPower / 20)
          );
        }
        this.characterService.yang++;
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

  Fishing: Activity = {
    level: 0,
    name: ['Fishing'],
    location: LocationType.SmallPond,
    imageBaseName: 'fishing',
    // cormorant fishing later!
    activityType: ActivityType.Fishing,
    description: ['Grab your net and see if you can catch some fish.'],
    yinYangEffect: [YinYangEffect.Yin],
    consequenceDescription: ['Uses 30 Stamina. Increases intelligence and strength and you might catch a fish.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 30;
        this.characterService.increaseAttribute('strength', 0.1);
        this.characterService.increaseAttribute('intelligence', 0.1);
        this.characterService.increaseAttribute('animalHandling', 0.02);
        this.characterService.increaseAttribute('waterLore', 0.01);
        this.fishingCounter++;
        let counterSatisfied = 10;
        if (this.homeService.bedroomFurniture.find(item => item?.id === 'cormorantCage')) {
          counterSatisfied = 5;
        }
        if (this.fishingCounter > counterSatisfied) {
          this.fishingCounter = 0;
          this.inventoryService.addItem(this.itemRepoService.items['carp']);
        }
        this.characterService.yin++;
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

  Burning: Activity = {
    level: 0,
    name: ['Burning Things'],
    location: LocationType.SmallTown,
    imageBaseName: 'burning',
    activityType: ActivityType.Burning,
    description: ['Light things on fire and watch them burn.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 5 Stamina. You will be charged for what you burn. Teaches you to love fire.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 5;
        const moneyCost = this.characterService.increaseAttribute('fireLore', 0.1);
        this.characterService.updateMoney(0 - moneyCost);
        if (this.characterService.money < 0) {
          this.characterService.updateMoney(0, true);
        }
        this.characterService.yang++;
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

  BalanceChi: Activity = {
    level: 0,
    name: ['Balance Your Chi'],
    location: LocationType.Self,
    imageBaseName: 'balance',
    activityType: ActivityType.BalanceChi,
    description: ['Balance the flow of your chi and widen your meridians.'],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: ['Uses 100 Stamina. Increases your weakest lore.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        let lowStat = 'earthLore' as AttributeType;
        for (const attribute of ['metalLore', 'woodLore', 'waterLore', 'fireLore'] as AttributeType[]) {
          if (this.characterService.attributes[attribute].value < this.characterService.attributes[lowStat].value) {
            lowStat = attribute;
          }
        }
        let value = 0.01;
        if (this.characterService.qiUnlocked || this.characterService.easyMode) {
          value = 0.1;
        }
        this.characterService.increaseAttribute(lowStat, value);
        this.characterService.increaseAttribute('spirituality', 0.001);
        if (this.characterService.yin > this.characterService.yang) {
          this.characterService.yang++;
        } else {
          this.characterService.yin++;
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

  BodyCultivation: Activity = {
    level: 0,
    name: ['Body Cultivation'],
    location: LocationType.Self,
    imageBaseName: 'bodycultivation',
    activityType: ActivityType.BodyCultivation,
    description: [
      'Focus on the development of your body. Unblock your meridians, let your chi flow, and prepare your body for immortality.',
    ],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 100 Stamina. Increases your physical abilities and strengthen your aptitudes in them.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        this.characterService.increaseAttribute('strength', 1);
        this.characterService.increaseAttribute('speed', 1);
        this.characterService.increaseAttribute('toughness', 1);
        this.characterService.attributes.strength.aptitude += 0.1;
        this.characterService.attributes.speed.aptitude += 0.1;
        this.characterService.attributes.toughness.aptitude += 0.1;
        this.characterService.increaseAttribute('spirituality', 0.001);
        this.characterService.yang++;
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

  MindCultivation: Activity = {
    level: 0,
    name: ['Mind Cultivation'],
    location: LocationType.Self,
    imageBaseName: 'mindcultivation',
    activityType: ActivityType.MindCultivation,
    description: [
      'Focus on the development of your mind. Unblock your meridians, let your chi flow, and prepare your mind for immortality.',
    ],
    yinYangEffect: [YinYangEffect.Yin],
    consequenceDescription: [
      'Uses 100 Stamina. Increases your mental abilities and strengthen your aptitudes in them.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        this.characterService.increaseAttribute('intelligence', 1);
        this.characterService.increaseAttribute('charisma', 1);
        this.characterService.attributes.intelligence.aptitude += 0.1;
        this.characterService.attributes.charisma.aptitude += 0.1;
        this.characterService.increaseAttribute('spirituality', 0.001);
        this.characterService.yin++;
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

  CoreCultivation: Activity = {
    level: 0,
    name: ['Core Cultivation'],
    location: LocationType.Self,
    imageBaseName: 'corecultivation',
    activityType: ActivityType.CoreCultivation,
    description: ['Focus on the development of your soul core.'],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 200 Stamina. A very advanced cultivation technique. Make sure you have achieved a deep understanding of elemental balance before attempting this. Gives you a small chance of increasing your Qi capabilities.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 200;
        if (this.characterService.qiUnlocked) {
          this.coreCultivationCounter++;
          if (this.coreCultivationCounter > 100) {
            this.coreCultivationCounter = 0;
            this.characterService.status.qi.max++;
            this.characterService.status.qi.value++;
          }
        }
        this.characterService.yang++;
        this.characterService.yin++;
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

  SoulCultivation: Activity = {
    level: 0,
    name: ['Soul Cultivation'],
    location: LocationType.Self,
    imageBaseName: 'soulcultivation',
    activityType: ActivityType.SoulCultivation,
    description: ['Focus on the development of your immortal soul.'],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: [
      "Uses 1000 health. An immortal's cultivation technique. Balance your attributes and your lore, and improve yourself in every way.",
    ],
    consequence: [
      () => {
        this.characterService.status.health.value -= 1000;
        let lowStat = 'earthLore' as AttributeType;
        for (const attribute of ['metalLore', 'woodLore', 'waterLore', 'fireLore'] as AttributeType[]) {
          if (this.characterService.attributes[attribute].value < this.characterService.attributes[lowStat].value) {
            lowStat = attribute;
          }
        }
        this.characterService.increaseAttribute(lowStat, 1);

        lowStat = 'strength' as AttributeType;
        for (const attribute of ['speed', 'toughness', 'intelligence', 'charisma'] as AttributeType[]) {
          if (this.characterService.attributes[attribute].value < this.characterService.attributes[lowStat].value) {
            lowStat = attribute;
          }
        }
        this.characterService.increaseAttribute(lowStat, 1);
        this.characterService.increaseAttribute('spirituality', 0.01);

        this.characterService.healthBonusSoul++;
        this.characterService.status.stamina.max++;
        this.characterService.status.qi.max++;
        this.characterService.checkOverage();
        if (this.characterService.yin > this.characterService.yang) {
          this.characterService.yang++;
        } else {
          this.characterService.yin++;
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

  InfuseEquipment: Activity = {
    level: 0,
    name: ['Infuse Equipment'],
    location: LocationType.Self,
    imageBaseName: 'infuseequipment',
    activityType: ActivityType.InfuseEquipment,
    description: ['Infuse the power of a gem into your equipment.'],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: ['Uses 200 Stamina and 10 Qi. An advanced magical technique.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 200;
        this.characterService.status.qi.value -= 10;
        this.characterService.yang++;
        this.characterService.yin++;
      },
    ],
    resourceUse: [
      {
        stamina: 200,
        qi: 10,
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

  InfuseBody: Activity = {
    level: 0,
    name: ['Infuse Body'],
    location: LocationType.Self,
    imageBaseName: 'infusebody',
    activityType: ActivityType.InfuseBody,
    description: [
      'Direct your magical energy into reinforcing your physical body, making it healthier and more able to sustain damage without falling.',
    ],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 10 Qi and 200 Stamina. Make sure you have enough magical power before attempting this.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 200;
        if (this.characterService.qiUnlocked && this.characterService.status.qi.value >= 10) {
          this.characterService.status.qi.value -= 10;
          this.characterService.healthBonusMagic++;
        }
        this.characterService.yang++;
        this.characterService.yin++;
      },
    ],
    resourceUse: [
      {
        stamina: 200,
        qi: 10,
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

  ExtendLife: Activity = {
    level: 0,
    name: ['Extending Life'],
    location: LocationType.Self,
    imageBaseName: 'extendlife',
    activityType: ActivityType.ExtendLife,
    description: ['Direct your magical energy into extending your lifespan, making you live longer.'],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: [
      'Uses 20 Qi and 400 Stamina. Make sure you have enough magical power before attempting this.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 400;
        if (this.characterService.qiUnlocked && this.characterService.status.qi.value >= 20) {
          this.characterService.status.qi.value -= 20;
          if (this.characterService.magicLifespan < 36500) {
            this.characterService.magicLifespan += 10;
          }
        }
        this.characterService.yang++;
        this.characterService.yin++;
      },
    ],
    resourceUse: [
      {
        stamina: 400,
        qi: 20,
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

  Recruiting: Activity = {
    level: 0,
    name: ['Recruiting Followers'],
    location: LocationType.LargeCity,
    imageBaseName: 'recruiting',
    activityType: ActivityType.Recruiting,
    description: ['Look for followers willing to serve you.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 100 Stamina and 1M taels. Gives you a small chance of finding a follower, if you are powerful enough to attract any.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        if (!this.followerService.followersUnlocked) {
          this.logService.log(
            LogTopic.FOLLOWER,
            'Every potential follower ignores your recruiting efforts after sensing your low cultivation.'
          );
          return;
        }
        if (this.characterService.money <= 1000000) {
          this.logService.log(LogTopic.FOLLOWER, "You don't have the funds required to recruit anyone.");
          return;
        }
        this.characterService.updateMoney(-1000000);
        this.recruitingCounter++;
        if (this.recruitingCounter > 100) {
          this.recruitingCounter = 0;
          this.followerService.generateFollower();
        }
        this.characterService.yang++;
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

  TrainingFollowers: Activity = {
    level: 0,
    name: ['Training Followers'],
    location: LocationType.LargeCity,
    imageBaseName: 'trainingfollowers',
    activityType: ActivityType.TrainingFollowers,
    description: ['Train your followers to make them more powerful.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 1000 Stamina. Gives you a small chance for each follower of increasing their power. They might learn more if you are a better leader.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        this.trainingFollowersDays++;
        this.characterService.yang++;
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

  Taunting: Activity = {
    level: 0,
    name: ['Looking for Trouble'],
    location: LocationType.Self,
    imageBaseName: 'taunting',
    activityType: ActivityType.Taunting,
    description: ['Go looking for an enemy and call them out to battle.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Has a chance to incite a fight.'],
    consequence: [
      () => {
        this.tauntCounter++;
        if (this.tauntCounter > 20 || this.battleService.autoTroubleUnlocked) {
          this.battleService.trouble();
          this.tauntCounter = 0;
        }
        this.characterService.yang++;
      },
    ],
    resourceUse: [{}],
    requirements: [
      {
        strength: 100,
        toughness: 100,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 0,
  };

  CombatTraining: Activity = {
    level: 0,
    name: ['Combat Training'],
    location: LocationType.Self,
    imageBaseName: 'combattraining',
    activityType: ActivityType.CombatTraining,
    description: [
      'Hone every fiber of your being to martial sepremacy. Your experience in the Hell of Mirrors allowed you to examine your own combat form and understand how to improve it. Now all you need is practice.',
    ],
    yinYangEffect: [YinYangEffect.Balance],
    consequenceDescription: ['Uses 10000 stamina. Trains your Combat Mastery.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 10000;
        this.characterService.increaseAttribute('combatMastery', 0.01);
        this.characterService.yang++;
        this.characterService.yin++;
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

  PetRecruiting: Activity = {
    level: 0,
    name: ['Finding Pets'],
    location: LocationType.Self,
    imageBaseName: 'findingpets',
    activityType: ActivityType.PetRecruiting,
    description: ['Look for animals that want to be your pets.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: ['Uses 100 Stamina and 100,000 food. Gives you a small chance of finding a pet.'],
    consequence: [
      () => {
        if (this.inventoryService.getQuantityByType('food') < 100000) {
          return;
        }
        this.characterService.status.stamina.value -= 100;
        if (this.inventoryService.consume('food', 100000, true) <= 0) {
          return;
        }
        this.characterService.increaseAttribute('animalHandling', 1);
        if (this.followerService.followersUnlocked) {
          this.petRecruitingCounter++;
          if (this.petRecruitingCounter > 100) {
            this.petRecruitingCounter = 0;
            this.followerService.generateFollower(true);
          }
        }
        this.characterService.yang++;
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

  PetTraining: Activity = {
    level: 0,
    name: ['Training Pets'],
    location: LocationType.Self,
    imageBaseName: 'trainingpets',
    activityType: ActivityType.PetTraining,
    description: ['Train your pets to make them more powerful.'],
    yinYangEffect: [YinYangEffect.Yang],
    consequenceDescription: [
      'Uses 1000 Stamina and 100k food. Gives you a small chance for each pet of increasing their power. They might learn more if you are a better with animals.',
    ],
    consequence: [
      () => {
        if (this.inventoryService.getQuantityByType('food') < 100000) {
          return;
        }
        this.characterService.status.stamina.value -= 1000;
        // Consuming this food is kind of expensive performance wise, but since the stacks are so high
        // it would be impractical to ask players to keep so much in inventory. Maybe we can keep track of
        // a hidden temporary food value or something in the future?
        if (this.inventoryService.consume('food', 100000, true) <= 0) {
          return;
        }
        this.characterService.increaseAttribute('animalHandling', 1);
        this.trainingPetsDays++;
        this.characterService.yang++;
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

  PurifyGems: Activity = {
    level: 0,
    name: ['Purifying Gems'],
    location: LocationType.Self,
    imageBaseName: 'purifyinggems',
    activityType: ActivityType.PurifyGems,
    description: ['Purify corrupted spirit gems into life gems.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 100000 Stamina and a corrupted spirit gem.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100000;
        const corruptedGemStackIndex = this.inventoryService.itemStacks.findIndex(
          itemStack =>
            itemStack.item?.type === LOOT_TYPE_GEM &&
            itemStack.item.subtype === EFFECT_CORRUPTION &&
            itemStack.quantity >= 1
        );
        if (corruptedGemStackIndex !== -1) {
          const corruptedGemStack = this.inventoryService.itemStacks[corruptedGemStackIndex];
          corruptedGemStack.quantity--;
          if (corruptedGemStack.quantity === 0) {
            this.inventoryService.setItemEmptyStack(corruptedGemStackIndex);
          }
          this.inventoryService.addItem(
            this.inventoryService.generateSpiritGem(corruptedGemStack!.item!.value / 5, 'life')
          );
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
        spirituality: 1e24,
      },
    ],
    unlocked: false,
    skipApprenticeshipLevel: 0,
  };

  burnMoney: Activity = {
    level: 0,
    name: ['Burn Money'],
    location: LocationType.Hell,
    activityType: ActivityType.BurnMoney,
    description: ['Burn mortal realm money to receive hell money.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses a huge pile of mortal money (one million). Gives you some hell money.'],
    consequence: [
      () => {
        if (this.characterService.money < 1e6) {
          this.logService.log(
            LogTopic.EVENT,
            "You fail to burn the money that you don't have, and feel pretty dumb for trying."
          );
          return;
        }
        this.characterService.updateMoney(-1e6);
        this.hellService!.burnedMoney += 1e6;
        if (this.hellService!.fasterHellMoney) {
          this.characterService.hellMoney += 10;
        } else {
          this.characterService.hellMoney++;
        }
      },
    ],
    resourceUse: [
      {
        stamina: 10,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  hellRecruiting: Activity = {
    level: 0,
    name: ['Recruiting the Damned'],
    location: LocationType.Hell,
    activityType: ActivityType.HellRecruiting,
    description: ['Look for followers willing to help you.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 100 Stamina and 1000 hell money. Gives you a small chance of finding a follower.'],
    consequence: [
      () => {
        if (this.characterService.attributes.charisma.value < 1e6) {
          this.logService.log(LogTopic.EVENT, 'You completely fail to catch the attention of any of the damned.');
          return;
        }
        if (this.characterService.hellMoney < 1000) {
          this.logService.injury(
            LogTopic.EVENT,
            "You don't have enough hell money. The damned souls around you team up with the demons to give you a beating."
          );
          this.characterService.status.health.value -= this.characterService.status.health.max * 0.2;
          if (this.characterService.status.health.value <= 0) {
            this.hellService!.beaten = true;
          }
          return;
        }
        this.characterService.status.stamina.value -= 100;
        this.characterService.hellMoney -= 1000;
        if (Math.random() < 0.01) {
          this.followerService.generateFollower(false, 'damned');
          this.logService.log(LogTopic.EVENT, 'Your recruiting efforts seem to infuriate the demons here.');
        } else {
          this.logService.log(
            LogTopic.EVENT,
            'You pass around some bribes but fail to find any interested followers today.'
          );
        }
      },
    ],
    resourceUse: [
      {
        stamina: 100,
      },
    ],
    requirements: [{}],
    unlocked: false,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  rehabilitation: Activity = {
    level: 0,
    name: ['Rehabilitate Ruffian'],
    location: LocationType.Hell,
    activityType: ActivityType.Rehabilitation,
    description: [
      'You recognize a bunch of the ruffians here as people who used to beat and rob you in your past lives. Perhaps you can give them some some friendly rehabilitation. With your fists.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 100 Stamina and 10 hell money as bait. Breaks a ruffian out of their basket and picks a fight with them.',
    ],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100;
        this.battleService.addEnemy({
          name: 'Ruffian',
          baseName: 'deadruffian',
          health: 100,
          maxHealth: 100,
          defense: 10,
          defeatEffect: 'respawnDouble',
          loot: [],
          techniques: [
            {
              name: 'Attack',
              ticks: 0,
              ticksRequired: 10,
              baseDamage: 10,
              unlocked: true,
            },
          ],
        });
      },
    ],
    resourceUse: [
      {
        stamina: 100,
      },
    ],
    requirements: [{}],
    unlocked: false,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  honorAncestors: Activity = {
    level: 0,
    name: ['Honor Ancestors'],
    location: LocationType.Hell,
    activityType: ActivityType.HonorAncestors,
    description: [
      'You look around and realize that you have many family members and ancestors here. You should probably give them some credit for what they have done for you. And some money.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1 hell money.'],
    consequence: [
      () => {
        if (this.characterService.hellMoney < 1) {
          this.logService.log(
            LogTopic.EVENT,
            'Your ancestors are not impressed with your lack of financial offerings.'
          );
          return;
        }
        this.characterService.hellMoney--;
        this.inventoryService.addItem(this.itemRepoService.items['tokenOfGratitude']);
      },
    ],
    resourceUse: [
      {
        stamina: 10,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  copperMining: Activity = {
    level: 0,
    name: ['Copper Mining'],
    location: LocationType.Hell,
    activityType: ActivityType.CopperMining,
    description: [
      "The copper pillars here look like they're made of a decent grade of copper. It looks like you have enough slack in your chains to turn and break off some pieces.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 100,000 stamina and produces one copper bar.'],
    consequence: [
      () => {
        if (this.characterService.attributes.strength.value < 1e24) {
          this.logService.log(LogTopic.EVENT, "You try to crack into the pillar, but you're not strong enough.");
          return;
        }
        this.characterService.status.stamina.value -= 100000;
        this.inventoryService.addItem(this.itemRepoService.items['copperBar']);
      },
    ],
    resourceUse: [
      {
        stamina: 100000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  forgeHammer: Activity = {
    level: 0,
    name: ['Forge Hammer'],
    location: LocationType.Hell,
    activityType: ActivityType.ForgeHammer,
    description: [
      'Shape a bar of copper into a hammer using your bare hands. This would be so much easier with an anvil and tools.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 100,000 stamina and produces the worst hammer in the world.'],
    consequence: [
      () => {
        if (this.characterService.attributes.strength.value < 1e24) {
          this.logService.log(
            LogTopic.EVENT,
            'Your weak muscles flinch at the very thought of trying to mold metal by hand.'
          );
          return;
        }
        this.characterService.status.stamina.value -= 100000;
        if (this.inventoryService.consume('metal', 1) > 0) {
          const newHammer: Equipment = {
            id: 'weapon',
            imageFile: 'copperHammer',
            name: 'Copper Hammer',
            type: 'equipment',
            slot: 'rightHand',
            value: 1,
            weaponStats: {
              baseDamage: 1,
              material: 'metal',
              baseName: 'hammer',
            },
            description: 'A crude copper hammer.',
          };
          this.inventoryService.addItem(newHammer);
        }
      },
    ],
    resourceUse: [
      {
        stamina: 100000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  climbMountain: Activity = {
    level: 0,
    name: ['Climb the Mountain'],
    location: LocationType.Hell,
    activityType: ActivityType.ClimbMountain,
    description: [
      "Take another step up the mountain. The path before you seems exceptionally jagged. Maybe you shouldn't have killed so very many little spiders.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1000 stamina and works off some of that murderous karma you have built up.'],
    consequence: [
      () => {
        if (
          this.characterService.attributes.strength.value < 1e24 ||
          this.characterService.attributes.toughness.value < 1e24
        ) {
          this.logService.log(
            LogTopic.EVENT,
            'Your legs give out before you can take a single step up the mountain. Maybe if you were stronger and tougher you could climb.'
          );
          return;
        }
        this.characterService.status.stamina.value -= 1000;
        this.hellService!.mountainSteps++;
      },
    ],
    resourceUse: [
      {
        stamina: 1000,
      },
    ],
    requirements: [
      {
        strength: 1e24,
        toughness: 1e24,
      },
    ],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  attackClimbers: Activity = {
    level: 0,
    name: ['Attack Climbers'],
    location: LocationType.Hell,
    activityType: ActivityType.AttackClimbers,
    description: [
      "The murderers on this mountain look pretty distracted. It wouldn't be hard to knock them down to the bottom.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Knock a climber off the mountain.'],
    consequence: [
      () => {
        this.hellService!.mountainSteps = 0;
      },
    ],
    resourceUse: [{}],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  meltMountain: Activity = {
    level: 0,
    name: ['Melt the Mountain'],
    location: LocationType.Hell,
    activityType: ActivityType.MeltMountain,
    description: [
      "The mountain is far to slippery climb. The only way you're getting to the top is to bring the top down to you.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Focus your connection to fire and melt that sucker down.'],
    consequence: [
      () => {
        if (this.characterService.attributes.fireLore.value < 1e16) {
          this.logService.log(LogTopic.EVENT, "Your connection to fire isn't nearly as strong as you thought it was.");
          return;
        }

        const numberSpawned = Math.log10(this.characterService.attributes.fireLore.value);
        for (let i = 0; i < numberSpawned; i++) {
          this.battleService.addEnemy({
            name: 'Ice Golem',
            baseName: 'icegolem',
            health: 1e15,
            maxHealth: 1e15,
            defense: 1e6,
            loot: [this.itemRepoService.items['iceCore']],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 1e6,
                unlocked: true,
              },
            ],
          });
        }
      },
    ],
    resourceUse: [{}],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  freezeMountain: Activity = {
    level: 0,
    name: ['Rock the Lava'],
    location: LocationType.Hell,
    activityType: ActivityType.FreezeMountain,
    description: ['Swimming in lava is less fun that it seemed like it would be.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Focus your connection to water and turn that lava back to stone.'],
    consequence: [
      () => {
        if (this.characterService.attributes.waterLore.value < 1e16) {
          this.logService.log(LogTopic.EVENT, "Your connection to water isn't nearly as strong as you thought it was.");
          return;
        }
        const numberSpawned = Math.log10(this.characterService.attributes.waterLore.value);
        for (let i = 0; i < numberSpawned; i++) {
          this.battleService.addEnemy({
            name: 'Lava Golem',
            baseName: 'lavagolem',
            health: 1e15,
            maxHealth: 1e15,
            defense: 1e6,
            loot: [this.itemRepoService.items['fireCore']],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 1e6,
                unlocked: true,
              },
            ],
          });
        }
      },
    ],
    resourceUse: [{}],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  healAnimals: Activity = {
    level: 0,
    name: ['Heal Animals'],
    location: LocationType.Hell,
    activityType: ActivityType.HealAnimals,
    description: [
      'You notice that not all the animals here are frenzied killers. Some of them are sick, wounded, and miserable. You resolve to do what good you can here.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 10,000 Qi and 10,000 stamina. Heals an animal.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 10000;
        this.characterService.status.qi.value -= 10000;
        this.hellService!.animalsHealed++;
      },
    ],
    resourceUse: [
      {
        stamina: 10000,
        qi: 10000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  liftBoulder: Activity = {
    level: 0,
    name: ['Lift the Boulder Higher'],
    location: LocationType.Hell,
    activityType: ActivityType.LiftBoulder,
    description: ['The boulder is heavy, but you are strong. See how high you can lift it.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 100,000 stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 100000;
        this.hellService!.boulderHeight++;
      },
    ],
    resourceUse: [
      {
        stamina: 10000,
        qi: 10000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  HellSwim: Activity = {
    level: 0,
    name: ['Swim Deeper into the Blood'],
    location: LocationType.Hell,
    activityType: ActivityType.Swim,
    description: ['Swim down further into the crimson depths.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 2000 Stamina. Reduce health by 1000.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 2000;
        this.characterService.status.health.value -= 1000;
        this.hellService!.swimDepth++;
      },
    ],
    resourceUse: [
      {
        stamina: 2000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  searchForExit: Activity = {
    level: 0,
    name: ['Search for the Exit'],
    location: LocationType.Hell,
    activityType: ActivityType.SearchForExit,
    description: [
      "The lost souls here are searching for a way out, and they can't seem to see the portal you came in on. You could help them search for the exit they're seeking.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 200,000 Stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 200000;
        // TODO: tune this
        if (this.characterService.attributes.intelligence.value <= 1e24) {
          this.logService.log(
            LogTopic.EVENT,
            'You stumble around completely lost like the rest of the souls here. If only you were smarter.'
          );
          return;
        }
        const threshold = Math.log10(this.characterService.attributes.intelligence.value - 1e24) * 0.00001;
        if (Math.random() < threshold) {
          this.hellService!.exitFound = true;
          /*
          if (!this.hells[HellLevel.WrongfulDead].activities.includes(this.teachTheWay)) {
            this.hells[HellLevel.WrongfulDead].activities.push(this.teachTheWay);
            this.reloadActivities();
          }
            */
        }
      },
    ],
    resourceUse: [
      {
        stamina: 200000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  teachTheWay: Activity = {
    level: 0,
    name: ['Teach the Way to the Exit'],
    location: LocationType.Hell,
    activityType: ActivityType.TeachTheWay,
    description: ['Teach the other damned souls here the way out.'],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 200,000 Stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 200000;
        // TODO: tune this
        if (this.characterService.attributes.charisma.value <= 1e24) {
          this.logService.log(LogTopic.EVENT, 'The damned souls completely ignore your attempts at instruction.');
          return;
        }
        const numberTaught = Math.floor(Math.log10(this.characterService.attributes.charisma.value - 1e24));
        this.hellService!.soulsEscaped += numberTaught;
      },
    ],
    resourceUse: [
      {
        stamina: 200000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  interrogate: Activity = {
    level: 0,
    name: ['Interrogate the Damned'],
    location: LocationType.Hell,
    activityType: ActivityType.Interrogate,
    description: [
      'Find out where the tomb looters here hid their stolen treasures. You might be able to reverse some of the damage they have done.',
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        if (this.characterService.attributes.charisma.value <= 1e24) {
          this.logService.log(LogTopic.EVENT, 'The damned here completely ignore you attempts.');
          return;
        }
        const threshold = Math.log10(this.characterService.attributes.charisma.value - 1e24) * 0.00001;
        if (Math.random() < threshold) {
          this.inventoryService.addItem(this.itemRepoService.items['treasureMap']);
        } else {
          this.logService.log(
            LogTopic.EVENT,
            'You almost talk a soul into telling you where their treasure is hidden.'
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
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  recoverTreasure: Activity = {
    level: 0,
    name: ['Recover a Treasure'],
    location: LocationType.Hell,
    activityType: ActivityType.RecoverTreasure,
    description: [
      "Recover a stolen relic. You'll need all your wits to find it even if you have one the sketchy maps the damned can provide.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        if (this.characterService.attributes.intelligence.value <= 1e24) {
          this.logService.log(
            LogTopic.EVENT,
            "The puzzle your best puzzling but can't figure out how to even start on this relic."
          );
          return;
        }
        const threshold = Math.log10(this.characterService.attributes.intelligence.value - 1e24) * 0.00001;
        if (Math.random() < threshold) {
          if (this.inventoryService.consume('treasureMap') > 0) {
            this.inventoryService.addItem(this.itemRepoService.items['stolenRelic']);
          }
        } else {
          this.logService.log(
            LogTopic.EVENT,
            "You think you're getting close to figuring out where this relic is. If only you were more clever."
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
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  replaceTreasure: Activity = {
    level: 0,
    name: ['Replace a Treasure'],
    location: LocationType.Hell,
    activityType: ActivityType.ReplaceTreasure,
    description: [
      "Return a stolen relic to the tomb where it came from. You'll need to be quick to avoid the tomb's traps.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1000 Stamina.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        if (this.characterService.attributes.speed.value <= 1e24) {
          this.logService.log(LogTopic.EVENT, 'You are too slow to even attempt replacing a treasure.');
          return;
        }
        const threshold = Math.log10(this.characterService.attributes.speed.value - 1e24) * 0.00001;
        if (Math.random() < threshold) {
          if (this.inventoryService.consume('stolenRelic') > 0) {
            this.hellService!.relicsReturned++;
          }
        } else {
          this.logService.log(
            LogTopic.EVENT,
            'You make a good effort to run through the tomb, but you fail. Try harder!'
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
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  endureTheMill: Activity = {
    level: 0,
    name: ['Endure the Mill'],
    location: LocationType.Hell,
    activityType: ActivityType.Endure,
    description: [
      "Trapped under the millstone like this, there's not much you can do but endure the punishment. Fortunately, you probably never went out looking for tiny spiders to squash, right?",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 1000 stamina. Try not to give up. You can do this!'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 1000;
        // TODO: tune this
        const damage = Math.max(100000 - this.characterService.attributes.toughness.value / 1e23, 100);
        this.characterService.status.health.value -= damage;
        if (this.characterService.status.health.value <= 0) {
          this.hellService!.beaten = true;
        } else {
          this.hellService!.timesCrushed++;
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
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  examineContracts: Activity = {
    level: 0,
    name: ['Examine Contracts'],
    location: LocationType.Hell,
    activityType: ActivityType.ExamineContracts,
    description: [
      "As if the saw-weilding demons weren't bad enough, this place is a haven for fiendish bureaucrats. Huge piles of paper containing the contracts, covenants, bylaws, stipulations, regulations, and heretofor unspecified legal nonsense for this hell. Maybe if you go through them carefully, you can find a loophole to get yourself an audience with the boss.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: ['Uses 500,000 stamina because hellish legalese is so incredibly boring.'],
    consequence: [
      () => {
        this.characterService.status.stamina.value -= 500000;
        if (this.characterService.attributes.intelligence.value <= 1e24) {
          this.logService.log(LogTopic.EVENT, "You can't even begin to read the complex contracts.");
          return;
        }
        const threshold = Math.log10(this.characterService.attributes.intelligence.value - 1e24) * 0.00001;
        if (Math.random() < threshold) {
          this.hellService!.contractsExamined++;
        } else {
          this.logService.log(LogTopic.EVENT, 'You very nearly make out the meaning of the scrawled contract.');
        }
      },
    ],
    resourceUse: [
      {
        stamina: 500000,
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
  };

  HellOddJobs: Activity = {
    level: 0,
    name: ['Odd Jobs'],
    location: LocationType.SmallTown,
    imageBaseName: 'oddjobs',
    activityType: ActivityType.OddJobs,
    description: [
      "Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Undignified work for an aspiring god, but you can't manage anything more profitable when you're projecting your spirit this far.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [
      'Uses 5 Stamina. Increases all your basic attributes by a small amount and provides a little money.',
    ],
    consequence: [
      () => {
        this.characterService.increaseAttribute('strength', 0.02);
        this.characterService.increaseAttribute('toughness', 0.02);
        this.characterService.increaseAttribute('speed', 0.02);
        this.characterService.increaseAttribute('intelligence', 0.02);
        this.characterService.increaseAttribute('charisma', 0.02);
        this.characterService.status.stamina.value -= 5;
        this.characterService.updateMoney(3);
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

  escapeHell: Activity = {
    level: 0,
    location: LocationType.Hell,
    name: ['Escape from this hell'],
    activityType: ActivityType.EscapeHell,
    description: ["Return to the gates of Lord Yama's realm."],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [''],
    consequence: [
      () => {
        this.battleService.enemies = [];
        this.battleService.currentEnemy = null;
        const leavingHell = this.hellService!.hells[this.hellService!.currentHell];
        if (leavingHell.exitEffect) {
          leavingHell.exitEffect();
        }
        this.hellService!.moveToHell(HellLevel.Gates);
      },
    ],
    requirements: [{}],
    unlocked: true,
    discovered: true,
    skipApprenticeshipLevel: 0,
    resourceUse: [],
  };

  FinishHell: Activity = {
    level: 0,
    name: ['Challenge Lord Yama'],
    location: LocationType.Hell,
    activityType: ActivityType.FinishHell,
    description: [
      "You've had enough of this place and learned everything these hells can teach you. Your karmic debt is paid. Challenge Lord Yama to prove you deserve your rightful place in the heavens.",
    ],
    yinYangEffect: [YinYangEffect.None],
    consequenceDescription: [''],
    consequence: [
      () => {
        if (this.battleService.enemies.length === 0) {
          this.battleService.addEnemy({
            name: 'Lord Yama',
            baseName: 'Yama',
            health: 1e40,
            maxHealth: 1e40,
            defense: 1e18,
            loot: [this.itemRepoService.items['portalKey']],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 1e14,
                unlocked: true,
              },
            ],
          });
          this.battleService.addEnemy({
            name: 'Horse Face',
            baseName: 'HorseFace',
            health: 1e39,
            maxHealth: 1e39,
            defense: 5e17,
            loot: [],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 5e13,
                unlocked: true,
              },
            ],
          });
          this.battleService.addEnemy({
            name: 'Ox Head',
            baseName: 'OxHead',
            health: 1e39,
            maxHealth: 1e39,
            defense: 5e17,
            loot: [],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 5e13,
                unlocked: true,
              },
            ],
          });
        }
      },
    ],
    requirements: [{}],
    resourceUse: [],
    unlocked: true,
    skipApprenticeshipLevel: 0,
  };
}
/* eslint-enable @typescript-eslint/ban-ts-comment */
