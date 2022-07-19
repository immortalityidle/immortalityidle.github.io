import { Injectable } from '@angular/core';
import { BattleService } from './battle.service';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { CharacterService } from './character.service';
import { Furniture, InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';

export interface Home {
  name: string;
  type: HomeType;
  description: string;
  cost: number;
  costPerDay: number;
  landRequired: number;
  maxInventory: number;
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
  Capital
}

export interface Field {
  cropName: string,
  yield: number,
  maxYield: number,
  daysToHarvest: number,
  originalDaysToHarvest: number
}

export interface HomeProperties {
  land: number,
  homeValue: HomeType,
  furniture: FurnitureSlots,
  fields: Field[],
  extraFields: number,
  averageYield: number,
  landPrice: number,
  autoBuyLandUnlocked: boolean,
  autoBuyLandLimit: number,
  autoBuyHomeUnlocked: boolean,
  autoBuyHomeLimit: HomeType,
  autoBuyFurnitureUnlocked: boolean,
  autoBuyFurniture: FurnitureSlots,
  autoFieldUnlocked: boolean,
  autoFieldLimit: number,
  useAutoBuyReserve: boolean,
  autoBuyReserveAmount: number,
  nextHomeCostReduction: number,
  houseBuildingProgress: number,
  upgrading: boolean,
  ownedFurniture: string[]
}

export type FurniturePosition = 'bed' | 'bathtub' | 'kitchen' | 'workbench';
export type FurnitureSlots  = { [key in FurniturePosition]: Furniture | null};

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  autoBuyLandUnlocked = false;
  autoBuyLandLimit = 5;
  autoBuyHomeUnlocked = false;
  autoBuyHomeLimit: HomeType = 2;
  autoBuyFurnitureUnlocked = false;
  autoBuyFurniture: FurnitureSlots = {
    bed: null,
    bathtub: null,
    kitchen: null,
    workbench: null
  }
  autoFieldUnlocked = false;
  autoFieldLimit = 0;
  useAutoBuyReserve = false;
  autoBuyReserveAmount = 0;
  land: number;
  landPrice: number;
  fields: Field[] = [];
  extraFields = 0;
  averageYield = 0; // running average of how much food is produced
  furniture: FurnitureSlots = {
    bed: null,
    bathtub: null,
    kitchen: null,
    workbench: null
  }
  furniturePositionsArray: FurniturePosition[] = ['bed', 'bathtub', 'kitchen', 'workbench'];
  ownedFurniture: string[] = [];
  grandfatherTent = false;
  houseBuildingProgress = 1;
  upgrading = false;

  homesList: Home[] = [
    {
      name: "Squatter Tent",
      type: HomeType.SquatterTent,
      description: "A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The mice around here are pretty nasty and you might get robbed by bandits.",
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      maxInventory: 10,
      consequence: () => {
        if (Math.random() < 0.05){
          this.logService.addLogMessage("Some troublemakers stole some money while you were sleeping. It might be time to get some walls.", 'INJURY', 'EVENT');
          this.characterService.characterState.money -= (this.characterService.characterState.money / 10);
        }
        if (Math.random() < 0.4){
          this.battleService.addEnemy(this.battleService.enemyRepo.mouse);
        }
      },
      furnitureSlots: [],
      daysToBuild: 1
    },
    {
      name: "Tent of Your Own",
      type: HomeType.OwnTent,
      description: "A decent tent pitched on your own bit of land. The occasional mouse or ruffian might give you trouble. Automatically restores 1 stamina and a bit of health each night.",
      cost: 100,
      costPerDay: 1,
      landRequired: 1,
      maxInventory: 12,
      consequence: () => {
        this.characterService.characterState.status.health.value += .5;
        this.characterService.characterState.status.stamina.value += 1;
        if (Math.random() < 0.03){
          this.logService.addLogMessage("Some troublemakers stole some money while you were sleeping. It might be time to get some walls.", 'INJURY', 'EVENT');
          this.characterService.characterState.money -= (this.characterService.characterState.money / 10);
        }
        if (Math.random() < 0.2){
          this.battleService.addEnemy(this.battleService.enemyRepo.mouse);
        }
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [],
      daysToBuild: 1
    },
    {
      name: "Dirty Shack",
      type: HomeType.DirtyShack,
      description: "A cheap dirt-floored wooden shack. At least it has a door to keep ruffians out. Automatically restores 3 stamina and a bit of health each night.",
      cost: 1000,
      costPerDay: 5,
      landRequired: 5,
      maxInventory: 15,
      consequence: () => {
        this.characterService.characterState.status.health.value += .5;
        this.characterService.characterState.status.stamina.value += 3;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed'
      ],
      daysToBuild: 1
    },
    {
      name: "Simple Hut",
      type: HomeType.SimpleHut,
      description: "A very simple hut. Automatically restores 5 stamina and a bit of health each night.",
      cost: 10000,
      costPerDay: 10,
      landRequired: 10,
      maxInventory: 18,
      consequence: () => {
        this.characterService.characterState.status.health.value += .7;
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub'
      ],
      daysToBuild: 10
    },
    {
      name: "Pleasant Cottage",
      type: HomeType.PleasantCottage,
      description: "A nice little home where you can rest peacefully. Automatically restores 10 stamina and a bit of health each night.",
      cost: 100000,
      costPerDay: 20,
      landRequired: 20,
      maxInventory: 20,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 0.1;
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 10;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen'
      ],
      daysToBuild: 30
    },
    {
      name: "Large House",
      type: HomeType.LargeHouse,
      description: "A large house where you can live and work. Automatically restores 15 stamina and a bit of health each night.",
      cost: 1000000,
      costPerDay: 50,
      landRequired: 50,
      maxInventory: 24,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 0.2;
        this.characterService.characterState.status.health.value += 2;
        this.characterService.characterState.status.stamina.value += 15;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 90
    },
    {
      name: "Courtyard House",
      type: HomeType.CourtyardHouse,
      description: "A large house with a wall and an enclosed courtyard. Perfect for building a thriving business. Automatically restores 20 stamina and a bit of health each night.",
      cost: 10000000,
      costPerDay: 80,
      landRequired: 80,
      maxInventory: 28,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 0.3;
        this.characterService.characterState.status.health.value += 3;
        this.characterService.characterState.status.stamina.value += 20;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 180
    },
    {
      name: "Manor",
      type: HomeType.Manor,
      description: "A large manor house. You are really moving up in the world. Automatically restores 25 stamina and a bit of health each night.",
      cost: 100000000,
      costPerDay: 100,
      landRequired: 100,
      maxInventory: 30,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 0.4;
        this.characterService.characterState.status.health.value += 4;
        this.characterService.characterState.status.stamina.value += 25;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 365
    },
    {
      name: "Mansion",
      type: HomeType.Mansion,
      description: "An elaborate mansion. Automatically restores 30 stamina and a bit of health each night.",
      cost: 1000000000,
      costPerDay: 120,
      landRequired: 120,
      maxInventory: 32,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 0.5;
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.status.stamina.value += 30;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 3650
    },
    {
      name: "Palace",
      type: HomeType.Palace,
      description: "A lavish palace. Automatically restores 35 stamina and a bit of health each night.",
      cost: 10000000000,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 36,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 1;
        this.characterService.characterState.status.health.value += 10;
        this.characterService.characterState.status.stamina.value += 35;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 36500
    },
    {
      name: "Castle",
      type: HomeType.Castle,
      description: "An imposing castle. Automatically restores 40 stamina and a bit of health each night.",
      cost: 10000000000,
      costPerDay: 150,
      landRequired: 150,
      maxInventory: 40,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 2;
        this.characterService.characterState.status.health.value += 15;
        this.characterService.characterState.status.stamina.value += 40;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 365000
    },
    {
      name: "Fortress",
      type: HomeType.Fortress,
      description: "An indomitable fortress. Automatically restores 50 stamina and a bit of health each night.",
      cost: 100000000000,
      costPerDay: 180,
      landRequired: 180,
      maxInventory: 50,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 3;
        this.characterService.characterState.status.health.value += 20;
        this.characterService.characterState.status.stamina.value += 50;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 3650000
    },
    {
      name: "Mountain",
      type: HomeType.Mountain,
      description: "An entire mighty mountain. Automatically restores 100 stamina and a bit of health each night.",
      cost: 1000000000000,
      costPerDay: 500,
      landRequired: 500,
      maxInventory: 60,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 4;
        this.characterService.characterState.status.health.value += 30;
        this.characterService.characterState.status.stamina.value += 100;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 36500000
    },
    {
      name: "Forbidden City",
      type: HomeType.ForbiddenCity,
      description: "A city of your very own. Automatically restores 200 stamina and a bit of health each night.",
      cost: 10000000000000,
      costPerDay: 1000,
      landRequired: 1000,
      maxInventory: 80,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 5;
        this.characterService.characterState.status.health.value += 50;
        this.characterService.characterState.status.stamina.value += 200;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 365000000
    },
    {
      name: "Capital",
      type: HomeType.Capital,
      description: "The entire empire is yours now. Automatically restores 300 stamina and a bit of health each night.",
      cost: 100000000000000,
      costPerDay: 10000,
      landRequired: 10000,
      maxInventory: 100,
      consequence: () => {
        this.characterService.characterState.status.mana.value += 10;
        this.characterService.characterState.status.health.value += 80;
        this.characterService.characterState.status.stamina.value += 300;
        this.characterService.characterState.checkOverage();
      },
      furnitureSlots: [
        'bed',
        'bathtub',
        'kitchen',
        'workbench'
      ],
      daysToBuild: 3650000000
    }
  ];

  homeValue!: HomeType;
  home!: Home;
  nextHome!: Home;
  nextHomeCostReduction = 0;
  nextHomeCost = 0;
  
  constructor(
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private logService: LogService,
    private battleService: BattleService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
      this.land = 0;
      this.landPrice = 100;
      this.setCurrentHome(this.homesList[0]);
      if (this.home === undefined ||
        this.homeValue === undefined ||
        this.nextHome === undefined) {
        throw Error('Home service not initialized correctly.');
      }

      mainLoopService.tickSubject.subscribe(() => {
        if (this.characterService.characterState.dead){
          return;
        }
        if (this.upgrading){
          this.upgradeTick();
        }
        this.nextHomeCost = this.nextHome.cost - this.nextHomeCostReduction;
        if (this.nextHomeCost < 0){
          this.nextHomeCost = 0;
        }
        this.home.consequence();
        for (const slot of this.furniturePositionsArray){
          const furniturePiece = this.furniture[slot];
          if (furniturePiece?.use){
            furniturePiece?.use();
          }
        }
        this.ageFields();
        if (this.home.costPerDay > this.characterService.characterState.money){
          this.logService.addLogMessage("You can't afford the upkeep on your home. Some thugs rough you up over the debt. You better get some money, fast.", "INJURY", 'EVENT');
          this.characterService.characterState.status.health.value -= 20;
          this.characterService.characterState.money = 0;
        } else {
          this.characterService.characterState.money -= this.home.costPerDay;
        }
      });

      reincarnationService.reincarnateSubject.subscribe(() => {
        this.reset();
        if (this.grandfatherTent){
          this.logService.addLogMessage("Your grandfather gives you a bit of land and helps you set up a tent on  it.", "STANDARD", 'EVENT');
          //and a few coins so you don't immediately get beat up for not having upkeep money for your house
          this.characterService.characterState.money += 50;
          this.setCurrentHome(this.nextHome);
        }
      });
  }

  getProperties(): HomeProperties {
    return {
      homeValue: this.homeValue,
      furniture: this.furniture,
      land: this.land,
      landPrice: this.landPrice,
      fields: this.fields,
      extraFields: this.extraFields,
      averageYield: this.averageYield,
      autoBuyLandUnlocked: this.autoBuyLandUnlocked,
      autoBuyLandLimit: this.autoBuyLandLimit,
      autoBuyHomeUnlocked: this.autoBuyHomeUnlocked,
      autoBuyHomeLimit: this.autoBuyHomeLimit,
      autoBuyFurnitureUnlocked: this.autoBuyFurnitureUnlocked,
      autoBuyFurniture: this.autoBuyFurniture,
      autoFieldUnlocked: this.autoFieldUnlocked,
      useAutoBuyReserve: this.useAutoBuyReserve,
      autoBuyReserveAmount: this.autoBuyReserveAmount,
      autoFieldLimit: this.autoFieldLimit,
      nextHomeCostReduction: this.nextHomeCostReduction,
      houseBuildingProgress: this.houseBuildingProgress,
      upgrading: this.upgrading,
      ownedFurniture: this.ownedFurniture,

    }
  }

  setProperties(properties: HomeProperties) {
    this.land = properties.land;
    this.landPrice = properties.landPrice;
    this.fields = properties.fields;
    this.extraFields = properties.extraFields || 0;
    this.averageYield = properties.averageYield || 0;
    this.setCurrentHome(this.homesList[properties.homeValue]);
    this.autoBuyLandUnlocked = properties.autoBuyLandUnlocked || false;
    this.autoBuyLandLimit = properties.autoBuyLandLimit || 0;
    this.autoBuyHomeUnlocked = properties.autoBuyHomeUnlocked || false;
    this.autoBuyHomeLimit = properties.autoBuyHomeLimit || 3;
    this.autoBuyFurnitureUnlocked = properties.autoBuyFurnitureUnlocked || false;
    this.autoBuyFurniture = properties.autoBuyFurniture || false;
    this.autoFieldUnlocked = properties.autoFieldUnlocked || false;
    this.autoFieldLimit = properties.autoFieldLimit || 0;
    this.useAutoBuyReserve = properties.useAutoBuyReserve || false;
    this.autoBuyReserveAmount = properties.autoBuyReserveAmount || 0;
    this.nextHomeCostReduction = properties.nextHomeCostReduction || 0;
    this.houseBuildingProgress = properties.houseBuildingProgress || 1;
    this.upgrading = properties.upgrading || false;
    for (const slot of this.furniturePositionsArray){
      const savedFurniture = properties.furniture[slot];
      if (savedFurniture){
        this.furniture[slot] = this.itemRepoService.getFurnitureById(savedFurniture.id);
      }
    }
    this.ownedFurniture = properties.ownedFurniture || [];
  }

  // gets the specs of the next home, doesn't actually upgrade
  getNextHome(){
    for (let i = this.homeValue; i < this.homesList.length - 1; i++){
      if (this.homeValue === this.homesList[i].type){
        return this.homesList[i + 1];
      }
    }
    // we're on the last home.
    return this.homesList[this.homesList.length - 1];
  }

  upgradeToNextHome(){
    if (this.upgrading){
      // currently upgrading, bail out
      return;
    }
    if (this.characterService.characterState.money >= this.nextHomeCost && this.land >= this.nextHome.landRequired){
      this.characterService.characterState.money -= this.nextHomeCost;
      this.land -= this.nextHome.landRequired;
      this.nextHomeCostReduction = 0;
      this.houseBuildingProgress = 0;
      this.upgrading = true;
      this.logService.addLogMessage("You start upgrading your home to a " + this.nextHome.name, "STANDARD", 'EVENT');
    }
  }

  upgradeTick(){
    this.houseBuildingProgress += 1 / this.nextHome.daysToBuild;
    if (this.houseBuildingProgress >= 1){
      this.houseBuildingProgress = 1;
      this.upgrading = false;
      this.setCurrentHome(this.nextHome);
      this.logService.addLogMessage("You finished upgrading your home. You now live in a " + this.home.name, "STANDARD", 'EVENT');
    }
  }

  reset() {
    this.nextHomeCostReduction = 0;
    this.setCurrentHome(this.homesList[0]);
    this.land = 0;
    this.landPrice = 100;
    this.fields = [];
    this.extraFields = 0;
    this.averageYield = 0;
    this.furniture.bed = null;
    this.furniture.bathtub = null;
    this.furniture.kitchen = null;
    this.furniture.workbench = null;
    this.upgrading = false;
    this.houseBuildingProgress = 1;
    this.ownedFurniture = [];
  }

  setCurrentHome(home: Home) {
    this.homeValue = home.type;
    this.home = this.getHomeFromValue(this.homeValue);
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

  getCrop(): Field{
    let cropIndex = 0;
    if (this.characterService.characterState.attributes.woodLore.value > 1){
      cropIndex = Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value));
    }
    if (cropIndex >= this.inventoryService.farmFoodList.length){
      cropIndex = this.inventoryService.farmFoodList.length - 1;
    }
    const cropItem = this.inventoryService.farmFoodList[cropIndex];
    // more valuable crops yield less per field and take longer to harvest, tune this later
    return {cropName: cropItem.id,
      yield: 1,
      maxYield: Math.floor(200 / cropItem.value),
      daysToHarvest: 180 + cropItem.value,
      originalDaysToHarvest: 180 + cropItem.value
    };
  }

  addField(quantity = 1){
    if (quantity < 0){
      quantity = this.land;
    }
    while (quantity > 0 && this.land > 0){
      if (this.fields.length >= 300){
        this.extraFields += quantity;
        this.land -= quantity;
        return;
      } else {
        this.fields.push(this.getCrop());
        this.land--;
        quantity--;
      }
    }
  }
  
