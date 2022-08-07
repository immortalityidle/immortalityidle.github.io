import { Injectable, Injector } from '@angular/core';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { Furniture, InventoryService, Item } from './inventory.service';
import { ImpossibleTaskService, ImpossibleTaskType } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { AutoBuyerService } from './autoBuyer.service';
import { GameStateService } from './game-state.service';
import { HellLevel, HellService } from './hell.service';

@Injectable({
  providedIn: 'root'
})
export class ItemRepoService {
  homeService?: HomeService;
  activityService?: ActivityService;
  inventoryService?: InventoryService;
  battleService?: BattleService;
  impossibleTaskService?: ImpossibleTaskService;
  followerService?: FollowersService;
  autoBuyerService?: AutoBuyerService;
  gameStateService?: GameStateService;
  hellService?: HellService;

  furniture: {[key: string]: Furniture} = {
    blanket: {
      id: 'blanket',
      name: "Blanket",
      type: 'furniture',
      slot: 'bed',
      value: 10,
      description: "A tattered blanket. Not much, but it could keep you warm at night. Increases daily stamina recovery by 1.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value++;
      },
    },
    mat: {
      id: 'mat',
      name: "Sleeping Mat",
      type: 'furniture',
      slot: 'bed',
      value: 1000,
      description: "A thin woven mat to sleep on. Increases daily stamina recovery by 1 and restores a bit of health.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 1;
        this.characterService.characterState.status.health.value += 0.1;
        this.characterService.characterState.checkOverage();
      }
    },
    canopyBed: {
      id: 'canopyBed',
      name: "Canopy Bed",
      type: 'furniture',
      slot: 'bed',
      value: 10000,
      description: "A fine bed with a cover. Curtains keep the mosquitoes off you during the night. Increases daily stamina recovery by 2 and restores a bit of health.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 2;
        this.characterService.characterState.status.health.value += 0.2;
        this.characterService.characterState.checkOverage();
      }
    },
    heatedBed: {
      id: 'heatedBed',
      name: "Heated Bed",
      type: 'furniture',
      slot: 'bed',
      value: 100000,
      description: "A bed built over a small clay oven. Keeps you toasty on even the coldest nights. Increases daily stamina recovery by 5 and improves health recovery.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      }
    },
    bedOfNails: {
      id: 'bedOfNails',
      name: "Bed of Nails",
      type: 'furniture',
      slot: 'bed',
      value: 10000,
      description: "A solid board with nails poking upwards. You won't sleep as well, but it is certain to toughen you up.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value -= 1;
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
      }
    },
    waterBucket: {
      id: 'waterBucket',
      name: "water bucket ",
      type: 'furniture',
      slot: 'bathtub',
      value: 10,
      description: "A bucket of water that lets you splash water on your face. Increases charisma.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.01);
      }
    },
    washBasin: {
      id: 'washBasin',
      name: "wash basin",
      type: 'furniture',
      slot: 'bathtub',
      value: 1000,
      description: "A wash basin with a rag to clean yourself. Increases charisma.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.05);
      }
    },
    woodenTub: {
      id: 'woodenTub',
      name: "wooden tub",
      type: 'furniture',
      slot: 'bathtub',
      value: 10000,
      description: "A tall and narrow tub where you can squat and bathe. Increases charisma and health recovery.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.1);
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      }
    },
    bronzeTub: {
      id: 'bronzeTub',
      name: "bronze tub",
      type: 'furniture',
      slot: 'bathtub',
      value: 1000000,
      description: "A luxurious tub where you can get sparkling clean. Increases charisma and health recovery.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.2);
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      }
    },
    heatedTub: {
      id: 'heatedTub',
      name: "heated tub",
      type: 'furniture',
      slot: 'bathtub',
      value: 1e8,
      description: "A luxurious tub with its own heating stove. Good for your health and beauty.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.2);
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.healthBonusBath++;
        this.characterService.characterState.checkOverage();
      }
    },
    cookPot: {
      id: 'cookPot',
      name: "cook pot",
      type: 'furniture',
      slot: 'kitchen',
      value: 10,
      description: "A simple pot over a fire to boil your food. Improves all physical attributes.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.01);
        this.characterService.characterState.increaseAttribute('speed', 0.01);
        this.characterService.characterState.increaseAttribute('toughness', 0.01);
      }
    },
    roastingSpit: {
      id: 'roastingSpit',
      name: "roasting spit",
      type: 'furniture',
      slot: 'kitchen',
      value: 1000,
      description: "A simple spit to go along with your cookpot, letting you add more variety to your diet. Improves all physical attributes.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.02);
        this.characterService.characterState.increaseAttribute('speed', 0.02);
        this.characterService.characterState.increaseAttribute('toughness', 0.02);
      }
    },
    wok: {
      id: 'wok',
      name: "wok",
      type: 'furniture',
      slot: 'kitchen',
      value: 1000000,
      description: "A large metal wok to stir-fry a tasty dinner. Improves all physical attributes.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.05);
        this.characterService.characterState.increaseAttribute('speed', 0.05);
        this.characterService.characterState.increaseAttribute('toughness', 0.05);
      }
    },
    chefKitchen: {
      id: 'chefKitchen',
      name: "chef kitchen",
      type: 'furniture',
      slot: 'kitchen',
      value: 1e9,
      description: "An elaborate kitchen that allows you to cook anything. Improves all physical attributes.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
      }
    },
    anvil: {
      id: 'anvil',
      name: "anvil",
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: "An anvil to work on blacksmithing.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('metalLore', 0.01);
      }
    },
    herbGarden: {
      id: 'herbGarden',
      name: "herb garden",
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: "An pleasant garden growing herbs.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('woodLore', 0.01);
      }
    },
    dogKennel: {
      id: 'dogKennel',
      name: "dog kennel",
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: "A kennel for training hunting dogs.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('animalHandling', 0.01);
      }
    },
    cauldron: {
      id: 'cauldron',
      name: "cauldron",
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: "A cauldron for practicing alchemy.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('waterLore', 0.01);
      }
    },
    prayerShrine: {
      id: 'prayerShrine',
      name: "prayer shrine",
      type: 'furniture',
      slot: 'workbench',
      value: 1e7,
      description: "A quiet shrine for contemplative prayer. You won't be able to use this unless you have some innate spirituality.",
      useConsumes: false,
      use: () => {
        if (this.characterService.characterState.attributes.spirituality.value > 0){
          this.characterService.characterState.increaseAttribute('spirituality', 0.01);
        }
      }
    }
  }

  items: {[key: string]: Item} = {
    rice: {
      id: 'rice',
      name: 'rice',
      type: 'food',
      value: 1,
      description: 'A basic staple of life. One pouch will sustain you for a day.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        this.characterService.characterState.checkOverage();
      },
    },
    cabbage: {
      id: 'cabbage',
      name: 'cabbage',
      type: 'food',
      value: 5,
      description: 'A simple, healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.01){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    beans: {
      id: 'beans',
      name: 'beans',
      type: 'food',
      value: 10,
      description: 'A handful of healthy vegetables.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.02){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 5)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if(this.characterService.characterState.foodLifespan < (365 * 5)){
            this.characterService.characterState.foodLifespan = 365 * 5;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    broccoli: {
      id: 'broccoli',
      name: 'broccoli',
      type: 'food',
      value: 15,
      description: 'Little green trees. A very healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.05){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 10)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 10)){
            this.characterService.characterState.foodLifespan = 365 * 10;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    calabash: {
      id: 'calabash',
      name: 'calabash',
      type: 'food',
      value: 20,
      description: 'A tasty gourd with health-giving properties.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.08){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 15)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 15)){
            this.characterService.characterState.foodLifespan = 365 * 15;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    taro: {
      id: 'taro',
      name: 'taro',
      type: 'food',
      value: 25,
      description: 'A healthy root vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.1){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 20)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 20)){
            this.characterService.characterState.foodLifespan = 365 * 20;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    pear: {
      id: 'pear',
      name: 'pear',
      type: 'food',
      value: 30,
      description: 'A tasty fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.12){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 25)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 25)){
            this.characterService.characterState.foodLifespan = 365 * 25;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    melon: {
      id: 'melon',
      name: 'melon',
      type: 'food',
      value: 35,
      description: 'A yummy fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.15){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 30)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 30)){
            this.characterService.characterState.foodLifespan = 365 * 30;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    plum: {
      id: 'plum',
      name: 'plum',
      type: 'food',
      value: 40,
      description: 'An excellent fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.18){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 35)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 35)){
            this.characterService.characterState.foodLifespan = 365 * 35;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    apricot: {
      id: 'apricot',
      name: 'apricot',
      type: 'food',
      value: 45,
      description: 'A delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.20){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 40)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 40)){
            this.characterService.characterState.foodLifespan = 365 * 40;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    peach: {
      id: 'peach',
      name: 'peach',
      type: 'food',
      value: 50,
      description: 'A highly prized and delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and can even lead to a long life.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.22){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity * 2;
          if (this.characterService.characterState.foodLifespan + quantity <= (365 * 72)){
            this.characterService.characterState.foodLifespan += quantity;
          } else if (this.characterService.characterState.foodLifespan < (365 * 72)){
            this.characterService.characterState.foodLifespan = 365 * 72;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    meat: {
      id: 'meat',
      name: 'meat',
      type: 'food',
      value: 50,
      description: 'Some delicious meat.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly. Can also improve your health and stamina.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity * 2;
        this.characterService.characterState.healthBonusFood += quantity;
        this.characterService.characterState.status.health.value += quantity * 10;
        this.characterService.characterState.status.stamina.max += quantity;
        this.characterService.characterState.checkOverage();
      },
    },
    spiritMeat: {
      id: 'spiritMeat',
      name: 'spirit meat',
      type: 'food',
      value: 1000,
      description: 'Your hunters have performed a ritual burned offering of meat to send you this spiritual feast.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly. Can also improve your health and stamina.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity * 2;
        this.characterService.characterState.healthBonusFood += quantity;
        this.characterService.characterState.status.health.value += quantity * 20;
        this.characterService.characterState.status.stamina.max += quantity;
        this.characterService.characterState.checkOverage();
      },
    },
    carp: {
      id: 'carp',
      name: 'carp',
      type: 'food',
      value: 50,
      description: 'A common fish.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly. Might also improve your health and stamina.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.1){
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.stamina.max += quantity;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    hide: {
      id: 'hide',
      name: 'hide',
      type: 'hide',
      value: 1,
      description: 'A basic animal hide.'
    },
    balsaLog: {
      id: 'balsaLog',
      name: 'balsa log',
      type: 'wood',
      value: 1,
      description: 'A really soft log.',
    },
    elmLog: {
      id: 'elmLog',
      name: 'elm log',
      type: 'wood',
      value: 2,
      description: 'A soft log.',
    },
    cypressLog: {
      id: 'cypressLog',
      name: 'cypress log',
      type: 'wood',
      value: 3,
      description: 'A poor quality log.',
    },
    walnutLog: {
      id: 'walnutLog',
      name: 'walnut log',
      type: 'wood',
      value: 4,
      description: 'An adequate quality log.',
    },
    laurelwoodLog: {
      id: 'laurelwoodLog',
      name: 'laurelwood log',
      type: 'wood',
      value: 5,
      description: 'A nice quality log.',
    },
    blackwoodLog: {
      id: 'blackwoodLog',
      name: 'blackwood log',
      type: 'wood',
      value: 6,
      description: 'A good quality log.',
    },
    rosewoodLog: {
      id: 'rosewoodLog',
      name: 'rosewood log',
      type: 'wood',
      value: 7,
      description: 'A great quality log.',
    },
    pearwoodLog: {
      id: 'pearwoodLog',
      name: 'pearwood log',
      type: 'wood',
      value: 8,
      description:  'An excellent quality log.',
    },
    zitanLog: {
      id: 'zitanLog',
      name: 'zitan log',
      type: 'wood',
      value: 9,
      description: 'An amazing quality log.',
    },
    lignumvitaeLog: {
      id: 'lignumvitaeLog',
      name: 'lignum vitae log',
      type: 'wood',
      value: 10,
      description: 'a log of the highest mortal quality.',
    },
    peachwoodlog: {
      id: 'peachwoodlog',
      name: 'peachwood log',
      type: 'wood',
      value: 11,
      description: 'A log brimming with spiritual energy.',
    },
    diamondwoodLog: {
      id: 'diamondwoodLog',
      name: 'diamondwood log',
      type: 'wood',
      value: 12,
      description: 'A log as hard as diamond.',
    },
    titanwoodLog: {
      id: 'titanwoodLog',
      name: 'titanwood log',
      type: 'wood',
      value: 13,
      description: 'A log with the strength of titans.',
    },
    dragonwoodLog: {
      id: 'dragonwoodLog',
      name: 'dragonwood log',
      type: 'wood',
      value: 14,
      description: 'A log blessed by dragons.',
    },
    devilwoodLog: {
      id: 'devilwoodLog',
      name: 'devilwood log',
      type: 'wood',
      value: 15,
      description: 'A demonic quality log.',
    },
    divinewoodLog: {
      id: 'divinewoodLog',
      name: 'divinewood log',
      type: 'wood',
      value: 16,
      description: 'A divine quality log.',
    },
    copperOre: {
      id: 'copperOre',
      name: 'copper ore',
      type: 'ore',
      value: 1,
      description: 'A chunk of copper ore.',
    },
    tinOre: {
      id: 'tinOre',
      name: 'tin ore',
      type: 'ore',
      value: 2,
      description: 'A chunk of tin ore.'
    },
    bronzeOre: {
      id: 'bronzeOre',
      name: 'mixed ore',
      type: 'ore',
      value: 3,
      description: 'A chunk of ore containing copper, tin, lead, and zinc.'
    },
    ironOre: {
      id: 'ironOre',
      name: 'iron ore',
      type: 'ore',
      value: 4,
      description: 'A chunk of iron ore.',
    },
    steelOre: {
      id: 'steelOre',
      name: 'coal-mixed iron ore',
      type: 'ore',
      value: 5,
      description: 'A chunk of iron ore laced with coal.',
    },
    mithrilOre: {
      id: 'mithrilOre',
      name: 'mithril ore',
      type: 'ore',
      value: 6,
      description: 'A chunk of mithril ore.',
    },
    greensteelOre: {
      id: 'greensteelOre',
      name: 'greensteel ore',
      type: 'ore',
      value: 7,
      description: 'A chunk of greensteel ore.',
    },
    bluesteelOre: {
      id: 'bluesteelOre',
      name: 'bluesteel ore',
      type: 'ore',
      value: 8,
      description: 'A chunk of bluesteel ore.',
    },
    redsteelOre: {
      id: 'redsteelOre',
      name: 'redsteel ore',
      type: 'ore',
      value: 9,
      description: 'A chunk of redsteel ore.',
    },
    flamesteelOre: {
      id: 'flamesteelOre',
      name: 'flamesteel ore',
      type: 'ore',
      value: 10,
      description: 'A chunk of flamesteel ore.',
    },
    froststeelOre: {
      id: 'froststeelOre',
      name: 'froststeel ore',
      type: 'ore',
      value: 11,
      description: 'A chunk of froststeel ore.',
    },
    brightsteelOre: {
      id: 'brightsteelOre',
      name: 'brightsteel ore',
      type: 'ore',
      value: 12,
      description: 'A chunk of brightsteel ore.',
    },
    darksteelOre: {
      id: 'darksteelOre',
      name: 'darksteel ore',
      type: 'ore',
      value: 13,
      description: 'A chunk of darksteel ore.',
    },
    felsteelOre: {
      id: 'felsteelOre',
      name: 'felsteel ore',
      type: 'ore',
      value: 14,
      description: 'A chunk of felsteel ore.',
    },
    cloudsteelOre: {
      id: 'cloudsteelOre',
      name: 'cloudsteel ore',
      type: 'ore',
      value: 15,
      description: 'A chunk of cloudsteel ore.',
    },
    adamantOre: {
      id: 'adamantOre',
      name: 'adamant ore',
      type: 'ore',
      value: 16,
      description: 'A chunk of adamant ore.',
    },
    // metal bars should always be 10x the value of the associated ore
    copperBar: {
      id: 'copperBar',
      name: 'copper bar',
      type: 'metal',
      value: 10,
      description: 'A bar of copper.',
    },
    tinBar: {
      id: 'tinBar',
      name: 'tin bar',
      type: 'metal',
      value: 20,
      description: 'A bar of tin.',
    },
    bronzeBar: {
      id: 'bronzeBar',
      name: 'bronze bar',
      type: 'metal',
      value: 30,
      description: 'A bar of bronze.',
    },
    ironBar: {
      id: 'ironBar',
      name: 'iron bar',
      type: 'metal',
      value: 40,
      description: 'A bar of iron.',
    },
    steelBar: {
      id: 'steelBar',
      name: 'steel bar',
      type: 'metal',
      value: 50,
      description: 'A bar of steel.',
    },
    mithrilBar: {
      id: 'mithrilBar',
      name: 'mithril bar',
      type: 'metal',
      value: 60,
      description: 'A bar of of mithril.',
    },
    greensteelBar: {
      id: 'greensteelBar',
      name: 'greensteel bar',
      type: 'metal',
      value: 70,
      description: 'A bar of greensteel.',
    },
    bluesteelBar: {
      id: 'bluesteelBar',
      name: 'bluesteel bar',
      type: 'metal',
      value: 80,
      description: 'A bar of bluesteel.',
    },
    redsteelBar: {
      id: 'redsteelBar',
      name: 'redsteel bar',
      type: 'metal',
      value: 90,
      description: 'A bar of redsteel.',
    },
    flamesteelBar: {
      id: 'flamesteelBar',
      name: 'flamesteel bar',
      type: 'metal',
      value: 100,
      description: 'A bar of flamesteel.',
    },
    froststeelBar: {
      id: 'froststeelBar',
      name: 'froststeel bar',
      type: 'metal',
      value: 110,
      description: 'A bar of froststeel.',
    },
    brightsteelBar: {
      id: 'brightsteelBar',
      name: 'brightsteel bar',
      type: 'metal',
      value: 120,
      description: 'A bar of brightsteel.',
    },
    darksteelBar: {
      id: 'darksteelBar',
      name: 'darksteel bar',
      type: 'metal',
      value: 130,
      description: 'A bar of darksteel.',
    },
    felsteelBar: {
      id: 'felsteelBar',
      name: 'felsteel bar',
      type: 'metal',
      value: 140,
      description: 'A bar of felsteel.',
    },
    cloudsteelBar: {
      id: 'cloudsteelBar',
      name: 'cloudsteel bar',
      type: 'metal',
      value: 150,
      description: 'A bar of cloudsteel.',
    },
    adamantBar: {
      id: 'adamantBar',
      name: 'adamant bar',
      type: 'metal',
      value: 160,
      description: 'A bar of adamant.',
    },
    junk: {
      id: 'junk',
      name: 'junk',
      type: 'metal',
      value: 10,
      description: 'Some metal junk.',
    },
    pillMold: {
      id: 'pillMold',
      name: 'pill mold',
      type: 'pillMold',
      value: 100,
      description: 'A metal mold for compressing a very powerful pill.',
    },
    pillBox: {
      id: 'pillBox',
      name: 'pill box',
      type: 'pillBox',
      value: 100,
      description: 'A wooden box required for holding a very powerful pill.',
    },
    pillPouch: {
      id: 'pillPouch',
      name: 'pill pouch',
      type: 'pillPouch',
      value: 100,
      description: 'A leather pouch designed to fit inside a pill box and preserve the power of certain very potent pills.',
    },
    unbreakableChain: {
      id: 'unbreakableChain',
      name: 'unbreakable chain',
      type: 'chain',
      value: 1,
      description: 'This chain is specially forged to be incredibly strong, but it\'s REALLY heavy.',
    },
    everlastingBrick: {
      id: 'everlastingBrick',
      name: 'everlasting brick',
      type: 'brick',
      value: 1,
      description: 'This brick is specially made to bear unimaginable weight.',
    },
    everlastingMortar: {
      id: 'everlastingMortar',
      name: 'everlasting mortar',
      type: 'mortar',
      value: 1,
      description: 'This mortar is specially made to hold up even the highest building.',
    },
    scaffolding: {
      id: 'scaffolding',
      name: 'scaffolding',
      type: 'scaffolding',
      value: 1,
      description: 'This scaffolding allows you to work for the next level of your tower.',
    },
    windTome: {
      id: 'windTome',
      name: 'Tome of Wind Control',
      type: 'windTome',
      value: 1,
      description: 'This book contains a great deal of research on how winds work and how they can be tamed.',
    },
    army: {
      id: 'army',
      name: 'a vast army',
      type: 'army',
      value: 1,
      description: 'This is an army. It fits nicely in your backpack due to your mastery of transdimensional magic.',
    },
    immortality: {
      id: 'immortality',
      name: 'Essence of Immortality',
      type: 'immortality',
      value: Infinity,
      description: 'The object of your obsession. Using this will make you immortal.',
      useLabel: 'Become Immortal',
      useDescription: 'Become immortal and win the game.',
      useConsumes: true,
      use: () => {
        if (!this.impossibleTaskService){
          this.impossibleTaskService = this.injector.get(ImpossibleTaskService);
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.OvercomeDeath].progress++;
        this.impossibleTaskService.activeTaskIndex = ImpossibleTaskType.OvercomeDeath; // just in case. Don't want this use to fail.
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.OvercomeDeath].complete){
          this.logService.addLogMessage("YOU HAVE ACHIEVED IMMORTALITY! YOU WILL LIVE FOREVER!", "INJURY", 'STORY');
          if (!this.gameStateService){
            this.gameStateService = this.injector.get(GameStateService);
          }
          if (this.gameStateService.easyModeEver){
            this.logService.addLogMessage("Good work, even if you did take the easy path. For more of a challenge, you could reset and try without using the easy game mode.", "STANDARD", 'STORY');
          }
          this.logService.addLogMessage("You won this game in " + this.mainLoopService.totalTicks + " days over " + this.characterService.characterState.totalLives + " lifetimes. I wonder if other immortals have ever done it faster?", "STANDARD", 'STORY');
          this.characterService.characterState.immortal = true;
        }
      },
    },
    fingers: {
      id: 'fingers',
      name: 'fingers',
      type: 'fingers',
      value: 1,
      description: 'A handful of bloody fingers. The demons carry them as grisly trophies. Now, it seems, you do too.',
    },
    tokenOfGratitude: {
      id: 'tokenOfGratitude',
      name: 'token of gratitude',
      type: 'tokenOfGratitude',
      value: 1,
      description: 'A small keepsake from your family member.',
    },
    mirrorShard: {
      id: 'mirrorShard',
      name: 'mirror shard',
      type: 'mirrorShard',
      value: 1,
      description: 'A shard of broken glass. You carefully turn the reflective side away from you.',
    },
    hellCrownTongueRippers: {
      id: 'hellCrownTongueRippers',
      name: 'Crown of the Tongue Rippers',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown proving your mastery over the Hell of Tongue Rippers. Using this will unlock a new type of follower.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.TongueRipping)){
          this.hellService.completedHellBosses.push(HellLevel.TongueRipping);
        }
        this.logService.addLogMessage("The crown of the Hell of Tongue Rippers settles onto your head, then sinks in to become a part of your very soul. You feel that your words carry a new power that can inspire a new kind of follower to worship you as the god you are becoming. Perhaps a trip back to the mortal realm through reincarnation might we worthwhile.", "STANDARD", 'STORY');
        this.followerService.unlockJob("prophet");
      },
    },
    hellCrownScissors: {
      id: 'hellCrownScissors',
      name: 'Crown of Scissors',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown proving your mastery over the Hell of Scissors. Using this will unlock a new ability for your followers.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Scissors)){
          this.hellService.completedHellBosses.push(HellLevel.Scissors);
        }
        this.logService.addLogMessage("The Crown of Scissors settles onto your head, then sinks in to become a part of your very soul. You feel a deeper appreciation for marriage and family, and your followers sense it.", "STANDARD", 'STORY');
        this.logService.addLogMessage("From now on, each follower will train a child to replace themselves in your service when they pass away.", "STANDARD", 'STORY');
        this.followerService.autoReplaceUnlocked = true;
      },
    },
    hellCrownTreesOfKnives: {
      id: 'hellCrownTreesOfKnives',
      name: 'Crown of Knives',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown proving your mastery over the Hell of Trees of Knives. Using this will unlock a new follower.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.TreesOfKnives)){
          this.hellService.completedHellBosses.push(HellLevel.TreesOfKnives);
        }
        this.logService.addLogMessage("The crown of Knives settles onto your head, then sinks in to become a part of your very soul. You can recruit a new follower specialized in honoring ancestors.", "STANDARD", 'STORY');
        this.followerService.unlockJob("moneyBurner");
      },
    },
    hellCrownMirrors: {
      id: 'hellCrownMirrors',
      name: 'Crown of Mirrors',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown proving your mastery over the Hell of Mirrors. Using this will unlock a new understanding of combat.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Mirrors)){
          this.hellService.completedHellBosses.push(HellLevel.Mirrors);
        }
        this.logService.addLogMessage("The crown of Mirrors settles onto your head, then sinks in to become a part of your very soul. A deep understanding of combat based on your many battles with yourself reveals itself in a moment of enlightenment.", "STANDARD", 'STORY');
        this.characterService.characterState.attributes.combatMastery.value += 1;
        this.activityService.CombatTraining.unlocked = true;
      },
    },
    hellCrownSteamers: {
      id: 'hellCrownSteamers',
      name: 'Crown of Steam',
      type: 'hellcrown',
      value: Infinity,
      description: 'A misty crown proving your mastery over the Hell of Steamers. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.battleService){
          this.battleService = this.injector.get(BattleService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Steamers)){
          this.hellService.completedHellBosses.push(HellLevel.Steamers);
        }
        this.logService.addLogMessage("The crown of Steam settles onto your head, then sinks in to become a part of your very soul. You learn to harness the intense heat of the Hell of Steamers in a powerful magical blast.", "STANDARD", 'STORY');
        this.battleService.pyroclasmUnlocked = true;
      },
    },
    hellCrownPillars: {
      id: 'hellCrownPillars',
      name: 'Crown of Pillars',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown topped with tiny copper pillar proving your mastery over the hell for arsonists. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService){
          this.hellService = this.injector.get(HellService);
        }
        if (!this.battleService){
          this.battleService = this.injector.get(BattleService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.CopperPillars)){
          this.hellService.completedHellBosses.push(HellLevel.CopperPillars);
        }
        this.logService.addLogMessage("The crown of Pillars settles onto your head, then sinks in to become a part of your very soul. Your inner fire stretches toward your skin, forming a barrier to protect you and harm your enemies.", "STANDARD", 'STORY');
        this.battleService.fireShieldUnlocked = true;
      },
    },
    //TODO: tune prices on all manuals, currently silly cheap for testing
    fastPlayManual: {
      id: 'fastPlayManual',
      name: "Manual of Expeditious Time Perception",
      type: "manual",
      description: "This manual teaches you to perceive time as moving faster.",
      value: 28000,
      useLabel: "Read",
      useDescription: "Permanently unlock fast game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastSpeed = true;
        this.mainLoopService.topDivider = this.mainLoopService.topDivider > 5 ? 5: this.mainLoopService.topDivider;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.unlockFastSpeed;
      }
    },
    fasterPlayManual: {
      id: 'fasterPlayManual',
      name: "Manual of Greatly Expeditious Time Perception",
      type: "manual",
      description: "This manual teaches you to perceive time as moving much faster.",
      value: 100000,
      useLabel: "Read",
      useDescription: "Permanently unlock faster game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFasterSpeed = true;
        this.mainLoopService.topDivider = this.mainLoopService.topDivider > 2 ? 2: this.mainLoopService.topDivider;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.unlockFasterSpeed;
      }
    },
    fastestPlayManual: {
      id: 'fastestPlayManual',
      name: "Manual of Ludicrous Time Perception",
      type: "manual",
      description: "This manual teaches you to perceive time as moving incredibly fast.",
      value: 800000,
      useLabel: "Read",
      useDescription: "Permanently unlock fastest game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastestSpeed = true;
        this.mainLoopService.topDivider = 1;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.unlockFastestSpeed;
      }
    },
    restartActivityManual: {
      id: 'restartActivityManual',
      name: "Manual of Remembered Plans",
      type: "manual",
      description: "This manual teaches you to automatically resume activities from your previous life. Only activities that you qualify for when you reach adulthood are available to resume.",
      value: 500,
      useLabel: "Read",
      useDescription: "Permanently unlock preserving activity plans across reincarnations.",
      useConsumes: true,
      use: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoRestart = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService?.autoRestart;
      }
    },
    autoSellManual: {
      id: 'autoSellManual',
      name: "Manual of Mercantile Fluency",
      type: "manual",
      description: "This manual teaches you to automatically sell items.",
      value: 80000,
      useLabel: "Read",
      useDescription: "Permanently unlock Autosell button in the inventory panel.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellUnlocked;
      }
    },
    autoUseManual: {
      id: 'autoUseManual',
      name: "Manual of Facilitated Usage",
      type: "manual",
      description: "This manual teaches you to automatically use items.",
      value: 1000000,
      useLabel: "Read",
      useDescription: "Permanently unlock Autouse button in the inventory panel.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoUseUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoUseUnlocked;
      }
    },
    autoBalanceManual: {
      id: 'autoBalanceManual',
      name: "Manual of Balanced Consumption and Mercantile Moderation",
      type: "manual",
      description: "This manual teaches you to automatically balance between using and selling items.",
      value: 5e7,
      useLabel: "Read",
      useDescription: "Permanently unlock Autobalance button in the inventory panel.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoBalanceUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoBalanceUnlocked;
      }
    },
    autoBuyLandManual: {
      id: 'autoBuyLandManual',
      name: "Manual of Land Acquisition",
      type: "manual",
      description: "This manual teaches you to automatically purchase land.",
      value: 2000000,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic land purchasing.",
      useConsumes: true,
      use: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyLandUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyLandUnlocked;
      }
    },
    autoBuyHomeManual: {
      id: 'autoBuyHomeManual',
      name: "Manual of Home Improvement",
      type: "manual",
      description: "This manual teaches you to automatically upgrade your home.",
      value: 1e7,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic home upgrades.",
      useConsumes: true,
      use: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyHomeUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyHomeUnlocked;
      }
    },
    autoBuyFurnitureManual: {
      id: 'autoBuyFurnitureManual',
      name: "Manual of Home Furnishing",
      type: "manual",
      description: "This manual teaches you to automatically buy the last furniture you bought for your home in future lives.",
      value: 8e7,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic purchasing for furniture.",
      useConsumes: true,
      use: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyFurnitureUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyFurnitureUnlocked;
      }
    },
    autoBuyerSettingsManual: {
      id: 'autoBuySettingsManual',
      name: "Manual of Customized Automation",
      type: "manual",
      description: "This manual teaches you to customize the order and behavior of auto-buying.",
      value: 1e9,
      useLabel: "Read",
      useDescription: "Permanently unlock auto-buying customization",
      useConsumes: true,
      use: () => {
        if (!this.autoBuyerService){
          this.autoBuyerService = this.injector.get(AutoBuyerService);
        }
        this.autoBuyerService.autoBuyerSettingsUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.autoBuyerService){
          this.autoBuyerService = this.injector.get(AutoBuyerService);
        }
        return this.autoBuyerService.autoBuyerSettingsUnlocked;
      }
    },
    autoFieldManual: {
      id: 'autoFieldManual',
      name: "Manual of Field Conversion",
      type: "manual",
      description: "This manual teaches you to automatically plow open land into fields.",
      value: 2000000,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic field plowing.",
      useConsumes: true,
      use: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoFieldUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoFieldUnlocked;
      }
    },
    autoPotionManual: {
      id: 'autoPotionManual',
      name: "Manual of Gluttonous Potion Consumption",
      type: "manual",
      description: "This manual teaches you to automatically use all potions.",
      value: 2e8,
      useLabel: "Read",
      useDescription: "Permanently unlock autodrinking all potions.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoPotionUnlocked = true;
        for (let index = this.inventoryService.autoUseEntries.length - 1; index >= 0; index--){
          if (this.inventoryService.autoUseEntries[index].name.includes("Potion")){
            this.inventoryService.autoUseEntries.splice(index, 1);
          }
        }
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoPotionUnlocked;
      }
    },
    autoPillManual: {
      id: 'autoPotionManual',
      name: "Manual of Reckless Pill Consumption",
      type: "manual",
      description: "This manual teaches you to automatically use all pills.",
      value: 1e10,
      useLabel: "Read",
      useDescription: "Permanently unlock autoswallowing all pills.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoPillUnlocked = true;
        for (let index = this.inventoryService.autoUseEntries.length - 1; index >= 0; index--){
          if (this.inventoryService.autoUseEntries[index].name.includes("Pill")){
            this.inventoryService.autoUseEntries.splice(index, 1);
          }
        }
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoPillUnlocked;
      }
    },
    autoTroubleManual: {
      id: 'autoTroubleManual',
      name: "Manual of Consistent Troublemaking",
      type: "manual",
      description: "This manual teaches you to automatically look for trouble.",
      value: 5e8,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic trouble in the battle panel.",
      useConsumes: true,
      use: () => {
        // check if battleService is injected yet, if not, inject it (circular dependency issues)
        if (!this.battleService){
          this.battleService = this.injector.get(BattleService);
        }
        this.battleService.autoTroubleUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if battleService is injected yet, if not, inject it (circular dependency issues)
        if (!this.battleService){
          this.battleService = this.injector.get(BattleService);
        }
        return this.battleService?.autoTroubleUnlocked;
      }
    },
    autoWeaponMergeManual: {
      id: 'autoWeaponMergeManual',
      name: "Manual of Effortless Weapon Merging",
      type: "manual",
      description: "This manual teaches you to automatically merge weapons.",
      value: 1e9,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic weapon merging in the inventory panel.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoWeaponMergeUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoWeaponMergeUnlocked;
      }
    },
    autoArmorMergeManual: {
      id: 'autoArmorMergeManual',
      name: "Manual of Effortless Armor Merging",
      type: "manual",
      description: "This manual teaches you to automatically merge armor.",
      value: 1e9,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic armor merging in the inventory panel.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoArmorMergeUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoArmorMergeUnlocked;
      }
    },
    useSpiritGemManual: {
      id: 'useSpiritGemManual',
      name: "Manual of Spirit Gem Comprehension",
      type: "manual",
      description: "This manual teaches you to incorporate spirit gems in your crafting.",
      value: 500000,
      useLabel: "Read",
      useDescription: "Permanently unlock including spirit gems when creating items.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.useSpiritGemUnlocked = true;
        this.inventoryService.useSpiritGemWeapons = true;
        this.inventoryService.useSpiritGemPotions = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.useSpiritGemUnlocked;
      }
    },
    bestHerbsManual: {
      id: 'bestHerbsManual',
      name: "Manual of the Herbal Connoisseur",
      type: "manual",
      description: "This manual teaches you to automatically sell any herbs below your current ability to gather.",
      value: 5000000,
      useLabel: "Read",
      useDescription: "Permanently unlock autoselling lower grade herbs.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldHerbs = true;
        this.inventoryService.autoSellOldHerbsEnabled = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldHerbs;
      }
    },
    bestWoodManual: {
      id: 'bestWoodManual',
      name: "Manual of the Discerning Wood Collector",
      type: "manual",
      description: "This manual teaches you to automatically sell any logs below your current ability to gather.",
      value: 5000000,
      useLabel: "Read",
      useDescription: "Permanently unlock autoselling lower grade logs.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldWood = true;
        this.inventoryService.autoSellOldWoodEnabled = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldWood;
      }
    },
    bestOreManual: {
      id: 'bestOreManual',
      name: "Manual of Mineral Pragmatism",
      type: "manual",
      description: "This manual teaches you to automatically sell any ores and bars below your current ability to gather.",
      value: 5000000,
      useLabel: "Read",
      useDescription: "Permanently unlock autoselling lower grade ores and bars.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldOre = true;
        this.inventoryService.autoSellOldOreEnabled = true;
        this.inventoryService.autoSellOldBarsEnabled = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldOre;
      }
    },
    bestWeaponManual: {
      id: 'bestWeaponManual',
      name: "Manual of Wise Weapon Selection",
      type: "manual",
      description: "This manual teaches you to automatically equip the best weapons that you have.",
      value: 1e10,
      useLabel: "Read",
      useDescription: "Permanently unlock autoequipping the best weapons in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoequipBestWeapon = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoequipBestWeapon;
      }
    },
    bestArmorManual: {
      id: 'bestArmorManual',
      name: "Manual of Defensive Preparation",
      type: "manual",
      description: "This manual teaches you to automatically equip the best armor that you have.",
      value: 1e10,
      useLabel: "Read",
      useDescription: "Permanently unlock autoequipping the best armor in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoequipBestArmor = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoequipBestArmor;
      }
    },
    betterStorageManual: {
      id: 'betterStorageManual',
      name: "Manual of Efficient Item Storage",
      type: "manual",
      description: "This manual teaches you to store items more efficiently so you can keep more in each stack.",
      value: 1000000,
      useLabel: "Read",
      useDescription: "Permanently increase by ten times the number of items you can put in each stack in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 1000;
      }
    },
    evenBetterStorageManual: {
      id: 'evenBetterStorageManual',
      name: "Manual of Hyperefficient Item Storage",
      type: "manual",
      description: "This manual teaches you to store items more efficiently so you can keep more in each stack.",
      value: 1e8,
      useLabel: "Read",
      useDescription: "Permanently increase by ten times the number of items you can put in each stack in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 10000;
      }
    },
    bestStorageManual: {
      id: 'bestStorageManual',
      name: "Manual of Hyperspatial Item Storage",
      type: "manual",
      description: "This manual teaches you to store items more efficiently so you can keep more in each stack.",
      value: 1e8,
      useLabel: "Read",
      useDescription: "Permanently increase by ten times the number of items you can put in each stack in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 100000;
      }
    },
    followerAutoDismissManual: {
      id: 'followerAutoDismissManual',
      name: "Manual of Judicious Disciple Selection",
      type: "manual",
      description: "This manual teaches you to automatically dismiss followers based on their jobs.",
      value: 1e11,
      useLabel: "Read",
      useDescription: "Permanently increase by ten times the number of items you can put in each stack in your inventory.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        this.followerService.autoDismissUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.followerService){
          this.followerService = this.injector.get(FollowersService);
        }
        return this.followerService.autoDismissUnlocked;
      }
    },
    bestGemsManual: {
      id: 'bestGemsManual',
      name: "Manual of Gemological Purity",
      type: "manual",
      description: "This manual teaches you to automatically sell gems that are below the value of the gems your current monster drops.",
      value: 1e9,
      useLabel: "Read",
      useDescription: "Permanently unlock gem autoselling for lower level gems.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldGemsUnlocked = true;
        this.inventoryService.autoSellOldGemsEnabled = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldGemsUnlocked;
      }
    },
    autoPauseSettingsManual: {
      id: 'autoPauseSettingsManual',
      name: "Manual of Customized Danger Sensing",
      type: "manual",
      description: "This manual teaches you to customize options for automatically pausing the game.",
      value: 1e7,
      useLabel: "Read",
      useDescription: "Permanently unlock auto-pausing customization",
      useConsumes: true,
      use: () => {
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoPauseUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService.autoPauseUnlocked;
      }
    },
    bankedTicksEfficiencyManual: {
      id: 'bankedTicksEfficiencyManual',
      name: "Manual of Efficient Time Banking",
      type: "manual",
      description: "This manual teaches you to more efficiently bank ticks when paused or offline.",
      value: 2.5e9,
      useLabel: "Read",
      useDescription: "Permanently increase banked tick efficiency to 50%.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.offlineDivider = 2;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.offlineDivider <= 2;
      }
    },
    autoRestManual: {
      id: 'autoRestManual',
      name: "Manual of Timely Rest",
      type: "manual",
      description: "This manual teaches you to avoid overwork by resting just in time.",
      value: 4e10,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic resting.",
      useConsumes: true,
      use: () => {
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoRestUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService.autoRestUnlocked;
      }
    },
    ageSpeedManual: {
      id: 'ageSpeedManual',
      name: "Manual of Aged Time Perception",
      type: "manual",
      description: "This manual teaches you to percieve time faster the older you are.",
      value: 7.5e9,
      useLabel: "Read",
      useDescription: "Permanently increase time passage based on your age.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockAgeSpeed = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.unlockAgeSpeed;
      }
    },
    totalPlaytimeManual: {
      id: 'totalPlaytimeManual',
      name: "Manual of Lifetime Time Perception",
      type: "manual",
      description: "This manual teaches you to percieve time faster the longer you've lived across all your lives.",
      value: 5e10,
      useLabel: "Read",
      useDescription: "Permanently increase time passage based on your total time lived.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockPlaytimeSpeed = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        return this.mainLoopService.unlockPlaytimeSpeed;
      }
    },
  }

  constructor(private characterService: CharacterService,
    private injector: Injector,
    private logService: LogService,
    private mainLoopService: MainLoopService) {

  }

  getItemById(id: string): Item | undefined {
    if (this.items[id]){
      return this.items[id];
    }
    return undefined;
  }

  getFurnitureById(id: string): Furniture | null {
    if (this.furniture[id]){
      return this.furniture[id];
    }
    return null;
  }

}

