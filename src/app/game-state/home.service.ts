import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { InventoryService, Item, ItemStack } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { HellService } from './hell.service';
import { ActivityType } from './activity';
import { ActivityService } from './activity.service';
import { AttributeType } from './character';
import { TitleCasePipe } from '@angular/common';

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
  maxFurniture: number;
  maxWorkstations: number;
  maxWorkstationPower: number;
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

export interface Workstation {
  name?: string;
  id: string;
  triggerActivity: ActivityType;
  power: number;
  setupCost: number;
  maintenanceCost: number;
  description: string;
  maxInputs: number;
  inputs: ItemStack[];
  consequence: (workstation: Workstation) => void;
}

export interface HomeProperties {
  land: number;
  homeValue: HomeType;
  bedroomFurniture: (Item | null)[];
  landPrice: number;
  autoBuyLandUnlocked: boolean;
  autoBuyLandLimit: number;
  autoBuyHomeUnlocked: boolean;
  autoBuyHomeLimit: HomeType;
  keepFurniture: boolean;
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
  seeFurnitureEffects: boolean;
  workstations: Workstation[];
  totalCrafts: number;
  alchemyCounter: number;
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  hellService?: HellService;
  activityService?: ActivityService;
  autoBuyLandUnlocked = false;
  autoBuyLandLimit = 5;
  autoBuyHomeUnlocked = false;
  autoBuyHomeLimit: HomeType = 2;
  keepFurniture = false;
  useAutoBuyReserve = false;
  autoBuyReserveAmount = 0;
  land: number;
  landPrice: number;
  ownedFurniture: string[] = [];
  grandfatherTent = false;
  houseBuildingProgress = 1;
  upgrading = false;
  thugPause = false;
  hellHome = false;
  homeUnlocked = false;
  smoothFarming = false;
  keepHome = false;
  bedroomFurniture: (Item | null)[] = [null, null, null, null, null, null, null, null, null];
  openBedroomFurnitureSlots = 0;
  seeFurnitureEffects = false;
  workstations: Workstation[] = [];
  totalCrafts = 0;
  alchemyCounter = 0;

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
      maxFurniture: 0,
      maxWorkstations: 0,
      maxWorkstationPower: 0,
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
      maxInventory: 15,
      upgradeToTooltip:
        'Get a better home and stop the mouse invasions.<br>A better home will cost 100 taels and take up 1 land.<br>Land can be purchasd in the Regular People Shop.<br>The new home will restore 1 stamina and a bit of health each night.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.5;
        this.characterService.characterState.status.stamina.value += 1;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 0,
      maxWorkstations: 0,
      maxWorkstationPower: 0,
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
      maxInventory: 20,
      upgradeToTooltip:
        'Get a better home and stop the ruffians from stealing your wealth.<br>A better home will cost 1,000 taels and take up 5 land.<br>The new home will restore 3 stamina and a bit of health each night.<br>It also has walls.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.5;
        this.characterService.characterState.status.stamina.value += 3;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 1,
      maxWorkstations: 0,
      maxWorkstationPower: 0,
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
      maxInventory: 25,
      upgradeToTooltip:
        'Get a better house and give your descendants a permanent place to settle.<br>A better home will cost 10,000 taels and take up 10 land.<br>The new home will restore 5 stamina and a bit of health each night.',
      consequence: () => {
        this.characterService.characterState.status.health.value += 0.7;
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 2,
      maxWorkstations: 0,
      maxWorkstationPower: 0,
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
      maxInventory: 30,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100,000 taels and take up 20 land.<br>The new home will restore 10 stamina and 1 health and a bit of Qi each night (if unlocked).',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.1;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 10;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 3,
      maxWorkstations: 1,
      maxWorkstationPower: 0,
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
      maxInventory: 35,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1M taels and take up 50 land.<br>The new home will restore 15 stamina, 2 health, and a bit of Qi each night (if unlocked).',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.2;
        this.characterService.characterState.status.health.value += 2;
        this.characterService.characterState.status.stamina.value += 15;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 4,
      maxWorkstations: 2,
      maxWorkstationPower: 0,
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
      maxInventory: 40,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10m taels and take up 80 land.<br>The new home will restore 20 stamina, 3 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.3;
        this.characterService.characterState.status.health.value += 3;
        this.characterService.characterState.status.stamina.value += 20;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 5,
      maxWorkstations: 3,
      maxWorkstationPower: 0,
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
      maxInventory: 50,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100m taels and take up 100 land.<br>The new home will restore 25 stamina, 4 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.4;
        this.characterService.characterState.status.health.value += 4;
        this.characterService.characterState.status.stamina.value += 25;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 6,
      maxWorkstations: 3,
      maxWorkstationPower: 0,
      daysToBuild: 365,
    },
    {
      name: 'Mansion',
      type: HomeType.Mansion,
      description: 'An elaborate mansion. Automatically restores 30 stamina, 5 health, and a bit of Qi each night.',
      cost: 1e9,
      costPerDay: 120,
      landRequired: 120,
      maxInventory: 50,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1B taels and take up 120 land.<br>The new home will restore 30 stamina, 5 health, and a bit of Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 0.5;
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.status.stamina.value += 30;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 7,
      maxWorkstations: 4,
      maxWorkstationPower: 0,
      daysToBuild: 3650,
    },
    {
      name: 'Palace',
      type: HomeType.Palace,
      description: 'A lavish palace. Automatically restores 35 stamina, 10 health, and 1 Qi each night.',
      cost: 1e10,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 55,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10B taels and take up 150 land.<br>The new home will restore 35 stamina, 10 health, and 1 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 1;
        this.characterService.characterState.status.health.value += 10;
        this.characterService.characterState.status.stamina.value += 35;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 8,
      maxWorkstations: 4,
      maxWorkstationPower: 1,
      daysToBuild: 36500,
    },
    {
      name: 'Castle',
      type: HomeType.Castle,
      description: 'An imposing castle. Automatically restores 40 stamina, 15 health, and 2 Qi each night.',
      cost: 1e11,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 60,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100B taels and take up 150 land.<br>The new home will restore 40 stamina, 15 health, and 2 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 2;
        this.characterService.characterState.status.health.value += 15;
        this.characterService.characterState.status.stamina.value += 40;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 5,
      maxWorkstationPower: 1,
      daysToBuild: 365000,
    },
    {
      name: 'Fortress',
      type: HomeType.Fortress,
      description: 'An indomitable fortress. Automatically restores 50 stamina, 20 health, and 3 Qi each night.',
      cost: 1e12,
      costPerDay: 180,
      landRequired: 180,
      maxInventory: 65,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 1T taels and take up 180 land.<br>The new home will restore 50 stamina, 20 health, and 3 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 3;
        this.characterService.characterState.status.health.value += 20;
        this.characterService.characterState.status.stamina.value += 50;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 5,
      maxWorkstationPower: 1,
      daysToBuild: 3650000,
    },
    {
      name: 'Mountain',
      type: HomeType.Mountain,
      description: 'An entire mighty mountain. Automatically restores 100 stamina, 30 health, and 4 Qi each night.',
      cost: 1e13,
      costPerDay: 500,
      landRequired: 500,
      maxInventory: 70,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10T taels and take up 500 land.<br>The new home will restore 100 stamina, 30 health, and 4 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 4;
        this.characterService.characterState.status.health.value += 30;
        this.characterService.characterState.status.stamina.value += 100;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 6,
      maxWorkstationPower: 2,
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
      maxFurniture: 9,
      maxWorkstations: 6,
      maxWorkstationPower: 2,
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
      maxFurniture: 9,
      maxWorkstations: 7,
      maxWorkstationPower: 2,
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
      maxInventory: 110,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10q taels and take up 1,000,000 land.<br>The new home will restore 500 stamina, 100 health, and 20 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 20;
        this.characterService.characterState.status.health.value += 100;
        this.characterService.characterState.status.stamina.value += 500;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 8,
      maxWorkstationPower: 2,
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
      maxInventory: 120,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100q taels and take up 10,000,000 land.<br>The new home will restore 1000 stamina, 150 health, and 30 Qi each night.',
      consequence: () => {
        this.characterService.characterState.status.qi.value += 30;
        this.characterService.characterState.status.health.value += 150;
        this.characterService.characterState.status.stamina.value += 1000;
        this.characterService.characterState.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 9,
      maxWorkstationPower: 2,
      daysToBuild: 365e9,
    },
  ];

