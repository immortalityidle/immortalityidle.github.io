import { Injectable } from '@angular/core';
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

export interface ActivityProperties {
  autoRestart: boolean,
  pauseOnDeath: boolean,
  activityLoop: ActivityLoopEntry[],
  unlockedActivities: ActivityType[],
  openApprenticeships: number,
  spiritActivity: ActivityType | null,
  completedApprenticeships: ActivityType[];
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  spiritActivity: ActivityType | null = null;
  autoRestart: boolean = false;
  pauseOnDeath: boolean = true;
  activities: Activity[] = this.getActivityList();
  openApprenticeships: number = 1;
  oddJobDays: number = 0;
  beggingDays: number = 0;
  completedApprenticeships: ActivityType[] = [];
  currentIndex = 0;
  currentTickCount = 0;
  exhaustionDays = 0;
  currentLoopEntry?: ActivityLoopEntry = undefined;

  constructor(
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
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
    mainLoopService.tickSubject.subscribe(() => {
      if (this.activityLoop.length == 0){
        this.mainLoopService.pause = true;
        return;
      }
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.exhaustionDays > 0){
        this.exhaustionDays--;
        return;
      }

      if (this.currentIndex < this.activityLoop.length) {
        this.currentLoopEntry = this.activityLoop[this.currentIndex];
        // check if our current activity is zero-day
        if (this.currentLoopEntry.repeatTimes == 0){
          // don't do the activity, instead see if there's a next one we can switch to
          let index = 0;
          if (this.currentIndex < this.activityLoop.length - 1){
            index = this.currentIndex + 1;
          }
          while (index != this.currentIndex && this.activityLoop[index].repeatTimes == 0){
            index++;
            if (index >= this.activityLoop.length){
              index = 0;
            }
          }
          if (index == this.currentIndex){
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
        activity.consequence[activity.level]();

        // check for exhaustion
        if (this.characterService.characterState.status.stamina.value < 0) {
          // take 5 days to recover, regain stamina, restart loop
          this.logService.addLogMessage('You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.', 'INJURY', 'EVENT');
          this.exhaustionDays = 5;
          this.characterService.characterState.status.stamina.value = this.characterService.characterState.status.stamina.max;
        }
        // check for mana overuse
        if (this.characterService.characterState.status.mana.value < 0) {
          this.logService.addLogMessage('You overextend your mana and damage your mana channels. It takes you 10 days to recover.','INJURY', 'EVENT');
          if (this.characterService.characterState.status.mana.max > 1){
            this.characterService.characterState.status.mana.max -= 1;
          }
          this.exhaustionDays = 10;
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
        activity.consequence[activity.level]();
        this.characterService.characterState.status.mana.value -= 5;
      }
    });
    mainLoopService.longTickSubject.subscribe(() => {
      this.upgradeActivities();
      this.checkRequirements();
    });

  }

  getProperties(): ActivityProperties{
    let unlockedActivities: ActivityType[] = [];
    for (const activity of this.activities){
      if (activity.unlocked){
        unlockedActivities.push(activity.activityType);
      }
    }
    return {
      autoRestart: this.autoRestart,
      pauseOnDeath: this.pauseOnDeath,
      activityLoop: this.activityLoop,
      unlockedActivities: unlockedActivities,
      openApprenticeships: this.openApprenticeships,
      spiritActivity: this.spiritActivity,
      completedApprenticeships: this.completedApprenticeships
    }
  }

  setProperties(properties: ActivityProperties){
    this.completedApprenticeships = properties.completedApprenticeships || [];
    let unlockedActivities = properties.unlockedActivities || [ActivityType.OddJobs, ActivityType.Resting];
    for (const activity of this.activities){
        activity.unlocked = unlockedActivities.includes(activity.activityType);
    }
    this.autoRestart = properties.autoRestart;
    this.pauseOnDeath = properties.pauseOnDeath;
    this.activityLoop = properties.activityLoop;
    this.spiritActivity = properties.spiritActivity || null;
    this.openApprenticeships = properties.openApprenticeships || 0;
  }

  meetsRequirements(activity: Activity): boolean {
    if (this.meetsRequirementsByLevel(activity, activity.level, true)){
      activity.unlocked = true;
      return true;
    }
    return false;
  }

  meetsRequirementsByLevel(activity: Activity, level: number, apprenticeCheck: boolean): boolean {
    if (apprenticeCheck && !activity.unlocked && this.openApprenticeships <= 0){
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
      if (activity.requirements[level][key] != undefined) {
        requirementValue = activity.requirements[level][key]!;
      }
      if (this.characterService.characterState.attributes[key].value <= requirementValue) {
        return false;
      }
    }
    return true;
  }

  checkRequirements(): void {
    for (let activity of this.activities){
      if (!activity.unlocked && this.meetsRequirements(activity)){
        activity.unlocked = true;
      }
    }
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      if (!this.getActivityByType(this.activityLoop[i].activity).unlocked) {
        this.activityLoop.splice(i, 1);
      }
    }
  }

  upgradeActivities(): void {
    for (const activity of this.activities){
      if (activity.level < (activity.description.length - 1)){
        if (this.meetsRequirementsByLevel(activity, (activity.level + 1), false)){
          activity.level++;
          // check to see if we got above apprenticeship skip level
          if (activity.unlocked && activity.skipApprenticeshipLevel == activity.level){
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
    this.oddJobDays = 0;
    this.beggingDays = 0;
    for (const activity of this.activities){
      activity.level = 0;
      activity.unlocked = false;
    }
    for (let i = 0; i < 5; i++){
      // upgrade to anything that the starting attributes allow
      this.upgradeActivities();
    }
    if (this.impossibleTaskService.activeTaskIndex != ImpossibleTaskType.Swim){
      this.getActivityByType(ActivityType.Resting).unlocked = true;
      this.getActivityByType(ActivityType.OddJobs).unlocked = true;
    }
    if (this.autoRestart){
      this.checkRequirements();
      if (this.pauseOnDeath){
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
    throw Error('Could not find activity from type');
  }

  checkApprenticeship(activityType: ActivityType){
    if (this.openApprenticeships == 0){
      return;
    }
    this.openApprenticeships--;
    for (const activity of this.activities) {
      if (activity.activityType !== activityType && activity.level < activity.skipApprenticeshipLevel) {
        // relock all other apprentice activities
        activity.unlocked = false;
        // and remove any entries for them from the activity loop
        for (let i = this.activityLoop.length - 1; i >= 0; i--){
          if (this.activityLoop[i].activity == activity.activityType){
            this.activityLoop.splice(i, 1);
          }
        }
      }
    }
  }

  reloadActivities(){
    this.activityLoop = [];
    this.spiritActivity = null;
    this.activities = this.getActivityList();

  }

  getActivityList(): Activity[] {
    this.defineActivities();

    let newList: Activity[] = [];

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.Swim){
      newList.push(this.Swim);
      // don't include the rest of the activities
      return newList;
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.RaiseIsland){
      newList.push(this.ForgeChains);
      newList.push(this.AttachChains);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.BuildTower){
      newList.push(this.MakeBrick);
      newList.push(this.MakeMortar);
      newList.push(this.MakeScaffold);
      newList.push(this.BuildTower);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.TameWinds){
      newList.push(this.ResearchWind);
      newList.push(this.TameWinds);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.LearnToFly){
      newList.push(this.LearnToFly);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.BefriendDragon){
      newList.push(this.OfferDragonFood);
      newList.push(this.OfferDragonWealth);
      newList.push(this.TalkToDragon);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.ConquerTheWorld){
      newList.push(this.GatherArmies);
      newList.push(this.ConquerTheWorld);
    }

    if (this.impossibleTaskService.activeTaskIndex == ImpossibleTaskType.RearrangeTheStars){
      newList.push(this.MoveStars);
    }

    newList.push(this.OddJobs);
    newList.push(this.Resting);
    newList.push(this.Begging);
    newList.push(this.Farming);
    newList.push(this.GatherHerbs);
    newList.push(this.ChopWood);
    newList.push(this.Mining);
    newList.push(this.Smelting);
    newList.push(this.Blacksmithing);
    newList.push(this.Woodworking);
    newList.push(this.Leatherworking);
    newList.push(this.Alchemy);
    newList.push(this.Hunting);
    newList.push(this.Fishing);
    newList.push(this.BodyCultivation);
    newList.push(this.MindCultivation);
    newList.push(this.CoreCultivation);
    newList.push(this.InfuseBody);
    newList.push(this.ExtendLife);
    newList.push(this.Recruiting);
    newList.push(this.TrainingFollowers);
    newList.push(this.Burning);
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
  BodyCultivation: Activity;
  // @ts-ignore
  MindCultivation: Activity;
  // @ts-ignore
  CoreCultivation: Activity;
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
      consequenceDescription: ['Reduce Stamina by 20. Reduce health by 100.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.status.health.value -= 100;
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.Swim].complete){
          this.logService.addLogMessage("You have acheived the impossible and dived all the way to the bottom of the ocean.","STANDARD","STORY");
        }
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
      consequenceDescription: ['Reduce Stamina by 100. If you have the right facilities and materials you might be able to create an unbreakable chain.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let metalValue = this.inventoryService.consume('metal');
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "anvil" && metalValue >= 150){
          if (Math.random() > 0.01){
            this.logService.addLogMessage("Your anvil rings with power, a new chain is forged!","STANDARD","CRAFTING");
            this.inventoryService.addItem(this.itemRepoService.items['unbreakableChain']);
          }
        } else {
          this.logService.addLogMessage("You fumble with the wrong tools and materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
        }
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
      description: ['Swim deep and attach one of your chains to the island.'],
      consequenceDescription: ['Reduce Stamina by 1000. Requires an unbreakable chain.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        if (this.inventoryService.consume("chain") > 0){
            this.logService.addLogMessage("You attach a chain to the island. and give your chains a tug.","STANDARD","EVENT");
            this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].progress++;
            this.impossibleTaskService.checkCompletion();
            if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.RaiseIsland].complete){
              this.logService.addLogMessage("With a mighty pull, the island comes loose. You haul it to the surface.","STANDARD","STORY");
            }
        } else {
          this.logService.addLogMessage("You fumble around in the depths without a chain until a shark comes by and takes a bite.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
        }
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
      description: ['Create a brick sturdy enough to support the weight of your tower.'],
      consequenceDescription: ['Reduce Stamina by 100. If you have the right materials you will create an everlasting brick.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let oreValue = 0;
        for (let i = 0; i < 200; i++){
          oreValue = this.inventoryService.consume('ore');
        }
        if (oreValue >= 10){
          this.inventoryService.addItem(this.itemRepoService.items['everlastingBrick']);
        } else {
          this.logService.addLogMessage("You fumble with the wrong materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
        }
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
      consequenceDescription: ['Reduce Stamina by 1000. If you have the right facilities and materials you might succeed in setting up the scaffolding for the next level.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        let woodValue = 0;
        for (let i = 0; i < 200; i++){
          woodValue = this.inventoryService.consume('wood');
        }
        if (woodValue >= 11){
          this.inventoryService.addItem(this.itemRepoService.items['scaffolding']);
        } else {
          this.logService.addLogMessage("You fumble with the wrong materials, hurt yourself, and break your weak attempt at scaffolding.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
        }
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
      consequenceDescription: ['Reduce Stamina by 100. If you have the right facilities and materials you might succeed in mixing some proper mortar.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        let oreValue = 0;
        oreValue = this.inventoryService.consume('ore');
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron" && oreValue >= 10){
          this.inventoryService.addItem(this.itemRepoService.items['everlastingMortar']);
        } else {
          this.logService.addLogMessage("You fumble with the wrong materials and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
        }
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
      consequenceDescription: ['Reduce Stamina by 1000. If you have the right followers and materials you will build the next level.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        let numBuilders = 0;
        for (let follower of this.followerService.followers){
          if (follower.job = "builder"){
            numBuilders++;
          }
        }
        if (numBuilders < 10){
          this.logService.addLogMessage("You fumble without the proper help and hurt yourself.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.05;
          return;
        }
        let value = 0;
        value = this.inventoryService.consume('scaffolding');
        if (value < 1){
          this.logService.addLogMessage("You try building without a scaffolding, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          return;
        }
        value = 0;
        for (let i = 0; i < 100; i++){
          value = this.inventoryService.consume('mortar');
        }
        if (value < 1){
          this.logService.addLogMessage("You try building without enough mortar, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          return;
        }
        value = 0;
        for (let i = 0; i < 1000; i++){
          value = this.inventoryService.consume('brick');
        }
        if (value < 1){
          this.logService.addLogMessage("You try building without enough bricks, but it ends in a disaster and you are badly hurt.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= this.characterService.characterState.status.health.max * 0.2;
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BuildTower].complete){
          this.logService.addLogMessage("You have acheived the impossible and built a tower beyond the heavens.","STANDARD","STORY");
        }
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
      consequenceDescription: ['Reduce Stamina and Mana by 100. Compile your research and if you have done enough you may produce a Tome of Wind Control.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.status.mana.value -= 100;
        if (this.characterService.characterState.status.stamina.value >= 0 && this.characterService.characterState.status.mana.value >= 0){
          if (Math.random() < 0.01){
            this.logService.addLogMessage("Research breakthrough! You produce a tome!.","STANDARD","CRAFTING");
            this.inventoryService.addItem(this.itemRepoService.items['windTome']);
          }
        }
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
      consequenceDescription: ['Reduce Stamina by 100. Use a Tome of Wind Control to tame the hurricane.'],
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
        }
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
        for (let i = 0; i < 1000; i++){
          value = this.inventoryService.consume('food');
        }
        if (value < 1){
          this.logService.addLogMessage("The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
          return;
        }
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 2000){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
        } else {
          this.logService.addLogMessage("The dragon doesn't seem interested in any more food.","STANDARD","EVENT");
        }
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
        if (this.characterService.characterState.money < 1000000000){
          this.logService.addLogMessage("The dragon is offended by your paltry offering and takes a swipe at you with its massive claw.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
          return;
        }
        this.characterService.characterState.money -= 1000000000;
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress < 4000){
          this.impossibleTaskService.taskProgress[ImpossibleTaskType.BefriendDragon].progress++;
        } else {
          this.logService.addLogMessage("The dragon doesn't seem interested in any more money.","STANDARD","EVENT");
        }
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
        if (this.characterService.characterState.attributes.charisma.value < 10000000000){
          this.logService.addLogMessage("The dragon doesn't like the sound of your voice and takes a bite out of you. Maybe you should practice speaking with humans first.","INJURY","EVENT");
          this.characterService.characterState.status.health.value -= 1000;
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
        for (let i = 0; i < 10000; i++){
          value = this.inventoryService.consume('food');
        }
        if (value < 1){
          this.logService.addLogMessage("You don't have enough food to feed your army, so they revolt and fight you instead.","INJURY","EVENT");
          this.battleService.addEnemy(this.battleService.enemyRepo.army);
          return;
        }
        if (this.characterService.characterState.money < 10000000000){
          this.logService.addLogMessage("You don't have enough money to pay your army, so they revolt and fight you instead.","INJURY","EVENT");
          this.battleService.addEnemy(this.battleService.enemyRepo.army);
          return;
        }
        this.characterService.characterState.money -= 10000000000;
        this.inventoryService.addItem(this.itemRepoService.items['army']);
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
        for (let i = 0; i < this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress; i++){
          value = this.inventoryService.consume('army');
        }
        if (value < 1){
          for (let i = 0; i < 5; i++){
            this.battleService.addEnemy(this.battleService.enemyRepo.army);
          }
          return;
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].progress++;
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.ConquerTheWorld].complete){
          this.logService.addLogMessage("You did the impossible and conquered the world! Under your wise rule all human suffering ceases.","STANDARD","STORY");
        }
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
      consequenceDescription: ["Costs 1000 stamina and 1000 magic."],
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
        ['Uses 5 stamina. Increases a random attribute and provides a little money.'],
      consequence: [() => {
        const keys = Object.keys(
          this.characterService.characterState.attributes
        ) as AttributeType[];
        // randomly choose any of the first five stats
        const key = keys[Math.floor(Math.random() * 5)];
        this.characterService.characterState.increaseAttribute(key, 0.1);
        this.characterService.characterState.status.stamina.value -= 5;
        this.characterService.characterState.money += 3;
        this.getActivityByType(ActivityType.OddJobs).lastIncome = 3;
        this.oddJobDays++;
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
      consequenceDescription: ['Restores some stamina and a little health.',
        'Restores more stamina and some health.',
        'Restores lots of stamina, health, and mana.'],
      consequence: [
        () => {
          this.characterService.characterState.status.stamina.value += 50;
          this.characterService.characterState.status.health.value += 2;
          this.characterService.characterState.checkOverage();
        },
        () => {
          this.characterService.characterState.status.stamina.value += 100;
          this.characterService.characterState.status.health.value += 10;
          if (Math.random() < 0.01){
            this.characterService.characterState.increaseAttribute('spirituality', 0.1);
          }
          if (this.characterService.characterState.manaUnlocked){
            this.characterService.characterState.status.mana.value += 1;
          }
          this.characterService.characterState.checkOverage();
        },
        () => {
          this.characterService.characterState.status.stamina.value += 200;
          this.characterService.characterState.status.health.value += 20;
          this.characterService.characterState.status.mana.value += 10
          this.characterService.characterState.increaseAttribute('spirituality', 0.1);
          this.characterService.characterState.checkOverage();
        }
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
        'Uses 5 stamina. Increases charisma and provides a little money.',
        'Uses 5 stamina. Increases charisma and provides some money.',
        'Uses 5 stamina. Increases charisma and provides money.',
        'Uses 5 stamina. Increases charisma, provides money, and makes you wonder what any of this means for your immortal progression.'
      ],
      consequence: [
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          let money = 3 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
        },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.2);
          this.characterService.characterState.status.stamina.value -= 5;
          let money = 10 + Math.log2(this.characterService.characterState.attributes.charisma.value);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.3);
          this.characterService.characterState.status.stamina.value -= 5;
          let money = 20 + Math.log2(this.characterService.characterState.attributes.charisma.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          },
        () => {
          this.characterService.characterState.increaseAttribute('charisma',0.5);
          this.characterService.characterState.status.stamina.value -= 5;
          let money = 30 + Math.log2(this.characterService.characterState.attributes.charisma.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Begging).lastIncome = money;
          this.beggingDays++;
          }
      ],
      requirements: [
        {
          charisma: 3,
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
        'Uses 25 stamina. Increases strength and toughness and provides a little money.',
        'Uses 25 stamina. Increases strength, toughness, and money.',
        'Uses 25 stamina. Build your physical power, master your craft, and create weapons.',
        'Uses 50 stamina. Bring down your mighty hammer and create works of metal wonder.',
      ],
      consequence: [
        // grade 0
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.status.stamina.value -= 25;
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.metalLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          if (Math.random() < blacksmithSuccessChance) {
            this.inventoryService.addItem(this.itemRepoService.items['junk']);
            this.characterService.characterState.increaseAttribute('metalLore', 0.1);
          }
        },
        // grade 1
        () => {
          this.checkApprenticeship(ActivityType.Blacksmithing);
          this.characterService.characterState.increaseAttribute('strength',0.2);
          this.characterService.characterState.increaseAttribute('toughness',0.2);
          this.characterService.characterState.status.stamina.value -= 25;
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.metalLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.02;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          if (Math.random() < blacksmithSuccessChance) {
            this.characterService.characterState.increaseAttribute('metalLore', 0.2);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('metal');
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
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.fireLore.value +
            (this.characterService.characterState.attributes.metalLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.05;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "anvil"){
            blacksmithSuccessChance += 0.05;
          }
          if (Math.random() < blacksmithSuccessChance) {
            this.characterService.characterState.increaseAttribute('metalLore',0.3);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('metal');
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
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.fireLore.value +
            (this.characterService.characterState.attributes.metalLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Blacksmithing).lastIncome = money;
          let blacksmithSuccessChance = 0.2;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "anvil"){
            blacksmithSuccessChance += 0.2;
          }
          if (Math.random() < blacksmithSuccessChance) {
            this.characterService.characterState.increaseAttribute('metalLore',0.5);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade / 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
              }
            }
          }
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
      consequenceDescription: ['Uses 10 stamina. Find herbs and learn about plants'],
      consequence: [() => {
        this.characterService.characterState.increaseAttribute('intelligence',0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        this.characterService.characterState.status.stamina.value -= 10;
        // the grade on herbs probably needs diminishing returns
        this.inventoryService.generateHerb();
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == 'herbGarden'){
          this.inventoryService.generateHerb();
        }
        if (Math.random() < 0.01) {
          this.characterService.characterState.increaseAttribute('woodLore',0.1);
        }
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
        'Uses 10 stamina. Get smarter, make a few taels, and learn the secrets of alchemy.',
        'Uses 10 stamina. Get smarter, make money, practice your craft. If you have some herbs, you might make a usable potion or pill.',
        'Uses 10 stamina. Get smarter, make money, and make some decent potions or pills.',
        'Uses 20 stamina. Create amazing potions and pills.'
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence',0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          let money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.waterLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 0.01;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
            alchemySuccessChance += 0.05;
          }
          if (Math.random() < alchemySuccessChance) {
            this.characterService.characterState.increaseAttribute('woodLore',0.05);
            this.characterService.characterState.increaseAttribute('waterLore',0.1);
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Alchemy);
          this.characterService.characterState.increaseAttribute('intelligence',0.2);
          this.characterService.characterState.status.stamina.value -= 10;
          let money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 0.02;
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
            alchemySuccessChance += 0.05;
          }
          if (Math.random() < alchemySuccessChance) {
            this.characterService.characterState.increaseAttribute('woodLore',0.1);
            this.characterService.characterState.increaseAttribute('waterLore',0.2);
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
          let money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          let alchemySuccessChance = 1 - Math.exp(0 - 0.025 * Math.log(this.characterService.characterState.attributes.waterLore.value));
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
            alchemySuccessChance += 0.05;
          }
          if (Math.random() < alchemySuccessChance) {
            this.characterService.characterState.increaseAttribute('woodLore',0.2);
            this.characterService.characterState.increaseAttribute('waterLore',0.3);
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
          let money = Math.log2(this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.waterLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Alchemy).lastIncome = money;
          this.characterService.characterState.increaseAttribute('woodLore',0.3);
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
      consequenceDescription: ["Uses 10 stamina. Get a log and learn about plants."],
      consequence: [() => {
        this.characterService.characterState.increaseAttribute('strength',0.1);
        this.characterService.characterState.status.stamina.value -= 10;
        this.inventoryService.addItem(this.inventoryService.getWood());
        if (Math.random() < 0.01) {
          this.characterService.characterState.increaseAttribute('woodLore',0.1);
        }
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
        'Uses 20 stamina. Increases strength and intelligence and provides a little money.',
        'Uses 20 stamina. Increases strength and intelligence and provides a little money. You may make something you want to keep now and then.',
        'Uses 20 stamina. Increases strength and intelligence, earn some money, create wooden equipment.',
        'Uses 40 stamina. Create the best of wooden weapons.',
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
          this.characterService.characterState.status.stamina.value -= 20;
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            this.characterService.characterState.attributes.woodLore.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('woodLore', 0.1);
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Woodworking);
          this.characterService.characterState.increaseAttribute('strength',0.2);
          this.characterService.characterState.increaseAttribute('intelligence',0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('woodLore',0.2);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('wood');
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
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('woodLore',0.3);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('wood');
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
          let money = Math.log2(this.characterService.characterState.attributes.strength.value +
            this.characterService.characterState.attributes.intelligence.value) +
            (this.characterService.characterState.attributes.woodLore.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Woodworking).lastIncome = money;
          if (Math.random() < 0.2) {
            this.characterService.characterState.increaseAttribute('woodLore',0.5);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('wood');
              if (grade >= 1){ // if the wood was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  (grade * 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value)), 'wood'));
              }
            }
          }
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
        'Fashion!.'
      ],
      consequenceDescription:[
        'Uses 20 stamina. Increases speed and toughness and provides a little money.',
        'Uses 20 stamina. Increases speed and toughness and provides a little money. You may make something you want to keep now and then.',
        'Uses 20 stamina. Increases speed and toughness, earn some money, create leather equipment.',
        'Uses 40 stamina. Create the fanciest pants you can imagine. Maybe some boots, too.',
      ],
      consequence: [
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.status.stamina.value -= 20;
          let money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            this.characterService.characterState.attributes.animalHandling.value;
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('animalHandling', 0.1);
          }
        },
        () => {
          this.checkApprenticeship(ActivityType.Leatherworking);
          this.characterService.characterState.increaseAttribute('speed',0.2);
          this.characterService.characterState.increaseAttribute('toughness',0.2);
          this.characterService.characterState.status.stamina.value -= 20;
          let money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 2);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('animalHandling',0.2);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('hide');
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
          let money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 5);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('animalHandling',0.3);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('hide');
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
          let money = Math.log2(this.characterService.characterState.attributes.speed.value +
            this.characterService.characterState.attributes.toughness.value) +
            (this.characterService.characterState.attributes.animalHandling.value * 10);
          this.characterService.characterState.money += money;
          this.getActivityByType(ActivityType.Leatherworking).lastIncome = money;
          if (Math.random() < 0.2) {
            this.characterService.characterState.increaseAttribute('animalHandling',0.5);
            if (this.inventoryService.openInventorySlots() > 0){
              let grade = this.inventoryService.consume('hide');
              if (grade >= 1){ // if the hide was found
                this.inventoryService.addItem(this.inventoryService.generateArmor(
                  (grade * 5) + Math.floor(Math.log2(this.characterService.characterState.attributes.animalHandling.value)), 'leather',
                  this.inventoryService.randomArmorSlot()));
              }
            }
          }
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
        ['Uses 20 stamina. Increases strength and speed and helps your fields to produce more food.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        let farmPower = Math.floor(Math.log10(this.characterService.characterState.attributes.woodLore.value + this.characterService.characterState.attributes.earthLore.value));
        if (farmPower < 1){
          farmPower = 1;
        }
        this.homeService.workFields(farmPower);
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        if (Math.random() < 0.01) {
          this.characterService.characterState.increaseAttribute('woodLore', 0.1);
          this.characterService.characterState.increaseAttribute('earthLore', 0.1);
        }
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
      description: ['Dig in the ground for useable minerals.'],
      consequenceDescription: ['Uses 20 stamina. Increases strength and sometimes finds something useful.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        if (Math.random() < 0.5) {
          this.characterService.characterState.increaseAttribute('earthLore', 0.1);
          this.inventoryService.addItem(this.inventoryService.getOre());
        }
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
      consequenceDescription: ['Uses 20 stamina. Increases toughness and intelligence. If you have metal ores, you can make them into bars.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 20;
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
        this.characterService.characterState.increaseAttribute('intelligence', 0.1);
        this.characterService.characterState.increaseAttribute('metalLore', 0.01);
        if (this.inventoryService.openInventorySlots() > 0){
          let grade = this.inventoryService.consume("ore");
          if (grade >= 1){
            this.inventoryService.addItem(this.inventoryService.getBar(grade));
          }
        }
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
      consequenceDescription: ['Uses 50 stamina. Increases speed and a good hunt provides some meat. It might draw unwanted attention to yourself.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 50;
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        let huntingSuccessChance = 0.1;
        if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "dogKennel"){
          huntingSuccessChance += 0.4;
        }
        if (Math.random() < huntingSuccessChance) {
          this.characterService.characterState.increaseAttribute('animalHandling', 0.1);
          this.inventoryService.addItem(this.itemRepoService.items['meat']);
          this.inventoryService.addItem(this.itemRepoService.items['hide']);
        }
        if (Math.random() < 0.01) {
          this.battleService.addEnemy(this.battleService.enemyRepo.wolf);
        }
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
      consequenceDescription: ['Uses 50 stamina. Increases intelligence and strength and you might catch a fish.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 50;
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('intelligence', 0.1);
        if (Math.random() < 0.2) {
          this.characterService.characterState.increaseAttribute('animalHandling', 0.1);
          this.characterService.characterState.increaseAttribute('waterLore', 0.05);
          this.inventoryService.addItem(this.itemRepoService.items['carp']);
        }
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
      consequenceDescription: ['Uses 5 stamina. You will be charged for what you burn. Teaches you to love fire.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 5;
        let moneyCost = this.characterService.characterState.increaseAttribute('fireLore', 0.1);
        this.characterService.characterState.money -= moneyCost;
        if (this.characterService.characterState.money < 0){
          this.characterService.characterState.money = 0;
        }
      }],
      requirements: [{
        intelligence: 10
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    };

    this.BodyCultivation = {
      level: 0,
      name: ['Body Cultivation'],
      activityType: ActivityType.BodyCultivation,
      description: ['Focus on the development of your body. Unblock your meridians, let your chi flow, and prepare your body for immortality.'],
      consequenceDescription: ['Uses 100 stamina. Increases your physical abilities and strengthen your aptitudes in them.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.increaseAttribute('strength', 1);
        this.characterService.characterState.increaseAttribute('speed', 1);
        this.characterService.characterState.increaseAttribute('toughness', 1);
        this.characterService.characterState.attributes.strength.aptitude += 0.1;
        this.characterService.characterState.attributes.speed.aptitude += 0.1;
        this.characterService.characterState.attributes.toughness.aptitude += 0.1;
        if (Math.random() < 0.01){
          this.characterService.characterState.increaseAttribute('spirituality', 0.1);
        }
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
      consequenceDescription: ['Uses 100 stamina. Increases your mental abilities and strengthen your aptitudes in them.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.increaseAttribute('intelligence', 1);
        this.characterService.characterState.increaseAttribute('charisma', 1);
        this.characterService.characterState.attributes.intelligence.aptitude += 0.1;
        this.characterService.characterState.attributes.charisma.aptitude += 0.1;
        if (Math.random() < 0.01){
          this.characterService.characterState.increaseAttribute('spirituality', 0.1);
        }
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
      consequenceDescription: ['A very advanced cultivation technique. Make sure you have achieved a deep understanding of elemental balance before attempting this. Uses 200 stamina. Gives you a small chance of increasing your mana capabilities.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 200;
        if (this.characterService.characterState.manaUnlocked){
          if (Math.random() < 0.01){
            this.characterService.characterState.status.mana.max++;
            this.characterService.characterState.status.mana.value++;
          }
        } else {
          let damage = this.characterService.characterState.status.health.max * 0.1;
          this.characterService.characterState.status.health.value -= damage;
          this.logService.addLogMessage("You fail miserably at cultivating your core and hurt yourself badly.","INJURY","EVENT");
        }
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

    this.InfuseBody = {
      level: 0,
      name: ['Infuse Body'],
      activityType: ActivityType.InfuseBody,
      description: ['Direct your magical energy into reinforcing your physical body, making it healthier and more able to sustain damage without falling.'],
      consequenceDescription: ['A magical technique that uses 10 mana and 200 stamina. Make sure you have enough magical power before attempting this.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 200;
        if (this.characterService.characterState.manaUnlocked && this.characterService.characterState.status.mana.value >= 10){
          this.characterService.characterState.status.mana.value -= 10;
          this.characterService.characterState.healthBonusMagic++;
        } else {
          let damage = this.characterService.characterState.status.health.max * 0.1;
          this.characterService.characterState.status.health.value -= damage;
          this.logService.addLogMessage("Your magic is too weak to infuse your body. You fail miserably and hurt yourself badly.","INJURY","EVENT");
        }
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
      name: ['Extend Life'],
      activityType: ActivityType.ExtendLife,
      description: ['Direct your magical energy into extending your lifespan, making you live longer.'],
      consequenceDescription: ['A magical technique that uses 20 mana and 400 stamina. Make sure you have enough magical power before attempting this.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 400;
        if (this.characterService.characterState.manaUnlocked && this.characterService.characterState.status.mana.value >= 20){
          this.characterService.characterState.status.mana.value -= 20;
          if (this.characterService.characterState.magicLifespan < 36500){
            this.characterService.characterState.magicLifespan += 10;
          }
        } else {
          let damage = this.characterService.characterState.status.health.max * 0.1;
          this.characterService.characterState.status.health.value -= damage;
          this.logService.addLogMessage("Your magic is too weak to extend your life. You fail miserably and hurt yourself badly.","INJURY","EVENT");
        }
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
      name: ['Recruit Followers'],
      activityType: ActivityType.Recruiting,
      description: ['Look for followers willing to serve you.'],
      consequenceDescription: ['Costs 100 stamina and 1M taels. Gives you a small chance of finding a follower, if you are powerful to attract any.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 100;
        this.characterService.characterState.money -= 1000000;
        if (this.characterService.characterState.money < 0){
          this.characterService.characterState.money = 0;
        }
        if (this.followerService.followersUnlocked && this.characterService.characterState.money > 0){
          if (Math.random() < 0.01){
            this.followerService.generateFollower();
          }
        } else {
          let damage = this.characterService.characterState.status.health.max * 0.1;
          this.characterService.characterState.status.health.value -= damage;
          this.logService.addLogMessage("You fail miserably at your attempt to recruit followers. An angry mob chases you down and gives you a beating for your arrogance.","INJURY","EVENT");
        }
      }],
      requirements: [{
        charisma: 1000000000,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

    this.TrainingFollowers = {
      level: 0,
      name: ['Training Followers'],
      activityType: ActivityType.TrainingFollowers,
      description: ['Train your followers to make them more powerful.'],
      consequenceDescription: ['Costs 1000 stamina. Gives you a small chance for each follower of increasing their power. You probably should not try this if you have no followers.'],
      consequence: [() => {
        this.characterService.characterState.status.stamina.value -= 1000;
        if (this.followerService.followersUnlocked){
          for (let follower of this.followerService.followers){
            if (Math.random() < 0.01){
              follower.power++;
              this.logService.addLogMessage(follower.name + " gains additional power as a " + follower.job, "STANDARD", "EVENT");
            }
          }
        }
      }],
      requirements: [{
        charisma: 10000000000,
      }],
      unlocked: false,
      skipApprenticeshipLevel: 0
    }

  }
}
