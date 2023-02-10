import { Injectable } from "@angular/core";
import { INITIAL_AGE } from "./character";
import { GameState } from "./game-state.service";
import { HomeType } from "./home.service";

type StateAction = (state: GameState) => GameState

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private _state: GameState = defaultState;

  load(state: GameState): StateService {
    this._state = state;
    return this;
  }

  forSave(): GameState {
    return this._state;
  }

  apply(...actions: StateAction[]): StateService {
    this._state = actions.reduce((state: GameState, action: StateAction) => action(state), this._state);
    return this;
  }

  select<T>(selector: (state: GameState) => T): T {
    return selector(this._state);
  }
}

const defaultState: GameState = {
  achievements: {
    unlockedAchievements: []
  },
  character: {
    attributes: {
      strength: {
        description: "An immortal must have raw physical power.",
        value: 1,
        lifeStartValue: 1,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "fitness_center"
      },
      toughness: {
        description: "An immortal must develop resilience to endure hardship.",
        value: 1,
        lifeStartValue: 1,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "castle"
      },
      speed: {
        description: "An immortal must be quick of foot and hand.",
        value: 1,
        lifeStartValue: 1,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "directions_run"
      },
      intelligence: {
        description: "An immortal must understand the workings of the universe.",
        value: 1,
        lifeStartValue: 1,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "local_library"
      },
      charisma: {
        description: "An immortal must influence the hearts and minds of others.",
        value: 1,
        lifeStartValue: 1,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "forum"
      },
      spirituality: {
        description: "An immortal must find deep connections to the divine.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "auto_awesome"
      },
      earthLore: {
        description: "Understanding the earth and how to draw power and materials from it.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "landslide"
      },
      metalLore: {
        description: "Understanding metals and how to forge and use them.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "hardware"
      },
      woodLore: {
        description: "Understanding plants and how to grow and care for them.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "forest"
      },
      waterLore: {
        description: "Understanding potions and pills and how to make and use them.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "emoji_food_beverage"
      },
      fireLore: {
        description: "Burn! Burn! BURN!!!",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "local_fire_department"
      },
      animalHandling: {
        description: "Skill in working with animals and monsters.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "pets"
      },
      combatMastery: {
        description: "Mastery of combat skills.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "sports_martial_arts"
      },
      magicMastery: {
        description: "Mastery of magical skills.",
        value: 0,
        lifeStartValue: 0,
        aptitude: 1,
        aptitudeMult: 1,
        icon: "self_improvement"
      }
    },
    money: 300,
    stashedMoney: 0,
    hellMoney: 0,
    equipment: {
      head: null,
      body: null,
      leftHand: null,
      rightHand: null,
      legs: null,
      feet: null
    },
    stashedEquipment: {
      head: null,
      body: null,
      leftHand: null,
      rightHand: null,
      legs: null,
      feet: null
    },
    age: INITIAL_AGE,
    status: {
      health: {
        description: "Physical well-being. Take too much damage and you will die.",
        value: 100,
        max: 100
      },
      stamina: {
        description: "Physical energy to accomplish tasks. Most activities use stamina, and if you let yourself run down you could get sick and have to stay in bed for a few days.",
        value: 100,
        max: 100
      },
      mana: {
        description: "Magical energy required for mysterious spiritual activities.",
        value: 0,
        max: 0
      },
      nourishment: {
        description: "Eating is essential to life. You will automatically eat whatever food you have available when you are hungry. If you run out of food you will automatically spend your money on a bowl of rice each day.",
        value: 7,
        max: 14
      }
    },
    baseLifespan: 30 * 365,
    foodLifespan: 0,
    alchemyLifespan: 0,
    statLifespan: 0,
    spiritualityLifespan: 0,
    magicLifespan: 0,
    attributeScalingLimit: 10,
    attributeSoftCap: 100000,
    aptitudeGainDivider: 5 * Math.pow(1.5, 9),
    condenseSoulCoreCost: 10,
    reinforceMeridiansCost: 1000,
    bloodlineRank: 0,
    manaUnlocked: false,
    totalLives: 1,
    healthBonusFood: 0,
    healthBonusBath: 0,
    healthBonusMagic: 0,
    healthBonusSoul: 0,
    empowermentFactor: 1,
    immortal: false,
    god: false,
    easyMode: false,
    highestMoney: 0,
    highestAge: 0,
    highestHealth: 0,
    highestStamina: 0,
    highestMana: 0,
    highestAttributes: {},
    yinYangUnlocked: false,
    yin: 0,
    yang: 0,
    righteousWrathUnlocked: false,
    bonusMuscles: false,
    bonusBrains: false,
    bonusHealth: false,
    showLifeSummary: true,
    showTips: false,
  },
  inventory: {
    itemStacks: [],
    stashedItemStacks: [],
    autoSellUnlocked: false,
    autoSellEntries: [],
    autoUseUnlocked: false,
    autoUseEntries: [],
    autoBalanceUnlocked: false,
    autoBalanceItems: [],
    autoPotionUnlocked: false,
    autoPillUnlocked: false,
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
    maxStackSize: 10,
    thrownAwayItems: 100,
    autoSellOldGemsUnlocked: false,
    autoSellOldGemsEnabled: false,
    autoBuyFood: true,
    automergeEquipped: false,
    autoSort: false,
    descendingSort: false,
    divinePeachesUnlocked: false,
    hideEquipment: false,
  },
  home: {
    land: 0,
    homeValue: HomeType.SquatterTent,
    furniture: {
      bed: null,
      bathtub: null,
      kitchen: null,
      workbench: null
    },
    fields: [],
    extraFields: 0,
    averageYield: 0,
    landPrice: 100,
    autoBuyLandUnlocked: false,
    autoBuyLandLimit: 5,
    autoBuyHomeUnlocked: false,
    autoBuyHomeLimit: HomeType.SimpleHut,
    autoBuyFurnitureUnlocked: false,
    autoBuyFurniture: {
      bed: null,
      bathtub: null,
      kitchen: null,
      workbench: null
    },
    autoFieldUnlocked: false,
    autoFieldLimit: 0,
    useAutoBuyReserve: false,
    autoBuyReserveAmount: 0,
    nextHomeCostReduction: 0,
    houseBuildingProgress: 1,
    upgrading: false,
    ownedFurniture: [],
    highestLand: 0,
    highestLandPrice: 0,
    mostFields: 0,
    highestAverageYield: 0,
    bestHome: HomeType.SquatterTent,
    thugPause: false,
    hellFood: false,
    hellHome: false,
    hideHome: false
  },
  activities: {
    autoRestart: false,
    pauseOnDeath: true,
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
    pauseOnImpossibleFail: true,
    totalExhaustedDays: 0,
    purifyGemsUnlocked: false
  },
  battles: {
    enemies: [],
    currentEnemy: null,
    kills: 0,
    troubleKills: 0,
    totalKills: 0,
    autoTroubleUnlocked: false,
    autoTroubleEnabled: false,
    monthlyMonsterDay: 0,
    manaShieldUnlocked: false,
    manaAttackUnlocked: false,
    pyroclasmUnlocked: false,
    metalFistUnlocked: false,
    fireShieldUnlocked: false,
    iceShieldUnlocked: false,
    enableManaShield: false,
    enableManaAttack: false,
    enablePyroclasm: false,
    enableMetalFist: false,
    enableFireShield: false,
    enableIceShield: false,
    highestDamageTaken: 0,
    highestDamageDealt: 0
  },
  followers: {
    followersUnlocked: false,
    followers: [],
    autoDismissUnlocked: false,
    maxFollowerByType: {},
    sortField: "Job",
    sortAscending: true,
    totalRecruited: 0,
    totalDied: 0,
    totalDismissed: 0,
    highestLevel: 0,
    stashedFollowers: [],
    stashedFollowersMaxes: {},
    unlockedHiddenJobs: [],
    autoReplaceUnlocked: false,
    petsEnabled: false,
    onlyWantedFollowers: false
  },
  logs: {
    logTopics: ['STORY', 'EVENT'],
    storyLog: []
  },
  autoBuy: {
    autoBuyerSettingsUnlocked: false,
    autoBuyerSettings: [{ 
      label: 'Home',
      type: 'home',
      enabled: true,
      waitForFinish: true
    },
    {
      label: 'Furniture',
      type: 'furniture',
      enabled: true,
      waitForFinish: true
    },
    { 
      label: 'Land/Field',
      type: 'land',
      enabled: true,
      waitForFinish: true
    }]
  },
  mainLoop: {
    unlockFastSpeed: false,
    unlockFasterSpeed: false,
    unlockFastestSpeed: false,
    unlockAgeSpeed: false,
    unlockPlaytimeSpeed: false,
    lastTime: new Date().getTime(),
    tickDivider: 10,
    offlineDivider: 10,
    pause: true,
    bankedTicks: 0,
    totalTicks: 0,
    useBankedTicks: true,
    scientificNotation: false
  },
  impossibleTasks: {
    taskProgress: [],
    impossibleTasksUnlocked: false,
    activeTaskIndex: -1,
  },
  hell: {
    inHell: false,
    currentHell: -1,
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
    contractsExamined: 0
  },
  darkMode: false,
  gameStartTimestamp: new Date().getTime(),
  saveInterval: 10,
  easyModeEver: false,
}