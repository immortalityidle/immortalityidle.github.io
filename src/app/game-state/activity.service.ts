import { Injectable, Injector } from '@angular/core';
import { BattleService } from './battle.service';
import { Activity, ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { AttributeType, CharacterAttribute } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService, HomeType } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ImpossibleTaskService, ImpossibleTaskType } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { HellService } from './hell.service';

export interface ActivityProperties {
  autoRestart: boolean,
  pauseOnDeath: boolean,
  pauseBeforeDeath: boolean,
  activityLoop: ActivityLoopEntry[],
  unlockedActivities: ActivityType[],
  openApprenticeships: number,
  spiritActivity: ActivityType | null,
  completedApprenticeships: ActivityType[],
  currentApprenticeship: ActivityType,
  savedActivityLoop: ActivityLoopEntry[],
  autoPauseUnlocked: boolean,
  autoRestUnlocked: boolean,
  pauseOnImpossibleFail: boolean,
  totalExhaustedDays: number,
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  savedActivityLoop: ActivityLoopEntry[] = [];
  spiritActivity: ActivityType | null = null;
  autoRestart = false;
  autoPauseUnlocked = false;
  pauseOnImpossibleFail = true;
  pauseOnDeath = true;
  pauseBeforeDeath = true;
  activities: Activity[];
  openApprenticeships = 1;
  oddJobDays = 0;
  beggingDays = 0;
  completedApprenticeships: ActivityType[] = [];
  currentIndex = 0;
  currentTickCount = 0;
  exhaustionDays = 0;
  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentApprenticeship: ActivityType = ActivityType.Resting;
  activityDeath = false; // Simpler to just check a flag for the achievement.
  autoRestUnlocked = false;
  totalExhaustedDays = 0;
  activityHeader = "";
  activityHeaderDescription = "";
  hellEnabled = false; // flip this true to enable new postmortal content
  hellService?: HellService;

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
    setTimeout(() => this.activities = this.getActivityList());
    
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
    mainLoopService.tickSubject.subscribe(() => {
      if (this.activityLoop.length === 0){
        this.mainLoopService.pause = true;
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.pauseBeforeDeath && this.characterService.characterState.age >= this.characterService.characterState.lifespan - 1 && !this.characterService.characterState.immortal){
        this.logService.addLogMessage("The end of your natural life is imminent. Game paused.", "INJURY", "EVENT");
        this.mainLoopService.pause = true;
      }
      if (this.exhaustionDays > 0){
        this.totalExhaustedDays++;
        this.exhaustionDays--;
        return;
      }
      if (this.characterService.characterState.bloodlineRank >= 9){
        this.characterService.characterState.increaseAptitudeDaily();
      }


      if (this.currentIndex < this.activityLoop.length) {
        this.currentLoopEntry = this.activityLoop[this.currentIndex];
        // check if our current activity is zero-day
        if (this.currentLoopEntry.repeatTimes === 0){
          // don't do the activity, instead see if there's a next one we can switch to
          let index = 0;
          if (this.currentIndex < this.activityLoop.length - 1){
            index = this.currentIndex + 1;
          }
          while (index !== this.currentIndex && this.activityLoop[index].repeatTimes === 0){
            index++;
            if (index >= this.activityLoop.length){
              index = 0;
            }
          }
          if (index === this.currentIndex){
            // we looped all the way around without getting any non-zero repeatTimes, pause the game and bail out
            this.mainLoopService.pause = true;
            return;
          } else {
            //switch to the found non-zero activity and restart the ticks for it
            this.currentIndex = index;
            this.currentLoopEntry = this.activityLoop[this.currentIndex];
            this.currentTickCount = 0;
          }
        }
        let activity = this.getActivityByType(this.currentLoopEntry.activity);
        const rest = this.getActivityByType(ActivityType.Resting);
        if (!this.checkResourceUse(activity) && rest.unlocked && this.autoRestUnlocked){ // check for resources, rest activity is available, and autopause unlocked.
          activity = rest;
        }
        activity.consequence[activity.level]();

        // check for exhaustion
        if (this.characterService.characterState.status.stamina.value < 0) {
          // take 5 days to recover, regain stamina, restart loop
          this.logService.addLogMessage('You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.', 'INJURY', 'EVENT');
          this.exhaustionDays = 5;
          this.characterService.characterState.status.stamina.value = 100;
          this.characterService.characterState.status.health.value -= 0.01 * this.characterService.characterState.status.health.max;
        }
        // check for mana overuse
        if (this.characterService.characterState.status.mana.value < 0) {
          this.logService.addLogMessage('You overextend your mana and damage your mana channels. It takes you 10 days to recover.','INJURY', 'EVENT');
          if (this.characterService.characterState.status.mana.max > 1){
            this.characterService.characterState.status.mana.max -= 1;
          }
          this.exhaustionDays = 10;
          this.characterService.characterState.status.health.value -= 0.01 * this.characterService.characterState.status.health.max;
        }
        // check for activity death
        this.activityDeath = false;
        if (this.characterService.characterState.status.health.value <= 0){
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
        }
      } else {
        // make sure that we reset the current index if activities get removed so that we're past the end of the list
        this.currentIndex = 0;
      }
      // do the spirit activity if we can
      if (this.spiritActivity && this.characterService.characterState.status.mana.value >= 5){
        let activity = this.getActivityByType(this.spiritActivity);
        const rest = this.getActivityByType(ActivityType.Resting);
        if (!this.checkResourceUse(activity, true) && rest.unlocked && this.autoRestUnlocked){ // check for resources, rest activity is available, and autopause unlocked.
          activity = rest;
        }
        activity.consequence[activity.level]();
        this.characterService.characterState.status.mana.value -= 5;
      }
    });
    mainLoopService.longTickSubject.subscribe(() => {
      this.upgradeActivities(false);
      this.checkRequirements(false);
    });

  }

  checkResourceUse(activity: Activity, spirit = false): boolean {
    if (!activity.resourceUse || !activity.resourceUse[activity.level]){
      return true;
    }
    if (spirit){
      if (!activity.resourceUse[activity.level]["mana"]){
        activity.resourceUse[activity.level]["mana"] = 0;
      }
      //@ts-ignore
      if (this.characterService.characterState.status["mana"].value < activity.resourceUse[activity.level]["mana"] + 5) {
        return false;
      }
    }
    for (const key in activity.resourceUse[activity.level]) {
      //@ts-ignore
      if (this.characterService.characterState.status[key].value < activity.resourceUse[activity.level][key]) {
        return false;
      }
    }
    return true;
  }

  getProperties(): ActivityProperties{
    const unlockedActivities: ActivityType[] = [];
    for (const activity of this.activities){
      if (activity.unlocked){
        unlockedActivities.push(activity.activityType);
      }
    }
    return {
      autoRestart: this.autoRestart,
      autoPauseUnlocked: this.autoPauseUnlocked,
      pauseOnDeath: this.pauseOnDeath,
      pauseBeforeDeath: this.pauseBeforeDeath,
      activityLoop: this.activityLoop,
      unlockedActivities: unlockedActivities,
      openApprenticeships: this.openApprenticeships,
      spiritActivity: this.spiritActivity,
      completedApprenticeships: this.completedApprenticeships,
      currentApprenticeship: this.currentApprenticeship,
      savedActivityLoop: this.savedActivityLoop,
      autoRestUnlocked: this.autoRestUnlocked,
      pauseOnImpossibleFail: this.pauseOnImpossibleFail,
      totalExhaustedDays: this.totalExhaustedDays
    }
  }

  setProperties(properties: ActivityProperties){
    this.reloadActivities();
    this.completedApprenticeships = properties.completedApprenticeships || [];
    const unlockedActivities = properties.unlockedActivities || [ActivityType.OddJobs, ActivityType.Resting];
    for (const activity of this.activities){
        activity.unlocked = unlockedActivities.includes(activity.activityType);
    }
    this.autoRestart = properties.autoRestart;
    this.autoPauseUnlocked = properties.autoPauseUnlocked || false;
    this.pauseOnDeath = properties.pauseOnDeath;
    this.pauseBeforeDeath = properties.pauseBeforeDeath || false;
    this.activityLoop = properties.activityLoop;
    this.spiritActivity = properties.spiritActivity || null;
    this.openApprenticeships = properties.openApprenticeships || 0;
    this.currentApprenticeship = properties.currentApprenticeship || ActivityType.Resting;
    this.savedActivityLoop = properties.savedActivityLoop || [];
    this.autoRestUnlocked = properties.autoRestUnlocked || false;
    if (properties.pauseOnImpossibleFail === undefined){
      this.pauseOnImpossibleFail = true;
    } else {
      this.pauseOnImpossibleFail = properties.pauseOnImpossibleFail;
    }
    this.totalExhaustedDays = properties.totalExhaustedDays || 0;
    for (let i = 0; i < 5; i++){
      // upgrade to anything that the loaded attributes allow
      this.upgradeActivities(true);
    }

  }

  meetsRequirements(activity: Activity): boolean {
    if (this.meetsRequirementsByLevel(activity, activity.level, true)){
      activity.unlocked = true;
      return true;
    }
    return false;
  }

  meetsRequirementsByLevel(activity: Activity, level: number, apprenticeCheck: boolean): boolean {
    if (apprenticeCheck && !activity.unlocked && this.openApprenticeships <= 0 && activity.activityType !== this.currentApprenticeship){
      if (level < activity.skipApprenticeshipLevel){
        return false;
      }
      if (activity.skipApprenticeshipLevel > 0 && !this.completedApprenticeships.includes(activity.activityType) ){
        // we've never completed an apprenticeship in this job and it needs one
        return false;
      }
    }
    const keys: (keyof CharacterAttribute)[] = Object.keys(
      activity.requirements[level]
    ) as (keyof CharacterAttribute)[];
    for (const keyIndex in keys) {
      const key = keys[keyIndex];
      let requirementValue = 0;
      if (activity.requirements[level][key] !== undefined) {
        requirementValue = activity.requirements[level][key]!;
      }
      if (this.characterService.characterState.attributes[key].value <= requirementValue) {
        return false;
      }
    }
    return true;
  }

  checkRequirements(squelchLogs: boolean): void {
    for (const activity of this.activities){
      if (!activity.unlocked && this.meetsRequirements(activity)){
        activity.unlocked = true;
        if (!squelchLogs){
          this.logService.addLogMessage("A new activity is available. Maybe you should try " + activity.name[activity.level] + ".", "STANDARD", "EVENT");
        }
      }
    }
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      if (!this.getActivityByType(this.activityLoop[i].activity).unlocked) {
        this.activityLoop.splice(i, 1);
      }
    }
  }

  upgradeActivities(squelchLogs: boolean): void {
    for (const activity of this.activities){
      if (activity.level < (activity.description.length - 1)){
        if (this.meetsRequirementsByLevel(activity, (activity.level + 1), false)){
          if (!squelchLogs && activity.unlocked){
            this.logService.addLogMessage("Congratulations on your promotion! " + activity.name[activity.level] + " upgraded to " + activity.name[activity.level + 1], "STANDARD", "EVENT");
          }
          activity.level++;
          // check to see if we got above apprenticeship skip level
          if (activity.unlocked && activity.skipApprenticeshipLevel === activity.level){
            if (!this.completedApprenticeships.includes(activity.activityType)){
              this.completedApprenticeships.push(activity.activityType);
            }
          }
        }
      }
    }
  }

  reset(): void {
    // downgrade all activities to base level
    this.openApprenticeships = 1;
    this.currentApprenticeship = ActivityType.Resting;
    this.oddJobDays = 0;
    this.beggingDays = 0;
    for (const activity of this.activities){
      activity.level = 0;
      activity.unlocked = false;
    }
    for (let i = 0; i < 5; i++){
      // upgrade to anything that the starting attributes allow
      this.upgradeActivities(true);
    }
    if (this.impossibleTaskService.activeTaskIndex !== ImpossibleTaskType.Swim){
      this.getActivityByType(ActivityType.Resting).unlocked = true;
      this.getActivityByType(ActivityType.OddJobs).unlocked = true;
    }
    if (this.autoRestart){
      this.checkRequirements(true);
      if (this.pauseOnDeath && !this.characterService.characterState.immortal){
        this.mainLoopService.pause = true;
      }
    } else {
      this.activityLoop = [];
    }
    this.currentTickCount = 0;
    this.currentIndex = 0;
  }

  getActivityByType(activityType: ActivityType): Activity {
    for (const activity of this.activities) {
      if (activity.activityType === activityType) {
        return activity;
      }
    }
    return this.activities[0]; // we can't find the right activity in the activities, so just return the first one.
  }

  checkApprenticeship(activityType: ActivityType){
    if (this.openApprenticeships === 0){
      return;
    }
    this.openApprenticeships--;
    this.currentApprenticeship = activityType;
    for (const activity of this.activities) {
      if (activity.activityType !== activityType && activity.level < activity.skipApprenticeshipLevel) {
        // relock all other apprentice activities
        activity.unlocked = false;
        // and remove any entries for them from the activity loop
        for (let i = this.activityLoop.length - 1; i >= 0; i--){
          if (this.activityLoop[i].activity === activity.activityType){
            this.activityLoop.splice(i, 1);
          }
        }
      }
    }
  }

  reloadActivities(){
    this.activities = this.getActivityList();
    for (let i = this.activityLoop.length - 1; i >= 0; i--){
      let found = false;
      for (const activity of this.activities){
        if (activity.activityType === this.activityLoop[i].activity){
          found = true;
        }
      }
      if (!found){
        // the activity isn't available now, remove it
        this.activityLoop.splice(i, 1);
      }
    }
    this.spiritActivity = null;
    for (let i = 0; i < 5; i++){
      // upgrade to anything that the current attributes allow
      this.upgradeActivities(true);
    }
    this.checkRequirements(true);
  }

  saveActivityLoop(){
    this.savedActivityLoop = JSON.parse(JSON.stringify(this.activityLoop));
  }

  loadActivityLoop(){
    this.activityLoop = JSON.parse(JSON.stringify(this.savedActivityLoop));
    this.checkRequirements(true);
  }


  getActivityList(): Activity[] {
    const newList: Activity[] = [];
    this.activityHeader = "";
    this.activityHeaderDescription = "";
    if (this.impossibleTaskService.activeTaskIndex >= 0){
      this.activityHeader = "Do the impossible: " + this.impossibleTaskService.tasks[this.impossibleTaskService.activeTaskIndex].name;
      this.activityHeaderDescription = this.impossibleTaskService.tasks[this.impossibleTaskService.activeTaskIndex].description;
    }

    if (!this.hellService){
      this.hellService = this.injector.get(HellService);
    }
    if (this.hellService.inHell){
      return this.hellService.getActivityList();
    }


    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.Swim){

      newList.push(this.Swim);
      // don't include the rest of the activities
      return newList;
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.RaiseIsland){
      newList.push(this.ForgeChains);
      newList.push(this.AttachChains);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.BuildTower){
      newList.push(this.MakeBrick);
      newList.push(this.MakeMortar);
      newList.push(this.MakeScaffold);
      newList.push(this.BuildTower);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.TameWinds){
      newList.push(this.ResearchWind);
      newList.push(this.TameWinds);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.LearnToFly){
      newList.push(this.LearnToFly);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.BefriendDragon){
      newList.push(this.OfferDragonFood);
      newList.push(this.OfferDragonWealth);
      newList.push(this.TalkToDragon);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.ConquerTheWorld){
      newList.push(this.GatherArmies);
      newList.push(this.ConquerTheWorld);
    }

    if (this.impossibleTaskService.activeTaskIndex === ImpossibleTaskType.RearrangeTheStars){
      newList.push(this.MoveStars);
    }

    newList.push(this.Resting);
    newList.push(this.OddJobs);
    newList.push(this.Begging);
    newList.push(this.Burning);
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
    if(this.characterService.characterState.manaUnlocked || this.characterService.characterState.easyMode){
      newList.push(this.ManaControl);
      newList.push(this.CoreCultivation);
      newList.push(this.InfuseEquipment);
      newList.push(this.InfuseBody);
      newList.push(this.ExtendLife);
    }
    newList.push(this.Recruiting);
    newList.push(this.TrainingFollowers);
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
  ManaControl: Activity;
  // @ts-ignore
  BodyCultivation: Activity;
  // @ts-ignore
  MindCultivation: Activity;
  // @ts-ignore
  CoreCultivation: Activity;
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


  defineActivities(){
    this.Swim = {
      level: 0,
      name: ['Swim Deeper'],
      activityType: ActivityType.Swim,
      description: ['Swim down further into the depths.'],
      consequenceDescription: ['Uses 20 Stamina. Reduce health by 100.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.status.health.value -= 100;
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].complete){
          this.logService.addLogMessage("Your preparations were worthwhile! You dove all the way to the bottom of the ocean, through a hidden tunnel that led impossibly deep, and found a mythical sunken island.","STANDARD","STORY");
        }
      }],
      resourceUse: [{
        stamina: 20
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.ForgeChains = {
      level: 0,
      name: ['Forge Unbreakable Chain'],
      activityType: ActivityType.ForgeChains,
      description: ['Forge a chain strong enough to pull the island from the depths.'],
      consequenceDescription: ['Uses 100 Stamina. If you have the right facilities, materials, and knowledge you might be able to create an unbreakable chain.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        const metalValue = this.inventoryService.consume('metal');
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "anvil" && metalValue >= 150 && this.characterService.characterState.attributes.metalLore.value >= 1e9){
          if (Math.random() < 0.1){
            this.logService.addLogMessage("Your anvil gives off an ear-splitting ringing and echoes endlessly into the depths. The new chain glows with power!","STANDARD","CRAFTING");
            this.inventoryService.addItem(this.itemRepoService.items['unbreakableChain']);
          } else {
            this.logService.addLogMessage("Your anvil rings and weakly echoes into the depths. You throw aside the useless dull chain.","STANDARD","CRAFTING");
          }
        } else if (this.characterService.characterState.attributes.metalLore.value < 1e9){
          this.logService.addLogMessage("You lack the necessary knowledge and cause a deadly explosion.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.6;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        } else {
          this.logService.addLogMessage("You fumble with the wrong tools and materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.AttachChains ={
      level: 0,
      name: ['Attach Chains to the Island'],
      activityType: ActivityType.AttachChains,
      description: ['Swim deep and attach one of your chains to the island, then pull.'],
      consequenceDescription: ['Uses 1000000 Stamina. These chains are really, REALLY heavy. You better plan on having an Unbreakable Chain and a good place to rest afterwards.'],
      consequence: [() => {
        if (this.characterService.characterState.status.stamina.value >= 1000000 && this.inventoryService.consume("chain") > 0 ){
          this.characterService.characterState.status.stamina.value -= 1000000;
          this.logService.addLogMessage("You attach a chain to the island, and give your chains a long, strenuous tug.","STANDARD","EVENT");
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].complete){
            this.logService.addLogMessage("With a mighty pull of 777 chains, the island comes loose. You haul it to the surface.","STANDARD","STORY");
          }
        } else if (this.inventoryService.consume("chain", 0)){
          this.logService.addLogMessage("You strain yourself trying to lug the chain to an anchor point and collapse.","INJURY","EVENT");
          this.characterService.characterState.status.stamina.value -= 1000000;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        } else {
          this.logService.addLogMessage("You pass time exploring the hidden tunnels without a chain until a horror of the depths takes a nibble.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 1000000
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.MakeBrick = {
      level: 0,
      name: ['Create an Everlasting Brick'],
      activityType: ActivityType.MakeBrick,
      description: ['Create bricks sturdy enough to support the weight of your tower.'],
      consequenceDescription: ['Uses 100 Stamina. If you have the right followers and materials you will create some everlasting bricks.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let oreValue = 0;
        let builderPower = 10; //divided by 10 later
        oreValue = this.inventoryService.consume('ore', 200);
        for (const follower of this.followerService.followers){
          if (follower.job === "builder"){
            builderPower += follower.power;
          }
        }
        builderPower = Math.floor(builderPower /10);
        if (oreValue >= 10){
          this.inventoryService.addItem(this.itemRepoService.items['everlastingBrick'], builderPower);
          this.logService.addLogMessage("You and your followers made " + (1 + builderPower) + " " + this.itemRepoService.items['everlastingBrick'].name,"STANDARD","CRAFTING");

        } else {
          this.logService.addLogMessage("You fumble with the wrong materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.MakeScaffold = {
      level: 0,
      name: ['Build Scaffolding'],
      activityType: ActivityType.MakeScaffold,
      description: ['Set up the scaffolding for the next level of your tower.'],
      consequenceDescription: ['Uses 1000 Stamina. If you have the right materials you might succeed in setting up the scaffolding for the next level.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        let woodValue = 0;
        woodValue = this.inventoryService.consume('wood', 200);
        if (woodValue >= 11){
          this.inventoryService.addItem(this.itemRepoService.items['scaffolding']);
          this.logService.addLogMessage("You made " + this.itemRepoService.items['scaffolding'].name,"STANDARD","CRAFTING");
        } else {
          this.logService.addLogMessage("You fumble with the wrong materials, hurt yourself, and break your weak attempt at scaffolding.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 1000
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.MakeMortar = {
      level: 0,
      name: ['Mix Everlasting Mortar'],
      activityType: ActivityType.MakeMortar,
      description: ['Mix mortar powerful enough to hold your mighty tower together.'],
      consequenceDescription: ['Uses 100 Stamina. If you have the right followers, facilities, and materials you might succeed in mixing some proper mortar.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let oreValue = 0;
        let builderPower = 100; //divided by 100 later
        for (const follower of this.followerService.followers){
          if (follower.job === "builder"){
            builderPower += follower.power;
          }
        }
        builderPower = Math.floor(builderPower / 100);
        oreValue = this.inventoryService.consume('ore');
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "cauldron" && oreValue >= 10){
          this.inventoryService.addItem(this.itemRepoService.items['everlastingMortar'], builderPower);
          this.logService.addLogMessage("You and your followers made " + (1 + builderPower) + " " + this.itemRepoService.items['everlastingMortar'].name,"STANDARD","CRAFTING");
        } else {
          this.logService.addLogMessage("You fumble with the wrong materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.BuildTower = {
      level: 0,
      name: ['Build the Next Level'],
      activityType: ActivityType.BuildTower,
      description: ['Assemble 1000 bricks, 100 barrels of mortar, and your scaffolding to construct the next level of your tower. You will need a lot of expert help for this.'],
      consequenceDescription: ['Uses 1000 Stamina. If you have the right followers and materials you will build the next level.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        let numBuilders = 0;
        for (const follower of this.followerService.followers){
          if (follower.job === "builder"){
            numBuilders++;
          }
        }
        if (numBuilders < 10){
          this.logService.addLogMessage("You fumble without the proper help and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        let value = 0;
        value = this.inventoryService.consume('scaffolding');
        if (value < 1){
          this.logService.addLogMessage("You try building without a scaffolding, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        value = 0;
        value = this.inventoryService.consume('mortar', 100);
        if (value < 1){
          this.logService.addLogMessage("You try building without enough mortar, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        value = 0;
        value = this.inventoryService.consume('brick', 1000);
        if (value < 1){
          this.logService.addLogMessage("You try building without enough bricks, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].complete){
          this.logService.addLogMessage("You have acheived the impossible and built a tower beyond the heavens.","STANDARD","STORY");
        }
      }],
      resourceUse: [{
        stamina: 1000
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.ResearchWind = {
      level: 0,
      name: ['Research Wind Control'],
      activityType: ActivityType.ResearchWind,
      description: ['Delve deep into wind lore to understand how the neverending storm can be controlled.'],
      consequenceDescription: ['Uses 100 Stamina and Mana. Compile your research and if you have done enough you may produce a Tome of Wind Control.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.status.mana.value -= 100;
        if (this.characterService.characterState.status.stamina.value < 0 || this.characterService.characterState.status.mana.value < 0){
          this.logService.addLogMessage("You try to research, but you just don't have the energy.","STANDARD","EVENT");
          return;
        }
        if (this.characterService.characterState.status.stamina.value >= 0 && this.characterService.characterState.status.mana.value >= 0){
          if (Math.random() < 0.01){
            this.logService.addLogMessage("Research breakthrough! You produce a tome!.","STANDARD","CRAFTING");
            this.inventoryService.addItem(this.itemRepoService.items['windTome']);
          }
        }
      }],
      resourceUse: [{
        stamina: 100,
        mana: 100
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.TameWinds = {
      level: 0,
      name: ['Tame Winds'],
      activityType: ActivityType.TameWinds,
      description: ['Use your research to tame the winds.'],
      consequenceDescription: ['Uses 100 Stamina. Use a Tome of Wind Control to tame the hurricane.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let value = 0;
        value = this.inventoryService.consume('windTome');
        if (value > 0){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.TameWinds].complete){
            this.logService.addLogMessage("You acheived the impossible and tamed a hurricane.","STANDARD","STORY");
          }
        } else {
          this.logService.addLogMessage("You try to tame the winds, but without the proper preparation you are blown off the top of the tower.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.5;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
        }
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.LearnToFly = {
      level: 0,
      name: ['Learn To Fly'],
      activityType: ActivityType.LearnToFly,
      description: ['Jump off your tower and practice flying. This will definitely go well for you.'],
      consequenceDescription: ['You will certainly, probably, maybe not die doing this.'],
      consequence: [() => {
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress++;
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 2222){
          this.logService.addLogMessage("Jumping off an impossibly tall tower ends about like you might expect. Your wounds may take a bit to heal, but at least you learned something.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
        } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 4444){
          this.logService.addLogMessage("You feel like you might have flown a litte bit, somewhere near the time you hit the ground.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 500;
        } else if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].progress < 6666){
          this.logService.addLogMessage("You definitely did better that time. You did some great flying but sticking the landing is still tricky.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 100;
        } else {
          this.logService.addLogMessage("Almost there! Perfect landings are so hard.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 10;
        }
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.LearnToFly].complete){
          this.logService.addLogMessage("You mastered flight! You can go anywhere in the world now, even where the ancient dragons live.","STANDARD","STORY");
        }
      }],
      resourceUse: [{
        health: 1001
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.OfferDragonFood = {
      level: 0,
      name: ['Offer Food'],
      activityType: ActivityType.OfferDragonFood,
      description: ['It turns out that dragons love peaches. Bring the dragon a bunch and he may be more friendly.'],
      consequenceDescription: ['You will need at least 1000 food for this to work.'],
      consequence: [() => {
        let value = 0;
        value = this.inventoryService.consume('food', 1000);
        if (value < 1){
          this.logService.addLogMessage("The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 2000){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
        } else {
          this.logService.addLogMessage("The dragon doesn't seem interested in any more food.","STANDARD","EVENT");
        }
      }],
      resourceUse: [{
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.OfferDragonWealth = {
      level: 0,
      name: ['Offer Wealth'],
      activityType: ActivityType.OfferDragonWealth,
      description: ['You have heard that dragons like treasure. Bring the dragon a bunch and he may be more friendly.'],
      consequenceDescription: ['You will need at least a billion taels for this to work.'],
      consequence: [() => {
        if (this.characterService.characterState.money < 1e9){
          this.logService.addLogMessage("The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.characterService.characterState.money -= 1e9;
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 4000){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
        } else {
          this.logService.addLogMessage("The dragon doesn't seem interested in any more money.","STANDARD","EVENT");
        }
      }],
      resourceUse: [{
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.TalkToDragon = {
      level: 0,
      name: ['Talk to the Dragon'],
      activityType: ActivityType.TalkToDragon,
      description: ['Try to strike up a conversation with the dragon.'],
      consequenceDescription: ['The dragon probably likes you enough to talk to you now, right?'],
      consequence: [() => {
        if (this.characterService.characterState.attributes.charisma.value < 1e10){
          this.logService.addLogMessage("The dragon doesn't like the sound of your voice and takes a bite out of you. Maybe you should practice speaking with humans first.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 3500){
          this.logService.addLogMessage("The dragon doesn't like like you enough to talk to you, but at least he doesn't attack you.","STANDARD","EVENT");
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].complete){
          this.logService.addLogMessage("You did the impossible and made friends with a dragon!","STANDARD","STORY");
        }
      }],
      resourceUse: [{
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.GatherArmies = {
      level: 0,
      name: ['Gather Armies'],
      activityType: ActivityType.GatherArmies,
      description: ['Gather troops into armies. This will require vast amounts of food and money.'],
      consequenceDescription: ["You rule a country by now, right? If not, this isn't going to go well."],
      consequence: [() => {
        if (this.homeService.homeValue < HomeType.Capital){
          this.logService.addLogMessage("You don't even have your own kingdom? What were you thinking? The nearby rulers send their forces against you.","INJURY","EVENT");
          for (let i = 0; i < 3; i++){
            this.battleService.addEnemy(this.battleService.enemyRepo.army);
          }
          return;
        }
        let value = 0;
        value = this.inventoryService.consume('food', 10000);
        if (value < 1){
          this.logService.addLogMessage("You don't have enough food to feed your army, so they revolt and fight you instead.","INJURY","EVENT");
          this.battleService.addEnemy(this.battleService.enemyRepo.army);
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        if (this.characterService.characterState.money < 1e10){
          this.logService.addLogMessage("You don't have enough money to pay your army, so they revolt and fight you instead.","INJURY","EVENT");
          this.battleService.addEnemy(this.battleService.enemyRepo.army);
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.characterService.characterState.money -= 1e10;
        this.inventoryService.addItem(this.itemRepoService.items['army']);
      }],
      resourceUse: [{
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.ConquerTheWorld = {
      level: 0,
      name: ['Conquer More Territory'],
      activityType: ActivityType.ConquerTheWorld,
      description: ['Send out your armies to conquer the world.'],
      consequenceDescription: ["I'm sure you have plenty of armies for this. You wouldn't try this without enough armies, that would end badly."],
      consequence: [() => {
        let value = 0;
        value = this.inventoryService.consume('army', this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress + 1);
        if (value < 1){
          for (let i = 0; i < 5; i++){
            this.battleService.addEnemy(this.battleService.enemyRepo.army);
          }
          this.logService.addLogMessage("Your armies failed you and you are forced to fight the enemy armies to a standstill.","STANDARD","EVENT");
          if (this.pauseOnImpossibleFail){
            this.mainLoopService.pause = true;
          }
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].complete){
          this.logService.addLogMessage("You did the impossible and conquered the world! Under your wise rule all human suffering ceases.","STANDARD","STORY");
        }
      }],
      resourceUse: [{
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.MoveStars = {
      level: 0,
      name: ['Move Stars'],
      activityType: ActivityType.MoveStars,
      description: ['Extend your vast magical powers into the heavens and force the starts into alignment.'],
      consequenceDescription: ["Uses 1000 Stamina and Mana."],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        this.characterService.characterState.status.mana.value -= 1000;
        if (this.characterService.characterState.status.stamina.value >= 0 && this.characterService.characterState.status.mana.value >= 0){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.RearrangeTheStars].progress++;
          this.impossibleTaskService.checkCompletion();
          if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.RearrangeTheStars].complete){
            this.logService.addLogMessage("You did the impossible and rearranged the stars themselves. You are so near to achieving immortality you can almost taste it. It tastes like peaches.","STANDARD","STORY");
          }
        }
      }],
      resourceUse: [{
        stamina: 1000,
        mana: 1000
      }],
      requirements: [{
      }],
      unlocked: true,
      skipApprenticeshipLevel: 0
    }

    this.OddJobs = {
      level: 0,
      name: ['Odd Jobs'],
      activityType: ActivityType.OddJobs,
      description:
        ['Run errands, pull weeds, clean toilet pits, or do whatever else you can to earn a coin. Undignified work for a future immortal, but you have to eat to live.'],
      consequenceDescription:
        ['Uses 5 Stamina. Increases all your basic attributes by a small amount and provides a little money.'],
      consequence: [() => {
        this.characterService.characterState.increaseAttribute('strength', 0.02);
        this.characterService.characterState.increaseAttribute('toughness', 0.02);
        this.characterService.characterState.increaseAttribute('speed', 0.02);
        this.characterService.characterState.increaseAttribute('intelligence', 0.02);
        this.characterService.characterState.increaseAttribute('charisma', 0.02);
        this.characterService.characterState.status.stamina.value -= 5;
        this.characterService.characterState.money += 3;
        this.getActivityByType(ActivityType.OddJobs).lastIncome = 3;
        this.oddJobDays++;
      }],
      resourceUse: [{
        stamina: 5
      }],
      requirements: [{}],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.Resting = {
      level: 0,
      name: ['Resting', 'Meditation', 'Communing With Divinity'],
      activityType: ActivityType.Resting,
      description:['Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
        'Enter a meditative state and begin your journey toward spritual enlightenment.',
        'Extend your senses beyond the mortal realm and connect to deeper realities.'],
      consequenceDescription: ['Restores 50 Stamina and 2 Health.',
        'Restores 100 Stamina, 10 Health, and 1 Mana (if unlocked).',
        'Restores 200 Stamina, 20 Health, and 10 Mana (if unlocked).'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value += 50;
          this.characterService.characterState.status.health.value += 2;
          this.characterService.characterState.checkOverage();
        },
        () => {
          this.characterService.characterState.status.stamina.value += 100;
          this.characterService.characterState.status.health.value += 10;
          this.characterService.characterState.increaseAttribute('spirituality', 0.001);
          if (this.characterService.characterState.manaUnlocked){
            this.characterService.characterState.status.mana.value += 1;
          }
          this.characterService.characterState.checkOverage();
        },
        () => {
          this.characterService.characterState.status.stamina.value += 200;
          this.characterService.characterState.status.health.value += 20;
          this.characterService.characterState.status.mana.value += 10
          this.characterService.characterState.increaseAttribute('spirituality', 0.5);
          this.characterService.characterState.checkOverage();
        }
      ],
      resourceUse: [
        {},
        {},
        {}
      ],
      requirements: [
        {},
        {
          strength: 1000,
          speed: 1000,
          charisma: 1000,
          intelligence: 1000,
          toughness: 1000
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
        }
      ],
      unlocked: true,
      skipApprenticeshipLevel: 0
    };

    this.Begging = {
      level: 0,
      name: ['Begging', 'Street Performing', 'Oration', 'Politics'],
      activityType: ActivityType.Begging,
      description:[
        'Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.',
        'Add some musical flair to your begging.',
        'Move the crowds with your stirring speeches.',
        'Charm your way into civic leadership.',
      ],
      consequenceDescription:[
        'Uses 5 Stamina. Increases charisma and provides a little money.',
        'Uses 5 Stamina. Increases charisma and provides some money.',
        'Uses 5 Stamina. Increases charisma and provides money.',
        'Uses 5 Stamina. Increases charisma, provides money, and makes you wonder what more you can gain from immersing yourself in mortal practices.'
      ],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 3 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
        },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.2);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 10 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.3);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 20 + Math.log2(this.characterService.characterState.attributes.charisma.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.5);
          this.characterService.characterState.status.stamina.value -= 5;
          const money = 30 + Math.log2(this.characterService.characterState.attributes.charisma.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          }
      ],
      resourceUse: [
        {
          stamina: 5
        },
        {
          stamina: 5
        },
        {
          stamina: 5
        },
        {
          stamina: 5
        }
      ],
      requirements: [
        {
          charisma: 3
        },
        {
          charisma: 100
        },
        {
          charisma: 5000
        },
        {
          charisma: 10000
        }
      ],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };


    this.Blacksmithing = {
      level: 0,
      name: ['Apprentice Blacksmithing', 'Journeyman Blacksmithing', 'Blacksmithing', 'Master Blacksmithing'],
      activityType: ActivityType.Blacksmithing,
      description:[
        "Work for the local blacksmith. You mostly pump the bellows, but at least you're learning a trade.",
        'Mold metal into useful things. You might even produce something you want to keep now and then.',
        'Create useful and beautiful metal objects. You might produce a decent weapon occasionally.',
        'Work the forges like a true master.',
      ],
      consequenceDescription:[
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
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.metalLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.1 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            this.inventoryService.addItem(this.itemRepoService.items['junk']);
          }
        },
        // grade 1
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength',0.2);
          this.characterService.characterState.increaseAttribute('toughness',0.2);
          this.characterService.characterState.status.stamina.value -= 25;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.metalLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.02;
          if (this.homeService.furniture.workbench?.id === "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore', 0.2 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.02 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                    (grade / 10) + Math.floor(Math.log2(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
              }
            }
          }
        },
        // grade 2
        () => {
          this.characterService.characterState.increaseAttribute('strength',0.5);
          this.characterService.characterState.increaseAttribute('toughness',0.5);
          this.characterService.characterState.status.stamina.value -= 25;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.fireLore.value +
            (this.characterService.characterState.attributes.metalLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.05;
          if (this.homeService.furniture.workbench?.id === "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('metalLore',0.3 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.05 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade / 10) + Math.floor(Math.log2(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
              }
            }
          }
        },
        // grade 3
        () => {
          this.characterService.characterState.increaseAttribute('strength', 1);
          this.characterService.characterState.increaseAttribute('toughness', 1);
          this.characterService.characterState.status.stamina.value -= 50;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.fireLore.value +
            (this.characterService.characterState.attributes.metalLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.2;
          if (this.homeService.furniture.workbench?.id === "anvil"){
            blacksmithSuccessChance += 0.2;
          }
          this.characterService.characterState.increaseAttribute('metalLore',0.5 * blacksmithSuccessChance);
          this.characterService.characterState.increaseAttribute('fireLore', 0.1 * blacksmithSuccessChance);
          if (Math.random() < blacksmithSuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade / 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
              }
            }
          }
          if (Math.random() < 0.001){
            this.inventoryService.addItem(this.itemRepoService.items['pillMold']);
          }
        }
      ],
      resourceUse: [
        {
          stamina: 25
        },
        {
          stamina: 25
        },
        {
          stamina: 25
        },
        {
          stamina: 50
        }
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
          fireLore: 1
        },
        {
          strength: 10000,
          toughness: 10000,
          metalLore: 100,
          fireLore: 10
        }
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2
    };

    this.GatherHerbs = {
      level: 0,
      name: ['Gathering Herbs'],
      activityType: ActivityType.GatherHerbs,
      description: ['Search the natural world for useful herbs.'],
      consequenceDescription: ['Uses 10 Stamina. Find herbs and learn about plants'],
      consequence: [() => {
        this.characterService.characterState.increaseAttribute('intelligence',0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        this.characterService.characterState.status.stamina.value -= 10;
        // the grade on herbs probably needs diminishing returns
        this.inventoryService.generateHerb();
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === 'herbGarden'){
          this.inventoryService.generateHerb();
        }
        this.characterService.characterState.increaseAttribute('woodLore',0.003);
      }],
      resourceUse: [{
        stamina: 10
      }],
      requirements: [{
        speed: 20,
        intelligence: 20,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Alchemy = {
      level: 0,
      name: ['Apprentice Alchemy', 'Journeyman Alchemy', 'Alchemy', 'Master Alchemy'],
      activityType: ActivityType.Alchemy,
      description: [
        'Get a job at the alchemist\'s workshop. It smells awful but you might learn a few things.',
        'Get a cauldron and do a little brewing of your own.',
        'Open up your own alchemy shop.',
        'Brew power, precipitate life, stir in some magic, and create consumable miracles.',
      ],
      consequenceDescription: [
        'Uses 10 Stamina. Get smarter, make a few taels, and learn the secrets of alchemy.',
        'Uses 10 Stamina. Get smarter, make money, practice your craft. If you have some herbs, you might make a usable potion or pill.',
        'Uses 10 Stamina. Get smarter, make money, and make some decent potions or pills.',
        'Uses 20 Stamina. Create amazing potions and pills.'
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence',0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          const money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "cauldron"){
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore',0.05 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore',0.1 * alchemySuccessChance);
        },
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence',0.2);
          this.characterService.characterState.status.stamina.value -= 10;
          const money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 0.02;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "cauldron"){
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore',0.1 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore',0.2 * alchemySuccessChance);
          if (Math.random() < alchemySuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('ingredient');
              if (grade >= 1){ // if the ingredient was found
                grade += Math.floor(Math.log2(this.characterService.characterState.attributes.waterLore.value));
                this.inventoryService.generatePotion(grade, false);
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('intelligence',0.5);
          this.characterService.characterState.status.stamina.value -= 10;
          const money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 1 - Math.exp(0 - 0.025 * Math.log(this.characterService.characterState.attributes.waterLore.value));
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "cauldron"){
            alchemySuccessChance += 0.05;
          }
          this.characterService.characterState.increaseAttribute('woodLore',0.15 * alchemySuccessChance);
          this.characterService.characterState.increaseAttribute('waterLore',0.3 * alchemySuccessChance);
          if (Math.random() < alchemySuccessChance) {
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('ingredient');
              if (grade >= 1){ // if the ingredient was found
                grade += Math.floor(Math.log2(this.characterService.characterState.attributes.waterLore.value));
                this.inventoryService.generatePotion(grade + 1, false);
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('intelligence', 1);
          this.characterService.characterState.status.stamina.value -= 20;
          const money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore',0.2);
          this.characterService.characterState.increaseAttribute('waterLore',0.6);
          if (this.inventoryService.openInventorySlots() > 0){
            let grade = this.inventoryService.consume('ingredient');
            if (grade >= 1){ // if the ingredient was found
              grade += Math.floor(Math.log2(this.characterService.characterState.attributes.waterLore.value));
              this.inventoryService.generatePotion(grade + 1, true);
            }
          }
        }
      ],
      resourceUse: [
        {
          stamina: 10
        },
        {
          stamina: 10
        },
        {
          stamina: 10
        },
        {
          stamina: 20
        }
      ],
      requirements: [
        {
          intelligence: 200,
        },
        {
          intelligence: 1000,
          waterLore: 1
        },
        {
          intelligence: 8000,
          waterLore: 10,
          woodLore: 1
        },
        {
          intelligence: 100000,
          waterLore: 100,
          woodLore: 10
        }
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2
    };

    this.ChopWood = {
      level: 0,
      name: ['Chopping Wood'],
      activityType: ActivityType.ChopWood,
      description: ['Work as a woodcutter, cutting logs in the forest.'],
      consequenceDescription: ["Uses 10 Stamina. Get a log and learn about plants."],
      consequence: [() => {
        this.characterService.characterState.increaseAttribute('strength',0.1);
        this.characterService.characterState.status.stamina.value -= 10;
        this.inventoryService.addItem(this.inventoryService.getWood());
        this.characterService.characterState.increaseAttribute('woodLore',0.01);
      }],
      resourceUse: [{
        stamina: 10
      }],
      requirements: [{
        strength: 100,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Woodworking = {
      level: 0,
      name: ['Apprentice Woodworking', 'Journeyman Woodworking', 'Woodworking', 'Master Woodworking'],
      activityType: ActivityType.Woodworking,
      description: [
        'Work in a woodcarver\'s shop.',
        'Carve wood into useful items.',
        'Open your own woodworking shop.',
        'Carve pure poetry in wooden form.'
      ],
      consequenceDescription:[
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
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.woodLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore', 0.001);
        },
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength',0.2);
          this.characterService.characterState.increaseAttribute('intelligence',0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore',0.005);
          if (Math.random() < 0.02) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1){ // if the wood was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  grade + Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value)), 'wood'));
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('strength',0.5);
          this.characterService.characterState.increaseAttribute('intelligence',0.5);
          this.characterService.characterState.status.stamina.value -= 20;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore',0.02);
          if (Math.random() < 0.05) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1){ // if the wood was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade * 2) + Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value)), 'wood'));
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('strength', 1);
          this.characterService.characterState.increaseAttribute('intelligence', 1);
          this.characterService.characterState.status.stamina.value -= 40;
          const money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore',0.6);
          if (Math.random() < 0.2) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('wood');
              if (grade >= 1){ // if the wood was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade * 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value)), 'wood'));
              }
            }
          }
          if (Math.random() < 0.001){
            this.inventoryService.addItem(this.itemRepoService.items['pillBox']);
          }
        }
      ],
      resourceUse: [
        {
          stamina: 20
        },
        {
          stamina: 20
        },
        {
          stamina: 20
        },
        {
          stamina: 40
        }
      ],
      requirements: [
        {
          strength: 100,
          intelligence: 100
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
        }
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2
    };

    this.Leatherworking = {
      level: 0,
      name: ['Apprentice Leatherworking', 'Journeyman Leatherworking', 'Leatherworking', 'Master Leatherworking'],
      activityType: ActivityType.Leatherworking,
      description: [
        'Work in a tannery, where hides are turned into leather items.',
        'Convert hides into leather items.',
        'Open your own tannery.',
        'Fashion!'
      ],
      consequenceDescription:[
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
          const money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.animalHandling.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling', 0.001);
        },
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed',0.2);
          this.characterService.characterState.increaseAttribute('toughness',0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          const money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling',0.002);
          if (Math.random() < 0.01) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1){ // if the hide was found
                this.inventoryService.addItem(this.inventoryService.generateArmor(
                  grade + Math.floor(Math.log2(this.characterService.characterState.attributes.animalHandling.value)), 'leather',
                  this.inventoryService.randomArmorSlot()));
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('speed',0.5);
          this.characterService.characterState.increaseAttribute('toughness',0.5);
          this.characterService.characterState.status.stamina.value -= 20;
          const money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling',0.003);
          if (Math.random() < 0.01) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1){ // if the hide was found
                this.inventoryService.addItem(this.inventoryService.generateArmor(
                  (grade * 2) + Math.floor(Math.log2(this.characterService.characterState.attributes.animalHandling.value)), 'leather',
                  this.inventoryService.randomArmorSlot()));
              }
            }
          }
        },
        () => {
          this.characterService.characterState.increaseAttribute('speed',1);
          this.characterService.characterState.increaseAttribute('toughness',1);
          this.characterService.characterState.status.stamina.value -= 40;
          const money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          this.characterService.characterState.increaseAttribute('animalHandling',0.1);
          if (Math.random() < 0.2) {
            if (this.inventoryService.openInventorySlots() > 0){
              const grade = this.inventoryService.consume('hide');
              if (grade >= 1){ // if the hide was found
                this.inventoryService.addItem(this.inventoryService.generateArmor(
                  (grade * 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.animalHandling.value)), 'leather',
                  this.inventoryService.randomArmorSlot()));
              }
            }
          }
          if (Math.random() < 0.001){
            this.inventoryService.addItem(this.itemRepoService.items['pillPouch']);
          }
        }
      ],
      resourceUse: [
        {
          stamina: 20
        },
        {
          stamina: 20
        },
        {
          stamina: 20
        },
        {
          stamina: 40
        }
      ],
      requirements: [
        {
          speed: 100,
          toughness: 100
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
        }
      ],
      unlocked: false,
      skipApprenticeshipLevel: 2
    };

    this.Farming = {
      level: 0,
      name: ['Farming'],
      activityType: ActivityType.Farming,
      description:
        ['Plant crops in your fields. This is a waste of time if you don\'t have some fields ready to work.'],
      consequenceDescription:
        ['Uses 20 Stamina. Increases strength and speed and helps your fields to produce more food.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        let farmPower = Math.floor(Math.log10(this.characterService.characterState.attributes.woodLore.value + this.characterService.characterState.attributes.earthLore.value));
        if (farmPower < 1){
          farmPower = 1;
        }
        this.homeService.workFields(farmPower);
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        this.characterService.characterState.increaseAttribute('woodLore', 0.001);
        this.characterService.characterState.increaseAttribute('earthLore', 0.001);
    }],
      resourceUse: [{
        stamina: 20
      }],
      requirements: [{
        strength: 10,
        speed: 10
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Mining = {
      level: 0,
      name: ['Mining'],
      activityType: ActivityType.Mining,
      description: ['Dig in the ground for usable minerals.'],
      consequenceDescription: ['Uses 20 Stamina. Increases strength and sometimes finds something useful.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('earthLore', 0.05);
        if (Math.random() < 0.5) {
          this.inventoryService.addItem(this.inventoryService.getOre());
        }
      }],
      resourceUse: [{
        stamina: 20
      }],
      requirements: [{
        strength: 70
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Smelting = {
      level: 0,
      name: ['Smelting'],
      activityType: ActivityType.Smelting,
      description: ['Smelt metal ores into usable metal.'],
      consequenceDescription: ['Uses 20 Stamina. Increases toughness and intelligence. If you have metal ores, you can make them into bars.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
        this.characterService.characterState.increaseAttribute('intelligence', 0.1);
        this.characterService.characterState.increaseAttribute('metalLore', 0.01);
        if (this.inventoryService.openInventorySlots() > 0){
          const grade = this.inventoryService.consume("ore");
          if (grade >= 1){
            this.inventoryService.addItem(this.inventoryService.getBar(grade));
          }
        }
      }],
      resourceUse: [{
        stamina: 20
      }],
      requirements: [{
        toughness: 100,
        intelligence: 100
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

    this.Hunting = {
      level: 0,
      name: ['Hunting'],
      activityType: ActivityType.Hunting,
      description: ['Hunt for animals in the nearby woods.'],
      consequenceDescription: ['Uses 50 Stamina. Increases speed and a good hunt provides some meat. It might draw unwanted attention to yourself.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 50;
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        let huntingSuccessChance = 0.1;
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id === "dogKennel"){
          huntingSuccessChance += 0.4;
        }
        this.characterService.characterState.increaseAttribute('animalHandling', 0.1 * huntingSuccessChance);
        if (Math.random() < huntingSuccessChance) {
          this.inventoryService.addItem(this.itemRepoService.items['meat']);
          this.inventoryService.addItem(this.itemRepoService.items['hide']);
        }
        if (Math.random() < 0.01) {
          this.battleService.addEnemy(this.battleService.enemyRepo.wolf);
        }
      }],
      resourceUse: [{
        stamina: 50
      }],
      requirements: [{
        speed: 200
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Fishing = {
      level: 0,
      name: ['Fishing'],
      // cormorant fishing later!
      activityType: ActivityType.Fishing,
      description: ['Grab your net and see if you can catch some fish.'],
      consequenceDescription: ['Uses 30 Stamina. Increases intelligence and strength and you might catch a fish.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 30;
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('intelligence', 0.1);
        this.characterService.characterState.increaseAttribute('animalHandling', 0.02);
          this.characterService.characterState.increaseAttribute('waterLore', 0.01);
        if (Math.random() < 0.2) {
          this.inventoryService.addItem(this.itemRepoService.items['carp']);
        }
      }],
      resourceUse: [{
        stamina: 30
      }],
      requirements: [{
        strength: 15,
        intelligence: 15
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.Burning = {
      level: 0,
      name: ['Burning Things'],
      activityType: ActivityType.Burning,
      description: ['Light things on fire and watch them burn.'],
      consequenceDescription: ['Uses 5 Stamina. You will be charged for what you burn. Teaches you to love fire.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 5;
        const moneyCost = this.characterService.characterState.increaseAttribute('fireLore', 0.1);
        this.characterService.characterState.money -= moneyCost;
        if (this.characterService.characterState.money < 0){
          this.characterService.characterState.money = 0;
        }
      }],
      resourceUse: [{
        stamina: 5
      }],
      requirements: [{
        intelligence: 10
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.ManaControl = {
      level: 0,
      name: ['Balance Your Chi'],
      activityType: ActivityType.ManaControl,
      description: ['Balance the flow of your chi and widen your meridians.'],
      consequenceDescription: ['Uses 100 Stamina. Increases your weakest lore.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let lowStat = "earthLore" as AttributeType;
        for (const attribute of ["metalLore","woodLore","waterLore","fireLore"] as AttributeType[]){
          if (this.characterService.characterState.attributes[attribute].value < this.characterService.characterState.attributes[lowStat].value) {
            lowStat = attribute;
          }
        }
        this.characterService.characterState.increaseAttribute(lowStat, 0.1);
        this.characterService.characterState.increaseAttribute('spirituality', 0.001);
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
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
        spirituality: 1
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.BodyCultivation = {
      level: 0,
      name: ['Body Cultivation'],
      activityType: ActivityType.BodyCultivation,
      description: ['Focus on the development of your body. Unblock your meridians, let your chi flow, and prepare your body for immortality.'],
      consequenceDescription: ['Uses 100 Stamina. Increases your physical abilities and strengthen your aptitudes in them.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.increaseAttribute('strength', 1);
        this.characterService.characterState.increaseAttribute('speed', 1);
        this.characterService.characterState.increaseAttribute('toughness', 1);
        this.characterService.characterState.attributes.strength.aptitude += 0.1;
        this.characterService.characterState.attributes.speed.aptitude += 0.1;
        this.characterService.characterState.attributes.toughness.aptitude += 0.1;
        this.characterService.characterState.increaseAttribute('spirituality', 0.001);
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
        strength: 5000,
        speed: 5000,
        toughness: 5000,
        spirituality: 1
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.MindCultivation = {
      level: 0,
      name: ['Mind Cultivation'],
      activityType: ActivityType.MindCultivation,
      description: ['Focus on the development of your mind. Unblock your meridians, let your chi flow, and prepare your mind for immortality.'],
      consequenceDescription: ['Uses 100 Stamina. Increases your mental abilities and strengthen your aptitudes in them.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.increaseAttribute('intelligence', 1);
        this.characterService.characterState.increaseAttribute('charisma', 1);
        this.characterService.characterState.attributes.intelligence.aptitude += 0.1;
        this.characterService.characterState.attributes.charisma.aptitude += 0.1;
        this.characterService.characterState.increaseAttribute('spirituality', 0.001);
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
        charisma: 5000,
        intelligence: 5000,
        spirituality: 1
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.CoreCultivation = {
      level: 0,
      name: ['Core Cultivation'],
      activityType: ActivityType.CoreCultivation,
      description: ['Focus on the development of your soul core.'],
      consequenceDescription: ['Uses 200 Stamina. A very advanced cultivation technique. Make sure you have achieved a deep understanding of elemental balance before attempting this. Gives you a small chance of increasing your mana capabilities.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 200;
        if (this.characterService.characterState.manaUnlocked){
          if (Math.random() < 0.01){
            this.characterService.characterState.status.mana.max++;
            this.characterService.characterState.status.mana.value++;
          }
        }
      }],
      resourceUse: [{
        stamina: 200
      }],
      requirements: [{
        woodLore: 1000,
        waterLore: 1000,
        fireLore: 1000,
        metalLore: 1000,
        earthLore: 1000,
        spirituality: 1000
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.InfuseEquipment = {
      level: 0,
      name: ['Infuse Equipment'],
      activityType: ActivityType.InfuseEquipment,
      description: ['Infuse the power of a gem into your equipment.'],
      consequenceDescription: ['Uses 200 Stamina and 10 mana. An advanced magical technique.'],
      consequence: [() => {
        if (!this.characterService.characterState.manaUnlocked){
          return;
        }
        this.characterService.characterState.status.stamina.value -= 200;
        this.characterService.characterState.status.mana.value -= 10;
        const gemValue = this.inventoryService.consume('spiritGem');
        if (gemValue > 0 && this.characterService.characterState.status.mana.value >= 0){
          this.inventoryService.upgradeEquipment(Math.floor(Math.pow(gemValue/10,2.4)));
        }
      }],
      resourceUse: [{
        stamina: 200,
        mana: 10
      }],
      requirements: [{
        strength: 2e7,
        toughness: 2e7,
        speed: 2e7,
        spirituality: 10000
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.InfuseBody = {
      level: 0,
      name: ['Infuse Body'],
      activityType: ActivityType.InfuseBody,
      description: ['Direct your magical energy into reinforcing your physical body, making it healthier and more able to sustain damage without falling.'],
      consequenceDescription: ['Uses 10 Mana and 200 Stamina. Make sure you have enough magical power before attempting this.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 200;
        if (this.characterService.characterState.manaUnlocked && this.characterService.characterState.status.mana.value >= 10){
          this.characterService.characterState.status.mana.value -= 10;
          this.characterService.characterState.healthBonusMagic++;
        }
      }],
      resourceUse: [{
        stamina: 200,
        mana: 10
      }],
      requirements: [{
        woodLore: 1000,
        waterLore: 1000,
        fireLore: 1000,
        metalLore: 1000,
        earthLore: 1000,
        spirituality: 1000
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

    this.ExtendLife = {
      level: 0,
      name: ['Extending Life'],
      activityType: ActivityType.ExtendLife,
      description: ['Direct your magical energy into extending your lifespan, making you live longer.'],
      consequenceDescription: ['Uses 20 Mana and 400 Stamina. Make sure you have enough magical power before attempting this.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 400;
        if (this.characterService.characterState.manaUnlocked && this.characterService.characterState.status.mana.value >= 20){
          this.characterService.characterState.status.mana.value -= 20;
          if (this.characterService.characterState.magicLifespan < 36500){
            this.characterService.characterState.magicLifespan += 10;
          }
        }
      }],
      resourceUse: [{
        stamina: 400,
        mana: 20
      }],
      requirements: [{
        woodLore: 10000,
        waterLore: 10000,
        fireLore: 10000,
        metalLore: 10000,
        earthLore: 10000,
        spirituality: 10000
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

    this.Recruiting = {
      level: 0,
      name: ['Recruiting Followers'],
      activityType: ActivityType.Recruiting,
      description: ['Look for followers willing to serve you.'],
      consequenceDescription: ['Uses 100 Stamina and 1M taels. Gives you a small chance of finding a follower, if you are powerful enough to attract any.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.money -= 1000000;
        if (this.characterService.characterState.money < 0){
          this.characterService.characterState.money = 0;
          return;
        }
        if (this.followerService.followersUnlocked && this.characterService.characterState.money > 0){
          if (Math.random() < 0.01){
            this.followerService.generateFollower();
          }
        }
      }],
      resourceUse: [{
        stamina: 100
      }],
      requirements: [{
        charisma: 5e7,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

    this.TrainingFollowers = {
      level: 0,
      name: ['Training Followers'],
      activityType: ActivityType.TrainingFollowers,
      description: ['Train your followers to make them more powerful.'],
      consequenceDescription: ['Uses 1000 Stamina. Gives you a small chance for each follower of increasing their power. They might learn more if you are a better leader.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        if (this.followerService.followersUnlocked){
          let allMaxed = true;
          for (const follower of this.followerService.followers){
            if (follower.power >= 100) {
              follower.power = 100; // Set max level to 100
            } else {
              allMaxed = false;
              if (Math.random() < (1 - Math.pow(follower.power / 100, 0.55)) / (36500000 / (3650 + follower.age * Math.log2(this.characterService.characterState.attributes.charisma.value/1e10 + 1)))){ // Softcap the increase
                follower.power++;
                if (follower.power > this.followerService.highestLevel){
                  this.followerService.highestLevel = follower.power;
                }
                follower.cost = 100 * follower.power;
                this.logService.addLogMessage(follower.name + " gains additional power as a " + follower.job, "STANDARD", "FOLLOWER");
              }
            }
          }
          if (allMaxed){
            this.logService.addLogMessage("You try to train your followers, but they are all already as powerful as they can be. You pat them each on the back and tell them they are great.", "STANDARD", "FOLLOWER");
          }
        }
      }],
      resourceUse: [{
        stamina: 1000
      }],
      requirements: [{
        charisma: 1e10,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

  }
}
