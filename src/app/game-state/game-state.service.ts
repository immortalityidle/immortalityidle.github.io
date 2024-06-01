import { Injectable } from '@angular/core';
import { ActivityService, ActivityProperties } from './activity.service';
import { BattleService, BattleProperties } from './battle.service';
import { LogProperties, LogService, LogTopic } from './log.service';
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
import { OfflineModalComponent } from '../offline-modal/offline-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Point } from '@angular/cdk/drag-drop';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdleGameState';

interface GameState {
  achievements: AchievementProperties;
  character: CharacterProperties;
  inventory: InventoryProperties;
  home: HomeProperties;
  activities: ActivityProperties;
  battles: BattleProperties;
  followers: FollowersProperties;
  logs: LogProperties;
  autoBuy: AutoBuyerProperties;
  mainLoop: MainLoopProperties;
  impossibleTasks: ImpossibleTaskProperties;
  hell: HellProperties;
  darkMode: boolean;
  gameStartTimestamp: number;
  saveInterval: number;
  easyModeEver: boolean;
  panelPositions: Point[];
  panelZIndex: number[];
  panelSizes: Point[];
  lockPanels: boolean;
}

declare global {
  interface Window {
    GameStateService: GameStateService;
  }
}

export enum PanelIndex {
  Attributes = 0,
  Health = 1,
  Log = 2,
  Activity = 3,
  Home = 4,
  Time = 5,
  Battle = 6,
  Inventory = 7,
  Equipment = 8,
  Followers = 9,
  Portal = 10,
  Pets = 11,
}

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  lastSaved = new Date().getTime();
  isDarkMode = false;
  isImport = false;
  isExperimental = window.location.href.includes('experimental');
  gameStartTimestamp = new Date().getTime();
  easyModeEver = false;
  saveInterval = 300; //In seconds
  saveSlot = '';
  panelPositions: Point[];
  defaultPanelPositions: Point[];
  panelZIndex: number[];
  defaultPanelZIndex: number[];
  panelSizes: Point[];
  defaultPanelSizes: Point[];
  lockPanels = false;
  dragging = false;

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
    private dialog: MatDialog,
    private achievementService: AchievementService,
    private impossibleTaskService: ImpossibleTaskService,
    private hellService: HellService
  ) {
    window.GameStateService = this;
    mainLoopService.longTickSubject.subscribe(() => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastSaved >= this.saveInterval * 1000) {
        this.savetoLocalStorage();
      }
    });
    this.defaultPanelPositions = [];

    this.defaultPanelPositions[PanelIndex.Attributes] = { x: 0, y: 260 };
    this.defaultPanelPositions[PanelIndex.Health] = { x: 0, y: 40 };
    this.defaultPanelPositions[PanelIndex.Log] = { x: 0, y: 900 };
    this.defaultPanelPositions[PanelIndex.Activity] = { x: 450, y: 40 };
    this.defaultPanelPositions[PanelIndex.Home] = { x: 1050, y: 360 };
    this.defaultPanelPositions[PanelIndex.Time] = { x: 1050, y: 40 };
    this.defaultPanelPositions[PanelIndex.Battle] = { x: 0, y: 680 };
    this.defaultPanelPositions[PanelIndex.Inventory] = { x: 830, y: 40 };
    this.defaultPanelPositions[PanelIndex.Equipment] = { x: 1050, y: 580 };
    this.defaultPanelPositions[PanelIndex.Followers] = { x: 1470, y: 40 };
    this.defaultPanelPositions[PanelIndex.Portal] = { x: 1470, y: 460 };
    this.defaultPanelPositions[PanelIndex.Pets] = { x: 1890, y: 40 };

    this.defaultPanelSizes = [];

    this.defaultPanelSizes[PanelIndex.Attributes] = { x: 430, y: 400 };
    this.defaultPanelSizes[PanelIndex.Health] = { x: 430, y: 200 };
    this.defaultPanelSizes[PanelIndex.Log] = { x: 1230, y: 400 };
    this.defaultPanelSizes[PanelIndex.Activity] = { x: 360, y: 620 };
    this.defaultPanelSizes[PanelIndex.Home] = { x: 400, y: 200 };
    this.defaultPanelSizes[PanelIndex.Time] = { x: 400, y: 300 };
    this.defaultPanelSizes[PanelIndex.Battle] = { x: 810, y: 200 };
    this.defaultPanelSizes[PanelIndex.Inventory] = { x: 200, y: 840 };
    this.defaultPanelSizes[PanelIndex.Equipment] = { x: 400, y: 300 };
    this.defaultPanelSizes[PanelIndex.Followers] = { x: 400, y: 400 };
    this.defaultPanelSizes[PanelIndex.Portal] = { x: 400, y: 800 };
    this.defaultPanelSizes[PanelIndex.Pets] = { x: 400, y: 400 };

    this.panelPositions = structuredClone(this.defaultPanelPositions);
    this.panelSizes = structuredClone(this.defaultPanelSizes);

    this.defaultPanelZIndex = [];
    for (const index in PanelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      this.defaultPanelZIndex[index] = Number(index);
    }

    this.panelZIndex = this.defaultPanelZIndex;
  }

  populateMissingPanelInfo() {
    for (const index in PanelIndex) {
      if (isNaN(Number(index))) {
        continue;
      }
      if (this.panelSizes[index] === undefined) {
        this.panelSizes[index] = this.defaultPanelSizes[index];
      }
      if (this.panelPositions[index] === undefined) {
        this.panelPositions[index] = this.defaultPanelPositions[index];
      }
      if (this.panelZIndex[index] === undefined) {
        this.panelZIndex[index] = this.defaultPanelZIndex[index];
      }
    }
  }

  resetPanels() {
    this.panelPositions = structuredClone(this.defaultPanelPositions);
    this.panelSizes = structuredClone(this.defaultPanelSizes);
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
  updateImportFlagKey(isImport?: boolean) {
    // A new key to avoid saving backups over mains, and mains over backups.
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
    const saveCopy = window.localStorage.getItem(
      LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot
    );
    if (saveCopy) {
      window.localStorage.setItem(
        'BACKUP' + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot,
        saveCopy
      );
    }
    window.localStorage.setItem(
      LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot,
      this.getGameExport()
    );
    this.lastSaved = new Date().getTime();
  }

  loadFromLocalStorage(backup = false): boolean {
    this.getSaveFile();
    const backupStr = backup ? 'BACKUP' : '';
    const gameStateSerialized = window.localStorage.getItem(
      backupStr + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor() + this.saveSlot
    );
    if (!gameStateSerialized) {
      return false;
    }
    this.importGame(gameStateSerialized);
    if (this.isImport) {
      this.characterService.toast('Load Successful');
      this.updateImportFlagKey(false);
    } else {
      this.dialog.open(OfflineModalComponent, {
        data: { earnedTicks: this.mainLoopService.earnedTicks },
        autoFocus: false,
      });
    }
    return true;
  }

  importLayout(value: string) {
    const layout = JSON.parse(value) as GameState;
    if (!layout || !layout.panelPositions || !layout.panelZIndex || !layout.panelSizes) {
      return;
    }
    this.panelPositions = layout.panelPositions || structuredClone(this.defaultPanelPositions);
    this.panelZIndex = layout.panelZIndex || structuredClone(this.defaultPanelZIndex);
    this.panelSizes = layout.panelSizes || structuredClone(this.defaultPanelSizes);
    this.lockPanels = layout.lockPanels || false;
    this.populateMissingPanelInfo();
  }

  importGame(value: string) {
    let gameStateSerialized: string;
    if (value.substring(0, 3) === 'iig') {
      // it's a new save file
      gameStateSerialized = decodeURIComponent(atob(value.substring(3)));
    } else {
      // it's a legacy save file
      gameStateSerialized = value;
    }
    const gameState = JSON.parse(gameStateSerialized) as GameState;
    this.impossibleTaskService.setProperties(gameState.impossibleTasks);
    this.hellService.setProperties(gameState.hell || {});
    this.characterService.characterState.setProperties(gameState.character);
    this.homeService.setProperties(gameState.home);
    this.inventoryService.setProperties(gameState.inventory);
    // restore functions to itemStacks, because JSON stringification throws them away
    for (const itemStack of this.inventoryService.itemStacks) {
      if (!itemStack.item) {
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
    this.achievementService.setProperties(gameState.achievements);
    this.isDarkMode = gameState.darkMode || false;
    this.gameStartTimestamp = gameState.gameStartTimestamp || new Date().getTime();
    this.easyModeEver = gameState.easyModeEver || false;
    this.saveInterval = gameState.saveInterval || 10;
    // Covers the case of folowerCap showing 0 when loading in
    this.followersService.updateFollowerCap();
    this.panelPositions = gameState.panelPositions || structuredClone(this.defaultPanelPositions);
    this.panelZIndex = gameState.panelZIndex || structuredClone(this.defaultPanelZIndex);
    this.panelSizes = gameState.panelSizes || structuredClone(this.defaultPanelSizes);
    this.lockPanels = gameState.lockPanels || false;
    this.updateImportFlagKey();
    this.populateMissingPanelInfo();
  }

  getLayoutExport(): string {
    const layout = {
      panelPositions: this.panelPositions,
      panelZIndex: this.panelZIndex,
      panelSizes: this.panelSizes,
      lockPanels: this.lockPanels,
    };
    return JSON.stringify(layout);
  }

  getGameExport(): string {
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
      saveInterval: this.saveInterval || 300,
      easyModeEver: this.easyModeEver,
      panelPositions: this.panelPositions,
      panelZIndex: this.panelZIndex,
      panelSizes: this.panelSizes,
      lockPanels: this.lockPanels,
    };
    let gameStateString = JSON.stringify(gameState);
    gameStateString = 'iig' + btoa(encodeURIComponent(gameStateString));
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
    this.logService.log(LogTopic.EVENT, 'You dirty cheater! You pressed the cheat button!');
    this.characterService.characterState.updateMoney(1e10);
    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'manual' && item.use) {
        item.use();
      }
    }
    const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
    for (const key in keys) {
      const attribute = this.characterService.characterState.attributes[keys[key]];
      attribute.aptitude += 1e7;
      attribute.value += 1e7;
    }
    this.inventoryService.addItem(this.inventoryService.generateSpiritGem(25));
    this.homeService.upgradeToNextHome();
    while (this.homeService.upgrading) {
      this.homeService.upgradeTick();
    }
  }

  setSaveFile() {
    window.localStorage.setItem(
      'saveSlotFor' + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor(),
      this.saveSlot
    );
  }

  getSaveFile() {
    const saveString = window.localStorage.getItem(
      'saveSlotFor' + LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor()
    );
    if (!saveString) {
      return;
    }
    this.saveSlot = saveString;
  }

  getDeploymentFlavor() {
    let href = window.location.href;
    if (href === 'http://localhost:4200/') {
      // development, use the standard save
      return '';
    } else if (href === 'https://immortalityidle.github.io/' || href === 'https://immortalityidle.github.io/old/') {
      // main game branch or old branch, use the standard save
      return '';
    } else if (href.includes('https://immortalityidle.github.io/')) {
      href = href.substring(0, href.length - 1); // trim the trailing slash
      return href.substring(href.lastIndexOf('/') + 1); //return the deployed branch so that the saves can be different for each branch
    }
    throw new Error('Hey, someone stole this game!'); // mess with whoever is hosting the game somewhere else and doesn't know enough javascript to fix this.
  }
}
