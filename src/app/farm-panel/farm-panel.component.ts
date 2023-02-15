import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less', '../app.component.less'],
})
export class FarmPanelComponent {
  constructor(
    public homeService: HomeService,
    private characterService: CharacterService,
    public gameStateService: GameStateService
  ) {}

  clearClicked(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      this.homeService.clearField(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.clearField(-1);
    } else {
      this.homeService.clearField();
    }
  }

  buyClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      this.homeService.buyLand(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.buyLand(-1);
    } else {
      this.homeService.buyLand(1);
    }
  }

  plowClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey || event.altKey) {
      this.homeService.addField(10);
    } else if (event.ctrlKey || event.metaKey) {
      this.homeService.addField(-1);
    } else {
      this.homeService.addField();
    }
  }
}
