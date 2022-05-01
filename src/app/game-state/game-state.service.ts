import { Injectable } from '@angular/core';
import { ActivityService, ActivityProperties } from '../activity-panel/activity.service';
import { BattleService, BattleProperties } from '../battle-panel/battle.service';
import { LogService } from '../log-panel/log.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterProperties } from './character';
import { CharacterService } from './character.service';
import { HomeService, HomeProperties } from './home.service';
import { InventoryService, ItemStack } from './inventory.service';
import { ItemRepoService } from './item-repo.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  character: CharacterProperties,
  itemStacks: ItemStack[],
  home: HomeProperties,
  activities: ActivityProperties,
  battles: BattleProperties
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
    private activityService: ActivityService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService
  ) {
    window.setInterval(this.savetoLocalStorage.bind(this), 10000);
  }

  savetoLocalStorage(): void {
    const gameState: GameState = {
      character: this.characterService.characterState.getProperties(),
      itemStacks: this.inventoryService.itemStacks,
      home: this.homeService.getProperties(),
      activities: this.activityService.getProperties(),
      battles: this.battleService.getProperties()
    };
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY, JSON.stringify(gameState));
    this.logService.addLogMessage('Game saved', 'STANDARD', 'SYSTEM');
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
      if (this.itemRepoService.getItemById(itemStack.item.id)){
        itemStack.item.use = this.itemRepoService.getItemById(itemStack.item.id).use;
      }
    }
    this.homeService.setProperties(gameState.home);
    this.activityService.setProperties(gameState.activities);
    this.battleService.setProperties(gameState.battles);
    this.logService.addLogMessage('Game loaded', 'STANDARD', 'SYSTEM');
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    this.reincarnationService.reincarnate();
  }
}
