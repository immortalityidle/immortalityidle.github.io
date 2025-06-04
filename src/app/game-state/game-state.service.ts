import { Injectable, signal } from '@angular/core';
import { ActivityService, ActivityProperties } from './activity.service';
import { BattleService, BattleProperties, RIGHT_HAND_TECHNIQUE, LEFT_HAND_TECHNIQUE } from './battle.service';
import { LogProperties, LogService } from './log.service';
import { MainLoopProperties, MainLoopService } from './main-loop.service';
import { AchievementProperties, AchievementService } from './achievement.service';
import { CharacterProperties } from './character.service';
import { CharacterService } from './character.service';
import { FollowersService, FollowersProperties } from './followers.service';
import { HomeService, HomeProperties, HomeType } from './home.service';
import { InventoryService, InventoryProperties } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { ImpossibleTaskProperties, ImpossibleTaskService } from './impossibleTask.service';
import { HellLevel, HellProperties, HellService } from './hell.service';
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
  mainLoop: MainLoopProperties;
  impossibleTasks: ImpossibleTaskProperties;
  hell: HellProperties;
  darkMode: boolean;
  gameStartTimestamp: number;
  saveInterval: number;
  easyModeEver: boolean;
  lockPanels: boolean;
  layout: KtdGridLayout;
  creditsClicked: boolean;
  supportClicked: boolean;
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
  isExperimental = window.location.href.includes('experimental');
  gameStartTimestamp = new Date().getTime();
  easyModeEver = false;
  saveInterval = 300; //In seconds
  lockPanels = false;
  dragging = false;
  layout = signal<KtdGridLayout | undefined>(undefined);
  allPanelsUsed = false;
  creditsClicked = false;
  supportClicked = false;
  hardResetting = false;

  panels: Panel[] = [
    {
      id: 'timePanel',
      name: 'Time',
      icon: 'timer',
      panelHelp:
        'Control the flow of time, stopping and starting it as you see fit. What an immense power!<br>Time will automatically pause if you have no activities on your schedule that you can perform.',
      unlocked: false,
    },
    {
      id: 'schedulePanel',
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
    const currentLayout = this.layout();
    if (currentLayout && newPanelId === '') {
      // sanity check that the panel getting added isn't already in the layout
      const existingPanel = currentLayout.find(panel => panel.id === newPanelId);
      if (existingPanel) {
        // already there, bail out
        return;
      }
    }
    const newLayout = JSON.parse(JSON.stringify(currentLayout));
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

  savetoLocalStorage(): void {
    if (this.hardResetting) {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor(), this.getGameExport());
    this.lastSaved = new Date().getTime();
  }

  loadFromLocalStorage(): boolean {
    const gameStateSerialized = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor());
    if (!gameStateSerialized) {
      return false;
    }
    this.importGame(gameStateSerialized);
    this.dialog.open(OfflineModalComponent, {
      data: { earnedTicks: this.mainLoopService.earnedTicks },
      autoFocus: false,
    });
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
    // TODO: stop supporting legacy game file imports
    if (value.substring(0, 3) === 'iig') {
      // it's a new save file
      gameStateSerialized = decodeURIComponent(atob(value.substring(3)));
    } else {
      // file isn't one this game created, bail out
      return;
    }
    const parsedGameState = JSON.parse(gameStateSerialized) as Partial<GameState>;
    const gameState = this.validateGameState(parsedGameState);
    this.impossibleTaskService.setProperties(gameState.impossibleTasks);
    this.hellService.setProperties(gameState.hell || {});
    this.characterService.setProperties(gameState.character);
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
    this.creditsClicked = gameState.creditsClicked || false;
    this.supportClicked = gameState.supportClicked || false;
    this.updateAllPanelsUsed();
  }

  private validateGameState(gameState: Partial<GameState>): GameState {
    const returnValue = {
      achievements: gameState.achievements ?? { unlockedAchievements: [] },
      character: this.getCharacterProperties(gameState.character),
      inventory: this.getInventoryProperties(gameState.inventory),
      home: this.getHomeProperties(gameState.home),
      farm: this.getFarmProperties(gameState.farm),
      activities: this.getActivitiesProperties(gameState.activities),
      locations: this.getLocationsProperties(gameState.locations),
      battles: this.getBattlesProperties(gameState.battles),
      followers: this.getFollowersProperties(gameState.followers),
      logs: this.getLogsProperties(gameState.logs),
      mainLoop: this.getMainLoopProperties(gameState.mainLoop),
      impossibleTasks: this.getImpossibleTasksProperties(gameState.impossibleTasks),
      hell: this.getHellProperties(gameState.hell),
      darkMode: gameState.darkMode ?? false,
      gameStartTimestamp: 0,
      saveInterval: 0,
      easyModeEver: gameState.easyModeEver ?? false,
      lockPanels: gameState.lockPanels ?? false,
      layout: gameState.layout ?? [],
      creditsClicked: gameState.creditsClicked || false,
      supportClicked: gameState.supportClicked || false,
    };
    return returnValue;
  }
  private getInventoryProperties(props: InventoryProperties | undefined): InventoryProperties {
    return {
      itemStacks: props?.itemStacks || [],
      stashedItemStacks: props?.stashedItemStacks || [],
      autoSellUnlocked: props?.autoSellUnlocked || false,
      autoSellEntries: props?.autoSellEntries || [],
      autoUseUnlocked: props?.autoUseUnlocked || false,
      autoEatUnlocked: props?.autoEatUnlocked || false,
      autoEatNutrition: props?.autoEatNutrition ?? true,
      autoEatHealth: props?.autoEatHealth || false,
      autoEatStamina: props?.autoEatStamina || false,
      autoEatQi: props?.autoEatQi || false,
      autoEatAll: props?.autoEatAll || false,
      autoUseEntries: props?.autoUseEntries || [],
      autoBalanceUnlocked: props?.autoBalanceUnlocked || false,
      autoBalanceItems: props?.autoBalanceItems || [],
      autoPillUnlocked: props?.autoPillUnlocked || false,
      autoPillEnabled: props?.autoPillEnabled || false,
      autoWeaponMergeUnlocked: props?.autoWeaponMergeUnlocked || false,
      autoArmorMergeUnlocked: props?.autoArmorMergeUnlocked || false,
      useSpiritGemUnlocked: props?.useSpiritGemUnlocked || false,
      useSpiritGemWeapons: props?.useSpiritGemWeapons || false,
      useCheapestSpiritGem: props?.useCheapestSpiritGem || false,
      autoSellOldHerbs: props?.autoSellOldHerbs || false,
      autoSellOldWood: props?.autoSellOldWood || false,
      autoSellOldOre: props?.autoSellOldOre || false,
      autoSellOldHides: props?.autoSellOldHides || false,
      autoSellOldHerbsEnabled: props?.autoSellOldHerbsEnabled || false,
      autoSellOldWoodEnabled: props?.autoSellOldWoodEnabled || false,
      autoSellOldOreEnabled: props?.autoSellOldOreEnabled || false,
      autoSellOldBarsEnabled: props?.autoSellOldBarsEnabled || false,
      autoSellOldHidesEnabled: props?.autoSellOldHidesEnabled || false,
      autoequipBestWeapon: props?.autoequipBestWeapon || false,
      autoequipBestArmor: props?.autoequipBestArmor || false,
      autoequipBestEnabled: props?.autoequipBestEnabled || false,
      maxStackSize: props?.maxStackSize || 100,
      thrownAwayItems: props?.thrownAwayItems || 0,
      autoSellOldGemsUnlocked: props?.autoSellOldGemsUnlocked || false,
      autoSellOldGemsEnabled: props?.autoSellOldGemsEnabled || false,
      autoBuyFood: props?.autoBuyFood ?? true,
      automergeEquipped: props?.automergeEquipped || false,
      autoSort: props?.autoSort || false,
      descendingSort: props?.descendingSort || false,
      divinePeachesUnlocked: props?.divinePeachesUnlocked || false,
      equipmentUnlocked: props?.equipmentUnlocked || false,
      equipmentCreated: props?.equipmentCreated || 0,
      totalItemsReceived: props?.totalItemsReceived || 0,
      autoReloadCraftInputs: props?.autoReloadCraftInputs || false,
      pillCounter: props?.pillCounter || 0,
      potionCounter: props?.potionCounter || 0,
      herbCounter: props?.herbCounter || 0,
      gemsAcquired: props?.gemsAcquired || 0,
      foodEatenToday: props?.foodEatenToday || 0,
      heirloomSlots: props?.heirloomSlots || 0,
      daysGorged: props?.daysGorged || 0,
    };
  }

  private getHomeProperties(props: HomeProperties | undefined): HomeProperties {
    return {
      land: props?.land || 0,
      homeValue: props?.homeValue || HomeType.SquatterTent,
      bedroomFurniture: props?.bedroomFurniture || [],
      landPrice: props?.landPrice || 0,
      keepFurniture: props?.keepFurniture || false,
      keepWorkstationInputs: props?.keepWorkstationInputs || false,
      nextHomeCostReduction: props?.nextHomeCostReduction || 0,
      houseBuildingProgress: props?.houseBuildingProgress || 1,
      upgrading: props?.upgrading || false,
      ownedFurniture: props?.ownedFurniture || [],
      highestLand: props?.highestLand || 0,
      highestLandPrice: props?.highestLandPrice || 100,
      bestHome: props?.bestHome || HomeType.SquatterTent,
      thugPause: props?.thugPause || false,
      hellHome: props?.hellHome || false,
      homeUnlocked: props?.homeUnlocked || false,
      keepHome: props?.keepHome || false,
      seeFurnitureEffects: props?.seeFurnitureEffects || false,
      workstations: props?.workstations || [],
      totalCrafts: props?.totalCrafts || 0,
      alchemyCounter: props?.alchemyCounter || 0,
      forgeChainsCounter: props?.forgeChainsCounter || 0,
    };
  }

  private getFarmProperties(props: FarmProperties | undefined): FarmProperties {
    return {
      fields: props?.fields || [],
      autoFieldLimit: props?.autoFieldLimit || 0,
      mostFields: props?.mostFields || 0,
      hellFood: props?.hellFood || false,
      fallowPlots: props?.fallowPlots || 0,
      unlockedCrops: props?.unlockedCrops || [],
    };
  }

  private getActivitiesProperties(props: ActivityProperties | undefined): ActivityProperties {
    return {
      autoRestart: props?.autoRestart || false,
      pauseOnDeath: props?.pauseOnDeath ?? true,
      pauseBeforeDeath: props?.pauseBeforeDeath || false,
      activityLoop: props?.activityLoop || [],
      unlockedActivities: props?.unlockedActivities || [],
      discoveredActivities: props?.discoveredActivities || [],
      openApprenticeships: props?.openApprenticeships || 0,
      spiritActivity: props?.spiritActivity || null,
      completedApprenticeships: props?.completedApprenticeships || [],
      currentApprenticeship: props?.currentApprenticeship || undefined,
      savedActivityLoops: props?.savedActivityLoops || [],
      loopChangeTriggers: props?.loopChangeTriggers || [],
      triggerIndex: props?.triggerIndex || 0,
      autoPauseUnlocked: props?.autoPauseUnlocked || false,
      autoRestUnlocked: props?.autoRestUnlocked || false,
      pauseOnImpossibleFail: props?.pauseOnImpossibleFail || false,
      totalExhaustedDays: props?.totalExhaustedDays || 0,
      purifyGemsUnlocked: props?.purifyGemsUnlocked || false,
      lifeActivities: props?.lifeActivities || {},
      familySpecialty: props?.familySpecialty || null,
      miningCounter: props?.miningCounter || 0,
      huntingCounter: props?.huntingCounter || 0,
      fishingCounter: props?.fishingCounter || 0,
      tauntCounter: props?.tauntCounter || 0,
      recruitingCounter: props?.recruitingCounter || 0,
      petRecruitingCounter: props?.petRecruitingCounter || 0,
      coreCultivationCounter: props?.coreCultivationCounter || 0,
      researchWindCounter: props?.researchWindCounter || 0,
    };
  }

  private getLocationsProperties(props: LocationProperties | undefined): LocationProperties {
    return {
      unlockedLocations: props?.unlockedLocations || [],
      troubleTarget: props?.troubleTarget || LocationType.SmallTown,
    };
  }

  private getBattlesProperties(props: BattleProperties | undefined): BattleProperties {
    return {
      enemies: props?.enemies || [],
      currentEnemy: props?.currentEnemy || null,
      kills: props?.kills || 0,
      killsByLocation: props?.killsByLocation || {},
      godSlayerKills: props?.godSlayerKills || 0,
      totalKills: props?.totalKills || 0,
      autoTroubleUnlocked: props?.autoTroubleUnlocked || false,
      monthlyMonsterDay: props?.monthlyMonsterDay || 0,
      highestDamageTaken: props?.highestDamageTaken || 0,
      highestDamageDealt: props?.highestDamageDealt || 0,
      godSlayersUnlocked: props?.godSlayersUnlocked || false,
      godSlayersEnabled: props?.godSlayersEnabled || false,
      totalEnemies: props?.totalEnemies || 0,
      battleMessageDismissed: props?.battleMessageDismissed || false,
      techniques: props?.techniques || [
        {
          name: 'Basic Strike',
          description: 'A very simple strike that even the weakest mortal could perform.',
          ticksRequired: 10,
          ticks: 0,
          baseDamage: 1,
          unlocked: true,
          attribute: 'strength',
          staminaCost: 1,
        },
        {
          // don't mess with the index on this
          name: RIGHT_HAND_TECHNIQUE,
          description: 'A strike from the weapon in your right hand.',
          ticksRequired: 6,
          ticks: 0,
          baseDamage: 2,
          unlocked: false,
          attribute: 'strength',
          staminaCost: 10,
        },
        {
          // don't mess with the index on this
          name: LEFT_HAND_TECHNIQUE,
          description: 'A strike from the weapon in your left hand.',
          ticksRequired: 8,
          ticks: 0,
          baseDamage: 2,
          unlocked: false,
          attribute: 'strength',
          staminaCost: 10,
        },
      ],
      techniqueDevelopmentCounter: props?.techniqueDevelopmentCounter || 0,
      maxFamilyTechniques: props?.maxFamilyTechniques || 0,
      statusEffects: props?.statusEffects || [],
      potionCooldown: props?.potionCooldown || 20,
      potionThreshold: props?.potionThreshold || 50,
      foodCooldown: props?.foodCooldown || 60,
      foodThresholdStatusType: props?.foodThresholdStatusType || 'health',
      foodThreshold: props?.foodThreshold || 50,
      activeFormation: props?.activeFormation || '',
      formationCooldown: props?.formationCooldown || 0,
      formationDuration: props?.formationDuration || 0,
      formationPower: props?.formationPower || 0,
      battlesUnlocked: props?.battlesUnlocked || false,
    };
  }

  private getFollowersProperties(props: FollowersProperties | undefined): FollowersProperties {
    return {
      followersUnlocked: props?.followersUnlocked || false,
      followers: props?.followers || [],
      autoDismissUnlocked: props?.autoDismissUnlocked || false,
      maxFollowerByType: props?.maxFollowerByType || {},
      maxPetsByType: props?.maxPetsByType || {},
      sortField: props?.sortField || 'Job',
      sortAscending: props?.sortAscending ?? true,
      totalRecruited: props?.totalRecruited || 0,
      totalDied: props?.totalDied || 0,
      totalDismissed: props?.totalDismissed || 0,
      highestLevel: props?.highestLevel || 0,
      stashedFollowers: props?.stashedFollowers || [],
      stashedPets: props?.stashedPets || [],
      stashedFollowersMaxes: props?.stashedFollowersMaxes || {},
      stashedPetMaxes: props?.stashedPetMaxes || {},
      unlockedHiddenJobs: props?.unlockedHiddenJobs || [],
      autoReplaceUnlocked: props?.autoReplaceUnlocked || false,
      petsBoosted: props?.petsBoosted || false,
      onlyWantedFollowers: props?.onlyWantedFollowers || false,
      pets: props?.pets || [],
    };
  }

  private getLogsProperties(props: LogProperties | undefined): LogProperties {
    return {
      logTopics: props?.logTopics || [],
      storyLog: props?.storyLog || [],
      startingStoryLogEntries: props?.startingStoryLogEntries || [],
    };
  }

  private getMainLoopProperties(props: MainLoopProperties | undefined): MainLoopProperties {
    return {
      unlockFastSpeed: props?.unlockFastSpeed || false,
      unlockFasterSpeed: props?.unlockFasterSpeed || false,
      unlockFastestSpeed: props?.unlockFastestSpeed || false,
      unlockAgeSpeed: props?.unlockAgeSpeed || false,
      unlockPlaytimeSpeed: props?.unlockPlaytimeSpeed || false,
      lastTime: props?.lastTime || new Date().getTime(),
      tickDivider: props?.tickDivider || 0,
      offlineDivider: props?.offlineDivider || 10,
      pause: props?.pause || false,
      bankedTicks: props?.bankedTicks || 0,
      totalTicks: props?.totalTicks || 0,
      useBankedTicks: props?.useBankedTicks ?? true,
      scientificNotation: props?.scientificNotation || false,
      playMusic: props?.playMusic || false,
      timeUnlocked: props?.timeUnlocked || false,
      daysSinceLongTick: props?.daysSinceLongTick || 0,
      daysSinceYearOrLongTick: props?.daysSinceYearOrLongTick || 0,
    };
  }

  private getImpossibleTasksProperties(props: ImpossibleTaskProperties | undefined): ImpossibleTaskProperties {
    return {
      taskProgress: props?.taskProgress || [],
      impossibleTasksUnlocked: props?.impossibleTasksUnlocked || false,
      activeTaskIndex: props?.activeTaskIndex || 0,
    };
  }

  private getHellProperties(props: HellProperties | undefined): HellProperties {
    let currentHell = props?.currentHell || HellLevel.Gates;
    if (currentHell < 0) {
      currentHell = HellLevel.Gates;
    }

    return {
      inHell: props?.inHell || false,
      currentHell: currentHell,
      completedHellTasks: props?.completedHellTasks || [],
      completedHellBosses: props?.completedHellBosses || [],
      mountainSteps: props?.mountainSteps || 0,
      animalsHealed: props?.animalsHealed || 0,
      boulderHeight: props?.boulderHeight || 0,
      daysFasted: props?.daysFasted || 0,
      swimDepth: props?.swimDepth || 0,
      exitFound: props?.exitFound || false,
      soulsEscaped: props?.soulsEscaped || 0,
      relicsReturned: props?.relicsReturned || 0,
      timesCrushed: props?.timesCrushed || 0,
      contractsExamined: props?.contractsExamined || 0,
      atonedKills: props?.atonedKills || 0,
      fasterHellMoney: props?.fasterHellMoney || false,
      burnedMoney: props?.burnedMoney || 0,
    };
  }

  private getCharacterProperties(props: CharacterProperties | undefined): CharacterProperties {
    return {
      attributes: {
        strength: {
          description: 'An immortal must have raw physical power.',
          value: props?.attributes.strength.value || 1,
          lifeStartValue: props?.attributes.strength.lifeStartValue || 1,
          aptitude: props?.attributes.strength.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.strength.aptitudeMult || 1,
          icon: 'fitness_center',
        },
        toughness: {
          description: 'An immortal must develop resilience to endure hardship.',
          value: props?.attributes.toughness.value || 1,
          lifeStartValue: props?.attributes.toughness.lifeStartValue || 1,
          aptitude: props?.attributes.toughness.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.toughness.aptitudeMult || 1,
          icon: 'castle',
        },
        speed: {
          description: 'An immortal must be quick of foot and hand.',
          value: props?.attributes.speed.value || 1,
          lifeStartValue: props?.attributes.speed.lifeStartValue || 1,
          aptitude: props?.attributes.speed.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.speed.aptitudeMult || 1,
          icon: 'directions_run',
        },
        intelligence: {
          description: 'An immortal must understand the workings of the universe.',
          value: props?.attributes.intelligence.value || 1,
          lifeStartValue: props?.attributes.intelligence.lifeStartValue || 1,
          aptitude: props?.attributes.intelligence.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.intelligence.aptitudeMult || 1,
          icon: 'local_library',
        },
        charisma: {
          description: 'An immortal must influence the hearts and minds of others.',
          value: props?.attributes.charisma.value || 1,
          lifeStartValue: props?.attributes.charisma.lifeStartValue || 1,
          aptitude: props?.attributes.charisma.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.charisma.aptitudeMult || 1,
          icon: 'forum',
        },
        spirituality: {
          description: 'An immortal must find deep connections to the divine.',
          value: props?.attributes.spirituality.value || 0,
          lifeStartValue: props?.attributes.spirituality.lifeStartValue || 0,
          aptitude: props?.attributes.spirituality.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.spirituality.aptitudeMult || 1,
          icon: 'self_improvement',
        },
        earthLore: {
          description: 'Understanding the earth and how to draw power and materials from it.',
          value: props?.attributes.earthLore.value || 0,
          lifeStartValue: props?.attributes.earthLore.lifeStartValue || 0,
          aptitude: props?.attributes.earthLore.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.earthLore.aptitudeMult || 1,
          icon: 'landslide',
        },
        metalLore: {
          description: 'Understanding metals and how to forge and use them.',
          value: props?.attributes.metalLore.value || 0,
          lifeStartValue: props?.attributes.metalLore.lifeStartValue || 0,
          aptitude: props?.attributes.metalLore.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.metalLore.aptitudeMult || 1,
          icon: 'view_module',
        },
        woodLore: {
          description: 'Understanding plants and how to grow and care for them.',
          value: props?.attributes.woodLore.value || 0,
          lifeStartValue: props?.attributes.woodLore.lifeStartValue || 0,
          aptitude: props?.attributes.woodLore.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.woodLore.aptitudeMult || 1,
          icon: 'forest',
        },
        waterLore: {
          description: 'Understanding potions and pills and how to make and use them.',
          value: props?.attributes.waterLore.value || 0,
          lifeStartValue: props?.attributes.waterLore.lifeStartValue || 0,
          aptitude: props?.attributes.waterLore.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.waterLore.aptitudeMult || 1,
          icon: 'water_drop',
        },
        fireLore: {
          description: 'Burn! Burn! BURN!!!',
          value: props?.attributes.fireLore.value || 0,
          lifeStartValue: props?.attributes.fireLore.lifeStartValue || 0,
          aptitude: props?.attributes.fireLore.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.fireLore.aptitudeMult || 1,
          icon: 'local_fire_department',
        },
        combatMastery: {
          description: 'Mastery of combat skills.',
          value: props?.attributes.combatMastery.value || 0,
          lifeStartValue: props?.attributes.combatMastery.lifeStartValue || 0,
          aptitude: props?.attributes.combatMastery.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.combatMastery.aptitudeMult || 1,
          icon: 'sports_martial_arts',
        },
        magicMastery: {
          description: 'Mastery of magical skills.',
          value: props?.attributes.magicMastery.value || 0,
          lifeStartValue: props?.attributes.magicMastery.lifeStartValue || 0,
          aptitude: props?.attributes.magicMastery.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.magicMastery.aptitudeMult || 1,
          icon: 'auto_awesome',
        },
        animalHandling: {
          description: 'Skill in working with animals and monsters.',
          value: props?.attributes.animalHandling.value || 0,
          lifeStartValue: props?.attributes.animalHandling.lifeStartValue || 0,
          aptitude: props?.attributes.animalHandling.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes.animalHandling.aptitudeMult || 1,
          icon: 'pets',
        },
        performance: {
          description: 'Skill in manipulating others with your voice.',
          value: props?.attributes?.performance?.value || 0,
          lifeStartValue: props?.attributes?.performance?.lifeStartValue || 0,
          aptitude: props?.attributes?.performance?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.performance?.aptitudeMult || 1,
          icon: 'record_voice_over',
        },
        smithing: {
          description: 'Skill with the forge and anvil.',
          value: props?.attributes?.smithing?.value || 0,
          lifeStartValue: props?.attributes?.smithing?.lifeStartValue || 0,
          aptitude: props?.attributes?.smithing?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.smithing?.aptitudeMult || 1,
          icon: 'hardware',
        },
        alchemy: {
          description: 'Mastery of potions and pills.',
          value: props?.attributes?.alchemy?.value || 0,
          lifeStartValue: props?.attributes?.alchemy?.lifeStartValue || 0,
          aptitude: props?.attributes?.alchemy?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.alchemy?.aptitudeMult || 1,
          icon: 'emoji_food_beverage',
        },
        woodwork: {
          description: 'Skill with saws and chisels.',
          value: props?.attributes?.woodwork?.value || 0,
          lifeStartValue: props?.attributes?.woodwork?.lifeStartValue || 0,
          aptitude: props?.attributes?.woodwork?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.woodwork?.aptitudeMult || 1,
          icon: 'carpenter',
        },
        leatherwork: {
          description: 'Skill shaping hides into useful items.',
          value: props?.attributes?.leatherwork?.value || 0,
          lifeStartValue: props?.attributes?.leatherwork?.lifeStartValue || 0,
          aptitude: props?.attributes?.leatherwork?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.leatherwork?.aptitudeMult || 1,
          icon: 'pets',
        },
        formationMastery: {
          description: 'Experience creating formation flags.',
          value: props?.attributes?.formationMastery?.value || 0,
          lifeStartValue: props?.attributes?.formationMastery?.lifeStartValue || 0,
          aptitude: props?.attributes?.formationMastery?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.formationMastery?.aptitudeMult || 1,
          icon: 'flag',
        },
        cooking: {
          description: 'Mastery of the wok and other kitchen essentials.',
          value: props?.attributes?.cooking?.value || 0,
          lifeStartValue: props?.attributes?.cooking?.lifeStartValue || 0,
          aptitude: props?.attributes?.cooking?.aptitude || 1,
          displayValue: signal<number>(0),
          displayAptitude: signal<number>(0),
          aptitudeMult: props?.attributes?.cooking?.aptitudeMult || 1,
          icon: 'soup_kitchen',
        },
      },
      status: {
        health: {
          description: 'Physical well-being. Take too much damage and you will die.',
          value: props?.status.health.value || 100,
          displayValue: signal<number>(props?.status.health.value || 100),
          max: props?.status.health.max || 100,
          displayMax: signal<number>(props?.status.health.value || 100),
          battleTickRecovery: props?.status.health.battleTickRecovery || 0,
        },
        stamina: {
          description:
            'Physical energy to accomplish tasks. Most activities use stamina, and if you let yourself run down you could get sick and have to stay in bed for a few days.',
          value: props?.status.stamina.value || 100,
          displayValue: signal<number>(props?.status.stamina.value || 100),
          max: props?.status.stamina.max || 100,
          displayMax: signal<number>(props?.status.stamina.value || 100),
          battleTickRecovery: props?.status.stamina.battleTickRecovery || 1,
        },
        qi: {
          description: 'Magical energy required for mysterious spiritual activities.',
          value: props?.status?.qi?.value || 0,
          displayValue: signal<number>(props?.status.qi.value || 0),
          max: props?.status?.qi?.max || 0,
          displayMax: signal<number>(props?.status.qi.value || 0),
          battleTickRecovery: props?.status?.qi?.battleTickRecovery || 0,
        },
        nutrition: {
          description:
            'Eating is essential to life. You will automatically eat whatever food you have available when you are hungry. If you run out of food, you will automatically spend some money on cheap scraps each day.',
          value: props?.status?.nutrition?.value || 30,
          displayValue: signal<number>(props?.status.nutrition.value || 30),
          max: props?.status?.nutrition?.max || 30,
          displayMax: signal<number>(props?.status.nutrition.value || 30),
          battleTickRecovery: props?.status?.nutrition?.battleTickRecovery || 0,
        },
      },
      money: props?.money || 0,
      stashedMoney: props?.stashedMoney || 0,
      hellMoney: props?.hellMoney || 0,
      equipment: {
        head: props?.equipment.head || null,
        feet: props?.equipment.feet || null,
        body: props?.equipment.body || null,
        legs: props?.equipment.legs || null,
        leftHand: props?.equipment.leftHand || null,
        rightHand: props?.equipment.rightHand || null,
      },
      stashedEquipment: {
        head: props?.stashedEquipment.head || null,
        feet: props?.stashedEquipment.feet || null,
        body: props?.stashedEquipment.body || null,
        legs: props?.stashedEquipment.legs || null,
        leftHand: props?.stashedEquipment.leftHand || null,
        rightHand: props?.stashedEquipment.rightHand || null,
      },
      itemPouches: props?.itemPouches || [],
      age: props?.age || 0,
      baseLifespan: props?.baseLifespan || 30 * 365,
      foodLifespan: props?.foodLifespan || 0,
      alchemyLifespan: props?.alchemyLifespan || 0,
      statLifespan: props?.statLifespan || 0,
      spiritualityLifespan: props?.spiritualityLifespan || 0,
      magicLifespan: props?.magicLifespan || 0,
      attributeScalingLimit: props?.attributeScalingLimit || 10,
      attributeSoftCap: props?.attributeSoftCap || 100000,
      aptitudeGainDivider: props?.aptitudeGainDivider || 5 * Math.pow(1.5, 9),
      condenseSoulCoreCost: props?.condenseSoulCoreCost || 10,
      reinforceMeridiansCost: props?.reinforceMeridiansCost || 1000,
      bloodlineRank: props?.bloodlineRank || 0,
      qiUnlocked: props?.qiUnlocked || false,
      totalLives: props?.totalLives || 1,
      healthBonusFood: props?.healthBonusFood || 0,
      healthBonusBath: props?.healthBonusBath || 0,
      healthBonusMagic: props?.healthBonusMagic || 0,
      healthBonusSoul: props?.healthBonusSoul || 0,
      empowermentFactor: props?.empowermentFactor || 1,
      immortal: props?.immortal || false,
      god: props?.god || false,
      easyMode: props?.easyMode || false,
      highestMoney: props?.highestMoney || 0,
      highestAge: props?.highestAge || 0,
      highestHealth: props?.highestHealth || 0,
      highestStamina: props?.highestStamina || 0,
      highestQi: props?.highestQi || 0,
      highestAttributes: props?.highestAttributes || {},
      yinYangBoosted: props?.yinYangBoosted || false,
      yin: props?.yin || 1,
      yang: props?.yang || 1,
      righteousWrathUnlocked: props?.righteousWrathUnlocked || false,
      bonusMuscles: props?.bonusMuscles || false,
      bonusBrains: props?.bonusBrains || false,
      bonusHealth: props?.bonusHealth || false,
      showLifeSummary: props?.showLifeSummary ?? true,
      showTips: props?.showTips || false,
      showUpdateAnimations: props?.showUpdateAnimations ?? true,
      startingStaminaBoost: props?.startingStaminaBoost || false,
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
      character: this.characterService.getProperties(),
      inventory: this.inventoryService.getProperties(),
      home: this.homeService.getProperties(),
      farm: this.farmService.getProperties(),
      locations: this.locationService.getProperties(),
      activities: this.activityService.getProperties(),
      battles: this.battleService.getProperties(),
      followers: this.followersService.getProperties(),
      logs: this.logService.getProperties(),
      mainLoop: this.mainLoopService.getProperties(),
      darkMode: this.isDarkMode,
      gameStartTimestamp: this.gameStartTimestamp,
      saveInterval: this.saveInterval || 300,
      easyModeEver: this.easyModeEver,
      lockPanels: this.lockPanels,
      layout: this.layout() ?? [],
      creditsClicked: this.creditsClicked,
      supportClicked: this.supportClicked,
    };
    let gameStateString = JSON.stringify(gameState);
    gameStateString = 'iig' + btoa(encodeURIComponent(gameStateString));
    return gameStateString;
  }

  hardReset(): void {
    this.hardResetting = true;
    window.localStorage.removeItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor());
    const gameStateSerialized = window.localStorage.getItem(LOCAL_STORAGE_GAME_STATE_KEY + this.getDeploymentFlavor());
    if (gameStateSerialized) {
      console.error("Game state didn't clear");
    }
    setTimeout(() => (window.window.location.href = window.location.href), 500);
  }

  rebirth(): void {
    this.characterService.forceRebirth = true;
    this.mainLoopService.pause = false;
  }

  getDeploymentFlavor() {
    let href = window.location.href;
    if (href === 'http://localhost:4200/' || href.includes('devtunnels.ms')) {
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