/**
 * 
 * @param quantity -1 for all
 */
  clearField(quantity = 1){
    if (quantity < 0){
      this.land += this.extraFields;
      this.extraFields = 0;
      this.land += this.fields.length;
      this.fields.splice(0);
      return;
    }
    if (this.extraFields > 0 && quantity <= this.extraFields){
      this.extraFields -= quantity;
      this.land += quantity;
      return;
    } else {
      quantity -= this.extraFields;
      this.extraFields = 0;
    }
    if (this.extraFields > 0 && quantity <= this.extraFields){
      this.extraFields -= quantity;
      this.land += quantity;
      return;
    } else {
      quantity -= this.extraFields;
      this.extraFields = 0;
    }
    if (this.fields.length > 0){
      if (quantity > this.fields.length){
        quantity = this.fields.length;
      }
      this.land += quantity;
      this.fields.splice(this.fields.length - quantity);
    }
  }

  workFields(workValue: number){
    for (let i = 0; i < this.fields.length && i < 300; i++){
      const field = this.fields[i];
      if (field.yield < field.maxYield){
        field.yield += workValue;
      }
    }
  }

  // only ever really work the first 300 fields that we show.
  // After that prorate yields by the amount of fields over 300.
  ageFields(){
    let startIndex = this.fields.length - 1;
    if (startIndex > 299){
      startIndex = 299;
    }
    let totalDailyYield = 0;
    for (let i = startIndex; i >= 0; i--){
      if (this.fields[i].daysToHarvest <= 0){
        let fieldYield = this.fields[i].yield;
        if (this.fields.length + this.extraFields > 300){
          fieldYield = Math.floor((this.fields.length + this.extraFields) / 300);
        }
        totalDailyYield += fieldYield;
        this.inventoryService.addItem(this.itemRepoService.items[this.fields[i].cropName], fieldYield);
        this.fields[i] = this.getCrop();
      } else {
        this.fields[i].daysToHarvest--;
      }
    }
    this.averageYield = ((this.averageYield * 364) + totalDailyYield) / 365;
  }

