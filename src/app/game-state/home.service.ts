import { Injectable, Injector, signal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService, EquipmentPosition } from './character.service';
import { InventoryService, Item, ItemStack } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { HellService } from './hell.service';
import { ActivityType } from './activity';
import { ActivityService } from './activity.service';
import { AttributeType } from './character.service';
import { TitleCasePipe } from '@angular/common';
import { FollowersService } from './followers.service';
import { LOOT_TYPE_GEM } from './battle.service';

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
  triggerActivities: ActivityType[];
  power: number;
  setupCost: number;
  maintenanceCost: number;
  description: string;
  maxInputs: number;
  inputs: ItemStack[];
  equipmentSlot?: EquipmentPosition;
  consequence: (workstation: Workstation, activityType: ActivityType) => void;
}

export interface HomeProperties {
  land: number;
  homeValue: HomeType;
  bedroomFurniture: (Item | null)[];
  landPrice: number;
  keepFurniture: boolean;
  keepWorkstationInputs: boolean;
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
  forgeChainsCounter: number;
}

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  hellService?: HellService;
  activityService?: ActivityService;
  followerService?: FollowersService;
  keepFurniture = false;
  keepWorkstationInputs = false;
  land: number;
  landPrice: number;
  ownedFurniture: string[] = [];
  grandfatherTent = false;
  houseBuildingProgress = 1;
  upgrading = false;
  thugPause = false;
  hellHome = signal<boolean>(false);
  homeUnlocked = false;
  keepHome = false;
  bedroomFurniture: (Item | null)[] = [null, null, null, null, null, null, null, null, null];
  openBedroomFurnitureSlots = 0;
  seeFurnitureEffects = false;
  workstations: Workstation[] = [];
  totalCrafts = 0;
  alchemyCounter = 0;
  forgeChainsCounter = 0;
  //TODO: put the counters on the workstations, and display progress
  //TODO: counter for more things, espeicially formations

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
        this.characterService.status.health.value += 0.5;
        this.characterService.status.stamina.value += 1;
        this.characterService.checkOverage();
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
        this.characterService.status.health.value += 0.5;
        this.characterService.status.stamina.value += 3;
        this.characterService.checkOverage();
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
        this.characterService.status.health.value += 0.7;
        this.characterService.status.stamina.value += 5;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 0.1;
        this.characterService.status.health.value += 1;
        this.characterService.status.stamina.value += 10;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 0.2;
        this.characterService.status.health.value += 2;
        this.characterService.status.stamina.value += 15;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 0.3;
        this.characterService.status.health.value += 3;
        this.characterService.status.stamina.value += 20;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 0.4;
        this.characterService.status.health.value += 4;
        this.characterService.status.stamina.value += 25;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 0.5;
        this.characterService.status.health.value += 5;
        this.characterService.status.stamina.value += 30;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 1;
        this.characterService.status.health.value += 10;
        this.characterService.status.stamina.value += 35;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 2;
        this.characterService.status.health.value += 15;
        this.characterService.status.stamina.value += 40;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 3;
        this.characterService.status.health.value += 20;
        this.characterService.status.stamina.value += 50;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 4;
        this.characterService.status.health.value += 30;
        this.characterService.status.stamina.value += 100;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 5;
        this.characterService.status.health.value += 50;
        this.characterService.status.stamina.value += 200;
        this.characterService.checkOverage();
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
        this.characterService.status.qi.value += 10;
        this.characterService.status.health.value += 80;
        this.characterService.status.stamina.value += 300;
        this.characterService.checkOverage();
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
        "You've built quite a little empire for yourself. Automatically restores 500 stamina, 100 health, and 20 Qi each night.",
      cost: 1e16,
      costPerDay: 1e6,
      landRequired: 1e6,
      maxInventory: 110,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 10q taels and take up 1,000,000 land.<br>The new home will restore 500 stamina, 100 health, and 20 Qi each night.',
      consequence: () => {
        this.characterService.status.qi.value += 20;
        this.characterService.status.health.value += 100;
        this.characterService.status.stamina.value += 500;
        this.characterService.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 8,
      maxWorkstationPower: 3,
      daysToBuild: 365e8,
    },
    {
      name: 'Godthrone',
      type: HomeType.Godthrone,
      description:
        'All in the land kneel far beneath you. Automatically restores 1000 stamina, 150 health, and 30 Qi each night.',
      cost: 1e17,
      costPerDay: 1e7,
      landRequired: 1e7,
      maxInventory: 120,
      upgradeToTooltip:
        'Get a better house.<br>A better home will cost 100q taels and take up 10,000,000 land.<br>The new home will restore 1000 stamina, 150 health, and 30 Qi each night.',
      consequence: () => {
        this.characterService.status.qi.value += 30;
        this.characterService.status.health.value += 150;
        this.characterService.status.stamina.value += 1000;
        this.characterService.checkOverage();
      },
      maxFurniture: 9,
      maxWorkstations: 9,
      maxWorkstationPower: 3,
      daysToBuild: 365e9,
    },
  ];

  workstationsList: Workstation[] = [
    {
      id: 'Smelter',
      triggerActivities: [ActivityType.Smelting],
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

        if (fuelStack && oreStack && oreStack.quantity > 0 && fuelStack.quantity > 5) {
          this.totalCrafts++;
          this.inventoryService.addItem(this.inventoryService.getBar(oreStack.item?.value || 1));
          oreStack.quantity--;
          fuelStack.quantity -= 5;
        }
      },
    },
    {
      id: 'Superior Smelter',
      triggerActivities: [ActivityType.Smelting, ActivityType.MakeBrick],
      power: 0,
      setupCost: 1000000,
      maintenanceCost: 10000000,
      description:
        'An enormous smelter that will produce metal bars when you do Smelting, or possible make other things that require intense heat.<br>You will need to provide your own ore and fuel.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        if (activityType === ActivityType.MakeBrick) {
          this.makeBricks(workstation);
          return;
        }
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
      triggerActivities: [ActivityType.Blacksmithing],
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple anvil that will let you craft your own equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Heavy Anvil',
      triggerActivities: [ActivityType.Blacksmithing],
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A massive anvil that will let you craft more powerful equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Masterwork Anvil',
      triggerActivities: [ActivityType.Blacksmithing, ActivityType.ForgeChains],
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted anvil that will let you craft extremely powerful equipment when you do Blacksmithing.<br>You will need to provide your own metal bars.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        if (activityType === ActivityType.ForgeChains) {
          this.forgeChains(workstation);
        } else {
          this.createEquipment(workstation, activityType);
        }
      },
    },
    {
      id: 'Basic Woodworking Bench',
      triggerActivities: [ActivityType.Woodworking],
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple woodworking workbench that will let you craft your own equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Advanced Woodworking Bench',
      triggerActivities: [ActivityType.Woodworking],
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A fully stocked woodworking workbench that will let you craft more powerful equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Masterwork Woodworking Bench',
      triggerActivities: [ActivityType.Woodworking, ActivityType.MakeScaffold],
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted woodworking workbench that will let you craft extremely powerful equipment when you do Woodworking.<br>You will need to provide your own wood.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        if (activityType === ActivityType.MakeScaffold) {
          this.makeScafold(workstation);
        } else {
          this.createEquipment(workstation, activityType);
        }
      },
    },
    {
      id: 'Basic Leatherworking Station',
      triggerActivities: [ActivityType.Leatherworking],
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple leatherworking station that will let you craft your own equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 1,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Advanced Leatherworking Station',
      triggerActivities: [ActivityType.Leatherworking],
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A fully stocked leatherworking station that will let you craft more powerful equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Masterwork Leatherworking Station',
      triggerActivities: [ActivityType.Leatherworking],
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted leatherworking station that will let you craft extremely powerful equipment when you do Leatherworking.<br>You will need to provide your own hides.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.createEquipment(workstation, activityType);
      },
    },
    {
      id: 'Basic Cauldron',
      triggerActivities: [ActivityType.Alchemy],
      power: 0,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.craftAlchemy(workstation, activityType);
      },
    },
    {
      id: 'Large Cauldron',
      triggerActivities: [ActivityType.Alchemy],
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A large cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 4,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.craftAlchemy(workstation, activityType);
      },
    },
    {
      id: 'Enchanted Cauldron',
      triggerActivities: [ActivityType.Alchemy, ActivityType.MakeMortar],
      power: 2,
      setupCost: 10000000,
      maintenanceCost: 10000,
      description:
        'An enchanted cauldron for brewing potions and making pills when you do alchemy.<br>You will need to provide your own herbs.',
      maxInputs: 6,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        if (activityType === ActivityType.MakeMortar) {
          this.makeMortar(workstation);
        } else {
          this.craftAlchemy(workstation, activityType);
        }
      },
    },
    {
      id: 'Cook Pot',
      triggerActivities: [ActivityType.Cooking],
      power: 0,
      setupCost: 100,
      maintenanceCost: 10,
      description: 'A simple cook pot to prepare meals.<br>You will need to provide your own ingredients.',
      maxInputs: 2,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.cookFood(workstation, activityType);
      },
    },
    {
      id: 'Roasting Spit',
      triggerActivities: [ActivityType.Cooking],
      power: 1,
      setupCost: 10000,
      maintenanceCost: 100,
      description:
        'A simple spit to roast your foods, letting you add more variety to your diet.<br>You will need to provide your own ingredients.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.cookFood(workstation, activityType);
      },
    },
    {
      id: 'Chef Kitchen',
      triggerActivities: [ActivityType.Cooking],
      power: 2,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A restaurant quality kitchen allowing you to make magnificent meals.<br>You will need to provide your own ingredients.',
      maxInputs: 5,
      inputs: [],
      consequence: (workstation: Workstation, activityType: ActivityType) => {
        this.cookFood(workstation, activityType);
      },
    },
    {
      id: 'Basic Formation Workstation',
      triggerActivities: [ActivityType.FormationCreation],
      power: 1,
      setupCost: 1000000,
      maintenanceCost: 1000,
      description:
        'A simple workspace where you can assemple flags, talismans, arrays, and other items and assemble them into kits that can support you in battle.',
      maxInputs: 3,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createFormationKit(workstation);
      },
    },
    {
      id: 'Advanced Formation Workstation',
      triggerActivities: [ActivityType.FormationCreation],
      power: 2,
      setupCost: 100000000,
      maintenanceCost: 10000,
      description:
        'Am advanced workspace where you can assemple flags, talismans, arrays, and other items and assemble them into kits that can support you in battle.',
      maxInputs: 4,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createFormationKit(workstation);
      },
    },
    {
      id: 'Masterwork Formation Workstation',
      triggerActivities: [ActivityType.FormationCreation],
      power: 3,
      setupCost: 1000000000,
      maintenanceCost: 100000,
      description:
        'A workspace where you can assemple the most powerful flags, talismans, arrays, and other items and assemble them into kits that can support you in battle.',
      maxInputs: 5,
      inputs: [],
      consequence: (workstation: Workstation) => {
        this.createFormationKit(workstation);
      },
    },
    {
      id: 'Simple Infusion Station',
      triggerActivities: [ActivityType.InfuseEquipment],
      power: 0,
      setupCost: 100000000,
      maintenanceCost: 10000,
      description: 'A workspace where you can infuse your equipment with the power and attributes of your gems.',
      maxInputs: 1,
      inputs: [],
      equipmentSlot: 'head',
      consequence: (workstation: Workstation) => {
        this.infuseEquipment(workstation);
      },
    },
    {
      id: 'Advanced Infusion Station',
      triggerActivities: [ActivityType.InfuseEquipment],
      power: 1,
      setupCost: 1000000000,
      maintenanceCost: 100000,
      description:
        'A more powerful workspace where you can infuse your equipment with the power and attributes of your gems.',
      maxInputs: 1,
      inputs: [],
      equipmentSlot: 'head',
      consequence: (workstation: Workstation) => {
        this.infuseEquipment(workstation);
      },
    },
    {
      id: 'Masterwork Infusion Station',
      triggerActivities: [ActivityType.InfuseEquipment],
      power: 2,
      setupCost: 10000000000,
      maintenanceCost: 1000000,
      description:
        'A more powerful workspace where you can infuse your equipment with the power and attributes of your gems.',
      maxInputs: 1,
      inputs: [],
      equipmentSlot: 'head',
      consequence: (workstation: Workstation) => {
        this.infuseEquipment(workstation);
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
    setTimeout(() => (this.followerService = this.injector.get(FollowersService)));
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
      if (this.characterService.fatherGift && this.characterService.bloodlineRank < 6) {
        // Skip this at higher bloodline ranks, it's not thematic.
        this.logService.log(
          LogTopic.EVENT,
          'Your father puts some coins in your purse as you begin your grand adventure.'
        );
        this.characterService.updateMoney(2000);
      }

      this.characterService.updateMoney(this.home.costPerDay * 30);
    });
  }

  tick() {
    if (this.characterService.dead) {
      return;
    }
    if (this.upgrading) {
      this.upgradeTick();
    }
    this.nextHomeCost = this.nextHome.cost - this.nextHomeCostReduction;
    if (this.nextHomeCost < 0) {
      this.nextHomeCost = 0;
    }
    if (!this.hellService?.inHell() || this.hellHome()) {
      this.home.consequence();
      for (const furniturePiece of this.bedroomFurniture) {
        if (furniturePiece?.use) {
          furniturePiece?.use();
        }
      }
    }
    if (!this.hellService?.inHell() && !this.characterService.god()) {
      let totalCost = 0;
      for (const workstation of this.workstations) {
        totalCost += workstation.maintenanceCost;
      }
      totalCost += this.home.costPerDay;
      if (totalCost > this.characterService.money) {
        this.logService.injury(
          LogTopic.EVENT,
          "You can't afford the upkeep on your home. Some thugs rough you up over the debt. You'd better start doing activities that make more money, fast, or you'll work yourself to death."
        );
        if (this.thugPause) {
          this.logService.log(LogTopic.EVENT, 'Game paused (you can change this in the schedule options).');
          this.mainLoopService.pause = true;
        }
        this.characterService.status.health.value -= 20;
        this.characterService.updateMoney(0, true);
      } else {
        this.characterService.updateMoney(0 - totalCost);
      }
    }
  }

  getProperties(): HomeProperties {
    return {
      homeValue: this.homeValue,
      bedroomFurniture: this.bedroomFurniture,
      land: this.land,
      landPrice: this.landPrice,
      keepFurniture: this.keepFurniture,
      keepWorkstationInputs: this.keepWorkstationInputs,
      nextHomeCostReduction: this.nextHomeCostReduction,
      houseBuildingProgress: this.houseBuildingProgress,
      upgrading: this.upgrading,
      ownedFurniture: this.ownedFurniture,
      highestLand: this.highestLand,
      highestLandPrice: this.highestLandPrice,
      bestHome: this.bestHome,
      thugPause: this.thugPause,
      hellHome: this.hellHome(),
      homeUnlocked: this.homeUnlocked,
      keepHome: this.keepHome,
      seeFurnitureEffects: this.seeFurnitureEffects,
      workstations: this.workstations,
      totalCrafts: this.totalCrafts,
      alchemyCounter: this.alchemyCounter,
      forgeChainsCounter: this.forgeChainsCounter,
    };
  }

  setProperties(properties: HomeProperties) {
    this.land = properties.land;
    this.landPrice = properties.landPrice;
    this.setCurrentHome(this.homesList[properties.homeValue]);
    this.keepFurniture = properties.keepFurniture || false;
    this.keepWorkstationInputs = properties.keepWorkstationInputs || false;
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
    this.hellHome.set(properties.hellHome || false);
    this.homeUnlocked = properties.homeUnlocked || false;
    this.keepHome = properties.keepHome;
    this.seeFurnitureEffects = properties.keepHome;
    this.totalCrafts = properties.totalCrafts;
    this.alchemyCounter = properties.alchemyCounter || 0;
    this.forgeChainsCounter = properties.forgeChainsCounter || 0;
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
    if (this.characterService.money >= this.nextHomeCost && this.land >= this.nextHome.landRequired) {
      this.characterService.updateMoney(0 - this.nextHomeCost);
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
    while (this.workstations.length > 0) {
      this.removeWorkstation(this.workstations[0]);
    }
    for (let i = 0; i < this.bedroomFurniture.length; i++) {
      this.setFurniture(null, i);
    }
    this.land += this.home.landRequired;

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
    } else if (!this.keepWorkstationInputs) {
      for (const workstation of this.workstations) {
        for (const wsinput of workstation.inputs) {
          wsinput.quantity = 0;
        }
      }
    }
    if (!this.keepFurniture) {
      for (let i = 0; i < this.bedroomFurniture.length; i++) {
        this.bedroomFurniture[i] = null;
      }
      this.recalculateFengShui();
      this.ownedFurniture = [];
    }
    if (this.characterService.bloodlineRank < 7) {
      if (this.upgrading) {
        // refund the land used in the upgrade so land prices come out right
        this.land += this.nextHome.landRequired;
      }
      this.upgrading = false;
      this.houseBuildingProgress = 1;
    }
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
    if (this.characterService.money >= price) {
      this.characterService.updateMoney(0 - price);
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
    this.characterService.fengshuiScore = fengshuiScore;
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
      triggerActivities: workstationTemplate?.triggerActivities,
      power: workstationTemplate.power,
      setupCost: workstationTemplate.setupCost,
      maintenanceCost: workstationTemplate.maintenanceCost,
      description: workstationTemplate.description,
      maxInputs: workstationTemplate.maxInputs,
      inputs: emptyInputs,
      equipmentSlot: workstationTemplate.equipmentSlot,
      consequence: workstationTemplate.consequence,
    };

    if (copyWorkstation) {
      newWorkstation.inputs = copyWorkstation.inputs;
    }
    this.workstations.push(newWorkstation);
  }

  triggerWorkstations(activityType: ActivityType, numberOfTriggers: number = 1) {
    for (let i = 0; i < numberOfTriggers; i++) {
      // TODO: optimize this
      for (const workstation of this.workstations) {
        if (workstation.triggerActivities.includes(activityType)) {
          workstation.consequence(workstation, activityType);
        }
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
        const maxAdditionalQuantity =
          this.inventoryService.maxStackSize -
          this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity;
        if (this.inventoryService.itemStacks[itemIndex].quantity < maxAdditionalQuantity) {
          this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity +=
            this.inventoryService.itemStacks[itemIndex].quantity;
          this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
        } else {
          this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity +=
            maxAdditionalQuantity;
          this.inventoryService.itemStacks[itemIndex].quantity -= maxAdditionalQuantity;
        }
        return;
      }
      if (this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity === 0) {
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex] =
          this.inventoryService.itemStacks[itemIndex];
        this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].id =
          destinationWorkstationIndex +
          '_' +
          destinationInputIndex +
          this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].item!.name +
          this.workstations[destinationWorkstationIndex].inputs[destinationInputIndex].quantity;
        this.inventoryService.itemStacks[itemIndex] = this.inventoryService.getEmptyItemStack();
      } else {
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
      }
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

  chefsWork(workValue: number) {
    const kitchens = this.workstations.filter(ws => ws.triggerActivities.includes(ActivityType.Cooking));
    for (const kitchen of kitchens) {
      this.cookFood(kitchen, workValue / kitchens.length);
    }
  }

  cookFood(workstation: Workstation, activityType: ActivityType, cookAmount: number = 1) {
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
        itemStack.quantity >= cookAmount
      ) {
        usedIngredients.push(itemStack.item.id);
        if (itemStack.item.subtype && !usedSubtypes.includes(itemStack.item.subtype)) {
          usedSubtypes.push(itemStack.item.subtype);
        }
        totalValue += itemStack.item.value;
        itemStack.quantity -= cookAmount;
      }
    }
    if (totalValue < 1) {
      // didn't find any usable ingredients
      return;
    }

    totalValue *= usedIngredients.length;
    totalValue *= usedSubtypes.length;
    totalValue *= workstation.power + 1;

    const cookingLevel = this.activityService?.getActivityByType(activityType)?.level || 0;
    let imageFile = 'meal';
    let foodName = 'Menu Special #' + totalValue;
    let pouchable = false;
    if (cookingLevel > 0) {
      totalValue *= 4;
      imageFile = 'soulfood';
      foodName = 'Soul Food Special #' + totalValue;
      pouchable = true;
    }
    const effect = 'meal' + totalValue;

    this.totalCrafts++;
    this.inventoryService.addItem(
      {
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
        pouchable: pouchable,
        effect: effect,
      },
      cookAmount
    );
  }

  forgeChains(workstation: Workstation) {
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'metal');

    if (this.characterService.attributes.metalLore.value < 1e9) {
      this.logService.injury(LogTopic.EVENT, 'You lack the necessary knowledge and cause a deadly explosion.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.6;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    if (!materialStack || materialStack.quantity < 10 || (materialStack.item?.value || 0) < 150) {
      this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong tools and materials and hurt yourself.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }
    const gemStack = workstation.inputs.find(itemStack => itemStack.item?.type === LOOT_TYPE_GEM);
    if (!gemStack || gemStack.quantity < 10 || (gemStack.item?.value || 0) < 200) {
      this.logService.injury(
        LogTopic.EVENT,
        "You think you have the right metal, but you'll need something to imbue it with additional strength."
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    this.forgeChainsCounter++;
    materialStack.quantity -= 10;
    gemStack.quantity -= 10;

    if (this.forgeChainsCounter >= 10) {
      this.logService.log(
        LogTopic.CRAFTING,
        'Your anvil gives off an ear-splitting ring and echoes endlessly into the depths. The new chain glows with power!'
      );
      this.inventoryService.addItem(this.itemRepoService.items['unbreakableChain']);
      this.forgeChainsCounter = 0;
    } else {
      this.logService.log(
        LogTopic.CRAFTING,
        'Your anvil rings and weakly echoes into the depths. You throw aside the useless dull chain, but you think you are on the right track.'
      );
    }
  }

  makeMortar(workstation: Workstation) {
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'ore');
    if (!materialStack || (materialStack.item?.value || 0) < 10 || materialStack.quantity < 100) {
      this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong materials and hurt yourself.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    const hideStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'hide');
    if (!hideStack || hideStack.quantity < 10 || (hideStack.item?.value || 0) < 10) {
      this.logService.injury(
        LogTopic.EVENT,
        "You think you have the right ore to make mortar, but you'll need something to give the mortar additional elasticity. Something strong, yet flexible."
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    const gemStack = workstation.inputs.find(itemStack => itemStack.item?.type === LOOT_TYPE_GEM);
    if (!gemStack || gemStack.quantity < 10 || (gemStack.item?.value || 0) < 250) {
      this.logService.injury(
        LogTopic.EVENT,
        "You think you have the right materials to make mortar, but you'll need something to imbue the mixture with additional strength."
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }
    const builderPower = Math.floor((this.followerService!.jobs['builder'].totalPower + 100) / 100);
    if (builderPower < 10) {
      this.logService.injury(
        LogTopic.EVENT,
        'You try mixing the cauldron of mortar, but lack the required experience with building materials to do it properly. You might need some help.'
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }
    materialStack.quantity -= 100;
    hideStack.quantity -= 10;
    gemStack.quantity -= 10;
    this.inventoryService.addItem(this.itemRepoService.items['everlastingMortar'], builderPower);
    this.logService.log(
      LogTopic.CRAFTING,
      'You and your followers made some ' + this.itemRepoService.items['everlastingMortar'].name
    );
  }

  makeBricks(workstation: Workstation) {
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'ore');
    if (!materialStack || (materialStack.item?.value || 0) < 10 || materialStack.quantity < 200) {
      this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong materials and hurt yourself.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    const fuelStackIndex = workstation.inputs.findIndex(itemStack => itemStack.item?.subtype === 'fuel');
    if (fuelStackIndex === -1) {
      this.logService.injury(LogTopic.EVENT, 'Your brick-making smelter remains inert without fuel.');
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    const fuelStack = workstation.inputs[fuelStackIndex];
    if (!fuelStack || (fuelStack.item?.value || 0) < 10) {
      this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong fuels and hurt yourself.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    if (fuelStack.quantity < 2000) {
      // pull in more fuel of the same id if inventory has it.
      const fuelInventoryIndex = this.inventoryService.itemStacks.findIndex(
        itemStack => itemStack?.item?.id === fuelStack.item?.id
      );
      if (fuelInventoryIndex !== -1) {
        this.moveItemToWorkstation(fuelInventoryIndex, this.workstations.indexOf(workstation), fuelStackIndex);
      }
      if (fuelStack.quantity < 2000) {
        // it's still too low on fuel
        fuelStack.quantity = 0;
        this.logService.injury(LogTopic.EVENT, 'Your smelter sputters out, lacking the vast amounts of fuel it needs.');
        if (this.activityService?.pauseOnImpossibleFail) {
          this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
          this.mainLoopService.pause = true;
        }
        return;
      }
    }

    const gemStack = workstation.inputs.find(itemStack => itemStack.item?.type === LOOT_TYPE_GEM);
    if (!gemStack || gemStack.quantity < 10 || (gemStack.item?.value || 0) < 250) {
      this.logService.injury(
        LogTopic.EVENT,
        "You think you have the right ore to make bricks, but you'll need something to imbue the mixture with additional strength."
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    const builderPower = Math.floor((this.followerService!.jobs['builder'].totalPower + 100) / 100);
    if (builderPower < 10) {
      this.logService.injury(
        LogTopic.EVENT,
        'You try forming the bricks in your smelter, but lack the required experience with building materials to do it properly. You might need some help.'
      );
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }

    materialStack.quantity -= 200;
    fuelStack.quantity -= 2000;
    gemStack.quantity -= 10;
    this.inventoryService.addItem(this.itemRepoService.items['everlastingBrick'], builderPower);
    this.logService.log(
      LogTopic.CRAFTING,
      'You and your followers baked a batch of ' + this.itemRepoService.items['everlastingBrick'].name + 's'
    );
  }

  makeScafold(workstation: Workstation) {
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'wood');
    if (!materialStack || (materialStack.item?.value || 0) < 12 || materialStack.quantity < 200) {
      this.logService.injury(LogTopic.EVENT, 'You fumble with the wrong materials and hurt yourself.');
      this.characterService.status.health.value -= this.characterService.status.health.max * 0.05;
      if (this.activityService?.pauseOnImpossibleFail) {
        this.logService.log(LogTopic.EVENT, 'An attempt at an impossible task has failed. Game paused.');
        this.mainLoopService.pause = true;
      }
      return;
    }
    materialStack.quantity -= 200;
    this.inventoryService.addItem(this.itemRepoService.items['scaffolding']);
    this.logService.log(LogTopic.CRAFTING, 'You made ' + this.itemRepoService.items['scaffolding'].name);
  }

  createEquipment(workstation: Workstation, activityType: ActivityType) {
    if (workstation.inputs.length < 1) {
      // inputs array not populated, bail out
      return;
    }
    let material = 'metal';
    if (activityType === ActivityType.Woodworking) {
      material = 'wood';
    } else if (activityType === ActivityType.Leatherworking) {
      material = 'hide';
    }
    const activityLevel = this.activityService?.getActivityByType(activityType)?.level || 0;
    const materialStack = workstation.inputs.find(itemStack => itemStack.item?.type === material);
    // gems can be added for extra power
    const gemStack = workstation.inputs.find(itemStack => itemStack.item?.type === LOOT_TYPE_GEM);
    // wood or leather can be added for extra power
    const extraStack = workstation.inputs.find(
      itemStack =>
        itemStack.item?.type !== material &&
        (itemStack.item?.type === 'wood' || itemStack.item?.type === 'metal' || itemStack.item?.type === 'hide')
    );
    if (materialStack && materialStack.quantity >= 10) {
      let grade = (materialStack?.item?.value || 1) + workstation.power * 5;
      if (materialStack.item?.type === 'wood') {
        grade += Math.log10(this.characterService.attributes.woodLore.value);
      } else if (materialStack.item?.type === 'metal') {
        grade += Math.log10(this.characterService.attributes.metalLore.value);
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
      if (activityType === ActivityType.Leatherworking) {
        item = this.inventoryService.generateArmor(grade, this.inventoryService.randomArmorSlot());
      } else {
        item = this.inventoryService.generateWeapon(grade, material);
      }
      this.inventoryService.addItem(item);
      materialStack.quantity -= 10;
    }
  }

  craftAlchemy(workstation: Workstation, activityType: ActivityType) {
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
    const alchemyLevel = this.activityService?.getActivityByType(activityType)?.level || 0;
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
        itemStack.item.type === LOOT_TYPE_GEM &&
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
      this.inventoryService.generatePotion(totalValue);
    } else {
      this.inventoryService.generatePotion(totalValue);
    }
  }

  createFormationKit(workstation: Workstation) {
    const woodStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'wood' && itemStack.quantity >= 10);
    const hideStack = workstation.inputs.find(itemStack => itemStack.item?.type === 'hide' && itemStack.quantity >= 10);
    const gemStack = workstation.inputs.find(
      itemStack => itemStack.item?.type === LOOT_TYPE_GEM && itemStack.quantity >= 10
    );

    if (!woodStack || !hideStack || !gemStack) {
      return;
    }
    const metalStack = workstation.inputs.find(
      itemStack => itemStack.item?.type === 'metal' && itemStack.quantity >= 10
    );
    const alchemyStack = workstation.inputs.find(
      itemStack =>
        (itemStack.item?.type === 'potion' || itemStack.item?.type === 'pill' || itemStack.item?.type === 'herb') &&
        itemStack.quantity >= 10
    );
    let formationPower =
      (woodStack.item?.value || 0) +
      (hideStack.item?.value || 0) +
      (gemStack.item?.value || 0) +
      (metalStack?.item?.value || 0) +
      (alchemyStack?.item?.value || 0);
    formationPower *= workstation.power;
    formationPower = Math.floor(formationPower);
    this.inventoryService.addItem(this.inventoryService.generateFormationKit(formationPower));
    woodStack.quantity -= 10;
    hideStack.quantity -= 10;
    gemStack.quantity -= 10;
    if (metalStack) {
      metalStack.quantity -= 10;
    }
    if (alchemyStack) {
      alchemyStack.quantity -= 10;
    }
  }

  infuseEquipment(workstation: Workstation) {
    if (!workstation.equipmentSlot) {
      return;
    }
    const equipmentItem = this.characterService.equipment[workstation.equipmentSlot];
    const gemStack = workstation.inputs.find(
      itemStack => itemStack.item?.type === LOOT_TYPE_GEM && itemStack.quantity > 0
    );
    const gemValue = gemStack?.item?.value || 0;
    if (gemValue > 0 && equipmentItem) {
      this.inventoryService.upgradeEquipment(
        equipmentItem,
        Math.pow((gemValue * (1 + workstation.power)) / 10, 2.4),
        gemStack?.item?.subtype
      );
      gemStack!.quantity--;
    }
  }

  changeWorkstationEquipmentSlot(workstation: Workstation) {
    if (!workstation.equipmentSlot) {
      return;
    }
    const slots: EquipmentPosition[] = ['head', 'body', 'legs', 'feet', 'rightHand', 'leftHand'];
    let index = slots.indexOf(workstation.equipmentSlot);
    index++;
    if (index >= slots.length) {
      index = 0;
    }
    workstation.equipmentSlot = slots[index];
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
    const furnitureItem = this.bedroomFurniture[furnitureIndex];
    if (furnitureItem) {
      tooltip += '<br><br>' + this.getFurnitureTooltip(furnitureItem);
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
