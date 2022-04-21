import { Injectable } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { CharacterService } from './character.service';
import { GameState } from './game-state';
import { HomeService } from './home.service';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  gameState = new GameState();

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private activityService: ActivityService
  ) { }

  reincarnate() {
    this.characterService.characterState.reincarnate();
    this.homeService.reset();
    this.inventoryService.reset();
    this.activityService.checkRequirements();
  }
}
