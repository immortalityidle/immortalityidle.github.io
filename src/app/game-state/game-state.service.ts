import { Injectable } from '@angular/core';
import { ActivityService, ActivityProperties } from '../activity-panel/activity.service';
import { BattleService, BattleProperties } from '../battle-panel/battle.service';
import { LogProperties, LogService } from '../log-panel/log.service';
import { MainLoopProperties, MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterProperties, AttributeType } from './character';
import { CharacterService } from './character.service';
import { HomeService, HomeProperties } from './home.service';
import { InventoryService, InventoryProperties } from './inventory.service';
import { ItemRepoService } from './item-repo.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  character: CharacterProperties,
  inventory: InventoryProperties,
  home: HomeProperties,
  activities: ActivityProperties,
  battles: BattleProperties,
  logs: LogProperties,
  mainLoop: MainLoopProperties
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
    private battleService: BattleService,
    private mainLoopService: MainLoopService

  ) {
    window.setInterval(this.savetoLocalStorage.bind(this), 10000);
  }

  savetoLocalStorage(): void {
    const gameState: GameState = {
      character: this.characterService.characterState.getProperties(),
      inventory: this.inventoryService.getProperties(),
      home: this.homeService.getProperties(),
      activities: this.activityService.getProperties(),
      battles: this.battleService.getProperties(),
      logs: this.logService.getProperties(),
      mainLoop: this.mainLoopService.getProperties()
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
    this.inventoryService.setProperties(gameState.inventory);
    // restore functions to itemStacks, because JSON stringification throws them away
    for (const itemStack of this.inventoryService.itemStacks){
      const item = this.itemRepoService.getItemById(itemStack.item.id);
      if (item) {
        itemStack.item = item;
      }
    }
    this.homeService.setProperties(gameState.home);
    this.activityService.setProperties(gameState.activities);
    this.battleService.setProperties(gameState.battles);
    this.logService.setProperties(gameState.logs);
    this.logService.addLogMessage('Game loaded', 'STANDARD', 'SYSTEM');
    this.mainLoopService.setProperties(gameState.mainLoop);
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    this.reincarnationService.reincarnate();
  }

  cheat(): void {
    this.logService.addLogMessage("You dirty cheater! You pressed the cheat button!","STANDARD","SYSTEM");
    this.characterService.characterState.money = 1000000000;
    for (let key in this.itemRepoService.items){
      let item = this.itemRepoService.items[key];
      if (item.type == 'manual' && item.use) {
        item.use();
      }
    }
    const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
    for (const key in keys){
      let attribute = this.characterService.characterState.attributes[keys[key]];
      attribute.aptitude += 1000;
    }
  }
}
