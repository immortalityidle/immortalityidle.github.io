import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterProperties } from './character';
import { CharacterService } from './character.service';
import { HomeType, HomeService } from './home.service';
import { InventoryService, ItemStack } from './inventory.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  character: CharacterProperties,
  itemStacks: ItemStack[],
  home: HomeType
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
    private reincarnationService: ReincarnationService
  ) {
    window.setInterval(this.savetoLocalStorage.bind(this), 10000);
  }



  savetoLocalStorage(): void {
    const gameState: GameState = {
      character: this.characterService.characterState.getProperties(),
      itemStacks: this.inventoryService.itemStacks,
      home: this.homeService.homeValue
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
    this.homeService.setCurrentHome(this.homeService.getHomeFromValue(gameState.home));
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    this.reincarnationService.reincarnate();
  }
}