/**
 * Set count to -1 for half max
 * @returns count of actual purchase
 */
  buyLand(count: number): number{
    const maximumCount = this.calculateAffordableLand(this.characterService.characterState.money);
    if(!maximumCount || !count){
      return 0;
    }
    let increase = 0;
    let price = 0;
    if (count > 0){
      count = Math.min(count,maximumCount);
    } else {
      count = Math.floor(maximumCount / 2);
    }
    increase = 10 * (count * (count + 1) / 2); //mathmatically increase by linear sum n (n + 1) / 2
    price = this.landPrice * count + increase;
    if (this.characterService.characterState.money >= price){
      this.characterService.characterState.money -= price;
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
  calculateAffordableLand(money: number): number{
    const x = money;
    const C = this.landPrice;
    return Math.floor(((-C - 5) + (Math.sqrt(Math.pow(C, 2) + 10 * C + 20 * x + 25)))/10); // I know this looks nuts but I tested it on its own ^_^;;

  }

  buyFurniture(itemId: string) {
    const item = this.itemRepoService.getFurnitureById(itemId)
    if (item) {
      if (this.characterService.characterState.money >= item.value){
        this.characterService.characterState.money -= item.value;
        this.ownedFurniture.push(item.name);
        this.furniture[item.slot] = item;
      }
    }
  }
}