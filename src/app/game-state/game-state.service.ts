import { Injectable } from '@angular/core';
import { ActivityService, ActivityProperties } from './activity.service';
import { BattleService, BattleProperties } from './battle.service';
import { LogProperties, LogService } from './log.service';
import { MainLoopProperties, MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { AchievementProperties, AchievementService } from './achievement.service';
import { CharacterProperties, AttributeType } from './character';
import { CharacterService } from './character.service';
import { FollowersService, FollowersProperties } from './followers.service';
import { HomeService, HomeProperties } from './home.service';
import { InventoryService, InventoryProperties } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ImpossibleTaskProperties, ImpossibleTaskService } from './impossibleTask.service';
import { AutoBuyerProperties, AutoBuyerService } from './autoBuyer.service';
import { AutoPauserProperties, AutoPauserService } from './autoPauser.service';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  achievements: AchievementProperties,
  character: CharacterProperties,
  inventory: InventoryProperties,
  home: HomeProperties,
  activities: ActivityProperties,
  battles: BattleProperties,
  followers: FollowersProperties,
  logs: LogProperties,
  autoBuy: AutoBuyerProperties,
  autoPause: AutoPauserProperties,
  mainLoop: MainLoopProperties,
  impossibleTasks: ImpossibleTaskProperties,
  darkMode: boolean
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  lastSaved = 0;
  isDarkMode = false;

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService,
    private inventoryService: InventoryService,
    private logService: LogService,
    private reincarnationService: ReincarnationService,
    private activityService: ActivityService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService,
    private followersService: FollowersService,
    private autoBuyerService: AutoBuyerService,
    private autoPauseerService: AutoPauserService,
    private mainLoopService: MainLoopService,
    private achievementService: AchievementService,
    private impossibleTaskService: ImpossibleTaskService

  ) {
    // @ts-ignore
    window['GameStateService'] = this;
    window.setInterval(this.savetoLocalStorage.bind(this), 10000);
  }

  savetoLocalStorage(): void {
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY, this.getGameExport());
    this.lastSaved = new Date().getTime();
  }

  loadFromLocalStorage(): void {
    const gameStateSerialized = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY);
    if (!gameStateSerialized) {
      return;
    }
    this.importGame(gameStateSerialized);
  }

  importGame(value: string){
    let gameStateSerialized: string;
    if (value.substring(0, 3) === "iig"){
      // it's a new save file
      gameStateSerialized = decodeURIComponent(atob(value.substring(3)));
    } else {
      // it's a legacy save file
      gameStateSerialized = value;
    }
    const gameState = JSON.parse(gameStateSerialized) as GameState;
    this.achievementService.setProperties(gameState.achievements);
    this.impossibleTaskService.setProperties(gameState.impossibleTasks);
    this.characterService.characterState.setProperties(gameState.character);
    this.homeService.setProperties(gameState.home);
    this.inventoryService.setProperties(gameState.inventory);
    // restore functions to itemStacks, because JSON stringification throws them away
    for (const itemStack of this.inventoryService.itemStacks){
      if (itemStack === null){
        continue;
      }
      const item = this.itemRepoService.getItemById(itemStack.item.id);
      if (item) {
        itemStack.item = item;
      }
    }
    this.activityService.setProperties(gameState.activities);
    this.battleService.setProperties(gameState.battles);
    this.followersService.setProperties(gameState.followers);
    this.logService.setProperties(gameState.logs);
    this.autoBuyerService.setProperties(gameState.autoBuy);
    this.autoPauserService.setProperties(gameState.autoPause);
    this.mainLoopService.setProperties(gameState.mainLoop);
    this.isDarkMode = gameState.darkMode || false;

  }

  getGameExport(): string{
    const gameState: GameState = {
      achievements: this.achievementService.getProperties(),
      impossibleTasks: this.impossibleTaskService.getProperties(),
      character: this.characterService.characterState.getProperties(),
      inventory: this.inventoryService.getProperties(),
      home: this.homeService.getProperties(),
      activities: this.activityService.getProperties(),
      battles: this.battleService.getProperties(),
      followers: this.followersService.getProperties(),
      logs: this.logService.getProperties(),
      autoBuy: this.autoBuyerService.getProperties(),
      autoPause: this.autoPauserService.getProperties(),
      mainLoop: this.mainLoopService.getProperties(),
      darkMode: this.isDarkMode,
    };
    let gameStateString = JSON.stringify(gameState);
    //gameStateString = "iig" + btoa(gameStateString);
    gameStateString = "iig" + btoa(encodeURIComponent(gameStateString));
    return gameStateString;
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY);
    // eslint-disable-next-line no-self-assign
    window.location.href = window.location.href;
  }

  rebirth(): void {
    this.characterService.forceRebirth = true;
    this.mainLoopService.pause = false;//TODO possibly check in autpauser service instead
  }

  cheat(): void {
    this.logService.addLogMessage("You dirty cheater! You pressed the cheat button!","STANDARD","EVENT");
    this.characterService.characterState.money += 10000000000;
    for (const key in this.itemRepoService.items){
      const item = this.itemRepoService.items[key];
      if (item.type === 'manual' && item.use) {
        item.use();
      }
    }
    const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
    for (const key in keys){
      const attribute = this.characterService.characterState.attributes[keys[key]];
      attribute.aptitude += 10000000;
      attribute.value += 10000000;
    }
    this.inventoryService.addItem(this.inventoryService.generateSpiritGem(25));
    this.homeService.upgradeToNextHome();
    while (this.homeService.upgrading){
      this.homeService.upgradeTick();
    }
  }
}
