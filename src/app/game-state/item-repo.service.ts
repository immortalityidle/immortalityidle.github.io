import { Injectable, Injector } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
import { Furniture, InventoryService, Item } from './inventory.service';

@Injectable({
  providedIn: 'root'
})
export class ItemRepoService {
  homeService?: HomeService;
  activityService?: ActivityService;
  inventoryService?: InventoryService;

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
      name: "Sleeping Mmt",
      type: 'furniture',
      slot: 'bed',
      value: 100,
      description: "A thin woven mat to sleep on. . Increases daily stamina recovery by 2.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 2;
      }
    },
    canopyBed: {
      id: 'canopyBed',
      name: "Canopy Bed",
      type: 'furniture',
      slot: 'bed',
      value: 10000,
      description: "A fine bed with a cover. Curtains keep the mosquitoes off you during the night. Increases daily stamina recovery by 3.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.status.stamina.value += 3;
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
      }
    },
    heatedTub: {
      id: 'heatedTub',
      name: "heated tub",
      type: 'furniture',
      slot: 'bathtub',
      value: 100000000,
      description: "A luxurious tub with its own heating stove. Good for your health and beauty.",
      useConsumes: false,
      use: () => {
        this.characterService.characterState.increaseAttribute('charisma', 0.2);
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.health.max += 1;
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
      value: 1000000000,
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
        this.characterService.characterState.increaseAttribute('metalLore', 0.1);
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
        this.characterService.characterState.increaseAttribute('plantLore', 0.1);
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
        this.characterService.characterState.increaseAttribute('animalLore', 0.1);
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
        this.characterService.characterState.increaseAttribute('alchemy', 0.1);
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
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
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
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.01){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.health.value++;
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
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.02){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.health.value++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    broccoli: {
      id: 'broccoli',
      name: 'broccoli',
      type: 'food',
      value: 20,
      description: 'A very healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.05){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.health.value++;
          if (this.characterService.characterState.foodLifespan < (365 * 40)){
            this.characterService.characterState.foodLifespan += 1;
          }
        }
        this.characterService.characterState.checkOverage();
      },
    },
    melon: {
      id: 'melon',
      name: 'melon',
      type: 'food',
      value: 30,
      description: 'A delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.1){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.health.value++;
          if (this.characterService.characterState.foodLifespan < (365 * 54)){
            this.characterService.characterState.foodLifespan += 1;
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
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.2){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.health.value += 2;
          if (this.characterService.characterState.foodLifespan < (365 * 72)){
            this.characterService.characterState.foodLifespan += 1;
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
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.status.health.max++;
        this.characterService.characterState.status.stamina.max++;
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
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.2){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.status.stamina.max++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    hide: {
      id: 'hide',
      name: 'hide',
      type: 'hide',
      value: 50,
      description: 'A basic animal hide.'
    },
    elmLog: {
      id: 'elmLog',
      name: 'elm log',
      type: 'wood',
      value: 1,
      description: 'A terrible quality log.',
    },
    cypressLog: {
      id: 'cypressLog',
      name: 'cypress log',
      type: 'wood',
      value: 2,
      description: 'A poor quality log.',
    },
    walnutLog: {
      id: 'walnutLog',
      name: 'walnut log',
      type: 'wood',
      value: 3,
      description: 'An adequate quality log.',
    },
    laurelwoodLog: {
      id: 'laurelwoodLog',
      name: 'laurelwood log',
      type: 'wood',
      value: 4,
      description: 'A nice quality log.',
    },
    pearwoodLog: {
      id: 'pearwoodLog',
      name: 'pearwood log',
      type: 'wood',
      value: 5,
      description: 'A good quality log.',
    },
    rosewoodLog: {
      id: 'rosewoodLog',
      name: 'log',
      type: 'wood',
      value: 6,
      description: 'A great quality log.',
    },
    zitanLog: {
      id: 'zitanLog',
      name: 'zitan log',
      type: 'wood',
      value: 7,
      description: 'An excellent quality log.',
    },
    blackwoodLog: {
      id: 'blackwoodLog',
      name: 'blackwood log',
      type: 'wood',
      value: 8,
      description: 'An amazing quality log.',
    },
    peachwoodLog: {
      id: 'peachwoodLog',
      name: 'peachwood log',
      type: 'wood',
      value: 9,
      description: 'A spiritual quality log.',
    },
    copperOre: {
      id: 'copperOre',
      name: 'copper ore',
      type: 'ore',
      value: 1,
      description: 'A chunk of copper ore.',
    },
    bronzeOre: {
      id: 'bronzeOre',
      name: 'mixed ore',
      type: 'ore',
      value: 2,
      description: 'A chunk of ore containing copper, tin, lead, and zinc.'
    },
    ironOre: {
      id: 'ironOre',
      name: 'iron ore',
      type: 'ore',
      value: 3,
      description: 'A chunk of iron ore.',
    },
    copperBar: {
      id: 'copperBar',
      name: 'copper bar',
      type: 'metal',
      value: 1,
      description: 'A bar of copper.',
    },
    bronzeBar: {
      id: 'bronzeBar',
      name: 'bronze bar',
      type: 'metal',
      value: 2,
      description: 'A bar of bronze.',
    },
    ironBar: {
      id: 'ironBar',
      name: 'iron bar',
      type: 'metal',
      value: 3,
      description: 'A bar of iron.',
    },
    junk: {
      id: 'junk',
      name: 'junk',
      type: 'metal',
      value: 1,
      description: 'Some metal junk.',
    },
    //TODO: tune prices on all manuals, currently silly cheap for testing
    fastPlayManual: {
      id: 'fastPlayManual',
      name: "Manual of Expeditious Time Perception",
      type: "manual",
      description: "This manual teaches you to percieve time as moving faster.",
      value: 500,
      useLabel: "Read",
      useDescription: "Permanently unlock fast game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastSpeed = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (this.mainLoopService.unlockFastSpeed){
          return true;
        } else {
          return false;
        }
      }
    },
    fasterPlayManual: {
      id: 'fasterPlayManual',
      name: "Manual of Greatly Expeditious Time Perception",
      type: "manual",
      description: "This manual teaches you to percieve time as moving much faster.",
      value: 7000,
      useLabel: "Read",
      useDescription: "Permanently unlock faster game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFasterSpeed = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (this.mainLoopService.unlockFasterSpeed){
          return true;
        } else {
          return false;
        }
      }
    },
    fastestPlayManual: {
      id: 'fastestPlayManual',
      name: "Manual of Ludicrous Time Perception",
      type: "manual",
      description: "This manual teaches you to percieve time as moving incredibly fast.",
      value: 100000,
      useLabel: "Read",
      useDescription: "Permanently unlock fastest game speed.",
      useConsumes: true,
      use: () => {
        this.mainLoopService.unlockFastestSpeed = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        if (this.mainLoopService.unlockFastestSpeed){
          return true;
        } else {
          return false;
        }
      }
    },
    perpetualFarmingManual: {
      id: 'perpetualFarmingManual',
      name: "Manual of Perpetual Farming",
      type: "manual",
      description: "This manual teaches you to automatically replant fields when they are harvested.",
      value: 50000,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic farm replanting.",
      useConsumes: true,
      use: () => {
        // check if homeService is injected yet, if not, inject it (circular dependency issues)
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoReplant = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if homeService is injected yet, if not, inject it (circular dependency issues)
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        if (this.homeService?.autoReplant){
          return true;
        } else {
          return false;
        }
      }
    },
    restartActivityManual: {
      id: 'restartActivityManual',
      name: "Manual of Remembered Plans",
      type: "manual",
      description: "This manual teaches you to automatically resume activities from your previous life. Only activities that you qualify for when you reach adulthood are available to resume.",
      value: 200000,
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
        if (this.activityService?.autoRestart){
          return true;
        } else {
          return false;
        }
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
      value: 3000000,
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
      value: 50000000,
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
      value: 10000000,
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
      value: 80000000,
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
      value: 200000000,
      useLabel: "Read",
      useDescription: "Permanently unlock autodrinking all potions.",
      useConsumes: true,
      use: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        this.inventoryService.autoPotionUnlocked = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD", 'EVENT');
      },
      owned: () => {
        // check if inventoryService is injected yet, if not, inject it (circular dependency issues)
        if (!this.inventoryService){
          this.inventoryService = this.injector.get(InventoryService);
        }
        return this.inventoryService.autoPotionUnlocked;
      }
    }
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

