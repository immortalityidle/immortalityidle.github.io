import { Injectable, signal } from '@angular/core';
import { ActivityService, ActivityProperties } from './activity.service';
import { BattleService, BattleProperties } from './battle.service';
import { LogProperties, LogService } from './log.service';
import { MainLoopProperties, MainLoopService } from './main-loop.service';
import { AchievementProperties, AchievementService } from './achievement.service';
import { AttributeObject, CharacterProperties, CharacterStatus, EquipmentSlots } from './character';
import { CharacterService } from './character.service';
import { FollowersService, FollowersProperties } from './followers.service';
import { HomeService, HomeProperties, HomeType } from './home.service';
import { InventoryService, InventoryProperties } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ImpossibleTaskProperties, ImpossibleTaskService } from './impossibleTask.service';
import { AutoBuyerProperties, AutoBuyerService } from './autoBuyer.service';
import { HellProperties, HellService } from './hell.service';
import { OfflineModalComponent } from '../offline-modal/offline-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { KtdGridLayout } from '@katoid/angular-grid-layout';
import { FarmProperties, FarmService } from './farm.service';
import { LocationProperties, LocationService } from './location.service';
import { LocationType } from './activity';

const LOCAL_STORAGE_GAME_STATE_KEY = 'immortalityIdle2GameState';

interface GameState {
  achievements: AchievementProperties;
  character: CharacterProperties;
  inventory: InventoryProperties;
  home: HomeProperties;
  farm: FarmProperties;
  activities: ActivityProperties;
  locations: LocationProperties;
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
  lockPanels = false;
  dragging = false;
  layout = signal<KtdGridLayout | undefined>(undefined);
  allPanelsUsed = false;

