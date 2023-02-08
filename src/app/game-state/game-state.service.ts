import { Injectable } from '@angular/core';
import { ActivityProperties } from './activity.service';
import { BattleProperties } from './battle.service';
import { LogProperties } from './log.service';
import { MainLoopProperties } from './main-loop.service';
import { AchievementProperties } from './achievement.service';
import { CharacterProperties, AttributeType } from './character';
import { FollowersProperties } from './followers.service';
import { HomeProperties } from './home.service';
import { InventoryProperties } from './inventory.service';
import { ImpossibleTaskProperties } from './impossibleTask.service';
import { AutoBuyerProperties } from './autoBuyer.service';
import { HellProperties } from './hell.service';
import { OfflineModalComponent } from '../offline-modal/offline-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ServicesService } from './services.service';

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

  lastSaved = new Date().getTime();
  isDarkMode = false;
  isImport = false;
  isExperimental = window.location.href.includes("experimental");
  gameStartTimestamp = new Date().getTime();
  easyModeEver = false;
  saveInterval = 300; //In seconds
  saveSlot = "";

  constructor(
    private services: ServicesService,
    private dialog: MatDialog

  ) {}

  init(): GameStateService {
    // @ts-ignore
    window['GameStateService'] = this;
    this.services.mainLoopService.longTickSubject.subscribe(() => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastSaved >= this.saveInterval * 1000) {
        this.savetoLocalStorage();
      }
    });
    return this;
  }

  changeAutoSaveInterval(interval: number): void {
    if (!interval || interval < 1) {
      interval = 1;
    } else if (interval > 900) {
      interval = 900;
    }
    this.saveInterval = interval;
    this.savetoLocalStorage();
  }

  /**
   *
   * @param isImport Leave undefined to load flag, boolean to change save to that boolean.
   */
  updateImportFlagKey(isImport?: boolean) { // A new key to avoid saving backups over mains, and mains over backups.
    if (isImport !== undefined) {
      this.isImport = isImport;
      const data = JSON.stringify(this.isImport);
      window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + 'isImport', data);
    } else {
      const data = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + 'isImport');
      if (data) {
        this.isImport = JSON.parse(data);
      }
    }
  }

  savetoLocalStorage(): void {
    const saveCopy = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot)
    if (saveCopy) {
      window.localStorage.setItem("BACKUP" + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot, saveCopy);
    }
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot, this.getGameExport());
    this.lastSaved = new Date().getTime();
  }

  loadFromLocalStorage(backup = false): boolean {
    this.getSaveFile();
    const backupStr = backup ? "BACKUP" : "";
    const gameStateSerialized = window.localStorage.getItem(backupStr + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot);
    if (!gameStateSerialized) {
      return false;
    }
    this.importGame(gameStateSerialized);
    if (this.isImport) {
      this.services.characterService.toast("Load Successful")
      this.updateImportFlagKey(false);
    } else {
      this.dialog.open(OfflineModalComponent, {
        data: { earnedTicks: this.services.mainLoopService.earnedTicks },
        autoFocus: false
      });
    }
    return true;
  }

  importGame(value: string) {
    let gameStateSerialized: string;
    if (value.substring(0, 3) === "iig") {
      // it's a new save file
      gameStateSerialized = decodeURIComponent(atob(value.substring(3)));
    } else {
      // it's a legacy save file
      gameStateSerialized = value;
    }
    const gameState = JSON.parse(gameStateSerialized) as GameState;
    this.services.impossibleTaskService.setProperties(gameState.impossibleTasks);
    this.services.hellService.setProperties(gameState.hell || {});
    this.services.characterService.characterState.setProperties(gameState.character);
    this.services.homeService.setProperties(gameState.home);
    this.services.inventoryService.setProperties(gameState.inventory);
    // restore functions to itemStacks, because JSON stringification throws them away
    for (const itemStack of this.services.inventoryService.itemStacks) {
      if (!itemStack) {
        continue;
      }
      const item = this.services.itemRepoService.getItemById(itemStack.item.id);
      if (item) {
        itemStack.item = item;
      }
    }
    this.services.activityService.setProperties(gameState.activities);
    this.services.battleService.setProperties(gameState.battles);
    this.services.followerService.setProperties(gameState.followers);
    this.services.logService.setProperties(gameState.logs);
    this.services.autoBuyerService.setProperties(gameState.autoBuy);
    this.services.mainLoopService.setProperties(gameState.mainLoop);
    this.services.achievementService.setProperties(gameState.achievements);
    this.isDarkMode = gameState.darkMode || false;
    this.gameStartTimestamp = gameState.gameStartTimestamp || new Date().getTime();
    this.easyModeEver = gameState.easyModeEver || false;
    this.saveInterval = gameState.saveInterval || 10;
    // Covers the case of folowerCap showing 0 when loading in
    this.services.followerService.updateFollowerCap();
    this.updateImportFlagKey();
  }

  getGameExport(): string {
    const gameState: GameState = {
      achievements: this.services.achievementService.getProperties(),
      impossibleTasks: this.services.impossibleTaskService.getProperties(),
      hell: this.services.hellService.getProperties(),
      character: this.services.characterService.characterState.getProperties(),
      inventory: this.services.inventoryService.getProperties(),
      home: this.services.homeService.getProperties(),
      activities: this.services.activityService.getProperties(),
      battles: this.services.battleService.getProperties(),
      followers: this.services.followerService.getProperties(),
      logs: this.services.logService.getProperties(),
      autoBuy: this.services.autoBuyerService.getProperties(),
      mainLoop: this.services.mainLoopService.getProperties(),
      darkMode: this.isDarkMode,
      gameStartTimestamp: this.gameStartTimestamp,
      saveInterval: this.saveInterval || 300,
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
    this.services.characterService.forceRebirth = true;
    this.services.mainLoopService.pause = false;
  }

  cheat(): void {
    this.services.logService.addLogMessage("You dirty cheater! You pressed the cheat button!", "STANDARD", "EVENT");
    this.services.characterService.characterState.money += 1e10;
    for (const key in this.services.itemRepoService.items) {
      const item = this.services.itemRepoService.items[key];
      if (item.type === 'manual' && item.use) {
        item.use();
      }
    }
    const keys = Object.keys(this.services.characterService.characterState.attributes) as AttributeType[];
    for (const key in keys) {
      const attribute = this.services.characterService.characterState.attributes[keys[key]];
      attribute.aptitude += 1e7;
      attribute.value += 1e7;
    }
    this.services.inventoryService.addItem(this.services.inventoryService.generateSpiritGem(25));
    this.services.homeService.upgradeToNextHome();
    while (this.services.homeService.upgrading) {
      this.services.homeService.upgradeTick();
    }
  }

  setSaveFile() {
    window.localStorage.setItem("saveSlotFor" + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor(), this.saveSlot);
  }

  getSaveFile() {
    const saveString = window.localStorage.getItem("saveSlotFor" + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor())
    if (!saveString) {
      return;
    }
    this.saveSlot = saveString;
  }

  getDeploymentFlavor() {
    let href = window.location.href;
    if (href === "http://localhost:4200/") {
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
