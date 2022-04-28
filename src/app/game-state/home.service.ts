import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterService } from './character.service';
import { Home } from './home';
import { InventoryService } from './inventory.service';

export enum HomeType {
  SquatterTent,
  OwnTent,
  DirtyShack,
  SimpleHut,
  PleasantCottage
}

export interface Field {
  cropName: string,
  yield: number,
  maxYield: number,
  daysToHarvest: number
}

export interface HomeProperties {
  land: number,
  homeValue: HomeType,
  fields: Field[],
  fieldYields: number,
  autoReplant: boolean
  landPrice: number
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  land: number;
  landPrice: number;
  fields: Field[] = [];
  fieldYields = 0; // running tally of how much food is currently growing in your fields
  homesList: Home[] = [
    {
      name: "Squatter Tent",
      type: HomeType.SquatterTent,
      description: "A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The owner of the land may not like that you're here.",
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      consequence: () => {
        if (Math.random() < 0.3){
          this.logService.addLogMessage("You got roughed up by the owner of the field. You should probably buy your own land and put up a better tent.");
          this.characterService.characterState.status.health.value -= 2;
        }
      }
    },
    {
      name: "Tent of Your Own",
      type: HomeType.OwnTent,
      description: "A decent tent pitched on your own bit of land.",
      cost: 100,
      costPerDay: 1,
      landRequired: 1,
      consequence: () => {
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 1;
        if (Math.random() < 0.1){
          this.logService.addLogMessage("You got roughed up by some local troublemakers. It might be time to get some walls.");
          this.characterService.characterState.status.health.value -= 2;
        }
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Dirty Shack",
      type: HomeType.DirtyShack,
      description: "A cheap dirt-floored wooden shack. At least it has a door to keep ruffians out.",
      cost: 1000,
      costPerDay: 5,
      landRequired: 5,
      consequence: () => {
        this.characterService.characterState.status.health.value += 3;
        this.characterService.characterState.status.stamina.value += 3;
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Simple Hut",
      type: HomeType.SimpleHut,
      description: "A very simple hut.",
      cost: 10000,
      costPerDay: 10,
      landRequired: 10,
      consequence: () => {
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.status.stamina.value += 5;
        this.characterService.characterState.checkOverage();
      }
    },
    {
      name: "Pleasant Cottage",
      type: HomeType.PleasantCottage,
      description: "A nice little home where you can rest peacefully.",
      cost: 100000,
      costPerDay: 20,
      landRequired: 20,
      consequence: () => {
        this.characterService.characterState.status.health.value += 10;
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
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
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
        this.home.consequence();
        this.ageFields();
        if (this.home.costPerDay > this.characterService.characterState.money){
          this.logService.addLogMessage("You can't afford the upkeep on your home. Some thugs rough you up over the debt. You better get some money, fast.");
          this.characterService.characterState.status.health.value -= 20;
          this.characterService.characterState.money = 0;
        } else {
          this.characterService.characterState.money -= this.home.costPerDay;
        }
      });

      reincarnationService.reincarnateSubject.subscribe(() => {
        this.reset();
        if (Math.random() < .3){
          this.logService.addLogMessage("Your grandfather gives you a bit of land and helps you set up a tent on  it.");
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
      autoReplant: this.autoReplant
    }
  }

  setProperties(properties: HomeProperties) {
    this.land = properties.land;
    this.landPrice = properties.landPrice;
    this.autoReplant = properties.autoReplant;
    this.fields = properties.fields;
    this.fieldYields = properties.fieldYields;
    this.setCurrentHome(this.homesList[properties.homeValue]);
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
    this.characterService.characterState.money -= this.nextHome.cost;
    this.land -= this.nextHome.landRequired;
    this.setCurrentHome(this.nextHome);
    this.logService.addLogMessage("You upgraded your home. You now live in a " + this.home.name);
  }

  reset() {
    this.setCurrentHome(this.homesList[0]);
    this.land = 0;
    this.landPrice = 100;
    this.fields = [];
    this.fieldYields = 0;
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
    // more valuable crops yield less and take longer to harvest, tune this later
    return {cropName: cropItem.name,
      yield: 0,
      maxYield: Math.floor(100 / cropItem.value),
      daysToHarvest: 90 * cropItem.value
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
    for (const field of this.fields){
      if (field.yield < field.maxYield){
        field.yield++;
        this.fieldYields++;
      }
    }
  }

  ageFields(){
    for (let i = this.fields.length - 1; i >= 0; i--){
      if (this.fields[i].daysToHarvest == 0){
        this.inventoryService.addItems(this.inventoryService.itemRepo[this.fields[i].cropName], this.fields[i].yield);
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
  }

  buyLand(){
    this.characterService.characterState.money -= this.landPrice;
    this.land++;
    this.landPrice += 10;
  }

}
