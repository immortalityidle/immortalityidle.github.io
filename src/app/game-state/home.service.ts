import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from './character.service';
import { Home } from './home';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  home: Home;

  homesList: Home[] = [
    {
      name: "Squatter Tent",
      description: "A dirty tent pitched in an unused field. Costs nothing, but you get what you pay for. The owner of the land may not like that you're here.",
      cost: 0,
      costPerDay: 0,
      landRequired: 0,
      consequence: () => {
        if (Math.random() < 0.3){
          this.logService.addLogMessage("You got roughed up by the owner of the field. You should probably buy your own land and put up a better tent.");
          this.characterService.characterState.status.health.value--;
        }
      }
    },
    {
      name: "Tent of Your Own",
      description: "A decent tent pitched on your own bit of land.",
      cost: 100,
      costPerDay: 0,
      landRequired: 1,
      consequence: () => {
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 1;
        this.characterService.characterState.checkOverage();
      }
    }
  ];
  constructor(private characterService: CharacterService,
    private logService: LogService) {
    this.home =this.homesList[0];
  }

  // gets the specs of the next home, doesn't actually upgrade
  getNextHome(){
    for (let i = 0; i < this.homesList.length - 1; i++){
      if (this.home.name == this.homesList[i].name){
        return this.homesList[i + 1];
      }
    }
    // we're on the last home.
    return this.homesList[this.homesList.length - 1];
  }

  upgradeToNextHome(){
    let nextHome = this.getNextHome();
    this.characterService.characterState.money -= nextHome.cost;
    this.characterService.characterState.land -= nextHome.landRequired;
    this.home = nextHome;
    this.logService.addLogMessage("You upgraded your home. You now live in a " + this.home.name);

    this.home = this.getNextHome();
  }
}
