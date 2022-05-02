import { Injectable } from '@angular/core';
import { BattleService } from '../battle-panel/battle.service';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterService } from './character.service';
import { Home } from './home';
import { InventoryService, ItemType } from './inventory.service';
import { ItemRepoService } from './item-repo.service';

export enum HomeType {
  SquatterTent,
  OwnTent,
  DirtyShack,
  SimpleHut,
  PleasantCottage
}

export interface Field {
  cropName: ItemType,
  yield: number,
  maxYield: number,
  daysToHarvest: number
}

export interface HomeProperties {
  land: number,
  homeValue: HomeType,
  fields: Field[],
  fieldYields: number,
  autoReplant: boolean,
  landPrice: number,
  autoBuyLandUnlocked: boolean,
  autoBuyLandLimit: number,
  autoBuyHomeUnlocked: boolean,
  autoBuyHomeLimit: HomeType,
  autoFieldUnlocked: boolean,
  autoFieldLimit: number
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  autoBuyLandUnlocked: boolean = false;
  autoBuyLandLimit: number = 50;
  autoBuyHomeUnlocked: boolean = false;
  autoBuyHomeLimit: HomeType = 1;
  autoFieldUnlocked: boolean = false;
  autoFieldLimit: number = 50;
  land: number;
  landPrice: number;
  fields: Field[] = [];
  fieldYields = 0; // running tally of how much food is currently growing in your fields
  fieldsTooltip: string = "";
  homesList: Home[] = [
    {
      name: "Squatter Tent",
      type: HomeType.SquatterTent,
      description: "A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The mice around here are pretty nasty and you might get robbed by bandits.",
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      consequence: () => {
        if (Math.random() < 0.05){
          this.logService.addLogMessage("Some troublemakers stole some money while you were sleeping. It might be time to get some walls.", 'INJURY', 'EVENT');
          this.characterService.characterState.money -= (this.characterService.characterState.money / 10);
        }
        if (Math.random() < 0.6){
          this.battleService.addEnemy(this.battleService.enemyRepo.mouse);
        }
      }
    },
    {
      name: "Tent of Your Own",
      type: HomeType.OwnTent,
      description: "A decent tent pitched on your own bit of land. The occasional mouse or ruffian might give you trouble. Automatically restores 1 stamina and a bit of health each night.",
      cost: 100,
      costPerDay: 1,
      landRequired: 1,
      consequence: () => {
        this.characterService.characterState.status.health.value += .5;
        this.characterService.characterState.status.stamina.value += 1;
        if (Math.random() < 0.05){
          this.logService.addLogMessage("Some troublemakers stole some money while you were sleeping. It might be time to get some walls.", 'INJURY', 'EVENT');
          this.characterService.characterState.money -= (this.characterService.characterState.money / 10);
        }
        if (Math.random() < 0.3){
          this.battleService.addEnemy(this.battleService.enemyRepo.mouse);
        }
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Dirty Shack",
      type: HomeType.DirtyShack,
      description: "A cheap dirt-floored wooden shack. At least it has a door to keep ruffians out. Automatically restores 3 stamina and a bit of health each night.",
      cost: 1000,
      costPerDay: 5,
      landRequired: 5,
      consequence: () => {
        this.characterService.characterState.status.health.value += .3;
        this.characterService.characterState.status.stamina.value += 3;
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Simple Hut",
      type: HomeType.SimpleHut,
      description: "A very simple hut. Automatically restores 5 stamina and a bit of health each night.",
      cost: 10000,
      costPerDay: 10,
      landRequired: 10,
      consequence: () => {
        this.characterService.characterState.status.health.value += .5;
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Pleasant Cottage",
      type: HomeType.PleasantCottage,
      description: "A nice little home where you can rest peacefully. Automatically restores 10 stamina and a bit of health each night.",
      cost: 100000,
      costPerDay: 20,
      landRequired: 20,
      consequence: () => {
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 10;
        this.characterService.characterState.checkOverage();
      }
    }
  ];

  homeValue!: HomeType;
  home!: Home;
  nextHome!: Home;
  autoReplant : boolean;

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
      this.autoReplant = false;
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
        this.home.consequence();
        this.ageFields();
        if (this.home.costPerDay > this.characterService.characterState.money){
          this.logService.addLogMessage("You can't afford the upkeep on your home. Some thugs rough you up over the debt. You better get some money, fast.", "INJURY", 'EVENT');
          this.characterService.characterState.status.health.value -= 20;
          this.characterService.characterState.money = 0;
        } else {
          this.characterService.characterState.money -= this.home.costPerDay;
        }
        this.autoBuy();
      });

      reincarnationService.reincarnateSubject.subscribe(() => {
        this.reset();
        if (Math.random() < .3){
          this.logService.addLogMessage("Your grandfather gives you a bit of land and helps you set up a tent on  it.", "STANDARD", 'REBIRTH');
          //and a few coins so you don't immediately get beat up for not having upkeep money for your house
          this.characterService.characterState.money += 5;
          this.setCurrentHome(this.nextHome);
        }
      });
  }

  getProperties(): HomeProperties {
    return {
      homeValue: this.homeValue,
      land: this.land,
      landPrice: this.landPrice,
      fields: this.fields,
      fieldYields: this.fieldYields,
      autoReplant: this.autoReplant,
      autoBuyLandUnlocked: this.autoBuyLandUnlocked,
      autoBuyLandLimit: this.autoBuyLandLimit,
      autoBuyHomeUnlocked: this.autoBuyHomeUnlocked,
      autoBuyHomeLimit: this.autoBuyHomeLimit,
      autoFieldUnlocked: this.autoFieldUnlocked,
      autoFieldLimit: this.autoFieldLimit,
    }
  }

