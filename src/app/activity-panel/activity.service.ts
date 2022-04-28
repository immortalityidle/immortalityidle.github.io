import { Injectable } from '@angular/core';
import { Activity, ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { AttributeType, CharacterAttribute } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';

export interface ActivityProperties {
  autoRestart: boolean,
  activityLoop: ActivityLoopEntry[]
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activityLoop: ActivityLoopEntry[] = [];
  autoRestart: boolean = false;
  activities: Activity[] = this.getActivityList();

  constructor(
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    public homeService: HomeService,
    reincarnationService: ReincarnationService,
    mainLoopService: MainLoopService
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
      activityLoop: this.activityLoop
    }
  }

  setProperties(properties: ActivityProperties){
    this.autoRestart = properties.autoRestart;
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
          ['Increases a random attribute and provides a little money.'],
        consequence: [() => {
          const keys = Object.keys(
            this.characterService.characterState.attributes
          ) as AttributeType[];
          // randomly choose any of the first five stats
          const key = keys[Math.floor(Math.random() * 5)];
          this.characterService.characterState.increaseAttribute(key, 0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          this.characterService.characterState.money += 1;
        }],
        requirements: [{}],
      },
      {
        level: 0,
        name: ['Resting', 'Meditation'],
        activityType: ActivityType.Resting,
        description:['Take a break and get some sleep. Good sleeping habits are essential for cultivating immortal attributes.',
          'Enter a meditative state and begin your journey toward spritual enlightenment.'],
        consequenceDescription: ['Restores stamina and a little health.'],
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
              this.characterService.characterState.attributes.spirituality.value += 0.1;
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
        name: ['Begging', 'Street Performing'],
        activityType: ActivityType.Begging,
        description:[
          'Find a nice spot on the side of the street, look sad, and put your hand out. Someone might put a coin in it if you are charasmatic enough.',
          'Add some musical flair to your begging.'
        ],
        consequenceDescription:['Increases charisma and provides a little money.',
          'Increases charisma and provides some money.'],
        consequence: [
          () => {
            this.characterService.characterState.increaseAttribute('charisma',0.1);
            this.characterService.characterState.status.stamina.value -= 1;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.charisma.value);
          },
          () => {
            this.characterService.characterState.increaseAttribute('charisma',0.2);
            this.characterService.characterState.status.stamina.value -= 5;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.charisma.value);
          }
        ],
        requirements: [
          {
            charisma: 5,
          },
          {
            charisma: 50
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
          'Increases strength and toughness and provides a little money.',
          'Increases strength, toughness, and money.',
          'Build your physical power, master your craft, and create weapons',
        ],
        consequence: [
          // grade 0
          () => {
            this.characterService.characterState.increaseAttribute('strength', 0.1);
            this.characterService.characterState.increaseAttribute('toughness',0.1);
            this.characterService.characterState.status.stamina.value -= 25;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.strength.value +
                this.characterService.characterState.attributes.toughness.value) +
              this.characterService.characterState.attributes.metalLore.value;
            if (Math.random() < 0.01) {
              this.inventoryService.addItem(this.inventoryService.itemRepo['junk']);
              this.characterService.characterState.increaseAttribute('metalLore',0.1);
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
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('metalLore', 0.2);
              let grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                    grade + Math.floor(Math.log10(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
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
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('metalLore',0.5);
              let grade = this.inventoryService.consume('metal');
              if (grade >= 1){ // if the metal was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  grade + Math.floor(Math.log10(this.characterService.characterState.attributes.metalLore.value)), 'metal'));
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
            strength: 200,
            toughness: 200,
            metalLore: 1,
          },
          {
            strength: 1000,
            toughness: 1000,
            metalLore: 10,
          }
        ],
      },
      {
        level: 0,
        name: ['Gather Herbs'],
        activityType: ActivityType.GatherHerbs,
        description: ['Search the natural world for useful herbs.'],
        consequenceDescription: ['Find a couple of herbs and learn about plants'],
        consequence: [() => {
          this.characterService.characterState.increaseAttribute('intelligence',0.1);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          this.characterService.characterState.status.stamina.value -= 5;
          this.inventoryService.addItem(this.inventoryService.itemRepo['herb']);
          this.inventoryService.addItem(this.inventoryService.itemRepo['herb']);
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
        name: ['Apprentice Alchemist', 'Journeyman Alchemist'],
        activityType: ActivityType.Alchemy,
        description: [
          'Get a job at the alchemist\'s workshop. It smells awful but you might learn a few things.',
          'Get a cauldron and do a little brewing of your own. '
        ],
        consequenceDescription: [
          'Get smarter, make a few taels, and learn the secrets of alchemy.',
          'If you have some herbs, you might make a usable potion or pill.'
        ],
        consequence: [
          () => {
            this.characterService.characterState.increaseAttribute('intelligence',0.1);
            this.characterService.characterState.status.stamina.value -= 10;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.intelligence.value) +
              this.characterService.characterState.attributes.plantLore.value +
              this.characterService.characterState.attributes.animalLore.value;
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('plantLore',0.1);
              this.characterService.characterState.increaseAttribute('animalLore',0.1);
            }
          },
          () => {
            this.characterService.characterState.increaseAttribute('intelligence',0.2);
            this.characterService.characterState.status.stamina.value -= 10;
            this.characterService.characterState.money +=
              Math.log2(this.characterService.characterState.attributes.intelligence.value) +
              ((this.characterService.characterState.attributes.plantLore.value +
              this.characterService.characterState.attributes.animalLore.value) * 2);
            if (Math.random() < 0.01) {
              this.characterService.characterState.increaseAttribute('plantLore',0.1);
              this.characterService.characterState.increaseAttribute('animalLore',0.1);
              let grade = this.inventoryService.consume('ingredient');
              if (grade >= 1){ // if the ingredient was found
                this.inventoryService.addItem(this.inventoryService.generatePotion(grade));
              }
            }
          }
        ],
        requirements: [
          {
            intelligence: 100,
          },
          {
            intelligence: 1000,
          },
        ],
      },
      {
        level: 0,
        name: ['Chop Wood'],
        activityType: ActivityType.ChopWood,
        description: ['Work as a woodcutter, cutting logs in the forest.'],
        consequenceDescription: ["Get a log and learn about plants."],
        consequence: [() => {
          this.characterService.characterState.increaseAttribute('strength',0.1);
          this.characterService.characterState.status.stamina.value -= 10;
          this.inventoryService.addItem(this.inventoryService.itemRepo['log']);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('plantLore',0.1);
          }
        }],
        requirements: [{
          strength: 10,
        }],
      },
      {
        level: 0,
        name: ['Apprentice Woodworking', 'Woodworking'],
        activityType: ActivityType.Woodworking,
        description: ['Work in a woodcarver\'s shop.', 'Carve wood into useful items.'],
        consequenceDescription:[
          'Increases strength and intelligence and provides a little money.',
          'Increases strength and intelligence and provides a little money. You may make something you want to keep now and then.',
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
              this.characterService.characterState.increaseAttribute('plantLore',0.1);
              let grade = this.inventoryService.consume('wood');
              if (grade >= 1){ // if the wood was found
                this.inventoryService.addItem(this.inventoryService.generateWeapon(
                  grade + Math.floor(Math.log10(this.characterService.characterState.attributes.metalLore.value)), 'wood'));
              }
            }
          },
        ],
        requirements: [
          {
            strength: 30,
            intelligence: 30
          },
          {
            strength: 300,
            intelligence: 300,
            plantLore: 1,
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
          ['Increases strength and speed and helps your fields to produce more food.'],
        consequence: [() => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.homeService.workFields();
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('plantLore', 0.1);
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
        consequenceDescription: ['Increases strength and sometimes finds something useful.'],
        consequence: [() => {
          this.characterService.characterState.status.stamina.value -= 20;
          this.characterService.characterState.increaseAttribute('strength', 0.1);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('metalLore', 0.1);
            this.inventoryService.addItem(this.inventoryService.itemRepo['metalOre']);
          }
        }],
        requirements: [{
          strength: 10
        }],
      },
      {
        level: 0,
        name: ['Hunting'],
        activityType: ActivityType.Hunting,
        description: ['Hunt for animals in the nearby woods.'],
        consequenceDescription: ['Increases speed and sometimes finds something useful.'],
        consequence: [() => {
          this.characterService.characterState.status.stamina.value -= 50;
          this.characterService.characterState.increaseAttribute('speed', 0.1);
          if (Math.random() < 0.01) {
            this.characterService.characterState.increaseAttribute('animalLore', 0.1);
            this.inventoryService.addItem(this.inventoryService.itemRepo['meat']);
          }
        }],
        requirements: [{
          speed: 50
        }],
      },
    ];
  }
}