  panels: Panel[] = [
    {
      id: 'timePanel',
      name: 'Schedule',
      icon: 'calendar_month',
      panelHelp:
        'Choose activities to add to your schedule by dragging and dropping them here or pressing the calendar button on activities.<br>When you allow time to move forward, you will perform each activity in your schedule in the order it is listed.<br>You can move scheduled activities around or repeat activities over multiple days.',
      unlocked: false,
    },
    {
      id: 'attributesPanel',
      name: 'Attributes',
      icon: 'bar_chart',
      panelHelp:
        'Your attributes define your growing immortal characteristics.<br>You can grow your attributes through the activities that you choose.<br>Aptitudes that you developed in your past lives can make it easier to develop attributes in your current life.',
      unlocked: true,
    },
    {
      id: 'followersPanel',
      name: 'Followers',
      icon: 'groups',
      panelHelp:
        'Your followers can aid you in many ways.<br>Each has a specific skill that they will use to your benefit.<br>Followers must be taken care of, so having them will cost you some money each day, and more powerful followers will have more expensive needs you will have to take care of.',
      unlocked: false,
    },
    {
      id: 'healthPanel',
      name: 'Status',
      icon: 'favorite',
      panelHelp:
        'Maintaining your health is an important part of becoming immortal.<br>If your health reaches 0, you will die and need to try for immortality once you are reincarnated in your next life.',
      unlocked: true,
    },
    {
      id: 'activityPanel',
      name: 'Activities',
      icon: 'self_improvement',
      panelHelp:
        "Click an activity to spend a day doing it.<br>Achieving immortality doesn't happen overnight.<br>It takes lifetimes of hard work.<br>Choose your activities to take care of your basic needs and develop your immortal potential.<br>At first you'll only know how to do a few things, but as you develop your attributes, more options will become available.<br>Don't forget to schedule some rest too!<br>You'll need to take a break now and then in your journey toward immortality.",
      unlocked: true,
    },
    {
      id: 'battlePanel',
      name: 'Battles',
      icon: 'fort',
      panelHelp:
        "Battling enemies is an essential part of your quest for immortality.<br>You'll need to be strong enough to fight them off if you want to stay alive.",
      unlocked: false,
    },
    {
      id: 'equipmentPanel',
      name: 'Equipment',
      icon: 'colorize',
      panelHelp:
        'You will need to arm yourself with weapons and protective gear if you want to fight through the many battles that await you on your journey to immortality.<br>Legends even speak of extraordinary cultivators who can combine items of the same type to produce even stronger equipment.<br>Watch out, each piece of gear will take damage with use and you will need to constantly improve it to keep it strong.',
      unlocked: false,
    },
    {
      id: 'homePanel',
      name: 'Home',
      icon: 'home',
      panelHelp:
        'Your home is an essential part of your life.<br>A better home allows you to recover and has room for furniture that can aid your immortal development.',
      unlocked: false,
    },
    {
      id: 'inventoryPanel',
      name: 'Inventory',
      icon: 'shopping_bag',
      panelHelp:
        'The items that you gain during your quest for immortality will appear here.<br>Hover your cursor over an item to learn more about it.',
      unlocked: false,
    },
    {
      id: 'logPanel',
      name: 'Log',
      icon: 'feed',
      panelHelp:
        'A record of the events that lead you to immortality will surely be of interest to those who sing your legend in the ages to come.<br>You can filter out the events that are less interesting to you in the present.',
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
      name: 'Pets',
      icon: 'pets',
      panelHelp: 'Your pets can aid you in many ways.<br>Each has a specific skill that they will use to your benefit.',
      unlocked: false,
    },
    {
      id: 'farmPanel',
      name: 'Farm',
      icon: 'solar_power',
      panelHelp: 'Your farm can grow healthy food that can aid you on your journey to immortality.',
      unlocked: false,
    },
    {
      id: 'locationPanel',
      name: 'Location',
      icon: 'public',
      panelHelp:
        'The locations you have available depend mostly on your speed, and will determine what activities you have available. You can select which locations you would prefer to find monsters in when you look for trouble.',
      unlocked: false,
    },
    {
      id: 'impossibleTasksPanel',
      name: 'Impossible Tasks',
      icon: 'priority_high',
      panelHelp:
        'The path to immortality runs through these impossible tasks. Only by completing them can you find the way to live forever.',
      unlocked: false,
    },
    {
      id: 'techniquePanel',
      name: 'Combat Techniques',
      icon: 'sports_martial_arts',
      panelHelp:
        'Developing unique family techniques is an essential part of a powerful bloodline and a useful step on your way to immortality.',
      unlocked: false,
    },
    {
      id: 'craftingPanel',
      name: 'Crafting',
      icon: 'carpenter',
      panelHelp: 'Creating weapons, armor, potions, and pills is an essential part of becoming an immortal.',
      unlocked: false,
    },
    {
      id: 'hellStatusPanel',
      name: 'Hell Progress',
      icon: 'local_fire_department',
      panelHelp: 'Your progress through the terrors of hell.',
      unlocked: false,
    },
  ];

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService,
    private farmService: FarmService,
    private inventoryService: InventoryService,
    private logService: LogService,
    private activityService: ActivityService,
    private itemRepoService: ItemRepoService,
    private battleService: BattleService,
    private followersService: FollowersService,
    private autoBuyerService: AutoBuyerService,
    private mainLoopService: MainLoopService,
    private dialog: MatDialog,
    private achievementService: AchievementService,
    private impossibleTaskService: ImpossibleTaskService,
    private locationService: LocationService,
    private hellService: HellService
  ) {
    window.GameStateService = this;
    mainLoopService.longTickSubject.subscribe(() => {
      const currentTime = new Date().getTime();
      if (currentTime - this.lastSaved >= this.saveInterval * 1000) {
        this.savetoLocalStorage();
      }
    });
    this.layout.set([]);
    this.resetPanels();
  }

  resetPanels() {
    //if (window.matchMedia('(max-width: 700px)').matches) {
    // narrow viewport
    this.layout.set([
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
        w: 38,
        h: 40,
      },
      {
        id: 'logPanel',
        x: 0,
        y: 30,
        w: 98,
        h: 25,
      },
    ]);
    this.updateAllPanelsUsed();
  }

  changeLayoutPanel(index: number, backwardSearch: boolean = false) {
    const newLayout = JSON.parse(JSON.stringify(this.layout()));
    let panelIndex = 0;

    const layout = this.layout();
    if (layout) {
      for (let i = 0; i < this.panels.length; i++) {
        if (this.panels[i].id === layout[index].id) {
          panelIndex = i;
        }
      }

      const panelId = this.getNextUnusedPanelId(panelIndex, backwardSearch);
      if (panelId === '') {
        // no unused panels, bail out
        return;
      }
      newLayout[index].id = panelId;
      this.layout.set(newLayout);
    }
  }

  removeLayoutPanel(index: number) {
    const newLayout = JSON.parse(JSON.stringify(this.layout()));
    newLayout.splice(index, 1);
    this.layout.set(newLayout);
    this.updateAllPanelsUsed();
  }

  addLayoutPanel(newPanelId = '', x = 0, y = 0, w = 30, h = 20) {
    const newLayout = JSON.parse(JSON.stringify(this.layout()));
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
      x: x,
      y: y,
      w: w,
      h: h,
    });
    this.layout.set(newLayout);
    this.updateAllPanelsUsed();
  }

  getNextUnusedPanelId(startIndex: number, backwards: boolean = false) {
    const layout = this.layout();
    if (!layout) {
      return this.panels[startIndex + 1].id;
    }
    if (backwards) {
      for (let i = startIndex - 1; i >= 0; i--) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
      for (let i = this.panels.length - 1; i >= startIndex; i--) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
    } else {
      for (let i = startIndex + 1; i < this.panels.length; i++) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
      for (let i = 0; i <= startIndex; i++) {
        if (!this.panels[i].unlocked) {
          continue;
        }
        if (!layout.find(({ id }) => id === this.panels[i].id)) {
          return this.panels[i].id;
        }
      }
    }
    return '';
  }

  updateAllPanelsUsed() {
    this.allPanelsUsed = true;
    const layout = this.layout();
    if (!layout) {
      return;
    }
    for (let i = 0; i < this.panels.length; i++) {
      if (!this.panels[i].unlocked) {
        continue;
      }
      if (!layout.find(({ id }) => id === this.panels[i].id)) {
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
    this.layout.set(layoutData.layout);
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
    const parsedGameState = JSON.parse(gameStateSerialized) as Partial<GameState>;
    const gameState = this.validateGameState(parsedGameState);
    this.impossibleTaskService.setProperties(gameState.impossibleTasks);
    this.hellService.setProperties(gameState.hell || {});
    this.characterService.characterState.setProperties(gameState.character);
    this.homeService.setProperties(gameState.home);
    this.farmService.setProperties(gameState.farm);
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
    this.locationService.setProperties(gameState.locations);
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
      this.layout.set(gameState.layout);
    }
    this.lockPanels = gameState.lockPanels ?? true;
    this.updateImportFlagKey();
    this.updateAllPanelsUsed();
  }

  private validateGameState(gameState: Partial<GameState>): GameState {
    return {
      achievements: gameState.achievements ?? { unlockedAchievements: [] },
      character: gameState.character ?? this.getEmptyCharacterProperties(),
      inventory: gameState.inventory ?? this.getEmptyInventory(),
      home: gameState.home ?? this.getEmptyHome(),
      farm: gameState.farm ?? this.getEmptyFarm(),
      activities: gameState.activities ?? this.getEmptyActivities(),
      locations: gameState.locations ?? this.getEmptyLocations(),
      battles: gameState.battles ?? this.getEmptyBattles(),
      followers: gameState.followers ?? this.getEmptyFollowers(),
      logs: gameState.logs ?? this.getEmptyLogs(),
      autoBuy: gameState.autoBuy ?? this.getEmptyAutoBuy(),
      mainLoop: gameState.mainLoop ?? this.getEmptyMainLoop(),
      impossibleTasks: gameState.impossibleTasks ?? this.getEmptyImpossibleTasks(),
      hell: gameState.hell ?? this.getEmptyHell(),
      darkMode: gameState.darkMode ?? false,
      gameStartTimestamp: 0,
      saveInterval: 0,
      easyModeEver: gameState.easyModeEver ?? false,
      lockPanels: gameState.lockPanels ?? false,
      layout: gameState.layout ?? [],
    };
  }
  private getEmptyInventory(): InventoryProperties {
    return {
      itemStacks: [],
      stashedItemStacks: [],
      autoSellUnlocked: false,
      autoSellEntries: [],
      autoUseUnlocked: false,
      autoEatUnlocked: false,
      autoEatNutrition: false,
      autoEatHealth: false,
      autoEatStamina: false,
      autoEatQi: false,
      autoEatAll: false,
      autoUseEntries: [],
      autoBalanceUnlocked: false,
      autoBalanceItems: [],
      autoPotionUnlocked: false,
      autoPillUnlocked: false,
      autoPotionEnabled: false,
      autoPillEnabled: false,
      autoWeaponMergeUnlocked: false,
      autoArmorMergeUnlocked: false,
      useSpiritGemUnlocked: false,
      useSpiritGemWeapons: false,
      useSpiritGemPotions: false,
      useCheapestSpiritGem: false,
      autoSellOldHerbs: false,
      autoSellOldWood: false,
      autoSellOldOre: false,
      autoSellOldHides: false,
      autoSellOldHerbsEnabled: false,
      autoSellOldWoodEnabled: false,
      autoSellOldOreEnabled: false,
      autoSellOldBarsEnabled: false,
      autoSellOldHidesEnabled: false,
      autoequipBestWeapon: false,
      autoequipBestArmor: false,
      autoequipBestEnabled: false,
      maxStackSize: 0,
      thrownAwayItems: 0,
      autoSellOldGemsUnlocked: false,
      autoSellOldGemsEnabled: false,
      autoBuyFood: false,
      automergeEquipped: false,
      autoSort: false,
      descendingSort: false,
      divinePeachesUnlocked: false,
      equipmentUnlocked: false,
      equipmentCreated: 0,
      totalItemsReceived: 0,
      autoReloadCraftInputs: false,
      pillCounter: 0,
      potionCounter: 0,
      herbCounter: 0,
      gemsAcquired: 0,
    };
  }

  private getEmptyHome(): HomeProperties {
    return {
      land: 0,
      homeValue: HomeType.SquatterTent,
      bedroomFurniture: [],
      landPrice: 0,
      autoBuyLandUnlocked: false,
      autoBuyLandLimit: 0,
      autoBuyHomeUnlocked: false,
      autoBuyHomeLimit: HomeType.SquatterTent,
      keepFurniture: false,
      useAutoBuyReserve: false,
      autoBuyReserveAmount: 0,
      nextHomeCostReduction: 0,
      houseBuildingProgress: 0,
      upgrading: false,
      ownedFurniture: [],
      highestLand: 0,
      highestLandPrice: 0,
      bestHome: HomeType.SquatterTent,
      thugPause: false,
      hellHome: false,
      homeUnlocked: false,
      keepHome: false,
      seeFurnitureEffects: false,
      workstations: [],
      totalCrafts: 0,
      alchemyCounter: 0,
      forgeChainsCounter: 0,
    };
  }

  private getEmptyFarm(): FarmProperties {
    return {
      fields: [],
      autoFieldLimit: 0,
      mostFields: 0,
      hellFood: false,
      fallowPlots: 0,
      unlockedCrops: [],
    };
  }

  private getEmptyActivities(): ActivityProperties {
    return {
      autoRestart: false,
      pauseOnDeath: false,
      pauseBeforeDeath: false,
      activityLoop: [],
      unlockedActivities: [],
      discoveredActivities: [],
      openApprenticeships: 0,
      spiritActivity: null,
      completedApprenticeships: [],
      currentApprenticeship: undefined,
      savedActivityLoop: [],
      savedActivityLoop2: [],
      savedActivityLoop3: [],
      autoPauseUnlocked: false,
      autoRestUnlocked: false,
      pauseOnImpossibleFail: false,
      totalExhaustedDays: 0,
      purifyGemsUnlocked: false,
      lifeActivities: {},
      familySpecialty: null,
      miningCounter: 0,
      huntingCounter: 0,
      fishingCounter: 0,
      tauntCounter: 0,
      recruitingCounter: 0,
      petRecruitingCounter: 0,
      coreCultivationCounter: 0,
      researchWindCounter: 0,
    };
  }

  private getEmptyLocations(): LocationProperties {
    return {
      unlockedLocations: [],
      troubleTarget: LocationType.SmallTown,
    };
  }

  private getEmptyBattles(): BattleProperties {
    return {
      enemies: [],
      currentEnemy: null,
      kills: 0,
      godSlayerKills: 0,
      totalKills: 0,
      autoTroubleUnlocked: false,
      monthlyMonsterDay: 0,
      highestDamageTaken: 0,
      highestDamageDealt: 0,
      godSlayersUnlocked: false,
      godSlayersEnabled: false,
      totalEnemies: 0,
      troubleCounter: 0,
      battleMessageDismissed: false,
      techniques: [],
      techniqueDevelopmentCounter: 0,
      maxFamilyTechniques: 0,
      statusEffects: [],
    };
  }

  private getEmptyFollowers(): FollowersProperties {
    return {
      followersUnlocked: false,
      followers: [],
      autoDismissUnlocked: false,
      maxFollowerByType: {},
      maxPetsByType: {},
      sortField: '',
      sortAscending: false,
      totalRecruited: 0,
      totalDied: 0,
      totalDismissed: 0,
      highestLevel: 0,
      stashedFollowers: [],
      stashedPets: [],
      stashedFollowersMaxes: {},
      stashedPetMaxes: {},
      unlockedHiddenJobs: [],
      autoReplaceUnlocked: false,
      petsEnabled: false,
      onlyWantedFollowers: false,
      pets: [],
    };
  }

  private getEmptyLogs(): LogProperties {
    return {
      logTopics: [],
      storyLog: [],
      startingStoryLogEntries: [],
    };
  }

  private getEmptyAutoBuy(): AutoBuyerProperties {
    return {
      autoBuyerSettingsUnlocked: false,
      autoBuyerSettings: [],
    };
  }

  private getEmptyMainLoop(): MainLoopProperties {
    return {
      unlockFastSpeed: false,
      unlockFasterSpeed: false,
      unlockFastestSpeed: false,
      unlockAgeSpeed: false,
      unlockPlaytimeSpeed: false,
      lastTime: 0,
      tickDivider: 0,
      offlineDivider: 0,
      pause: false,
      bankedTicks: 0,
      totalTicks: 0,
      useBankedTicks: false,
      scientificNotation: false,
      playMusic: false,
      timeUnlocked: false,
    };
  }

  private getEmptyImpossibleTasks(): ImpossibleTaskProperties {
    return {
      taskProgress: [],
      impossibleTasksUnlocked: false,
      activeTaskIndex: 0,
    };
  }

  private getEmptyHell(): HellProperties {
    return {
      inHell: false,
      currentHell: 0,
      completedHellTasks: [],
      completedHellBosses: [],
      mountainSteps: 0,
      animalsHealed: 0,
      boulderHeight: 0,
      daysFasted: 0,
      swimDepth: 0,
      exitFound: false,
      soulsEscaped: 0,
      relicsReturned: 0,
      timesCrushed: 0,
      contractsExamined: 0,
      atonedKills: 0,
      fasterHellMoney: false,
      burnedMoney: 0,
    };
  }

  private getEmptyCharacterProperties(): CharacterProperties {
    return {
      attributes: this.getEmptyAttributesObject(),
      money: 0,
      stashedMoney: 0,
      hellMoney: 0,
      equipment: this.getEmptyEquipmentSlots(),
      stashedEquipment: this.getEmptyEquipmentSlots(),
      itemPouches: [],
      age: 0,
      status: this.getEmptyCharacterStatus(),
      baseLifespan: 0,
      foodLifespan: 0,
      alchemyLifespan: 0,
      statLifespan: 0,
      spiritualityLifespan: 0,
      magicLifespan: 0,
      attributeScalingLimit: 0,
      attributeSoftCap: 0,
      aptitudeGainDivider: 0,
      condenseSoulCoreCost: 0,
      reinforceMeridiansCost: 0,
      bloodlineRank: 0,
      qiUnlocked: false,
      totalLives: 0,
      healthBonusFood: 0,
      healthBonusBath: 0,
      healthBonusMagic: 0,
      healthBonusSoul: 0,
      empowermentFactor: 0,
      immortal: false,
      god: false,
      easyMode: false,
      highestMoney: 0,
      highestAge: 0,
      highestHealth: 0,
      highestStamina: 0,
      highestQi: 0,
      highestAttributes: {},
      yinYangBoosted: false,
      yin: 0,
      yang: 0,
      righteousWrathUnlocked: false,
      bonusMuscles: false,
      bonusBrains: false,
      bonusHealth: false,
      showLifeSummary: false,
      showTips: false,
      showUpdateAnimations: false,
      startingStaminaBoost: false,
    };
  }

  private getEmptyEquipmentSlots(): EquipmentSlots {
    return {
      head: null,
      feet: null,
      body: null,
      legs: null,
      leftHand: null,
      rightHand: null,
    };
  }

  private getEmptyCharacterStatus(): CharacterStatus {
    return {
      health: {
        description: '',
        value: 0,
        max: 0,
        battleTickRecovery: undefined,
      },
      stamina: {
        description: '',
        value: 0,
        max: 0,
        battleTickRecovery: undefined,
      },
      qi: {
        description: '',
        value: 0,
        max: 0,
        battleTickRecovery: undefined,
      },
      nutrition: {
        description: '',
        value: 0,
        max: 0,
        battleTickRecovery: undefined,
      },
    };
  }

  private getEmptyAttributesObject(): AttributeObject {
    return {
      strength: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      toughness: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      speed: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      intelligence: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      charisma: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      spirituality: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      earthLore: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      metalLore: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      woodLore: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      waterLore: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      fireLore: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      animalHandling: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      combatMastery: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
      magicMastery: {
        description: '',
        value: 0,
        lifeStartValue: 0,
        aptitude: 0,
        aptitudeMult: 0,
        icon: '',
      },
    };
  }

  getLayoutExport(): string {
    const layoutData = {
      layout: this.layout() ?? [],
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
      farm: this.farmService.getProperties(),
      locations: this.locationService.getProperties(),
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
      layout: this.layout() ?? [],
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
