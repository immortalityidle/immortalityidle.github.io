import { Injectable } from '@angular/core';
import { BattleService } from '../battle-panel/battle.service';
import { Activity, ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { AttributeType, CharacterAttribute } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';

export interface ActivityProperties {
  autoRestart: boolean,
  pauseOnDeath: boolean,
  activityLoop: ActivityLoopEntry[]
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  autoRestart: boolean = false;
  pauseOnDeath: boolean = true;
  activities: Activity[] = this.getActivityList();

  constructor(
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    public homeService: HomeService,
    reincarnationService: ReincarnationService,
    private mainLoopService: MainLoopService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService
  ) {
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      this.upgradeActivities();
    });
  }

  getProperties(): ActivityProperties{
    return {
      autoRestart: this.autoRestart,
      pauseOnDeath: this.pauseOnDeath,
      activityLoop: this.activityLoop
    }
  }

  setProperties(properties: ActivityProperties){
    this.autoRestart = properties.autoRestart;
    this.pauseOnDeath = properties.pauseOnDeath;
    this.activityLoop = properties.activityLoop;
  }

  meetsRequirements(activity: Activity): boolean {
    return this.meetsRequirementsByLevel(activity, activity.level);
  }

  meetsRequirementsByLevel(activity: Activity, level: number): boolean {
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
    for (let i = this.activityLoop.length - 1; i >= 0; i--) {
      if (!this.meetsRequirements(this.getActivityByType(this.activityLoop[i].activity))) {
        this.activityLoop.splice(i, 1);
      }
    }
  }

  upgradeActivities(): void {
    for (const activity of this.activities){
      if (activity.level < (activity.description.length - 1)){
        if (this.meetsRequirementsByLevel(activity, (activity.level + 1))){
          activity.level++;
        }
      }
    }
  }

  reset(): void {
    // downgrade all activities to base level
    for (const activity of this.activities){
      activity.level = 0;
    }
    if (this.autoRestart){
      this.checkRequirements();
      if (this.pauseOnDeath){
        this.mainLoopService.pause = true;
      }
    } else {
      this.activityLoop = [];
    }
  }

  getActivityByType(activityType: ActivityType): Activity {
    for (const activity of this.activities) {
      if (activity.activityType === activityType) {
        return activity;
      }
    }
    throw Error('Could not find activity from type');
  }

  // TODO: Maybe pull these out as first class objects?
  getActivityList(): Activity[] {
    return [
      {
        level: 0,
        name: ['Odd Jobs'],
        activityType: ActivityType.OddJobs,
        description:
          ['Run errands, pull weeds, clean toilet pits, or whatever else you can earn a coin doing. Undignified work for a future immortal, but you have to eat to live.'],
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
        }],
        requirements: [{}],
      },
      {
        level: 0,
        name: ['Resting', 'Meditation'],
        activityType: ActivityType.Resting,
        description:['Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
          'Enter a meditative state and begin your journey toward spritual enlightenment.'],
        consequenceDescription: ['Restores half your stamina and a little health.',
          'Restores all your stamina and some health.'],
        consequence: [
          () => {
            this.characterService.characterState.status.stamina.value +=
              this.characterService.characterState.status.stamina.max / 2;
            this.characterService.characterState.status.health.value += 2;
            this.characterService.characterState.checkOverage();
          },
          () => {
            this.characterService.characterState.status.stamina.value = this.characterService.characterState.status.stamina.max;
            this.characterService.characterState.status.health.value += 10;
            if (Math.random() < 0.01){
              this.characterService.characterState.increaseAttribute('spirituality', 0.1);
            }
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
          }
        ],
      },
      {
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
            this.characterService.characterState.money += 3 +
              Math.log2(this.characterService.characterState.attributes.charisma.value);
          },
          () => {
            this.characterService.characterState.increaseAttribute('charisma',0.2);
            this.characterService.characterState.status.stamina.value -= 5;
            this.characterService.characterState.money += 10 +
              Math.log2(this.characterService.characterState.attributes.charisma.value);
          },
          () => {
            this.characterService.characterState.increaseAttribute('charisma',0.3);
            this.characterService.characterState.status.stamina.value -= 5;
            this.characterService.characterState.money += 20 +
              Math.log2(this.characterService.characterState.attributes.charisma.value * 2);
          },
          () => {
            this.characterService.characterState.increaseAttribute('charisma',0.5);
            this.characterService.characterState.status.stamina.value -= 5;
            this.characterService.characterState.money += 30 +
              Math.log2(this.characterService.characterState.attributes.charisma.value * 10);
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
        ]
      },
      {
        level: 0,
        name: ['Apprentice Blacksmithing', 'Journeyman Blacksmithing', 'Blacksmithing'],
        activityType: ActivityType.ApprenticeBlacksmithing,
        description:[
          "Work for the local blacksmith. You mostly pump the bellows, but at least you're learning a trade.",
          'Mold metal into useful things. You might even produce something you want to keep now and then.',
          'Create useful and beautiful metal objects. You might produce a decent weapon occasionally.'
        ],
        consequenceDescription:[
          'Uses 25 stamina. Increases strength and toughness and provides a little money.',
          'Uses 25 stamina. Increases strength, toughness, and money.',
          'Uses 25 stamina. Build your physical power, master your craft, and create weapons',
        ],
        consequence: [
          // grade 0
          () => {
            this.characterService.characterState.increaseAttribute('strength', 0.1);
            this.characterService.characterState.increaseAttribute('toughness', 0.1);
            this.characterService.characterState.status.stamina.value -= 25;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value) +
              this.characterService.characterState.attributes.metalLore.value;
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
            this.characterService.characterState.increaseAttribute('strength',0.2);
            this.characterService.characterState.increaseAttribute('toughness',0.2);
            this.characterService.characterState.status.stamina.value -= 25;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.toughness.value) +
              (this.characterService.characterState.attributes.metalLore.value * 2);
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
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.toughness.value) +
              (this.characterService.characterState.attributes.metalLore.value * 5);
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
          }
        ],
      },
      {
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
          this.inventoryService.addItem(this.inventoryService.generateHerb());
          if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == 'herbGarden'){
            this.inventoryService.addItem(this.inventoryService.generateHerb());
          }
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('plantLore',0.1);
          }
        }],
        requirements: [{
          speed: 20,
          intelligence: 20,
        }],
      },
      {
        level: 0,
        name: ['Apprentice Alchemy', 'Journeyman Alchemy', 'Alchemy'],
        activityType: ActivityType.Alchemy,
        description: [
          'Get a job at the alchemist\'s workshop. It smells awful but you might learn a few things.',
          'Get a cauldron and do a little brewing of your own.',
          'Open up your own alchemy shop.',
        ],
        consequenceDescription: [
          'Uses 10 stamina. Get smarter, make a few taels, and learn the secrets of alchemy.',
          'Uses 10 stamina. Get smarter, make money, practice your craft. If you have some herbs, you might make a usable potion or pill.',
          'Uses 10 stamina. Get smarter, make money, and make some decent potions or pills.'
        ],
        consequence: [
          () => {
            this.characterService.characterState.increaseAttribute('intelligence',0.1);
            this.characterService.characterState.status.stamina.value -= 10;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.intelligence.value) +
              this.characterService.characterState.attributes.plantLore.value +
              this.characterService.characterState.attributes.animalLore.value;
            let alchemySuccessChance = 0.01;
            if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
              alchemySuccessChance += 0.05;
            }
            if (Math.random() < alchemySuccessChance) {
              this.characterService.characterState.increaseAttribute('plantLore',0.05);
              this.characterService.characterState.increaseAttribute('animalLore',0.05);
              this.characterService.characterState.increaseAttribute('alchemy',0.1);
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('intelligence',0.2);
            this.characterService.characterState.status.stamina.value -= 10;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.intelligence.value) +
              ((this.characterService.characterState.attributes.plantLore.value +
              this.characterService.characterState.attributes.animalLore.value) * 2);
            let alchemySuccessChance = 0.02;
            if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
              alchemySuccessChance += 0.05;
            }
            if (Math.random() < alchemySuccessChance) {
              this.characterService.characterState.increaseAttribute('plantLore',0.1);
              this.characterService.characterState.increaseAttribute('animalLore',0.1);
              this.characterService.characterState.increaseAttribute('alchemy',0.2);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('ingredient');
                if (grade >= 1){ // if the ingredient was found
                  grade += Math.floor(Math.log2(this.characterService.characterState.attributes.alchemy.value));
                  this.inventoryService.generatePotion(grade);
                }
              }
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('intelligence',0.5);
            this.characterService.characterState.status.stamina.value -= 10;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.intelligence.value) +
              ((this.characterService.characterState.attributes.plantLore.value +
              this.characterService.characterState.attributes.animalLore.value) * 5);
            let alchemySuccessChance = 1 - Math.exp(0 - 0.025 * Math.log(this.characterService.characterState.attributes.alchemy.value));
            if (this.homeService.furniture.workbench && this.homeService.furniture.workbench.id == "cauldron"){
              alchemySuccessChance += 0.05;
            }
            if (Math.random() < alchemySuccessChance) {
              this.characterService.characterState.increaseAttribute('plantLore',0.2);
              this.characterService.characterState.increaseAttribute('animalLore',0.2);
              this.characterService.characterState.increaseAttribute('alchemy',0.3);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('ingredient');
                if (grade >= 1){ // if the ingredient was found
                  grade += Math.floor(Math.log2(this.characterService.characterState.attributes.alchemy.value));
                  this.inventoryService.generatePotion(grade + 1);
                }
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
            alchemy: 1,
            animalLore: 1,
            plantLore: 1
          },
          {
            intelligence: 8000,
            alchemy: 10,
            animalLore: 10,
            plantLore: 10
          }
        ],
      },
      {
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
            this.characterService.characterState.increaseAttribute('plantLore',0.1);
          }
        }],
        requirements: [{
          strength: 100,
        }],
      },
      {
        level: 0,
        name: ['Apprentice Woodworking', 'Journeyman Woodworking', 'Woodworking'],
        activityType: ActivityType.Woodworking,
        description: [
          'Work in a woodcarver\'s shop.',
          'Carve wood into useful items.',
          'Open your own woodworking shop.'
        ],
        consequenceDescription:[
          'Uses 20 stamina. Increases strength and intelligence and provides a little money.',
          'Uses 20 stamina. Increases strength and intelligence and provides a little money. You may make something you want to keep now and then.',
          'Uses 20 stamina. Increases strength and intelligence, earn some money, create wooden equipment.',
        ],
        consequence: [
          () => {
            this.characterService.characterState.increaseAttribute('strength', 0.1);
            this.characterService.characterState.increaseAttribute('intelligence', 0.1);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.intelligence.value) +
              this.characterService.characterState.attributes.plantLore.value;
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('plantLore', 0.1);
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('strength',0.2);
            this.characterService.characterState.increaseAttribute('intelligence',0.2);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.intelligence.value) +
              (this.characterService.characterState.attributes.plantLore.value * 2);
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('plantLore',0.2);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('wood');
                if (grade >= 1){ // if the wood was found
                  this.inventoryService.addItem(this.inventoryService.generateWeapon(
                    grade + Math.floor(Math.log2(this.characterService.characterState.attributes.plantLore.value)), 'wood'));
                }
              }
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('strength',0.5);
            this.characterService.characterState.increaseAttribute('intelligence',0.5);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
              this.characterService.characterState.attributes.intelligence.value) +
              (this.characterService.characterState.attributes.plantLore.value * 5);
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('plantLore',0.3);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('wood');
                if (grade >= 1){ // if the wood was found
                  this.inventoryService.addItem(this.inventoryService.generateWeapon(
                    grade + Math.floor(Math.log2(this.characterService.characterState.attributes.plantLore.value)), 'wood'));
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
            plantLore: 1,
          },
          {
            strength: 2000,
            intelligence: 2000,
            plantLore: 10,
          }
        ],
      },
      {
        level: 0,
        name: ['Apprentice Leatherworking', 'Journeyman Leatherworking', 'Leatherworking'],
        activityType: ActivityType.Leatherworking,
        description: [
          'Work in a tannery, where hides are turned into leather items.',
          'Convert hides into leather items.',
          'Open your own tannery.'
        ],
        consequenceDescription:[
          'Uses 20 stamina. Increases speed and toughness and provides a little money.',
          'Uses 20 stamina. Increases speed and toughness and provides a little money. You may make something you want to keep now and then.',
          'Uses 20 stamina. Increases speed and toughness, earn some money, create leather equipment.',
        ],
        consequence: [
          () => {
            this.characterService.characterState.increaseAttribute('speed', 0.1);
            this.characterService.characterState.increaseAttribute('toughness', 0.1);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.speed.value +
              this.characterService.characterState.attributes.toughness.value) +
              this.characterService.characterState.attributes.animalLore.value;
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('animalLore', 0.1);
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('speed',0.2);
            this.characterService.characterState.increaseAttribute('toughness',0.2);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.speed.value +
              this.characterService.characterState.attributes.toughness.value) +
              (this.characterService.characterState.attributes.animalLore.value * 2);
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('animalLore',0.2);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('hide');
                if (grade >= 1){ // if the wood was found
                  this.inventoryService.addItem(this.inventoryService.generateArmor(
                    grade + Math.floor(Math.log2(this.characterService.characterState.attributes.animalLore.value)), 'leather',
                    this.inventoryService.randomArmorSlot()));
                }
              }
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('speed',0.5);
            this.characterService.characterState.increaseAttribute('toughness',0.5);
            this.characterService.characterState.status.stamina.value -= 20;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.speed.value +
              this.characterService.characterState.attributes.toughness.value) +
              (this.characterService.characterState.attributes.animalLore.value * 5);
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('animalLore',0.3);
              if (this.inventoryService.openInventorySlots() > 0){
                let grade = this.inventoryService.consume('hide');
                if (grade >= 1){ // if the wood was found
                  this.inventoryService.addItem(this.inventoryService.generateArmor(
                    grade + Math.floor(Math.log2(this.characterService.characterState.attributes.animalLore.value)), 'leather',
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
            animalLore: 1,
          },
          {
            speed: 2000,
            toughness: 2000,
            animalLore: 10,
          }
        ],
      },
      {
        level: 0,
        name: ['Farming'],
        activityType: ActivityType.Farming,
        description:
          ['Plant crops in your fields. This is a waste of time if you don\'t have some fields ready to work.'],
        consequenceDescription:
          ['Uses 20 stamina. Increases strength and speed and helps your fields to produce more food.'],
        consequence: [() => {
          this.characterService.characterState.status.stamina.value -= 20;
          let farmPower = Math.floor(Math.log10(this.characterService.characterState.attributes.plantLore.value + this.characterService.characterState.attributes.earthLore.value));
          if (farmPower < 1){
            farmPower = 1;
          }
          this.homeService.workFields(farmPower);
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('plantLore', 0.1);
            this.characterService.characterState.increaseAttribute('earthLore', 0.1);
          }
      }],
        requirements: [{
          strength: 10,
          speed: 10
        }],
      },
      {
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
      },
      {
        level: 0,
        name: ['Smelting'],
        activityType: ActivityType.Smelting,
        description: ['Smelt metal ores into usable metal.'],
        consequenceDescription: ['Uses 30 stamina. Increases toughness and intelligence. If you have metal ores, you can make them into bars.'],
        consequence: [() => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.increaseAttribute('toughness', 0.1);
          this.characterService.characterState.increaseAttribute('intelligence', 0.1);
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
      },
      {
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
            this.characterService.characterState.increaseAttribute('animalLore', 0.1);
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
      },
      {
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
            this.characterService.characterState.increaseAttribute('animalLore', 0.1);
            this.inventoryService.addItem(this.itemRepoService.items['carp']);
          }
        }],
        requirements: [{
          strength: 15,
          intelligence: 15
        }],
      },
      {
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
      },
      {
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
      }
    ];
  }
}
