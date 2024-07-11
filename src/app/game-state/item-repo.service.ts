import { Injectable, Injector } from '@angular/core';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { Furniture, InventoryService, Item } from './inventory.service';
import { ImpossibleTaskService, ImpossibleTaskType } from './impossibleTask.service';
import { FollowersService } from './followers.service';
import { AutoBuyerService } from './autoBuyer.service';
import { GameStateService } from './game-state.service';
import { HellLevel, HellService } from './hell.service';

const daysInYear = 365;
@Injectable({
  providedIn: 'root',
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

  colorByRank: string[] = [
    'darkgray',
    'gray',
    'lightgray',
    'white',
    'darkgreen',
    'green',
    'lightgreen',
    'darkblue',
    'blue',
    'lightblue',
    'darkviolet',
    'purple',
    'fuchsia',
    'darkorange',
    'orange',
    'yellow',
    'gold',
    'red',
  ];

  furniture: { [key: string]: Furniture } = {
    blanket: {
      id: 'blanket',
      name: 'Blanket',
      type: 'furniture',
      slot: 'bed',
      value: 10,
      description:
        'A tattered blanket. Not much, but it could keep you warm at night. Increases daily stamina recovery by 1.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value++;
      },
    },
    mat: {
      id: 'mat',
      name: 'Sleeping Mat',
      type: 'furniture',
      slot: 'bed',
      value: 1000,
      description: 'A thin woven mat to sleep on. Increases daily stamina recovery by 1 and restores a bit of health.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 1;
        this.characterService.characterState.status.health.value += 0.1;
        this.characterService.characterState.checkOverage();
      },
    },
    canopyBed: {
      id: 'canopyBed',
      name: 'Canopy Bed',
      type: 'furniture',
      slot: 'bed',
      value: 10000,
      description:
        'A fine bed with a cover. Curtains keep the mosquitoes off you during the night. Increases daily stamina recovery by 2 and restores a bit of health.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 2;
        this.characterService.characterState.status.health.value += 0.2;
        this.characterService.characterState.checkOverage();
      },
    },
    heatedBed: {
      id: 'heatedBed',
      name: 'Heated Bed',
      type: 'furniture',
      slot: 'bed',
      value: 100000,
      description:
        'A bed built over a small clay oven. Keeps you toasty on even the coldest nights. Increases daily stamina recovery by 5 and improves health recovery.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      },
    },
    bedOfNails: {
      id: 'bedOfNails',
      name: 'Bed of Nails',
      type: 'furniture',
      slot: 'bed',
      value: 10000,
      description:
        "A solid board with nails poking upwards. You won't sleep as well, but it is certain to toughen you up.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value -= 1;
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
      },
    },
    waterBucket: {
      id: 'waterBucket',
      name: 'water bucket ',
      type: 'furniture',
      slot: 'bathtub',
      value: 10,
      description: 'A bucket of water that lets you splash water on your face. Increases charisma.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.01);
      },
    },
    washBasin: {
      id: 'washBasin',
      name: 'wash basin',
      type: 'furniture',
      slot: 'bathtub',
      value: 1000,
      description: 'A wash basin with a rag to clean yourself. Increases charisma.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.05);
      },
    },
    woodenTub: {
      id: 'woodenTub',
      name: 'wooden tub',
      type: 'furniture',
      slot: 'bathtub',
      value: 10000,
      description: 'A tall and narrow tub where you can squat and bathe. Increases charisma and health recovery.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.1);
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      },
    },
    bronzeTub: {
      id: 'bronzeTub',
      name: 'bronze tub',
      type: 'furniture',
      slot: 'bathtub',
      value: 1000000,
      description: 'A luxurious tub where you can get sparkling clean. Increases charisma and health recovery.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.2);
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.checkOverage();
      },
    },
    heatedTub: {
      id: 'heatedTub',
      name: 'heated tub',
      type: 'furniture',
      slot: 'bathtub',
      value: 1e8,
      description: 'A luxurious tub with its own heating stove. Good for your health and beauty.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.2);
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.healthBonusBath++;
        this.characterService.characterState.checkOverage();
      },
    },
    cookPot: {
      id: 'cookPot',
      name: 'cook pot',
      type: 'furniture',
      slot: 'kitchen',
      value: 10,
      description: 'A simple pot over a fire to boil your food. Improves all physical attributes.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.01);
        this.characterService.characterState.increaseAttribute('speed', 0.01);
        this.characterService.characterState.increaseAttribute('toughness', 0.01);
      },
    },
    roastingSpit: {
      id: 'roastingSpit',
      name: 'roasting spit',
      type: 'furniture',
      slot: 'kitchen',
      value: 1000,
      description:
        'A simple spit to go along with your cookpot, letting you add more variety to your diet. Improves all physical attributes.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.02);
        this.characterService.characterState.increaseAttribute('speed', 0.02);
        this.characterService.characterState.increaseAttribute('toughness', 0.02);
      },
    },
    wok: {
      id: 'wok',
      name: 'wok',
      type: 'furniture',
      slot: 'kitchen',
      value: 1000000,
      description: 'A large metal wok to stir-fry a tasty dinner. Improves all physical attributes.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.05);
        this.characterService.characterState.increaseAttribute('speed', 0.05);
        this.characterService.characterState.increaseAttribute('toughness', 0.05);
      },
    },
    chefKitchen: {
      id: 'chefKitchen',
      name: 'chef kitchen',
      type: 'furniture',
      slot: 'kitchen',
      value: 1e9,
      description: 'An elaborate kitchen that allows you to cook anything. Improves all physical attributes.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('strength', 0.1);
        this.characterService.characterState.increaseAttribute('speed', 0.1);
        this.characterService.characterState.increaseAttribute('toughness', 0.1);
      },
    },
    anvil: {
      id: 'anvil',
      name: 'anvil',
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: 'An anvil to work on blacksmithing.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('metalLore', 0.01);
      },
    },
    herbGarden: {
      id: 'herbGarden',
      name: 'herb garden',
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: 'An pleasant garden growing herbs.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('woodLore', 0.01);
      },
    },
    dogKennel: {
      id: 'dogKennel',
      name: 'dog kennel',
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: 'A kennel for training hunting dogs.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('animalHandling', 0.01);
      },
    },
    cauldron: {
      id: 'cauldron',
      name: 'cauldron',
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: 'A cauldron for practicing alchemy.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('waterLore', 0.01);
      },
    },
    bookshelf: {
      id: 'bookshelf',
      name: 'bookshelf',
      type: 'furniture',
      slot: 'workbench',
      value: 1000000,
      description: 'An bookshelf to read and expand your mind.',
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('intelligence', 0.1);
      },
    },
    prayerShrine: {
      id: 'prayerShrine',
      name: 'prayer shrine',
      type: 'furniture',
      slot: 'workbench',
      value: 1e7,
      description:
        "A quiet shrine for contemplative prayer. You won't be able to use this unless you have some innate spirituality.",
      useConsumes: false,
      use: () => {
        if (this.characterService.characterState.attributes.spirituality.value > 0) {
          this.characterService.characterState.increaseAttribute('spirituality', 0.01);
        }
      },
    },
  };

  items: { [key: string]: Item } = {
    rice: {
      id: 'rice',
      imageFile: 'rice',
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
      imageFile: 'cabbage',
      name: 'cabbage',
      type: 'food',
      value: 5,
      description: 'A simple, healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.01) {
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.health.value += quantity;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    beans: {
      id: 'beans',
      imageFile: 'beans',
      name: 'beans',
      type: 'food',
      value: 10,
      description: 'A handful of healthy vegetables.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.02;
        const maxLifespanIncrease = 5;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    broccoli: {
      id: 'broccoli',
      imageFile: 'broccoli',
      name: 'broccoli',
      type: 'food',
      value: 15,
      description: 'Little green trees. A very healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.05;
        const maxLifespanIncrease = 10;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    calabash: {
      id: 'calabash',
      imageFile: 'calabash',
      name: 'calabash',
      type: 'food',
      value: 20,
      description: 'A tasty gourd with health-giving properties.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.08;
        const maxLifespanIncrease = 15;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    taro: {
      id: 'taro',
      imageFile: 'taro',
      name: 'taro',
      type: 'food',
      value: 25,
      description: 'A healthy root vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.1;
        const maxLifespanIncrease = 20;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    pear: {
      id: 'pear',
      imageFile: 'pear',
      name: 'pear',
      type: 'food',
      value: 30,
      description: 'A tasty fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.12;
        const maxLifespanIncrease = 25;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    melon: {
      id: 'melon',
      imageFile: 'melon',
      name: 'melon',
      type: 'food',
      value: 35,
      description: 'A yummy fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.15;
        const maxLifespanIncrease = 30;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    plum: {
      id: 'plum',
      imageFile: 'plum',
      name: 'plum',
      type: 'food',
      value: 40,
      description: 'An excellent fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.18;
        const maxLifespanIncrease = 35;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    apricot: {
      id: 'apricot',
      imageFile: 'apricot',
      name: 'apricot',
      type: 'food',
      value: 45,
      description: 'A delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy and hardy.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.2;
        const maxLifespanIncrease = 40;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity);
      },
    },
    peach: {
      id: 'peach',
      imageFile: 'peach',
      name: 'peach',
      type: 'food',
      value: 50,
      description: 'A highly prized and delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and can even lead to a long life.',
      useConsumes: true,
      use: (quantity = 1) => {
        const lifespanChance = 0.22;
        const maxLifespanIncrease = 72;
        const healValue = 2;
        this.eatProduce(lifespanChance, maxLifespanIncrease, quantity, healValue);
      },
    },
    divinePeach: {
      id: 'divinePeach',
      imageFile: 'divinePeach',
      name: 'divine peach',
      type: 'food',
      value: 100,
      description: 'A divinely prized and delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Sates your immortal hunger.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.max += quantity;
        this.characterService.characterState.status.nourishment.value += quantity;
        this.characterService.characterState.healthBonusFood += quantity * 2;
        this.characterService.characterState.status.health.value += quantity * 20;
        this.characterService.characterState.status.stamina.value += quantity * 2;
        this.characterService.characterState.status.stamina.max += quantity * 2;
        this.characterService.characterState.status.mana.value += quantity;
        if (this.characterService.characterState.foodLifespan + quantity <= daysInYear * 720) {
          this.characterService.characterState.foodLifespan += quantity;
        } else if (this.characterService.characterState.foodLifespan < daysInYear * 720) {
          this.characterService.characterState.foodLifespan = daysInYear * 720;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    distilledPeachEssence: {
      id: 'distilledPeachEssence',
      imageFile: 'distilledPeachEssence',
      name: 'distilled peach essence',
      type: 'healthRestore',
      value: 1000,
      description:
        'An alchemical masterpiece created from the most perfect of peaches. When equipped, automatically consumed to restore 50 health when needed.',
      restoreAmount: 50,
      pouchable: true,
    },
    meat: {
      id: 'meat',
      imageFile: 'meat',
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
      imageFile: 'spiritMeat',
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
      imageFile: 'fish',
      name: 'carp',
      type: 'food',
      value: 50,
      description: 'A common fish.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly. Might also improve your health and stamina.',
      useConsumes: true,
      use: (quantity = 1) => {
        this.characterService.characterState.status.nourishment.value += quantity;
        if (Math.random() < 0.1) {
          this.characterService.characterState.healthBonusFood += quantity;
          this.characterService.characterState.status.stamina.max += quantity;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    hide: {
      id: 'hide',
      imageFile: 'hide1',
      imageColor: this.colorByRank[0],
      name: 'tattered hide',
      type: 'hide',
      value: 1,
      description: 'A tattered animal hide.',
    },
    thinPelt: {
      id: 'thinPelt',
      imageFile: 'hide2',
      imageColor: this.colorByRank[1],
      name: 'thin pelt',
      type: 'hide',
      value: 2,
      description: 'A thin fur pelt.',
    },
    plainLeather: {
      id: 'plainLeather',
      imageFile: 'hide3',
      imageColor: this.colorByRank[2],
      name: 'plain leather',
      type: 'hide',
      value: 3,
      description: 'A basic leather hide.',
    },
    scaleSkin: {
      id: 'scaleSkin',
      imageFile: 'hide4',
      imageColor: this.colorByRank[3],
      name: 'scale skin',
      type: 'hide',
      value: 4,
      description: 'A scaly reptile skin.',
    },
    thickFur: {
      id: 'thickFur5',
      imageFile: 'hide',
      imageColor: this.colorByRank[4],
      name: 'thick fur',
      type: 'hide',
      value: 5,
      description: 'A thick animal fur.',
    },
    armoredHide: {
      id: 'armoredHide',
      imageFile: 'hide6',
      imageColor: this.colorByRank[5],
      name: 'armored hide',
      type: 'hide',
      value: 6,
      description: 'An armored animal hide.',
    },
    frozenScales: {
      id: 'frozenScales',
      imageFile: 'hide7',
      imageColor: this.colorByRank[6],
      name: 'frozen scales',
      type: 'hide',
      value: 7,
      description: 'A frozen scaly hide.',
    },
    mysticalLeather: {
      id: 'mysticalLeather',
      imageFile: 'hide8',
      imageColor: this.colorByRank[7],
      name: 'mystical leather',
      type: 'hide',
      value: 8,
      description: 'A mystical animal hide.',
    },
    infernalFur: {
      id: 'infernalFur',
      imageFile: 'hide9',
      imageColor: this.colorByRank[8],
      name: 'infernal fur',
      type: 'hide',
      value: 9,
      description: 'A diabolical pelt.',
    },
    orichalcumHide: {
      id: 'orichalcumHide',
      imageFile: 'hide10',
      imageColor: this.colorByRank[9],
      name: 'orichalcum hide',
      type: 'hide',
      value: 10,
      description: 'A strong magic-infused hide.',
    },
    tempestScales: {
      id: 'tempestScales',
      imageFile: 'hide11',
      imageColor: this.colorByRank[10],
      name: 'tempest scales',
      type: 'hide',
      value: 11,
      description: 'A hide bristling with electricity.',
    },
    evergreenVeil: {
      id: 'evergreenVeil',
      imageFile: 'hide12',
      imageColor: this.colorByRank[11],
      name: 'evergreen veil',
      type: 'hide',
      value: 12,
      description: 'An extremely durable hide .',
    },
    sovereignLeather: {
      id: 'sovereignLeather',
      imageFile: 'hide13',
      imageColor: this.colorByRank[12],
      name: 'sovereign leather',
      type: 'hide',
      value: 13,
      description: 'A powerful hide of a noble animal.',
    },
    abyssalFur: {
      id: 'abyssalFur',
      imageFile: 'hide14',
      imageColor: this.colorByRank[13],
      name: 'abyssal fur',
      type: 'hide',
      value: 14,
      description: 'A fur brimming with unholy power.',
    },
    umbralHide: {
      id: 'umbralHide',
      imageFile: 'hide15',
      imageColor: this.colorByRank[14],
      name: 'umbral hide',
      type: 'hide',
      value: 15,
      description: 'A hide made of shadows themselves.',
    },
    divineVeil: {
      id: 'divineVeil',
      imageFile: 'hide16',
      imageColor: this.colorByRank[15],
      name: 'divine veil',
      type: 'hide',
      value: 16,
      description: 'A hide consecrated with divine protection.',
    },
    balsaLog: {
      id: 'balsaLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[0],
      name: 'balsa log',
      type: 'wood',
      value: 1,
      description: 'A really soft log.',
    },
    elmLog: {
      id: 'elmLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[1],
      name: 'elm log',
      type: 'wood',
      value: 2,
      description: 'A soft log.',
    },
    cypressLog: {
      id: 'cypressLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[2],
      name: 'cypress log',
      type: 'wood',
      value: 3,
      description: 'A poor quality log.',
    },
    walnutLog: {
      id: 'walnutLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[3],
      name: 'walnut log',
      type: 'wood',
      value: 4,
      description: 'An adequate quality log.',
    },
    laurelwoodLog: {
      id: 'laurelwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[4],
      name: 'laurelwood log',
      type: 'wood',
      value: 5,
      description: 'A nice quality log.',
    },
    blackwoodLog: {
      id: 'blackwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[5],
      name: 'blackwood log',
      type: 'wood',
      value: 6,
      description: 'A good quality log.',
    },
    rosewoodLog: {
      id: 'rosewoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[6],
      name: 'rosewood log',
      type: 'wood',
      value: 7,
      description: 'A great quality log.',
    },
    pearwoodLog: {
      id: 'pearwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[7],
      name: 'pearwood log',
      type: 'wood',
      value: 8,
      description: 'An excellent quality log.',
    },
    zitanLog: {
      id: 'zitanLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[8],
      name: 'zitan log',
      type: 'wood',
      value: 9,
      description: 'An amazing quality log.',
    },
    lignumvitaeLog: {
      id: 'lignumvitaeLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[9],
      name: 'lignum vitae log',
      type: 'wood',
      value: 10,
      description: 'A log of the highest mortal quality.',
    },
    peachwoodlog: {
      id: 'peachwoodlog',
      imageFile: 'wood',
      imageColor: this.colorByRank[10],
      name: 'peachwood log',
      type: 'wood',
      value: 11,
      description: 'A log brimming with spiritual energy.',
    },
    diamondwoodLog: {
      id: 'diamondwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[11],
      name: 'diamondwood log',
      type: 'wood',
      value: 12,
      description: 'A log as hard as diamond.',
    },
    titanwoodLog: {
      id: 'titanwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[12],
      name: 'titanwood log',
      type: 'wood',
      value: 13,
      description: 'A log with the strength of titans.',
    },
    dragonwoodLog: {
      id: 'dragonwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[13],
      name: 'dragonwood log',
      type: 'wood',
      value: 14,
      description: 'A log blessed by dragons.',
    },
    devilwoodLog: {
      id: 'devilwoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[14],
      name: 'devilwood log',
      type: 'wood',
      value: 15,
      description: 'A demonic quality log.',
    },
    divinewoodLog: {
      id: 'divinewoodLog',
      imageFile: 'wood',
      imageColor: this.colorByRank[15],
      name: 'divinewood log',
      type: 'wood',
      value: 16,
      description: 'A divine quality log.',
    },
    copperOre: {
      id: 'copperOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[0],
      name: 'copper ore',
      type: 'ore',
      value: 1,
      description: 'A chunk of copper ore.',
    },
    tinOre: {
      id: 'tinOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[1],
      name: 'tin ore',
      type: 'ore',
      value: 2,
      description: 'A chunk of tin ore.',
    },
    bronzeOre: {
      id: 'bronzeOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[2],
      name: 'mixed ore',
      type: 'ore',
      value: 3,
      description: 'A chunk of ore containing copper, tin, lead, and zinc.',
    },
    ironOre: {
      id: 'ironOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[3],
      name: 'iron ore',
      type: 'ore',
      value: 4,
      description: 'A chunk of iron ore.',
    },
    steelOre: {
      id: 'steelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[4],
      name: 'coal-mixed iron ore',
      type: 'ore',
      value: 5,
      description: 'A chunk of iron ore laced with coal.',
    },
    mithrilOre: {
      id: 'mithrilOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[5],
      name: 'mithril ore',
      type: 'ore',
      value: 6,
      description: 'A chunk of mithril ore.',
    },
    greensteelOre: {
      id: 'greensteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[6],
      name: 'greensteel ore',
      type: 'ore',
      value: 7,
      description: 'A chunk of greensteel ore.',
    },
    bluesteelOre: {
      id: 'bluesteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[7],
      name: 'bluesteel ore',
      type: 'ore',
      value: 8,
      description: 'A chunk of bluesteel ore.',
    },
    redsteelOre: {
      id: 'redsteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[8],
      name: 'redsteel ore',
      type: 'ore',
      value: 9,
      description: 'A chunk of redsteel ore.',
    },
    flamesteelOre: {
      id: 'flamesteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[9],
      name: 'flamesteel ore',
      type: 'ore',
      value: 10,
      description: 'A chunk of flamesteel ore.',
    },
    froststeelOre: {
      id: 'froststeelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[10],
      name: 'froststeel ore',
      type: 'ore',
      value: 11,
      description: 'A chunk of froststeel ore.',
    },
    brightsteelOre: {
      id: 'brightsteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[11],
      name: 'brightsteel ore',
      type: 'ore',
      value: 12,
      description: 'A chunk of brightsteel ore.',
    },
    darksteelOre: {
      id: 'darksteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[12],
      name: 'darksteel ore',
      type: 'ore',
      value: 13,
      description: 'A chunk of darksteel ore.',
    },
    felsteelOre: {
      id: 'felsteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[13],
      name: 'felsteel ore',
      type: 'ore',
      value: 14,
      description: 'A chunk of felsteel ore.',
    },
    cloudsteelOre: {
      id: 'cloudsteelOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[14],
      name: 'cloudsteel ore',
      type: 'ore',
      value: 15,
      description: 'A chunk of cloudsteel ore.',
    },
    adamantOre: {
      id: 'adamantOre',
      imageFile: 'ore',
      imageColor: this.colorByRank[15],
      name: 'adamant ore',
      type: 'ore',
      value: 16,
      description: 'A chunk of adamant ore.',
    },
    // metal bars should always be 10x the value of the associated ore
    copperBar: {
      id: 'copperBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[0],
      name: 'copper bar',
      type: 'metal',
      value: 10,
      description: 'A bar of copper.',
    },
    tinBar: {
      id: 'tinBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[1],
      name: 'tin bar',
      type: 'metal',
      value: 20,
      description: 'A bar of tin.',
    },
    bronzeBar: {
      id: 'bronzeBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[2],
      name: 'bronze bar',
      type: 'metal',
      value: 30,
      description: 'A bar of bronze.',
    },
    ironBar: {
      id: 'ironBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[3],
      name: 'iron bar',
      type: 'metal',
      value: 40,
      description: 'A bar of iron.',
    },
    steelBar: {
      id: 'steelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[4],
      name: 'steel bar',
      type: 'metal',
      value: 50,
      description: 'A bar of steel.',
    },
    mithrilBar: {
      id: 'mithrilBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[5],
      name: 'mithril bar',
      type: 'metal',
      value: 60,
      description: 'A bar of of mithril.',
    },
    greensteelBar: {
      id: 'greensteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[6],
      name: 'greensteel bar',
      type: 'metal',
      value: 70,
      description: 'A bar of greensteel.',
    },
    bluesteelBar: {
      id: 'bluesteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[7],
      name: 'bluesteel bar',
      type: 'metal',
      value: 80,
      description: 'A bar of bluesteel.',
    },
    redsteelBar: {
      id: 'redsteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[8],
      name: 'redsteel bar',
      type: 'metal',
      value: 90,
      description: 'A bar of redsteel.',
    },
    flamesteelBar: {
      id: 'flamesteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[9],
      name: 'flamesteel bar',
      type: 'metal',
      value: 100,
      description: 'A bar of flamesteel.',
    },
    froststeelBar: {
      id: 'froststeelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[10],
      name: 'froststeel bar',
      type: 'metal',
      value: 110,
      description: 'A bar of froststeel.',
    },
    brightsteelBar: {
      id: 'brightsteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[11],
      name: 'brightsteel bar',
      type: 'metal',
      value: 120,
      description: 'A bar of brightsteel.',
    },
    darksteelBar: {
      id: 'darksteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[12],
      name: 'darksteel bar',
      type: 'metal',
      value: 130,
      description: 'A bar of darksteel.',
    },
    felsteelBar: {
      id: 'felsteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[13],
      name: 'felsteel bar',
      type: 'metal',
      value: 140,
      description: 'A bar of felsteel.',
    },
    cloudsteelBar: {
      id: 'cloudsteelBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[14],
      name: 'cloudsteel bar',
      type: 'metal',
      value: 150,
      description: 'A bar of cloudsteel.',
    },
    adamantBar: {
      id: 'adamantBar',
      imageFile: 'metal',
      imageColor: this.colorByRank[15],
      name: 'adamant bar',
      type: 'metal',
      value: 160,
      description: 'A bar of adamant.',
    },
    junk: {
      id: 'junk',
      imageFile: 'junk',
      name: 'junk',
      type: 'metal',
      value: 10,
      description: 'Some metal junk.',
    },
    pillMold: {
      id: 'pillMold',
      imageFile: 'pillMold',
      name: 'pill mold',
      type: 'pillMold',
      value: 100,
      description: 'A metal mold for compressing a very powerful pill.',
    },
    pillBox: {
      id: 'pillBox',
      imageFile: 'pillBox',
      name: 'pill box',
      type: 'pillBox',
      value: 100,
      description: 'A wooden box required for holding a very powerful pill.',
    },
    pillPouch: {
      id: 'pillPouch',
      imageFile: 'pillPouch',
      name: 'pill pouch',
      type: 'pillPouch',
      value: 100,
      description:
        'A leather pouch designed to fit inside a pill box and preserve the power of certain very potent pills.',
    },
    unbreakableChain: {
      id: 'unbreakableChain',
      imageFile: 'chain',
      name: 'unbreakable chain',
      type: 'chain',
      value: 1,
      description: "This chain is specially forged to be incredibly strong, but it's REALLY heavy.",
    },
    everlastingBrick: {
      id: 'everlastingBrick',
      imageFile: 'brick',
      name: 'everlasting brick',
      type: 'brick',
      value: 1,
      description: 'This brick is specially made to bear unimaginable weight.',
    },
    everlastingMortar: {
      id: 'everlastingMortar',
      imageFile: 'mortar',
      name: 'everlasting mortar',
      type: 'mortar',
      value: 1,
      description: 'This mortar is specially made to hold up even the highest building.',
    },
    scaffolding: {
      id: 'scaffolding',
      imageFile: 'scaffolding',
      name: 'scaffolding',
      type: 'scaffolding',
      value: 1,
      description: 'This scaffolding allows you to work for the next level of your tower.',
    },
    windTome: {
      id: 'windTome',
      imageFile: 'windTome',
      name: 'Tome of Wind Control',
      type: 'windTome',
      value: 1,
      description: 'This book contains a great deal of research on how winds work and how they can be tamed.',
    },
    army: {
      id: 'army',
      imageFile: 'army',
      name: 'a vast army',
      type: 'army',
      value: 1,
      description: 'This is an army. It fits nicely in your backpack due to your mastery of transdimensional magic.',
    },
    immortality: {
      id: 'immortality',
      imageFile: 'immortality',
      name: 'Essence of Immortality',
      type: 'immortality',
      value: Infinity,
      description: 'The object of your obsession. Using this will make you immortal.',
      useLabel: 'Become Immortal',
      useDescription: 'Become immortal and win the game.',
      useConsumes: true,
      use: () => {
        if (!this.impossibleTaskService) {
          this.impossibleTaskService = this.injector.get(ImpossibleTaskService);
        }
        this.impossibleTaskService.taskProgress[ImpossibleTaskType.OvercomeDeath].progress++;
        this.impossibleTaskService.activeTaskIndex = ImpossibleTaskType.OvercomeDeath; // just in case. Don't want this use to fail.
        this.impossibleTaskService.checkCompletion();
        if (this.impossibleTaskService.taskProgress[ImpossibleTaskType.OvercomeDeath].complete) {
          this.logService.injury(LogTopic.STORY, 'YOU HAVE ACHIEVED IMMORTALITY! YOU WILL LIVE FOREVER!');
          if (!this.gameStateService) {
            this.gameStateService = this.injector.get(GameStateService);
          }
          if (this.gameStateService.easyModeEver) {
            this.logService.log(
              LogTopic.STORY,
              'Good work, even if you did take the easy path. For more of a challenge, you could reset and try without using the easy game mode.'
            );
          }
          this.logService.log(
            LogTopic.STORY,
            'You started your journey on ' +
              new Date(this.gameStateService.gameStartTimestamp).toDateString() +
              ' and succeeded in your quest on ' +
              new Date().toDateString() +
              '.'
          );
          this.logService.log(
            LogTopic.STORY,
            'You took ' +
              this.mainLoopService.totalTicks +
              ' days over ' +
              this.characterService.characterState.totalLives +
              ' lifetimes to overcome death.'
          );
          this.characterService.characterState.immortal = true;
        }
      },
    },
    portalKey: {
      id: 'portalKey',
      imageFile: 'key',
      name: 'Portal Key',
      type: 'portalKey',
      value: Infinity,
      description:
        "The key to Lord Yama's kingdom. With this key, you can use his portals to instantly travel anywhere.",
      useLabel: 'Create a portal back to the palace of the gods on Mount Penglai and claim your throne.',
      useDescription: 'Become a god and win the game (again).',
      useConsumes: true,
      use: () => {
        this.logService.injury(LogTopic.STORY, 'YOU HAVE ACHIEVED GODHOOD! YOU WILL RULE OVER THE UNIVERSE FOREVER!');
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        this.hellService.inHell = false;
        if (!this.gameStateService) {
          this.gameStateService = this.injector.get(GameStateService);
        }
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        this.logService.log(
          LogTopic.STORY,
          'You started your journey on ' +
            new Date(this.gameStateService.gameStartTimestamp).toDateString() +
            ' and achieved godhood on ' +
            new Date().toDateString() +
            '.'
        );
        this.logService.log(
          LogTopic.STORY,
          'You took ' +
            this.mainLoopService.totalTicks +
            ' days over ' +
            this.characterService.characterState.totalLives +
            ' lifetimes to claim your throne on Mount Penglai.'
        );
        this.characterService.characterState.god = true;
        this.activityService.reloadActivities();
      },
    },
    fingers: {
      id: 'fingers',
      imageFile: 'finger',
      name: 'fingers',
      type: 'fingers',
      value: 1,
      description: 'A handful of bloody fingers. The demons carry them as grisly trophies. Now, it seems, you do too.',
    },
    tokenOfGratitude: {
      id: 'tokenOfGratitude',
      imageFile: 'token',
      name: 'token of gratitude',
      type: 'tokenOfGratitude',
      value: 1,
      description: 'A small keepsake from your family member.',
    },
    mirrorShard: {
      id: 'mirrorShard',
      imageFile: 'mirrorShard',
      name: 'mirror shard',
      type: 'mirrorShard',
      value: 1,
      description: 'A shard of broken glass. You carefully turn the reflective side away from you.',
    },
    iceCore: {
      id: 'iceCore',
      imageFile: 'iceCore',
      name: 'ice core',
      type: 'iceCore',
      value: 1,
      description: 'A small sphere containing the essence of pure cold.',
    },
    fireCore: {
      id: 'fireCore',
      imageFile: 'fireCore',
      name: 'fire core',
      type: 'fireCore',
      value: 1,
      description: 'A small sphere containing the essence of pure heat.',
    },
    treasureMap: {
      id: 'treasureMap',
      imageFile: 'treasureMap',
      name: 'treasure map',
      type: 'treasureMap',
      value: 1,
      description: 'A treasure map with the location of a stolen relic.',
    },
    stolenRelic: {
      id: 'stolenRelic',
      imageFile: 'relic',
      name: 'stolen relic',
      type: 'stolenRelic',
      value: 1,
      description: 'A treasure pilfered from a tomb.',
    },
    hellCrownTongueRippers: {
      id: 'hellCrownTongueRippers',
      imageFile: 'crown',
      name: 'Crown of the Tongue Rippers',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown proving your mastery over the Hell of Tongue Rippers. Using this will unlock a new type of follower.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.TongueRipping)) {
          this.hellService.completedHellBosses.push(HellLevel.TongueRipping);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Tongue Rippers settles onto your head, then sinks in to become a part of your very soul. You feel that your words carry a new power that can inspire a new kind of follower to worship you as the god you are becoming. Perhaps a trip back to the mortal realm through reincarnation might be worthwhile.'
        );
        this.followerService.unlockJob('prophet');
      },
    },
    hellCrownScissors: {
      id: 'hellCrownScissors',
      imageFile: 'crown',
      name: 'Crown of Scissors',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown proving your mastery over the Hell of Scissors. Using this will unlock a new ability for your followers.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Scissors)) {
          this.hellService.completedHellBosses.push(HellLevel.Scissors);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Scissors settles onto your head, then sinks in to become a part of your very soul. You feel a deeper appreciation for marriage and family, and your followers sense it.'
        );
        this.logService.log(
          LogTopic.STORY,
          'From now on, each follower will train a child to replace themselves in your service when they pass away.'
        );
        this.followerService.autoReplaceUnlocked = true;
      },
    },
    hellCrownTreesOfKnives: {
      id: 'hellCrownTreesOfKnives',
      imageFile: 'crown',
      name: 'Crown of Knives',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown proving your mastery over the Hell of Trees of Knives. Using this will unlock a new follower.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.TreesOfKnives)) {
          this.hellService.completedHellBosses.push(HellLevel.TreesOfKnives);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Knives settles onto your head, then sinks in to become a part of your very soul. You can recruit a new follower specialized in honoring ancestors.'
        );
        this.followerService.unlockJob('moneyBurner');
      },
    },
    hellCrownMirrors: {
      id: 'hellCrownMirrors',
      imageFile: 'crown',
      name: 'Crown of Mirrors',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown proving your mastery over the Hell of Mirrors. Using this will unlock a new understanding of combat.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Mirrors)) {
          this.hellService.completedHellBosses.push(HellLevel.Mirrors);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Mirrors settles onto your head, then sinks in to become a part of your very soul. A deep understanding of combat based on your many battles with yourself reveals itself in a moment of enlightenment.'
        );
        this.characterService.characterState.attributes.combatMastery.value += 1;
        this.activityService.CombatTraining.unlocked = true;
      },
    },
    hellCrownSteamers: {
      id: 'hellCrownSteamers',
      imageFile: 'crown',
      name: 'Crown of Steam',
      type: 'hellcrown',
      value: Infinity,
      description: 'A misty crown proving your mastery over the Hell of Steamers. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Steamers)) {
          this.hellService.completedHellBosses.push(HellLevel.Steamers);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Steam settles onto your head, then sinks in to become a part of your very soul. You learn to harness the intense heat of the Hell of Steamers in a powerful magical blast.'
        );
        this.battleService.pyroclasmUnlocked = true;
      },
    },
    hellCrownPillars: {
      id: 'hellCrownPillars',
      imageFile: 'crown',
      name: 'Crown of Pillars',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown topped with tiny copper pillars. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.CopperPillars)) {
          this.hellService.completedHellBosses.push(HellLevel.CopperPillars);
        }
        this.logService.log(
          LogTopic.STORY,
          'The Crown of Pillars settles onto your head, then sinks in to become a part of your very soul. You can now summon a massive metal fist with each of your combat strikes.'
        );
        this.battleService.metalFistUnlocked = true;
      },
    },
    hellCrownMountainOfKnives: {
      id: 'hellCrownMountainOfKnives',
      imageFile: 'crown',
      name: 'Crown of the Knife Mountain',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown shaped like a mountain covered in tiny blades. Using this will unlock a new understanding of the world.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.MountainOfKnives)) {
          this.hellService.completedHellBosses.push(HellLevel.MountainOfKnives);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. Having balanced your karmic debt, you begin to see the balance in all the world around you.'
        );
        this.characterService.characterState.yinYangUnlocked = true;
      },
    },
    hellCrownMountainOfIce: {
      id: 'hellCrownMountainOfIce',
      imageFile: 'crown',
      name: 'Crown of Ice',
      type: 'hellcrown',
      value: Infinity,
      description: 'A frozen crown. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.MountainOfIce)) {
          this.hellService.completedHellBosses.push(HellLevel.MountainOfIce);
        }
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. The deep freezing from the mountain has given you a new idea for how to defend yourself.'
        );
        this.battleService.iceShieldUnlocked = true;
      },
    },
    hellCrownCauldronsOfOil: {
      id: 'hellCrownCauldronsOfOil',
      imageFile: 'crown',
      name: 'Cauldron Crown',
      type: 'hellcrown',
      value: Infinity,
      description:
        'An ugly pot you can wear on your head. Using this will unlock a new respect for the sanctity and dignity of human life.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.CauldronsOfOil)) {
          this.hellService.completedHellBosses.push(HellLevel.CauldronsOfOil);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. A new resolve awakens in you to protect the defenseless from those that would abuse them.'
        );
        this.characterService.characterState.righteousWrathUnlocked = true;
      },
    },
    hellCrownCattlePit: {
      id: 'hellCrownCattlePit',
      imageFile: 'crown',
      name: 'Cow Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'Now you are the Cow Emperor. Using this will let you understand animals.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.CattlePit)) {
          this.hellService.completedHellBosses.push(HellLevel.CattlePit);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        this.logService.log(
          LogTopic.STORY,
          "The crown settles onto your head, then sinks in to become a part of your very soul. You find a new and deep connection to animals that you've never felt before."
        );
        this.followerService.unlockElementalPets();
      },
    },
    hellCrownCrushingBoulder: {
      id: 'hellCrownCrushingBoulder',
      imageFile: 'crown',
      name: 'Boulder Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'A heavy stone crown. Using this will greatly improve your physical characteristics.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.CrushingBoulder)) {
          this.hellService.completedHellBosses.push(HellLevel.CrushingBoulder);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. Your muscles swell with new power.'
        );
        this.characterService.characterState.bonusMuscles = true;
      },
    },
    hellCrownMortarsAndPestles: {
      id: 'hellCrownMortarsAndPestles',
      imageFile: 'crown',
      name: 'Gluttonous Crown',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown topped with mortars full of hellfire. Using this will lead you to a new enlightenment about food.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.MortarsAndPestles)) {
          this.hellService.completedHellBosses.push(HellLevel.MortarsAndPestles);
        }
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. You come to a deep appreciation of the value and importance of food.'
        );
        this.homeService.hellFood = true;
        this.inventoryService.divinePeachesUnlocked = true;
        this.inventoryService.updateFarmFoodList();
      },
    },
    hellCrownBloodPool: {
      id: 'hellCrownBloodPool',
      imageFile: 'crown',
      name: 'Blood Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'A liquid crown made of blood. Using this will empower your bloodline.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.BloodPool)) {
          this.hellService.completedHellBosses.push(HellLevel.BloodPool);
        }
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. Your bloodline becomes so powerful that the benefits of your ancestral home now apply even when you are no longer in the mortal realm.'
        );
        this.homeService.hellHome = true;
      },
    },
    hellCrownWrongfulDead: {
      id: 'hellCrownWrongfulDead',
      imageFile: 'crown',
      name: 'Hollow Crown',
      type: 'hellcrown',
      value: Infinity,
      description:
        'A crown so light you can barely feel it. Using this will greatly improve your mental characteristics.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.WrongfulDead)) {
          this.hellService.completedHellBosses.push(HellLevel.WrongfulDead);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. Your mind suddenly expands with endless new possibilities.'
        );
        this.characterService.characterState.bonusBrains = true;
      },
    },
    hellCrownDismemberment: {
      id: 'hellCrownDismemberment',
      imageFile: 'crown',
      name: 'Crown of Limbs',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown topped with dismembered limbs. Using this will open up a new understanding of spirit gems.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Dismemberment)) {
          this.hellService.completedHellBosses.push(HellLevel.Dismemberment);
        }
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. If you are spiritual enough, you can now purify gems to infuse new effects into your weapons.'
        );
        this.activityService.purifyGemsUnlocked = true;
        this.activityService.reloadActivities();
      },
    },
    hellCrownFireMountain: {
      id: 'hellCrownFireMountain',
      imageFile: 'crown',
      name: 'Lava Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'A crown made of pure lava. Using this will unlock a new spell.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.MountainOfFire)) {
          this.hellService.completedHellBosses.push(HellLevel.MountainOfFire);
        }
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. The intense heat of the volcano has strengthened your inner fire, allowing you to form a barrier to protect you and harm your enemies.'
        );
        this.battleService.fireShieldUnlocked = true;
      },
    },
    hellCrownMills: {
      id: 'hellCrownMills',
      imageFile: 'crown',
      name: 'Millstone Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'A heavy crown with the weight of a millstone. Using this will increase the limits of your health.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Mills)) {
          this.hellService.completedHellBosses.push(HellLevel.Mills);
        }
        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. The intense pressure of the mill has strengthened your skin and bones allowing you to increase your total health dramatically.'
        );
        this.characterService.characterState.bonusHealth = true;
      },
    },
    hellCrownSaws: {
      id: 'hellCrownSaws',
      imageFile: 'crown',
      name: 'Saw Crown',
      type: 'hellcrown',
      value: Infinity,
      description: 'A toothy crown with sawblades pointing in all directions. Using this will unlock a new follower.',
      useLabel: 'Accept the Crown',
      useDescription: '',
      useConsumes: true,
      use: () => {
        if (!this.hellService) {
          this.hellService = this.injector.get(HellService);
        }
        if (!this.hellService.completedHellBosses.includes(HellLevel.Saws)) {
          this.hellService.completedHellBosses.push(HellLevel.Saws);
        }
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }

        this.logService.log(
          LogTopic.STORY,
          'The crown settles onto your head, then sinks in to become a part of your very soul. You can now recruit followers that put their swindling and cheating to good use.'
        );
        this.followerService.unlockJob('banker');
      },
    },
    fastPlayManual: {
      id: 'fastPlayManual',
      name: 'Manual of Expeditious Time Perception',
      type: 'manual',
      description: 'This manual teaches you to perceive time as moving faster.',
      value: 28000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock fast game speed.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastSpeed = true;
        this.mainLoopService.topDivider = this.mainLoopService.topDivider > 5 ? 5 : this.mainLoopService.topDivider;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.unlockFastSpeed;
      },
    },
    fasterPlayManual: {
      id: 'fasterPlayManual',
      name: 'Manual of Greatly Expeditious Time Perception',
      type: 'manual',
      description: 'This manual teaches you to perceive time as moving much faster.',
      value: 100000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock faster game speed.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFasterSpeed = true;
        this.mainLoopService.topDivider = this.mainLoopService.topDivider > 2 ? 2 : this.mainLoopService.topDivider;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.unlockFasterSpeed;
      },
    },
    fastestPlayManual: {
      id: 'fastestPlayManual',
      name: 'Manual of Ludicrous Time Perception',
      type: 'manual',
      description: 'This manual teaches you to perceive time as moving incredibly fast.',
      value: 800000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock fastest game speed.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastestSpeed = true;
        this.mainLoopService.topDivider = 1;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.unlockFastestSpeed;
      },
    },
    restartActivityManual: {
      id: 'restartActivityManual',
      name: 'Manual of Remembered Plans',
      type: 'manual',
      description:
        'This manual teaches you to automatically resume activities from your previous life. Only activities that you qualify for when you reach adulthood are available to resume.',
      value: 500,
      useLabel: 'Read',
      useDescription: 'Permanently unlock preserving activity plans across reincarnations.',
      useConsumes: true,
      use: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoRestart = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService?.autoRestart;
      },
    },
    autoSellManual: {
      id: 'autoSellManual',
      name: 'Manual of Mercantile Fluency',
      type: 'manual',
      description: 'This manual teaches you to automatically sell items.',
      value: 80000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-sell button in the inventory panel.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellUnlocked;
      },
    },
    autoUseManual: {
      id: 'autoUseManual',
      name: 'Manual of Facilitated Usage',
      type: 'manual',
      description: 'This manual teaches you to automatically use items.',
      value: 1000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-use button in the inventory panel.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoUseUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoUseUnlocked;
      },
    },
    autoBalanceManual: {
      id: 'autoBalanceManual',
      name: 'Manual of Balanced Consumption and Mercantile Moderation',
      type: 'manual',
      description: 'This manual teaches you to automatically balance between using and selling items.',
      value: 5e7,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-balance button in the inventory panel.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoBalanceUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoBalanceUnlocked;
      },
    },
    autoBuyLandManual: {
      id: 'autoBuyLandManual',
      name: 'Manual of Land Acquisition',
      type: 'manual',
      description: 'This manual teaches you to automatically purchase land.',
      value: 2000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic land purchasing.',
      useConsumes: true,
      use: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyLandUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyLandUnlocked;
      },
    },
    autoBuyHomeManual: {
      id: 'autoBuyHomeManual',
      name: 'Manual of Home Improvement',
      type: 'manual',
      description: 'This manual teaches you to automatically upgrade your home.',
      value: 1e7,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic home upgrades.',
      useConsumes: true,
      use: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyHomeUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyHomeUnlocked;
      },
    },
    autoBuyFurnitureManual: {
      id: 'autoBuyFurnitureManual',
      name: 'Manual of Home Furnishing',
      type: 'manual',
      description:
        'This manual teaches you to automatically buy the last furniture you bought for your home in future lives.',
      value: 8e7,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic purchasing for furniture.',
      useConsumes: true,
      use: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoBuyFurnitureUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoBuyFurnitureUnlocked;
      },
    },
    autoBuyerSettingsManual: {
      id: 'autoBuySettingsManual',
      name: 'Manual of Customized Automation',
      type: 'manual',
      description: 'This manual teaches you to customize the order and behavior of auto-buying.',
      value: 1e9,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-buying customization',
      useConsumes: true,
      use: () => {
        if (!this.autoBuyerService) {
          this.autoBuyerService = this.injector.get(AutoBuyerService);
        }
        this.autoBuyerService.autoBuyerSettingsUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.autoBuyerService) {
          this.autoBuyerService = this.injector.get(AutoBuyerService);
        }
        return this.autoBuyerService.autoBuyerSettingsUnlocked;
      },
    },
    autoFieldManual: {
      id: 'autoFieldManual',
      name: 'Manual of Field Conversion',
      type: 'manual',
      description: 'This manual teaches you to automatically plow open land into fields.',
      value: 2000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic field plowing.',
      useConsumes: true,
      use: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoFieldUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.homeService) {
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService.autoFieldUnlocked;
      },
    },
    autoPotionManual: {
      id: 'autoPotionManual',
      name: 'Manual of Gluttonous Potion Consumption',
      type: 'manual',
      description: 'This manual teaches you to automatically use all potions.',
      value: 2e8,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-drinking all potions.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoPotionUnlocked = true;
        this.inventoryService.autoPotionEnabled = true;
        for (let index = this.inventoryService.autoUseEntries.length - 1; index >= 0; index--) {
          if (this.inventoryService.autoUseEntries[index].name.includes('Potion')) {
            this.inventoryService.autoUseEntries.splice(index, 1);
          }
        }
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoPotionUnlocked;
      },
    },
    autoPillManual: {
      id: 'autoPotionManual',
      name: 'Manual of Reckless Pill Consumption',
      type: 'manual',
      description: 'This manual teaches you to automatically use all pills.',
      value: 1e10,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-swallowing all pills.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoPillUnlocked = true;
        this.inventoryService.autoPillEnabled = true;
        for (let index = this.inventoryService.autoUseEntries.length - 1; index >= 0; index--) {
          if (this.inventoryService.autoUseEntries[index].name.includes('Pill')) {
            this.inventoryService.autoUseEntries.splice(index, 1);
          }
        }
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoPillUnlocked;
      },
    },
    autoTroubleManual: {
      id: 'autoTroubleManual',
      name: 'Manual of Consistent Troublemaking',
      type: 'manual',
      description: 'This manual teaches you to automatically look for trouble.',
      value: 5e8,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic trouble in the battle panel.',
      useConsumes: true,
      use: () => {
        // check if battleService is injected yet, if not, inject it (circular dependency issues)
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        this.battleService.autoTroubleUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if battleService is injected yet, if not, inject it (circular dependency issues)
        if (!this.battleService) {
          this.battleService = this.injector.get(BattleService);
        }
        return this.battleService?.autoTroubleUnlocked;
      },
    },
    autoWeaponMergeManual: {
      id: 'autoWeaponMergeManual',
      name: 'Manual of Effortless Weapon Merging',
      type: 'manual',
      description: 'This manual teaches you to automatically merge weapons.',
      value: 1e9,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic weapon merging in the inventory panel.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoWeaponMergeUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoWeaponMergeUnlocked;
      },
    },
    autoArmorMergeManual: {
      id: 'autoArmorMergeManual',
      name: 'Manual of Effortless Armor Merging',
      type: 'manual',
      description: 'This manual teaches you to automatically merge armor.',
      value: 1e9,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic armor merging in the inventory panel.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoArmorMergeUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoArmorMergeUnlocked;
      },
    },
    useSpiritGemManual: {
      id: 'useSpiritGemManual',
      name: 'Manual of Spirit Gem Comprehension',
      type: 'manual',
      description: 'This manual teaches you to incorporate spirit gems in your crafting.',
      value: 500000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock including spirit gems when creating items.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.useSpiritGemUnlocked = true;
        this.inventoryService.useSpiritGemWeapons = true;
        this.inventoryService.useSpiritGemPotions = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.useSpiritGemUnlocked;
      },
    },
    bestHerbsManual: {
      id: 'bestHerbsManual',
      name: 'Manual of the Herbal Connoisseur',
      type: 'manual',
      description: 'This manual teaches you to automatically sell any herbs below your current ability to gather.',
      value: 5000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-selling lower grade herbs.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldHerbs = true;
        this.inventoryService.autoSellOldHerbsEnabled = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldHerbs;
      },
    },
    bestWoodManual: {
      id: 'bestWoodManual',
      name: 'Manual of the Discerning Wood Collector',
      type: 'manual',
      description: 'This manual teaches you to automatically sell any logs below your current ability to gather.',
      value: 5000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-selling lower grade logs.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldWood = true;
        this.inventoryService.autoSellOldWoodEnabled = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldWood;
      },
    },
    bestOreManual: {
      id: 'bestOreManual',
      name: 'Manual of Mineral Pragmatism',
      type: 'manual',
      description:
        'This manual teaches you to automatically sell any ores and bars below your current ability to gather.',
      value: 5000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-selling lower grade ores and bars.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldOre = true;
        this.inventoryService.autoSellOldOreEnabled = true;
        this.inventoryService.autoSellOldBarsEnabled = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldOre;
      },
    },
    bestHidesManual: {
      id: 'bestHidesManual',
      name: 'Manual of Pelt Perception',
      type: 'manual',
      description: 'This manual teaches you to automatically sell any hides below your current ability to gather.',
      value: 5000000,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-selling lower grade hides.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldHides = true;
        this.inventoryService.autoSellOldHidesEnabled = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldHides;
      },
    },
    bestWeaponManual: {
      id: 'bestWeaponManual',
      name: 'Manual of Wise Weapon Selection',
      type: 'manual',
      description: 'This manual teaches you to automatically equip the best weapons that you have.',
      value: 1e10,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-equipping the best weapons in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoequipBestWeapon = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoequipBestWeapon;
      },
    },
    bestArmorManual: {
      id: 'bestArmorManual',
      name: 'Manual of Defensive Preparation',
      type: 'manual',
      description: 'This manual teaches you to automatically equip the best armor that you have.',
      value: 1e10,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-equipping the best armor in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoequipBestArmor = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoequipBestArmor;
      },
    },
    betterStorageManual: {
      id: 'betterStorageManual',
      name: 'Manual of Efficient Item Storage',
      type: 'manual',
      description: 'This manual teaches you to store items more efficiently so you can keep more in each stack.',
      value: 1000000,
      useLabel: 'Read',
      useDescription:
        'Permanently increase by ten times the number of items you can put in each stack in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 1000;
      },
    },
    evenBetterStorageManual: {
      id: 'evenBetterStorageManual',
      name: 'Manual of Hyperefficient Item Storage',
      type: 'manual',
      description: 'This manual teaches you to store items more efficiently so you can keep more in each stack.',
      value: 1e8,
      useLabel: 'Read',
      useDescription:
        'Permanently increase by ten times the number of items you can put in each stack in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 10000;
      },
    },
    bestStorageManual: {
      id: 'bestStorageManual',
      name: 'Manual of Hyperspatial Item Storage',
      type: 'manual',
      description: 'This manual teaches you to store items more efficiently so you can keep more in each stack.',
      value: 1e8,
      useLabel: 'Read',
      useDescription:
        'Permanently increase by ten times the number of items you can put in each stack in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.maxStackSize *= 10;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.maxStackSize >= 100000;
      },
    },
    followerAutoDismissManual: {
      id: 'followerAutoDismissManual',
      name: 'Manual of Judicious Disciple Selection',
      type: 'manual',
      description: 'This manual teaches you to automatically dismiss followers based on their jobs.',
      value: 1e11,
      useLabel: 'Read',
      useDescription:
        'Permanently increase by ten times the number of items you can put in each stack in your inventory.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        this.followerService.autoDismissUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.followerService) {
          this.followerService = this.injector.get(FollowersService);
        }
        return this.followerService.autoDismissUnlocked;
      },
    },
    bestGemsManual: {
      id: 'bestGemsManual',
      name: 'Manual of Gemological Purity',
      type: 'manual',
      description:
        'This manual teaches you to automatically sell gems that are below the value of the gems your current monster drops.',
      value: 1e9,
      useLabel: 'Read',
      useDescription: 'Permanently unlock gem auto-selling for lower level gems.',
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoSellOldGemsUnlocked = true;
        this.inventoryService.autoSellOldGemsEnabled = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService) {
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoSellOldGemsUnlocked;
      },
    },
    autoPauseSettingsManual: {
      id: 'autoPauseSettingsManual',
      name: 'Manual of Customized Danger Sensing',
      type: 'manual',
      description: 'This manual teaches you to customize options for automatically pausing the game.',
      value: 1e7,
      useLabel: 'Read',
      useDescription: 'Permanently unlock auto-pausing customization',
      useConsumes: true,
      use: () => {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoPauseUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService.autoPauseUnlocked;
      },
    },
    bankedTicksEfficiencyManual: {
      id: 'bankedTicksEfficiencyManual',
      name: 'Manual of Efficient Time Banking',
      type: 'manual',
      description: 'This manual teaches you to more efficiently bank ticks when paused or offline.',
      value: 2.5e9,
      useLabel: 'Read',
      useDescription: 'Permanently increase banked tick efficiency to 50%.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.offlineDivider = 2;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.offlineDivider <= 2;
      },
    },
    autoRestManual: {
      id: 'autoRestManual',
      name: 'Manual of Timely Rest',
      type: 'manual',
      description: 'This manual teaches you to avoid overwork by resting just in time.',
      value: 4e10,
      useLabel: 'Read',
      useDescription: 'Permanently unlock automatic resting.',
      useConsumes: true,
      use: () => {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoRestUnlocked = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        if (!this.activityService) {
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService.autoRestUnlocked;
      },
    },
    ageSpeedManual: {
      id: 'ageSpeedManual',
      name: 'Manual of Aged Time Perception',
      type: 'manual',
      description: 'This manual teaches you to perceive time faster the older you are.',
      value: 7.5e9,
      useLabel: 'Read',
      useDescription: 'Permanently increase time passage based on your age.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockAgeSpeed = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.unlockAgeSpeed;
      },
    },
    totalPlaytimeManual: {
      id: 'totalPlaytimeManual',
      name: 'Manual of Lifetime Time Perception',
      type: 'manual',
      description: "This manual teaches you to perceive time faster the longer you've lived across all your lives.",
      value: 5e10,
      useLabel: 'Read',
      useDescription: 'Permanently increase time passage based on your total time lived.',
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockPlaytimeSpeed = true;
        this.logService.log(
          LogTopic.EVENT,
          "The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations."
        );
      },
      owned: () => {
        return this.mainLoopService.unlockPlaytimeSpeed;
      },
    },
  };

  constructor(
    private characterService: CharacterService,
    private injector: Injector,
    private logService: LogService,
    private mainLoopService: MainLoopService
  ) {}

  getItemById(id: string): Item | undefined {
    if (this.items[id]) {
      return this.items[id];
    }
    return undefined;
  }

  getFurnitureById(id: string): Furniture | null {
    if (this.furniture[id]) {
      return this.furniture[id];
    }
    return null;
  }

  private eatProduce(lifespanChance: number, maxLifespanIncrease: number, quantity = 1, healValue = 1) {
    this.characterService.characterState.status.nourishment.value += quantity;
    if (Math.random() < lifespanChance) {
      this.characterService.characterState.healthBonusFood += quantity;
      this.characterService.characterState.status.health.value += quantity * healValue;
      if (this.characterService.characterState.foodLifespan + quantity <= daysInYear * maxLifespanIncrease) {
        this.characterService.characterState.foodLifespan += quantity;
      } else if (this.characterService.characterState.foodLifespan < daysInYear * maxLifespanIncrease) {
        this.characterService.characterState.foodLifespan = daysInYear * maxLifespanIncrease;
      }
    }
    this.characterService.characterState.checkOverage();
  }
}
