import { Injectable } from '@angular/core';
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
          console.log("You got roughed up by the owner of the field. You should probably buy your own land.");
          this.characterService.characterState.status.health.value--;
        }
      }
    },
    {
      name: "Your Very Own Tent",
      description: "A decent tent pitched on your own bit of land.",
      cost: 100,
      costPerDay: 0,
      landRequired: 1,
      consequence: () => {
        this.characterService.characterState.status.health.value += 1;
        this.characterService.characterState.status.stamina.value += 1;
      }
    }
  ];
  constructor(private characterService: CharacterService) {
    this.home =this.homesList[0];
  }
}
