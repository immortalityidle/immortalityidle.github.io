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
import { KtdGridLayout } from '@katoid/angular-grid-layout';

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
  lockPanels: boolean;
  layout: KtdGridLayout;
}

declare global {
  interface Window {
    GameStateService: GameStateService;
  }
}

export interface Panel {
  id: string;
  name: string;
  icon: string;
  panelHelp: string;
  unlocked: boolean;
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
  lockPanels = true;
  dragging = false;
  layout: KtdGridLayout;
  allPanelsUsed = false;

  panels: Panel[] = [
    {
      id: 'timePanel',
      name: 'Time',
      icon: 'calendar_month',
      panelHelp:
        "Achieving immortality doesn't happen overnight. It takes lifetimes of hard work. Choose how to schedule your days to take care of your basic needs and develop your immortal potential. Click the schedule button on activities or drag them here to put them on your schedule. When you allow time to move forward, you will perform each activity in your schedule in the order it is listed. You can move scheduled activities around or repeat activities over multiple days. Don't forget to schedule some rest too! You'll need to take a break now and then in your journey toward immortality.",
      unlocked: false,
    },
    {
      id: 'attributesPanel',
      name: 'Attributes',
      icon: 'bar_chart',
      panelHelp:
        'Your attributes define your growing immortal characteristics. You can grow your attributes through the activities that you choose. Aptitudes that you developed in your past lives can make it easier to develop attributes in your current life.',
      unlocked: true,
    },
    {
      id: 'followersPanel',
      name: 'Followers',
      icon: 'groups',
      panelHelp:
        'Your followers can aid you in many ways. Each has a specific skill that they will use to your benefit. Followers must be taken care of, so having them will cost you some money each day, and more powerful followers will have more expensive needs you will have to take care of.',
      unlocked: false,
    },
    {
      id: 'healthPanel',
      name: 'Status',
      icon: 'favorite',
      panelHelp:
        'Maintaining your health is an important part of becoming immortal. If your health reaches 0, you will die and need to try for immortality once you are reincarnated in your next life.',
      unlocked: true,
    },
    {
      id: 'activityPanel',
      name: 'Activities',
      icon: 'self_improvement',
      panelHelp:
        "Choose activities to add to your schedule. At first you'll only know how to do a few things, but as you develop your attributes more options will become available.",
      unlocked: true,
    },
    {
      id: 'battlePanel',
      name: 'Battles',
      icon: 'fort',
      panelHelp:
        "Monsters come out at night. You'll need to be strong enough to fight them off if you want to become an immortal.",
      unlocked: false,
    },
    {
      id: 'equipmentPanel',
      name: 'Equipment',
      icon: 'colorize',
      panelHelp:
        'You will need to arm yourself with weapons and protective gear if you want to fight through the many battles that await you on your journey to immortality. Legends even speak of extraordinary cultivators who can combine items of the same type to produce even stronger equipment. Watch out, each piece of gear will take damage with use and you will need to constantly improve it to keep it strong.',
      unlocked: false,
    },
    {
      id: 'homePanel',
      name: 'Home',
      icon: 'home',
      panelHelp:
        'Your home is an essential part of your life. A better home allows you to recover and has room for furniture that can aid your immortal development.',
      unlocked: false,
    },
    {
      id: 'inventoryPanel',
      name: 'Inventory',
      icon: 'shopping_bag',
      panelHelp:
        'The items that you gain during your quest for immortality will appear here. Hover your cursor over an item to learn more about it.',
      unlocked: false,
    },
    {
      id: 'logPanel',
      name: 'Log',
      icon: 'feed',
      panelHelp:
        'A record of the events that lead you to immortality will surely be of interest to those who sing your legend in the ages to come. You can filter out the events that are less interesting to you in the present.',
      unlocked: true,
    },
    {
      id: 'portalPanel',
      name: 'Portals',
      icon: 'radio_button_checked',
      panelHelp: 'Take a portal to a different plane of existence.',
      unlocked: false,
    },
    {
      id: 'petsPanel',
      name: 'pets',
      icon: 'Pets',
      panelHelp: 'Your pets can aid you in many ways. Each has a specific skill that they will use to your benefit.',
      unlocked: false,
    },
  ];

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
    this.layout = [];
    this.resetPanels();
  }

  resetPanels() {
    //if (window.matchMedia('(max-width: 700px)').matches) {
    // narrow viewport
    this.layout = [
      {
        id: 'healthPanel',
        x: 0,
        y: 0,
        w: 98,
        h: 8,
      },
      {
        id: 'attributesPanel',
        x: 0,
        y: 15,
        w: 30,
        h: 20,
      },
      {
        id: 'activityPanel',
        x: 30,
        y: 15,
        w: 68,
        h: 40,
      },
      {
        id: 'logPanel',
        x: 0,
        y: 30,
        w: 98,
        h: 25,
      },
    ];
    this.updateAllPanelsUsed();
  }

  changeLayoutPanel(index: number, backwardSearch: boolean = false) {
    const newLayout = JSON.parse(JSON.stringify(this.layout));
    let panelIndex = 0;
    for (let i = 0; i < this.panels.length; i++) {
      if (this.panels[i].id === this.layout[index].id) {
        panelIndex = i;
      }
    }

    const panelId = this.getNextUnusedPanelId(panelIndex, backwardSearch);
    if (panelId === '') {
      // no unused panels, bail out
      return;
    }
    newLayout[index].id = panelId;
    this.layout = newLayout;
  }

  removeLayoutPanel(index: number) {
    const newLayout = JSON.parse(JSON.stringify(this.layout));
    newLayout.splice(index, 1);
    this.layout = newLayout;
    this.updateAllPanelsUsed();
  }

  addLayoutPanel(newPanelId = '') {
    const newLayout = JSON.parse(JSON.stringify(this.layout));
    let panelId = newPanelId;
    if (newPanelId === '') {
      panelId = this.getNextUnusedPanelId(0);
    }

    if (panelId === '') {
      // no unused panels, bail out
      return;
    }
    newLayout.push({
      id: panelId,
      x: 0,
      y: 0,
      w: 30,
      h: 20,
    });
    this.layout = newLayout;
    this.updateAllPanelsUsed();
  }

  getNextUnusedPanelId(startIndex: number, backwards: boolean = false) {
    if (backwards) {
      for (let i = startIndex - 1; i >= 0; i--) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!this.layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
      for (let i = this.panels.length - 1; i >= startIndex; i--) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!this.layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
    } else {
      for (let i = startIndex + 1; i < this.panels.length; i++) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!this.layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
      for (let i = 0; i <= startIndex; i++) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!this.layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
    }
    return '';
  }

  updateAllPanelsUsed() {
    this.allPanelsUsed = true;
    for (let i = 0; i < this.panels.length; i++) {
      if (!this.panels[i].unlocked) {
        continue;
      }
      if (!this.layout.find(({ id }) => id === this.panels[i].id)) {
        this.allPanelsUsed = false;
        return;
      }
    }
  }

  unlockPanel(panelId: string) {
    const panel = this.panels.find(({ id }) => id === panelId);
    if (panel) {
      panel.unlocked = true;
    }
    this.updateAllPanelsUsed();
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
    const layoutData = JSON.parse(value) as GameState;
    if (!layoutData || !layoutData.layout) {
      return;
    }
    this.layout = layoutData.layout;
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
    // Covers the case of followerCap showing 0 when loading in
    this.followersService.updateFollowerCap();
    if (gameState.layout) {
      this.layout = gameState.layout;
    }
    this.lockPanels = gameState.lockPanels ?? true;
    this.updateImportFlagKey();
    this.updateAllPanelsUsed();
  }

  getLayoutExport(): string {
    const layoutData = {
      layout: this.layout,
      lockPanels: this.lockPanels,
    };
    return JSON.stringify(layoutData);
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
      lockPanels: this.lockPanels,
      layout: this.layout,
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
