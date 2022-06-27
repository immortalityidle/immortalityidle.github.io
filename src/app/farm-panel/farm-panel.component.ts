import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less']
})
export class FarmPanelComponent {

  constructor(public homeService: HomeService,
    private characterService: CharacterService) { 

  }

  clearClicked(event: MouseEvent){
    event.preventDefault();
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.clearField();
      }
    } else if (event.ctrlKey){
      while (this.homeService.fields.length > 0){
        this.homeService.clearField();
      }
    } else {
      this.homeService.clearField();
    }

  }

  buyClicked(event: MouseEvent): void {
    event.preventDefault();
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.buyLand();
      }
    } else if (event.ctrlKey){
      while (this.characterService.characterState.money > this.homeService.landPrice){
        this.homeService.buyLand();
      }
    } else {
      this.homeService.buyLand();
    }
  }

  plowClicked(event: MouseEvent): void {
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.addField();
      }
    } else if (event.ctrlKey){
      while (this.homeService.land > 0){
        this.homeService.addField();
      }
    } else {
      this.homeService.addField();
    }
  }

}
