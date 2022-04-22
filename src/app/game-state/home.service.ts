import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from './character.service';
import { Home } from './home';

export enum HomeType {
  SquatterTent,
  OwnTent,
  DirtyShack,
  SimpleHut,
  PleasantCottage
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
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
      costPerDay: 0,
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
      costPerDay: 2,
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
      cost: 1000,
      costPerDay: 5,
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
      cost: 1000,
      costPerDay: 10,
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

  constructor(
    private characterService: CharacterService,
    private logService: LogService
  ) {
      this.setCurrentHome(this.homesList[0]);
      if (this.home === undefined ||
        this.homeValue === undefined ||
        this.nextHome === undefined) {
        throw Error('Home service not initialized correctly.');
      }
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
    this.characterService.characterState.land -= this.nextHome.landRequired;
    this.setCurrentHome(this.nextHome);
    this.logService.addLogMessage("You upgraded your home. You now live in a " + this.home.name);
  }

  reset() {
    this.setCurrentHome(this.homesList[0]);
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
}
