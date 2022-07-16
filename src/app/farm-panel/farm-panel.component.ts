import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less', '../app.component.less']
})
export class FarmPanelComponent {

  constructor(public homeService: HomeService,
    private characterService: CharacterService,
    public gameStateService: GameStateService

    ) {

  }

  clearClicked(event: MouseEvent){
    event.preventDefault();
    event.stopPropagation();
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
    event.stopPropagation();
    if (event.shiftKey){
      this.homeService.buyLand(10);
    } else if (event.ctrlKey){
      this.homeService.buyLand(-1);
    } else {
      this.homeService.buyLand(1);
    }
  }

  plowClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
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
