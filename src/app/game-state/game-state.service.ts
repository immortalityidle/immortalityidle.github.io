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
import { HellProperties, HellService } from './hell.service';

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
  mainLoop: MainLoopProperties,
  impossibleTasks: ImpossibleTaskProperties,
  hell: HellProperties,
  darkMode: boolean,
  gameStartTimestamp: number,
  saveInterval: number,
  easyModeEver: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

  lastSaved = 0;
  isDarkMode = false;
  isExperimental = window.location.href.includes("experimental");
  gameStartTimestamp = new Date().getTime();
  easyModeEver = false;
  saveInterval = 10; //In seconds
  saveSlot = "";

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
    private mainLoopService: MainLoopService,
    private achievementService: AchievementService,
    private impossibleTaskService: ImpossibleTaskService,
    private hellService: HellService

  ) {
    // @ts-ignore
    window['GameStateService'] = this;
    mainLoopService.longTickSubject.subscribe(() => {
      const currentTime = new Date();
      if (currentTime.valueOf() - this.lastSaved >= this.saveInterval*1000) {
        this.savetoLocalStorage();
      }
    });
  }

  changeAutoSaveInterval(interval: number): void{
    if(interval === null) return; 
    if(interval < 1) interval = 1; 
    else if (interval > 900) interval = 900;
    this.saveInterval = interval;
    this.savetoLocalStorage();
  }
  
  savetoLocalStorage(): void {
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot, this.getGameExport());
    this.lastSaved = new Date().getTime();
  }

  loadFromLocalStorage(): boolean {
    this.getSaveFile();
    const gameStateSerialized = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot);
    if (!gameStateSerialized) {
      return false;
    }
    this.importGame(gameStateSerialized);
    return true;
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
    this.hellService.setProperties(gameState.hell || {});
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
    this.mainLoopService.setProperties(gameState.mainLoop);
    this.isDarkMode = gameState.darkMode || false;
    this.gameStartTimestamp = gameState.gameStartTimestamp || new Date().getTime();
    this.easyModeEver = gameState.easyModeEver || false;
    this.saveInterval = gameState.saveInterval || 10;
    // Covers the case of folowerCap showing 0 when loading in
    this.followersService.updateFollowerCap();
  }

  getGameExport(): string{
    const gameState: GameState = {
      achievements: this.achievementService.getProperties(),
      impossibleTasks: this.impossibleTaskService.getProperties(),
      hell: this.hellService.getProperties(),
      character: this.characterService.characterState.getProperties(),
      inventory: this.inventoryService.getProperties(),
      home: this.homeService.getProperties(),
      activities: this.activityService.getProperties(),
      battles: this.battleService.getProperties(),
      followers: this.followersService.getProperties(),
      logs: this.logService.getProperties(),
      autoBuy: this.autoBuyerService.getProperties(),
      mainLoop: this.mainLoopService.getProperties(),
      darkMode: this.isDarkMode,
      gameStartTimestamp: this.gameStartTimestamp,
      saveInterval: this.saveInterval || 10,
      easyModeEver: this.easyModeEver
    };
    let gameStateString = JSON.stringify(gameState);
    //gameStateString = "iig" + btoa(gameStateString);
    gameStateString = "iig" + btoa(encodeURIComponent(gameStateString));
    return gameStateString;
  }

  hardReset(): void {
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot);
    // eslint-disable-next-line no-self-assign
    window.location.href = window.location.href;
  }

  rebirth(): void {
    this.characterService.forceRebirth = true;
    this.mainLoopService.pause = false;
  }

  cheat(): void {
    this.logService.addLogMessage("You dirty cheater! You pressed the cheat button!","STANDARD","EVENT");
    this.characterService.characterState.money += 1e10;
    for (const key in this.itemRepoService.items){
      const item = this.itemRepoService.items[key];
      if (item.type === 'manual' && item.use) {
        item.use();
      }
    }
    const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
    for (const key in keys){
      const attribute = this.characterService.characterState.attributes[keys[key]];
      attribute.aptitude += 1e7;
      attribute.value += 1e7;
    }
    this.inventoryService.addItem(this.inventoryService.generateSpiritGem(25));
    this.homeService.upgradeToNextHome();
    while (this.homeService.upgrading){
      this.homeService.upgradeTick();
    }
  }

  setSaveFile() {
    window.localStorage.setItem("saveSlotFor" + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor(), this.saveSlot);
  }

  getSaveFile() {
    const saveString = window.localStorage.getItem("saveSlotFor" + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor())
    if(!saveString)
    {
      return;
    }
    this.saveSlot = saveString;
  }

  getDeploymentFlavor(){
    let href = window.location.href;
    if (href === "http://localhost:4200/"){
      // development, use the standard save
      return "";
    } else if (href === "https://immortalityidle.github.io/" || href === "https://immortalityidle.github.io/old/") {
      // main game branch or old branch, use the standard save
      return "";
    } else if (href.includes("https://immortalityidle.github.io/")) {
      href = href.substring(0, href.length - 1); // trim the trailing slash
      return href.substring(href.lastIndexOf("/") + 1); //return the deployed branch so that the saves can be different for each branch
    }
    throw new Error("Hey, someone stole this game!"); // mess with whoever is hosting the game somewhere else and doesn't know enough javascript to fix this.
  }
}