  setProperties(properties: HomeProperties) {
    this.land = properties.land;
    this.landPrice = properties.landPrice;
    this.autoReplant = properties.autoReplant;
    this.fields = properties.fields;
    this.fieldYields = properties.fieldYields;
    this.setCurrentHome(this.homesList[properties.homeValue]);
    this.autoBuyLandUnlocked = properties.autoBuyLandUnlocked;
    this.autoBuyLandLimit = properties.autoBuyLandLimit;
    this.autoBuyHomeUnlocked = properties.autoBuyHomeUnlocked;
    this.autoBuyHomeLimit = properties.autoBuyHomeLimit;
    this.autoFieldUnlocked = properties.autoFieldUnlocked;
    this.autoFieldLimit = properties.autoFieldLimit;
  }

  // gets the specs of the next home, doesn't actually upgrade
  getNextHome(){
    for (let i = 0; i < this.homesList.length - 1; i++){
      if (this.homeValue == this.homesList[i].type){
        return this.homesList[i + 1];
      }
    }
    // we're on the last home.
    return this.homesList[this.homesList.length - 1];
  }

  upgradeToNextHome(){
    if (this.characterService.characterState.money >= this.nextHome.cost &&
      this.land >= this.nextHome.landRequired){
      this.characterService.characterState.money -= this.nextHome.cost;
      this.land -= this.nextHome.landRequired;
      this.setCurrentHome(this.nextHome);
      this.logService.addLogMessage("You upgraded your home. You now live in a " + this.home.name, "STANDARD", 'EVENT');
    }
  }

  reset() {
    this.setCurrentHome(this.homesList[0]);
    this.land = 0;
    this.landPrice = 100;
    this.fields = [];
    this.fieldYields = 0;
    this.fieldsTooltip = "";
  }

  setCurrentHome(home: Home) {
    this.homeValue = home.type;
    this.home = this.getHomeFromValue(this.homeValue);
    this.nextHome = this.getNextHome();
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
    if (this.characterService.characterState.attributes.plantLore.value > 1){
      cropIndex = Math.floor(Math.log2(this.characterService.characterState.attributes.plantLore.value));
    }
    if (cropIndex >= this.inventoryService.farmFoodList.length){
      cropIndex = this.inventoryService.farmFoodList.length - 1;
    }
    const cropItem = this.inventoryService.farmFoodList[cropIndex];
    // more valuable crops yield less per field and take longer to harvest, tune this later
    return {cropName: cropItem.id,
      yield: 0,
      maxYield: Math.floor((100 / cropItem.value) + this.characterService.characterState.attributes.plantLore.value),
      daysToHarvest: 90 + cropItem.value
    };
  }

  addField(){
    if (this.land > 0){
      this.land--;
      this.fields.push(this.getCrop());
      this.fieldYields++;
    }
  }

  workFields(){
    let workValue = 1;
    if (this.characterService.characterState.attributes.plantLore.value >= 10){
      workValue += Math.floor(Math.log10(this.characterService.characterState.attributes.plantLore.value));
    }
    for (const field of this.fields){
      if (field.yield < field.maxYield){
        field.yield += workValue;
        this.fieldYields += workValue;
      }
    }
  }

  ageFields(){
    let nextHarvest = Number.MAX_VALUE;
    for (let i = this.fields.length - 1; i >= 0; i--){
      if (this.fields[i].daysToHarvest < nextHarvest){
        nextHarvest = this.fields[i].daysToHarvest;
      }
      if (this.fields[i].daysToHarvest <= 0){
        this.inventoryService.addItems(this.itemRepoService.getItemById(this.fields[i].cropName), this.fields[i].yield);
        this.fieldYields -= this.fields[i].yield;
        if (this.autoReplant){
          this.fields[i] = this.getCrop();
        } else {
          this.fields.splice(i, 1);
          this.land++;
        }
      } else {
        this.fields[i].daysToHarvest--;
      }
    }
    if (nextHarvest < Number.MAX_VALUE){
      this.fieldsTooltip = "Next harvest in " + nextHarvest + " days.";
    }
  }

  buyLand(){
    if (this.characterService.characterState.money >= this.landPrice){
      this.characterService.characterState.money -= this.landPrice;
      this.land++;
      this.landPrice += 10;
    }
  }

  autoBuy(){
    if (this.autoBuyHomeUnlocked && this.homeValue < this.autoBuyHomeLimit){
      if (this.land >= this.nextHome.landRequired){
        //autoBuy is on, we have enough land, check if we have the money for the house plus the next few days' rent and food
        if ((this.nextHome.cost + (this.nextHome.costPerDay * 3) + 3)  < this.characterService.characterState.money){
          this.upgradeToNextHome();
        } else {
          // we can't afford the next house, bail out and don't autoBuy more land
          return;
        }
      }
    }
    if (this.autoBuyLandUnlocked && (this.land + this.fields.length) < this.autoBuyLandLimit){
      //autoBuy is on, check if we have the money for the land plus the next few days' rent and food
      if (this.characterService.characterState.money > this.landPrice  + (this.nextHome.costPerDay * 3) + 3 ){
        this.buyLand();
      }
    }
    if (this.autoFieldUnlocked && this.fields.length < this.autoFieldLimit){
      // don't autofield if we're trying to autoBuy a home
      if (this.autoBuyHomeLimit){
        if (this.homeValue >= this.autoBuyHomeLimit){
          this.addField();
        }
      } else {
        this.addField();
      }
    }
  }
}