  workstationsList: Workstation[] = [
    {
      id: 'Smelter',
      triggerActivity: ActivityType.Smelting,
      power: 0,
      setupCost: 1000,
      maintenanceCost: 10,
      description:
        'A smelter that will produce metal bars when you do Smelting.<br>You will need to provide your own ore and fuel.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        if (workstation.inputs.length < 2) {
          // inputs array not populated, bail out
          return;
        }
        const fuelStack = workstation.inputs.find(itemStack => itemStack.item?.subtype === 'fuel');
        const oreStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'ore');

        if (fuelStack && oreStack && oreStack.quantity > 0 && fuelStack.quantity > 0) {
          this.totalCrafts++;
          this.inventoryService.addItem(this.inventoryService.getBar(oreStack.item?.value || 1));
          oreStack.quantity--;
          fuelStack.quantity--;
        }
      },
    },
    {
      id: 'Basic Anvil',
      triggerActivity: ActivityType.Blacksmithing,
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple anvil that will let you craft your own equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Heavy Anvil',
      triggerActivity: ActivityType.Blacksmithing,
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A massive anvil that will let you craft more powerful equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Masterwork Anvil',
      triggerActivity: ActivityType.Blacksmithing,
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted anvil that will let you craft extremely powerful equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Basic Woodworking Bench',
      triggerActivity: ActivityType.Woodworking,
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple woodworking workbench that will let you craft your own equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Advanced Woodworking Bench',
      triggerActivity: ActivityType.Woodworking,
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A fully stocked woodworking workbench that will let you craft more powerful equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Masterwork Woodworking Bench',
      triggerActivity: ActivityType.Woodworking,
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted woodworking workbench that will let you craft extremely powerful equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Basic Leatherworking Station',
      triggerActivity: ActivityType.Leatherworking,
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple leatherworking station that will let you craft your own equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Advanced Leatherworking Station',
      triggerActivity: ActivityType.Leatherworking,
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A fully stocked leatherworking station that will let you craft more powerful equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Masterwork Leatherworking Station',
      triggerActivity: ActivityType.Leatherworking,
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted leatherworking station that will let you craft extremely powerful equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createEquipment(workstation);
      },
    },
    {
      id: 'Basic Cauldron',
      triggerActivity: ActivityType.Alchemy,
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.craftAlchemy(workstation);
      },
    },
    {
      id: 'Large Cauldron',
      triggerActivity: ActivityType.Alchemy,
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A large cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 4,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.craftAlchemy(workstation);
      },
    },
    {
      id: 'Enchanted Cauldron',
      triggerActivity: ActivityType.Alchemy,
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 6,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.craftAlchemy(workstation);
      },
    },
    {
      id: 'Cook Pot',
      triggerActivity: ActivityType.Cooking,
      power: 0,
      setupCost: 100,
      maintenanceCost: 10,
      description: 'A simple cook pot to prepare meals.<br>You will need to provide your own ingredients.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.cookFood(workstation);
      },
    },
    {
      id: 'Roasting Spit',
      triggerActivity: ActivityType.Cooking,
      power: 1,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple spit to roast your foods, letting you add more variety to your diet.<br>You will need to provide your own ingredients.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.cookFood(workstation);
      },
    },
    {
      id: 'Chef Kitchen',
      triggerActivity: ActivityType.Cooking,
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A restaurant quality kitchen allowing you to make magnificent meals.<br>You will need to provide your own ingredients.',
      maxInputs: 5,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.cookFood(workstation);
      },
    },
  ];
  availableWorkstationsList: Workstation[] = [];

  //Feng Shui Bagua map:
  baguaMap = [
    //0: Top Left: Wealth, Wood, Purple/Red/Green
    ['books', 'wood', 'purple', 'red', 'green'],
    //1: Top Center: Fame, Fire, Red/Orange
    ['bed', 'trophy', 'fire', 'red', 'orange'],
    //2: Top Right: Love/Relationships, Earth, Pink/Red
    ['bed', 'portrait', 'animal', 'earth', 'red', 'pink'],
    //3: Center Left: Family/Health, Wood, Green/Blue
    ['portrait', 'fitness', 'animal', 'wood', 'green', 'blue'],
    //4: Center: Health/Wellbeing, Earth, Yellow/Earth tones
    ['fitness', 'earth', 'yellow', 'brown'],
    //5: Center Right: Children/Creativity, Metal, White/Pastels
    ['portrait', 'metal', 'white', 'pastel'],
    //6: Bottom Left: Knowledge, Water/Earth, Blue/Black/Green
    ['books', 'spiritual', 'water', 'earth', 'blue', 'black', 'green'],
    //7: Bottom Center: Career, Water, Black
    ['water', 'black'],
    //8: Bottom Right: Helpful People/Travel, Metal, Gray/White/Black
    ['books', 'animal', 'metal', 'gray', 'white', 'black'],
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
    private itemRepoService: ItemRepoService,
    private titleCasePipe: TitleCasePipe
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    setTimeout(() => (this.activityService = this.injector.get(ActivityService)));
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

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
      if (this.keepHome) {
        this.logService.log(
          LogTopic.EVENT,
          'You reincarnate as one of your own descendants, and your family recognizes you as the reborn heir to the family home as you age.'
        );
      } else if (this.homeValue === HomeType.SquatterTent && this.grandfatherTent) {
        this.logService.log(
          LogTopic.EVENT,
          'Your grandfather gives you a bit of land and helps you set up a tent on it.'
        );
        this.setCurrentHome(this.nextHome);
      }
      if (this.characterService.fatherGift && this.characterService.characterState.bloodlineRank < 6) {
        // Skip this at higher bloodline ranks, it's not thematic.
        this.logService.log(
          LogTopic.EVENT,
          'Your father puts some coins in your purse as you begin your grand adventure.'
        );
        this.characterService.characterState.updateMoney(2000);
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
      for (const furniturePiece of this.bedroomFurniture) {
        if (furniturePiece?.use) {
          furniturePiece?.use();
          console.log('used', furniturePiece.name);
        }
      }
    }
    if (!this.hellService?.inHell && !this.characterService.characterState.god) {
      let totalCost = 0;
      for (const workstation of this.workstations) {
        totalCost += workstation.maintenanceCost;
      }
      totalCost += this.home.costPerDay;
      if (totalCost > this.characterService.characterState.money) {
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
        this.characterService.characterState.updateMoney(0 - totalCost);
      }
    }
  }

  getProperties(): HomeProperties {
    return {
      homeValue: this.homeValue,
      bedroomFurniture: this.bedroomFurniture,
      land: this.land,
      landPrice: this.landPrice,
      autoBuyLandUnlocked: this.autoBuyLandUnlocked,
      autoBuyLandLimit: this.autoBuyLandLimit,
      autoBuyHomeUnlocked: this.autoBuyHomeUnlocked,
      autoBuyHomeLimit: this.autoBuyHomeLimit,
      keepFurniture: this.keepFurniture,
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
      seeFurnitureEffects: this.seeFurnitureEffects,
      workstations: this.workstations,
      totalCrafts: this.totalCrafts,
      alchemyCounter: this.alchemyCounter,
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
    this.keepFurniture = properties.keepFurniture || false;
    this.useAutoBuyReserve = properties.useAutoBuyReserve || false;
    this.autoBuyReserveAmount = properties.autoBuyReserveAmount || 0;
    this.nextHomeCostReduction = properties.nextHomeCostReduction || 0;
    this.houseBuildingProgress = properties.houseBuildingProgress || 1;
    this.upgrading = properties.upgrading || false;
    for (let i = 0; i < properties.bedroomFurniture.length; i++) {
      const furnitureItem = properties.bedroomFurniture[i];
      if (furnitureItem) {
        this.bedroomFurniture[i] = this.itemRepoService.getFurnitureById(furnitureItem.id);
      } else {
        this.bedroomFurniture[i] = null;
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
    this.seeFurnitureEffects = properties.keepHome;
    this.totalCrafts = properties.totalCrafts;
    this.alchemyCounter = properties.alchemyCounter || 0;
    this.workstations = [];
    for (const workstation of properties.workstations) {
      this.addWorkstation(workstation.id, workstation);
    }
    this.recalculateFengShui();
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
    // TODO: bedroom furniture amd workstations need to go down the new cap, also refund land difference
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
    if (!this.keepFurniture) {
      for (let i = 0; i < this.bedroomFurniture.length; i++) {
        this.bedroomFurniture[i] = null;
      }
      this.recalculateFengShui();
      this.ownedFurniture = [];
    }
    if (this.characterService.characterState.bloodlineRank < 7) {
      this.upgrading = false;
      this.houseBuildingProgress = 1;
    }
    this.inventoryService.changeMaxItems(this.home.maxInventory);
    this.nextHomeCostReduction = 0;

    if (this.keepHome) {
      // reduce land price to account for lost land, but not land that you are keeping as farms
      this.landPrice -= 10 * (this.land - 1);
    } else {
      this.landPrice = 100;
    }
    this.land = 0;
  }

  setCurrentHome(home: Home) {
    this.homeValue = home.type;
    this.home = this.getHomeFromValue(this.homeValue);
    this.previousHome = this.getPreviousHome();
    this.nextHome = this.getNextHome();
    this.nextHomeCost = this.nextHome.cost - this.nextHomeCostReduction;
    this.inventoryService.changeMaxItems(this.home.maxInventory);
    this.availableWorkstationsList = this.workstationsList.filter(ws => ws.power <= home.maxWorkstationPower);
    this.recalculateFengShui();
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

  hasWorkstation(workstationName: string) {
    return this.workstations.find(ws => ws.id.includes(workstationName)) !== undefined;
  }

  setFurniture(item: Item | null, index: number) {
    if (item === null && this.bedroomFurniture[index]) {
      this.bedroomFurniture[index] = null;
      this.openBedroomFurnitureSlots++;
    } else if (item !== null && this.bedroomFurniture[index]) {
      // replace the current item
      this.bedroomFurniture[index] = item;
    } else if (item !== null && !this.bedroomFurniture[index]) {
      if (this.openBedroomFurnitureSlots <= 0) {
        // no room, bail out
        return;
      }
      this.bedroomFurniture[index] = item;
    }
    this.recalculateFengShui();
  }

  recalculateFengShui() {
    this.openBedroomFurnitureSlots = this.home.maxFurniture;
    let fengshuiScore = 0;
    for (let i = 0; i < this.bedroomFurniture.length; i++) {
      const furnitureItem = this.bedroomFurniture[i];
      if (furnitureItem) {
        this.openBedroomFurnitureSlots--;
        if (this.baguaMap[i].includes(furnitureItem.subtype || '')) {
          fengshuiScore += 1;
        }
        if (this.baguaMap[i].includes(furnitureItem.color || '')) {
          fengshuiScore += 1;
        }
        if (furnitureItem.elements) {
          for (const element of furnitureItem.elements) {
            if (this.baguaMap[i].includes(element)) {
              fengshuiScore += 1;
            }
          }
        }
      }
    }
    this.characterService.characterState.fengshuiScore = fengshuiScore;
  }

  removeWorkstation(workstation: Workstation) {
    for (const inputItemStack of workstation.inputs) {
      if (inputItemStack.item) {
        this.inventoryService.addItem(inputItemStack.item, inputItemStack.quantity);
      }
    }
    const index = this.workstations.indexOf(workstation);
    this.workstations.splice(index, 1);
  }

  addWorkstation(workstationId: string, copyWorkstation: Workstation | null = null) {
    if (this.workstations.length >= this.home.maxWorkstations) {
      // can't support another workstation, bail out
      return;
    }
    const workstationTemplate = this.workstationsList.find(({ id }) => id === workstationId);
    if (!workstationTemplate) {
      // no template found in the list for the id, bail out
      return;
    }
    let existingSameWorkstations = 0;
    for (const ws of this.workstations) {
      if (ws.id === workstationId) {
        existingSameWorkstations++;
      }
    }
    const emptyInputs: ItemStack[] = [];
    for (let i = 0; i < workstationTemplate.maxInputs; i++) {
      emptyInputs.push(this.inventoryService.getEmptyItemStack());
    }

    const newWorkstation = {
      index: this.workstations.length,
      name: workstationId + ' #' + (existingSameWorkstations + 1),
      id: workstationId,
      triggerActivity: workstationTemplate?.triggerActivity,
      power: workstationTemplate.power,
      setupCost: workstationTemplate.setupCost,
      maintenanceCost: workstationTemplate.maintenanceCost,
      description: workstationTemplate.description,
      maxInputs: workstationTemplate.maxInputs,
      inputs: emptyInputs,
      consequence: workstationTemplate.consequence,
    };

    if (copyWorkstation) {
      newWorkstation.inputs = copyWorkstation.inputs;
    }
    this.workstations.push(newWorkstation);
  }

  triggerWorkstations(activityType: ActivityType) {
    for (const workstation of this.workstations) {
      if (workstation.triggerActivity === activityType) {
        workstation.consequence(workstation);
      }
    }
  }

  moveItemToWorkstation(itemIndex: number, destinationWorkstationIndex: number, destinationInputIndex: number) {
    if (!this.inventoryService.itemStacks[itemIndex].item) {
      // no item to move, bail out
      return;
    }
    if (this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].item) {
      if (
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].item?.name ===
        this.inventoryService.itemStacks[itemIndex].item?.name
      ) {
        // same item type, dump the quantity into the workstation
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity +=
          this.inventoryService.itemStacks[itemIndex].quantity;
        this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
        return;
      }
      // swap the workstation item with the inventory item
      const temp = this.inventoryService.itemStacks[itemIndex];
      this.inventoryService.itemStacks[itemIndex] =
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex];
      this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex] = temp;
      this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].id =
        destinationWorkstationIndex +
        '_' +
        destinationInputIndex +
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].item!.name +
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity;
      this.inventoryService.fixId(itemIndex);
    } else {
      // nothing there now, just put the inventory item in the workstation
      this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex] =
        this.inventoryService.itemStacks[itemIndex];
      this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].id =
        destinationWorkstationIndex +
        '_' +
        destinationInputIndex +
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].item!.name +
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity;
      this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
    }
  }

  cookFood(workstation: Workstation) {
    if (workstation.inputs.length < 2) {
      // inputs array not populated, bail out
      return;
    }
    const usedIngredients: string[] = [];
    const usedSubtypes: string[] = [];
    let totalValue = 0;
    for (const itemStack of workstation.inputs) {
      if (
        itemStack.item &&
        itemStack.item.type === 'food' &&
        itemStack.item.subtype !== 'meal' &&
        !usedIngredients.includes(itemStack.item.id) &&
        itemStack.quantity > 0
      ) {
        usedIngredients.push(itemStack.item.id);
        if (itemStack.item.subtype && !usedSubtypes.includes(itemStack.item.subtype)) {
          usedSubtypes.push(itemStack.item.subtype);
        }
        totalValue += itemStack.item.value;
        itemStack.quantity--;
      }
    }
    if (totalValue < 1) {
      // didn't find any usable ingredients
      return;
    }

    totalValue *= usedIngredients.length;
    totalValue *= usedSubtypes.length;
    totalValue *= workstation.power + 1;

    const cookingLevel = this.activityService?.getActivityByType(workstation.triggerActivity)?.level || 0;
    let imageFile = 'meal';
    let foodName = 'Menu Special #' + totalValue;
    if (cookingLevel > 0) {
      totalValue *= 4;
      imageFile = 'soulfood';
      foodName = 'Soul Food Special #' + totalValue;
    }

    this.totalCrafts++;
    this.inventoryService.addItem({
      id: foodName,
      imageFile: imageFile,
      name: foodName,
      type: 'food',
      subtype: 'meal',
      value: totalValue,
      description: 'A home-made meal that can nourish you much more than raw ingredients.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly.',
      useConsumes: true,
    });
  }

  createEquipment(workstation: Workstation) {
    if (workstation.inputs.length < 1) {
      // inputs array not populated, bail out
      return;
    }
    let material = 'metal';
    if (workstation.triggerActivity === ActivityType.Woodworking) {
      material = 'wood';
    } else if (workstation.triggerActivity === ActivityType.Leatherworking) {
      material = 'hide';
    }
    const activityLevel = this.activityService?.getActivityByType(workstation.triggerActivity)?.level || 0;
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === material);
    // gems can be added for extra power
    const gemStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'gem');
    // wood or leather can be added for extra power
    const extraStack = workstation.inputs.find(
      itemStack =>
        itemStack.item?.type !== material &&
        (itemStack.item?.type === 'wood' || itemStack.item?.type === 'metal' || itemStack.item?.type === 'hide')
    );
    if (materialStack && materialStack.quantity >= 10) {
      let grade = (materialStack?.item?.value || 1) + workstation.power * 5;
      if (materialStack.item?.type === 'wood') {
        grade += Math.log10(this.characterService.characterState.attributes.woodLore.value);
      } else if (materialStack.item?.type === 'metal') {
        grade += Math.log10(this.characterService.characterState.attributes.metalLore.value);
      }

      grade += activityLevel;
      if (gemStack && gemStack.quantity > 0 && this.inventoryService.useSpiritGemUnlocked) {
        grade += gemStack?.item?.value || 1;
        gemStack.quantity--;
      }
      if (extraStack && extraStack.quantity > 0) {
        grade += extraStack?.item?.value || 1;
        extraStack.quantity--;
      }
      this.totalCrafts++;
      let item;
      if (workstation.triggerActivity === ActivityType.Leatherworking) {
        item = this.inventoryService.generateArmor(grade, this.inventoryService.randomArmorSlot());
      } else {
        item = this.inventoryService.generateWeapon(grade, material);
      }
      this.inventoryService.addItem(item);
      materialStack.quantity -= 10;
    }
  }

  craftAlchemy(workstation: Workstation) {
    if (workstation.inputs.length < 1) {
      // inputs array not populated, bail out
      return;
    }
    const usedIngredients: string[] = [];
    let totalValue = 0;
    let gemUsed = false;
    let pillMold = false;
    let pillBox = false;
    let pillPouch = false;
    const alchemyLevel = this.activityService?.getActivityByType(workstation.triggerActivity)?.level || 0;
    let attribute: AttributeType = 'toughness';
    for (const itemStack of workstation.inputs) {
      if (
        itemStack.item &&
        itemStack.item.type === 'herb' &&
        itemStack.item.subtype &&
        !usedIngredients.includes(itemStack.item.subtype) &&
        itemStack.quantity > 0
      ) {
        usedIngredients.push(itemStack.item.subtype);
        totalValue += itemStack.item.value;
        itemStack.quantity--;
        if (itemStack.item.attribute) {
          attribute = itemStack.item.attribute;
        }
      }
    }
    if (totalValue < 1) {
      // didn't find any usable ingredients
      return;
    }
    for (const itemStack of workstation.inputs) {
      if (
        itemStack.item &&
        itemStack.item.type === 'gem' &&
        itemStack.quantity > 0 &&
        this.inventoryService.useSpiritGemUnlocked
      ) {
        gemUsed = true;
        itemStack.quantity--;
      } else if (itemStack.item && itemStack.item.type === 'pillMold' && itemStack.quantity > 0) {
        pillMold = true;
        itemStack.quantity--;
      } else if (itemStack.item && itemStack.item.type === 'pillBox' && itemStack.quantity > 0) {
        pillBox = true;
        itemStack.quantity--;
      } else if (itemStack.item && itemStack.item.type === 'pillPouch' && itemStack.quantity > 0) {
        pillPouch = true;
        itemStack.quantity--;
      }
    }
    this.totalCrafts++;
    this.alchemyCounter++;
    if (gemUsed && pillMold && pillBox && pillPouch) {
      this.inventoryService.generateEmpowermentPill();
    } else if ((gemUsed || alchemyLevel > 2) && this.alchemyCounter > 10) {
      this.alchemyCounter = 0;
      this.inventoryService.generatePill(totalValue, attribute);
    } else {
      this.inventoryService.generatePotion(totalValue);
    }
  }

  getFurnitureSlotTooltip(furnitureIndex: number) {
    let tooltip = '';
    if (this.seeFurnitureEffects) {
      tooltip += 'This space facilitates the Feng Shui of your home when its furniture aligns with:';
      for (const prop of this.baguaMap[furnitureIndex]) {
        tooltip += '<br>' + this.titleCasePipe.transform(prop);
      }
      tooltip += '<br>';
    }
    if (this.openBedroomFurnitureSlots > 0) {
      tooltip += 'Click to set which furniture should be placed here.';
    }
    if (this.bedroomFurniture[furnitureIndex]) {
      tooltip += '<br><br>' + this.getFurnitureTooltip(this.bedroomFurniture[furnitureIndex]);
    }
    return tooltip;
  }

  getFurnitureTooltip(item: Item) {
    let tooltip = '';
    tooltip = item.description;
    if (this.seeFurnitureEffects) {
      tooltip += '<br>Feng Shui Properties:';
      if (item.subtype) {
        tooltip += '<br>' + this.titleCasePipe.transform(item.subtype);
      }
      if (item.color) {
        tooltip += '<br>Color: ' + this.titleCasePipe.transform(item.color);
      }
      if (item.elements) {
        tooltip += '<br>Elements: ';
        for (const element of item.elements) {
          tooltip += this.titleCasePipe.transform(element) + ', ';
        }
        tooltip = tooltip.substring(0, tooltip.length - 2);
      }
    }
    return tooltip;
  }
}
