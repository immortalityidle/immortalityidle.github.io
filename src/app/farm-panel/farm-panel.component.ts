import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';
import { FarmService } from '../game-state/farm.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less', '../app.component.less'],
})
export class FarmPanelComponent {
  constructor(
    public homeService: HomeService,
    public farmService: FarmService,
    private characterService: CharacterService,
    public gameStateService: GameStateService
  ) {}

  addFieldClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.farmService.addField();
  }

  removeFieldClicked(event: MouseEvent, fieldIndex: number) {
    this.farmService.removeField(fieldIndex);
  }

  addPlotToFieldClicked(event: MouseEvent, fieldIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    let quantity = 1;
    if (event) {
      if (event.shiftKey) {
        quantity *= 10;
      }
      if (event.ctrlKey) {
        quantity *= 100;
      }
    }
    this.farmService.assignFallowPlots(fieldIndex, quantity);
  }

  removePlotFromFieldClicked(event: MouseEvent, fieldIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    let quantity = 1;
    if (event) {
      if (event.shiftKey) {
        quantity *= 10;
      }
      if (event.ctrlKey) {
        quantity *= 100;
      }
    }
    this.farmService.unassignPlots(fieldIndex, quantity);
  }

  changeCropClicked(event: MouseEvent, fieldIndex: number) {
    this.farmService.changeCrop(fieldIndex);
  }
}
