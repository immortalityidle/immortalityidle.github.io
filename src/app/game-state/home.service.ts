import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { CharacterService } from './character.service';
import { Furniture, InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { HellService } from './hell.service';

export interface Home {
  name: string;
  type: HomeType;
  description: string;
  cost: number;
  costPerDay: number;
  landRequired: number;
  maxInventory: number;
  upgradeToTooltip: string;
  consequence: () => void;
  furnitureSlots: FurniturePosition[];
  daysToBuild: number;
}

export enum HomeType {
  SquatterTent,
  OwnTent,
  DirtyShack,
  SimpleHut,
  PleasantCottage,
  LargeHouse,
  CourtyardHouse,
  Manor,
  Mansion,
  Palace,
  Castle,
  Fortress,
  Mountain,
  ForbiddenCity,
  Capital,
  ImperialSeat,
  Godthrone,
}

export interface HomeProperties {
  land: number;
  homeValue: HomeType;
  furniture: FurnitureSlots;
  landPrice: number;
  autoBuyLandUnlocked: boolean;
  autoBuyLandLimit: number;
  autoBuyHomeUnlocked: boolean;
  autoBuyHomeLimit: HomeType;
  autoBuyFurnitureUnlocked: boolean;
  autoBuyFurniture: FurnitureSlots;
  useAutoBuyReserve: boolean;
  autoBuyReserveAmount: number;
  nextHomeCostReduction: number;
  houseBuildingProgress: number;
  upgrading: boolean;
  ownedFurniture: string[];
  highestLand: number;
  highestLandPrice: number;
  bestHome: HomeType;
  thugPause: boolean;
  hellHome: boolean;
  homeUnlocked: boolean;
  keepHome: boolean;
}

export type FurniturePosition = 'bed' | 'bathtub' | 'kitchen' | 'workbench';
export type FurnitureSlots = { [key in FurniturePosition]: Furniture | null };

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  hellService?: HellService;
  autoBuyLandUnlocked = false;
  autoBuyLandLimit = 5;
  autoBuyHomeUnlocked = false;
  autoBuyHomeLimit: HomeType = 2;
  autoBuyFurnitureUnlocked = false;
  autoBuyFurniture: FurnitureSlots = {
    bed: null,
    bathtub: null,
    kitchen: null,
    workbench: null,
  };
  useAutoBuyReserve = false;
  autoBuyReserveAmount = 0;
  land: number;
  landPrice: number;
  furniture: FurnitureSlots = {
    bed: null,
    bathtub: null,
    kitchen: null,
    workbench: null,
  };
  furniturePositionsArray: FurniturePosition[] = ['bed', 'bathtub', 'kitchen', 'workbench'];
  ownedFurniture: string[] = [];
  grandfatherTent = false;
  houseBuildingProgress = 1;
  upgrading = false;
  thugPause = false;
  hellHome = false;
  homeUnlocked = false;
  smoothFarming = false;
  keepHome = false;

  homesList: Home[] = [
    {
      name: 'Squatter Tent',
      type: HomeType.SquatterTent,
      description:
        'A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The mice around here are pretty nasty, so you should really buy some land and get a safer place to stay.',
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      maxInventory: 10,
      upgradeToTooltip: '',
      consequence: () => {
        // do nothing
      },
      furnitureSlots: [],
      daysToBuild: 1,
    },
    {
      name: 'Tent of Your Own',
      type: HomeType.OwnTent,
      description:
        'A decent tent pitched on your own bit of land. The occasional ruffian might give you trouble. Automatically restores 1 stamina and a bit of health each night.',
      cost: 100,
      costPerDay: 1,
      landRequired: 1,
      maxInventory: 12,
      upgradeToTooltip:
        'Get a better home and stop the mouse invasions.<br>A better home will cost 100 taels and take up 1 land.<br>The new home will restore 1 stamina and a bit of health each night.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.5;
        this.characterService.characterState.status.stamina.value += 1;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [],
      daysToBuild: 1,
    },
    {
      name: 'Dirty Shack',
      type: HomeType.DirtyShack,
      description:
        'A cheap dirt-floored wooden shack. At least it has a door to keep ruffians out. Automatically restores 3 stamina and a bit of health each night.',
      cost: 1000,
      costPerDay: 5,
      landRequired: 5,
      maxInventory: 15,
      upgradeToTooltip:
        'Get a better home and stop the troublemakers from stealing your wealth.<br>A better home will cost 1,000 taels and take up 5 land.<br>The new home will restore 3 stamina and a bit of health each night.<br>It also has walls and space to properly sleep.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.5;
        this.characterService.characterState.status.stamina.value += 3;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed'],
      daysToBuild: 1,
    },
    {
      name: 'Simple Hut',
      type: HomeType.SimpleHut,
      description:
        'A very simple hut. Automatically restores 5 stamina and a bit of health each night. This home and all future homes will remain in your family, and you wiil reincarnate as its heir.',
      cost: 10000,
      costPerDay: 10,
      landRequired: 10,
      maxInventory: 18,
      upgradeToTooltip:
        'Get a better house and give your descendants a permanent place to settle.<br>A better home will cost 10,000 taels and take up 10 land.<br>The new home will restore 5 stamina and a bit of health each night.<br>It has enough room to properly bathe.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.7;
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub'],
      daysToBuild: 10,
    },
    {
      name: 'Pleasant Cottage',
      type: HomeType.PleasantCottage,
      description:
        'A nice little home where you can rest peacefully. Automatically restores 10 stamina, 1 health and a bit of Qi each night.',
      cost: 100000,
      costPerDay: 20,
      landRequired: 20,
      maxInventory: 20,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100,000 taels and take up 20 land.<br>The new home will restore 10 stamina and 1 health and a bit of Qi each night (if unlocked).<br>It also has room to let you cook.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.1;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 10;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen'],
      daysToBuild: 30,
    },
    {
      name: 'Large House',
      type: HomeType.LargeHouse,
      description:
        'A large house where you can live and work. Automatically restores 15 stamina, 2 health, and a bit of Qi each night.',
      cost: 1000000,
      costPerDay: 50,
      landRequired: 50,
      maxInventory: 24,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1M taels and take up 50 land.<br>The new home will restore 15 stamina, 2 health, and a bit of Qi each night (if unlocked).<br>It has room to practice your craft.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.2;
        this.characterService.characterState.status.health.value += 2;
        this.characterService.characterState.status.stamina.value += 15;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 90,
    },
    {
      name: 'Courtyard House',
      type: HomeType.CourtyardHouse,
      description:
        'A large house with a wall and an enclosed courtyard. Perfect for building a thriving business. Automatically restores 20 stamina, 3 health, and a bit of Qi each night.',
      cost: 1e7,
      costPerDay: 80,
      landRequired: 80,
      maxInventory: 28,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10m taels and take up 80 land.<br>The new home will restore 20 stamina, 3 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.3;
        this.characterService.characterState.status.health.value += 3;
        this.characterService.characterState.status.stamina.value += 20;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 180,
    },
    {
      name: 'Manor',
      type: HomeType.Manor,
      description:
        'A large manor house. You are really moving up in the world. Automatically restores 25 stamina, 4 health, and a bit of Qi each night.',
      cost: 1e8,
      costPerDay: 100,
      landRequired: 100,
      maxInventory: 30,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100m taels and take up 100 land.<br>The new home will restore 25 stamina, 4 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.4;
        this.characterService.characterState.status.health.value += 4;
        this.characterService.characterState.status.stamina.value += 25;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365,
    },
    {
      name: 'Mansion',
      type: HomeType.Mansion,
      description: 'An elaborate mansion. Automatically restores 30 stamina, 5 health, and a bit of Qi each night.',
      cost: 1e9,
      costPerDay: 120,
      landRequired: 120,
      maxInventory: 32,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1B taels and take up 120 land.<br>The new home will restore 30 stamina, 5 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.5;
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.status.stamina.value += 30;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 3650,
    },
    {
      name: 'Palace',
      type: HomeType.Palace,
      description: 'A lavish palace. Automatically restores 35 stamina, 10 health, and 1 Qi each night.',
      cost: 1e10,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 36,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10B taels and take up 150 land.<br>The new home will restore 35 stamina, 10 health, and 1 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 1;
        this.characterService.characterState.status.health.value += 10;
        this.characterService.characterState.status.stamina.value += 35;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 36500,
    },
    {
      name: 'Castle',
      type: HomeType.Castle,
      description: 'An imposing castle. Automatically restores 40 stamina, 15 health, and 2 Qi each night.',
      cost: 1e11,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 40,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100B taels and take up 150 land.<br>The new home will restore 40 stamina, 15 health, and 2 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 2;
        this.characterService.characterState.status.health.value += 15;
        this.characterService.characterState.status.stamina.value += 40;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365000,
    },
    {
      name: 'Fortress',
      type: HomeType.Fortress,
      description: 'An indomitable fortress. Automatically restores 50 stamina, 20 health, and 3 Qi each night.',
      cost: 1e12,
      costPerDay: 180,
      landRequired: 180,
      maxInventory: 50,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1T taels and take up 180 land.<br>The new home will restore 50 stamina, 20 health, and 3 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 3;
        this.characterService.characterState.status.health.value += 20;
        this.characterService.characterState.status.stamina.value += 50;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 3650000,
    },
    {
      name: 'Mountain',
      type: HomeType.Mountain,
      description: 'An entire mighty mountain. Automatically restores 100 stamina, 30 health, and 4 Qi each night.',
      cost: 1e13,
      costPerDay: 500,
      landRequired: 500,
      maxInventory: 60,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10T taels and take up 500 land.<br>The new home will restore 100 stamina, 30 health, and 4 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 4;
        this.characterService.characterState.status.health.value += 30;
        this.characterService.characterState.status.stamina.value += 100;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365e5,
    },
    {
      name: 'Forbidden City',
      type: HomeType.ForbiddenCity,
      description: 'A city of your very own. Automatically restores 200 stamina, 50 health, and 5 Qi each night.',
      cost: 1e14,
      costPerDay: 1000,
      landRequired: 1000,
      maxInventory: 80,
      upgradeToTooltip:
        'Get a better house.<br>better home will cost 100T taels and take up 1,000 land.<br>The new home will restore 200 stamina, 50 health, and 5 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 5;
        this.characterService.characterState.status.health.value += 50;
        this.characterService.characterState.status.stamina.value += 200;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365e6,
    },
    {
      name: 'Capital',
      type: HomeType.Capital,
      description:
        'The entire province is yours now. Automatically restores 300 stamina, 80 health, and 10 Qi each night.',
      cost: 1e15,
      costPerDay: 10000,
      landRequired: 10000,
      maxInventory: 100,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1q taels and take up 10,000 land.<br>The new home will restore 300 stamina, 80 health, and 10 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 10;
        this.characterService.characterState.status.health.value += 80;
        this.characterService.characterState.status.stamina.value += 300;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365e7,
    },
    {
      name: 'Seat of the Empire',
      type: HomeType.ImperialSeat,
      description:
        "You've built quite an empire. Automatically restores 500 stamina, 100 health, and 20 Qi each night.",
      cost: 1e16,
      costPerDay: 1e6,
      landRequired: 1e6,
      maxInventory: 125,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10q taels and take up 1,000,000 land.<br>The new home will restore 500 stamina, 100 health, and 20 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 20;
        this.characterService.characterState.status.health.value += 100;
        this.characterService.characterState.status.stamina.value += 500;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365e8,
    },
    {
      name: 'Godthrone',
      type: HomeType.Godthrone,
      description:
        'The entire land kneels far beneath you. Automatically restores 1000 stamina, 150 health, and 30 Qi each night.',
      cost: 1e17,
      costPerDay: 1e7,
      landRequired: 1e7,
      maxInventory: 150,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100q taels and take up 10,000,000 land.<br>The new home will restore 1000 stamina, 150 health, and 30 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 30;
        this.characterService.characterState.status.health.value += 150;
        this.characterService.characterState.status.stamina.value += 1000;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: ['bed', 'bathtub', 'kitchen', 'workbench'],
      daysToBuild: 365e9,
    },
  ];

  homeValue!: HomeType;
  home!: Home;
  nextHome!: Home;
  previousHome!: Home;
  nextHomeCostReduction = 0;
  nextHomeCost = 0;
  highestLand = 0;
  highestLandPrice = 100;
  bestHome = 0;

  constructor(
    private injector: Injector,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private logService: LogService,
    private mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    this.land = 0;
    this.landPrice = 100;
    this.setCurrentHome(this.homesList[0]);
    if (this.home === undefined || this.homeValue === undefined || this.nextHome === undefined) {
      throw Error('Home service not initialized correctly.');
    }

    mainLoopService.homeTickSubject.subscribe(() => {
      this.tick();
    });

    mainLoopService.longTickSubject.subscribe(() => {
      if (this.land > this.highestLand) {
        this.highestLand = this.land;
      }
      if (this.landPrice > this.highestLandPrice) {
        this.highestLandPrice = this.landPrice;
      }
      if (this.homeValue > this.bestHome) {
        this.bestHome = this.homeValue;
      }
      if (this.upgrading && this.nextHome === this.home) {
        this.houseBuildingProgress = 1;
        this.upgrading = false;
        this.setCurrentHome(this.home);
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
      if (this.keepHome) {
        this.logService.log(
          LogTopic.EVENT,
          'You reincarnate as one of your own descendants and your family recognizes you as the reborn heir as you age.'
        );
      } else if (this.homeValue === HomeType.SquatterTent && this.grandfatherTent) {
        this.logService.log(
          LogTopic.EVENT,
          'Your grandfather gives you a bit of land and helps you set up a tent on it.'
        );
        this.setCurrentHome(this.nextHome);
      }
      this.characterService.characterState.updateMoney(this.home.costPerDay * 30);
    });
  }

  tick() {
    if (this.characterService.characterState.dead) {
      return;
    }
    if (this.upgrading) {
      this.upgradeTick();
    }
    this.nextHomeCost = this.nextHome.cost - this.nextHomeCostReduction;
    if (this.nextHomeCost < 0) {
      this.nextHomeCost = 0;
    }
    if (!this.hellService?.inHell || this.hellHome) {
      this.home.consequence();
      for (const slot of this.furniturePositionsArray) {
        const furniturePiece = this.furniture[slot];
        if (furniturePiece?.use) {
          furniturePiece?.use();
        }
      }
    }
    if (!this.hellService?.inHell && !this.characterService.characterState.god) {
      if (this.home.costPerDay > this.characterService.characterState.money) {
        this.logService.injury(
          LogTopic.EVENT,
          "You can't afford the upkeep on your home. Some thugs rough you up over the debt. You'd better start doing activities that make more money, fast, or you'll work yourself to death."
        );
        if (this.thugPause) {
          this.mainLoopService.pause = true;
        }
        this.characterService.characterState.status.health.value -= 20;
        this.characterService.characterState.money = 0;
      } else {
        this.characterService.characterState.updateMoney(0 - this.home.costPerDay);
      }
    }
  }

  getProperties(): HomeProperties {
    return {
      homeValue: this.homeValue,
      furniture: this.furniture,
      land: this.land,
      landPrice: this.landPrice,
      autoBuyLandUnlocked: this.autoBuyLandUnlocked,
      autoBuyLandLimit: this.autoBuyLandLimit,
      autoBuyHomeUnlocked: this.autoBuyHomeUnlocked,
      autoBuyHomeLimit: this.autoBuyHomeLimit,
      autoBuyFurnitureUnlocked: this.autoBuyFurnitureUnlocked,
      autoBuyFurniture: this.autoBuyFurniture,
      useAutoBuyReserve: this.useAutoBuyReserve,
      autoBuyReserveAmount: this.autoBuyReserveAmount,
      nextHomeCostReduction: this.nextHomeCostReduction,
      houseBuildingProgress: this.houseBuildingProgress,
      upgrading: this.upgrading,
      ownedFurniture: this.ownedFurniture,
      highestLand: this.highestLand,
      highestLandPrice: this.highestLandPrice,
      bestHome: this.bestHome,
      thugPause: this.thugPause,
      hellHome: this.hellHome,
      homeUnlocked: this.homeUnlocked,
      keepHome: this.keepHome,
    };
  }

  setProperties(properties: HomeProperties) {
    this.land = properties.land;
    this.landPrice = properties.landPrice;
    this.setCurrentHome(this.homesList[properties.homeValue]);
    this.autoBuyLandUnlocked = properties.autoBuyLandUnlocked || false;
    this.autoBuyLandLimit = properties.autoBuyLandLimit || 0;
    this.autoBuyHomeUnlocked = properties.autoBuyHomeUnlocked || false;
    this.autoBuyHomeLimit = properties.autoBuyHomeLimit || 3;
    this.autoBuyFurnitureUnlocked = properties.autoBuyFurnitureUnlocked || false;
    this.autoBuyFurniture = properties.autoBuyFurniture || false;
    this.useAutoBuyReserve = properties.useAutoBuyReserve || false;
    this.autoBuyReserveAmount = properties.autoBuyReserveAmount || 0;
    this.nextHomeCostReduction = properties.nextHomeCostReduction || 0;
    this.houseBuildingProgress = properties.houseBuildingProgress || 1;
    this.upgrading = properties.upgrading || false;
    for (const slot of this.furniturePositionsArray) {
      const savedFurniture = properties.furniture[slot];
      if (savedFurniture) {
        this.furniture[slot] = this.itemRepoService.getFurnitureById(savedFurniture.id);
      }
    }
    this.ownedFurniture = properties.ownedFurniture || [];
    this.highestLand = properties.highestLand || 0;
    this.highestLandPrice = properties.highestLandPrice || 100;
    this.bestHome = properties.bestHome || 0;
    this.thugPause = properties.thugPause || false;
    this.hellHome = properties.hellHome || false;
    this.homeUnlocked = properties.homeUnlocked || false;
    this.keepHome = properties.keepHome;
  }

  // gets the specs of the next home, doesn't actually upgrade
  getNextHome() {
    for (let i = this.homeValue; i < this.homesList.length - 1; i++) {
      if (this.homeValue === this.homesList[i].type) {
        return this.homesList[i + 1];
      }
    }
    // we're on the last home.
    return this.homesList[this.homesList.length - 1];
  }

  // gets the specs of the next home, doesn't actually downgrade
  getPreviousHome() {
    if (this.homeValue === HomeType.SquatterTent) {
      return this.home;
    }
    for (let i = 1; i < this.homesList.length; i++) {
      if (this.homeValue === this.homesList[i].type) {
        return this.homesList[i - 1];
      }
    }
    return this.home; // shouldn't ever happen
  }

  upgradeToNextHome() {
    if (this.upgrading) {
      // currently upgrading, bail out
      return;
    }
    if (this.characterService.characterState.money >= this.nextHomeCost && this.land >= this.nextHome.landRequired) {
      this.characterService.characterState.updateMoney(0 - this.nextHomeCost);
      this.land -= this.nextHome.landRequired;
      this.nextHomeCostReduction = 0;
      this.houseBuildingProgress = 0;
      this.upgrading = true;
      this.logService.log(LogTopic.EVENT, 'You start upgrading your home to a ' + this.nextHome.name);
    }
  }

  downgradeHome() {
    if (this.upgrading) {
      this.nextHomeCostReduction = 0;
      this.houseBuildingProgress = 0;
      this.upgrading = false;
    }
    this.setCurrentHome(this.previousHome);
  }

  upgradeTick(quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }

    this.houseBuildingProgress += (1 / this.nextHome.daysToBuild) * quantity;
    if (this.houseBuildingProgress >= 1) {
      this.houseBuildingProgress = 1;
      this.upgrading = false;
      this.setCurrentHome(this.nextHome);
      this.logService.log(LogTopic.EVENT, 'You finished upgrading your home. You now live in a ' + this.home.name);
    }
  }

  reset() {
    if (!this.keepHome) {
      this.setCurrentHome(this.homesList[0]);
    }
    if (this.characterService.characterState.bloodlineRank < 6) {
      this.furniture.bed = null;
      this.furniture.bathtub = null;
      this.furniture.kitchen = null;
      this.furniture.workbench = null;
      this.ownedFurniture = [];
    }
    if (this.characterService.characterState.bloodlineRank < 7) {
      this.upgrading = false;
      this.houseBuildingProgress = 1;
    }
    this.inventoryService.changeMaxItems(this.home.maxInventory);
    this.nextHomeCostReduction = 0;
    this.land = 0;
    this.landPrice = 100;
  }

  setCurrentHome(home: Home) {
    this.homeValue = home.type;
    this.home = this.getHomeFromValue(this.homeValue);
    this.previousHome = this.getPreviousHome();
    this.nextHome = this.getNextHome();
    this.nextHomeCost = this.nextHome.cost - this.nextHomeCostReduction;
    this.inventoryService.changeMaxItems(this.home.maxInventory);
  }

  getHomeFromValue(value: HomeType): Home {
    for (const home of this.homesList) {
      if (home.type === value) {
        return home;
      }
    }
    throw Error('Home was not found with the given value');
  }

  /**
   * Set count to -1 for half max
   * @returns count of actual purchase
   */
  buyLand(count: number): number {
    const increase = 10 * ((count * (count - 1)) / 2); //mathmatically increase by linear sum n (n + 1) / 2
    const price = this.landPrice * count + increase;
    if (this.characterService.characterState.money >= price) {
      this.characterService.characterState.updateMoney(0 - price);
      this.land += count;
      this.landPrice += 10 * count;
    }
    return count;
  }

  /**
   *
   * @param money the money available for use
   * @returns count of affordable land
   */
  calculateAffordableLand(money: number): number {
    const x = money;
    const C = this.landPrice;
    return Math.floor((-C - 5 + Math.sqrt(Math.pow(C, 2) + 10 * C + 20 * x + 25)) / 10); // I know this looks nuts but I tested it on its own ^_^;;
  }

  buyFurniture(itemId: string) {
    const item = this.itemRepoService.getFurnitureById(itemId);
    if (item) {
      if (this.characterService.characterState.money >= item.value) {
        this.characterService.characterState.updateMoney(0 - item.value);
        this.ownedFurniture.push(item.name);
        this.furniture[item.slot] = item;
      }
    }
  }
}
