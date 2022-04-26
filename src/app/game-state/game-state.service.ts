import { Injectable } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { LogService } from '../log-panel/log.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { ActivityLoopEntry } from './activity';
import { CharacterProperties } from './character';
import { CharacterService } from './character.service';
import { HomeService, HomeProperties } from './home.service';
import { InventoryService, ItemStack } from './inventory.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  character: CharacterProperties,
  itemStacks: ItemStack[],
  home: HomeProperties,
  activityLoop: ActivityLoopEntry[]
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    private activityService: ActivityService
  ) {
    window.setInterval(this.savetoLocalStorage.bind(this), 10000);
  }



  savetoLocalStorage(): void {
    const gameState: GameState = {
      character: this.characterService.characterState.getProperties(),
      itemStacks: this.inventoryService.itemStacks,
      home: this.homeService.getProperties(),
      activityLoop: this.activityService.activityLoop
    };
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
    this.logService.addLogMessage('Game saved');
  }

  loadFromLocalStorage(): void {
    const gameStateSerialized = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY);
    if (!gameStateSerialized) {
      return;
    }
    const gameState = JSON.parse(gameStateSerialized) as GameState;
    this.characterService.characterState.setProperties(gameState.character);
    this.inventoryService.itemStacks = gameState.itemStacks;
    // restore functions to itemStacks, because JSON stringification throws them away
    for (const itemStack of this.inventoryService.itemStacks){
      if (this.inventoryService.itemRepo[itemStack.item.name]){
        itemStack.item.use = this.inventoryService.itemRepo[itemStack.item.name].use;
      }
    }
    this.homeService.setProperties(gameState.home);
    this.activityService.activityLoop = gameState.activityLoop;
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    this.reincarnationService.reincarnate();
  }
}
