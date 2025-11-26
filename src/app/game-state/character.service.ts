import { Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ActivityService } from './activity.service';
import { Subscription } from 'rxjs';
import { HellService } from './hell.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CamelToTitlePipe, BigNumberPipe } from '../pipes';
import { AchievementService } from './achievement.service';
import { LifeSummaryComponent } from '../life-summary/life-summary.component';
import { Equipment, ItemStack } from './inventory.service';
import { Realm } from './activity';

export type CharacterAttribute = {
  [key: string]: number | undefined;
  strength?: number;
  toughness?: number;
  speed?: number;
  intelligence?: number;
  charisma?: number;
  spirituality?: number;
  earthLore?: number;
  metalLore?: number;
  woodLore?: number;
  waterLore?: number;
  fireLore?: number;
  combatMastery?: number;
  magicMastery?: number;
  animalHandling?: number;
  performance?: number;
  smithing?: number;
  alchemy?: number;
  woodwork?: number;
  leatherwork?: number;
  formationMastery?: number;
};

export type AttributeType =
  | 'strength'
  | 'toughness'
  | 'speed'
  | 'intelligence'
  | 'charisma'
  | 'spirituality'
  | 'wisdom'
  | 'justice'
  | 'mercy'
  | 'wrath'
  | 'presence'
  | 'earthLore'
  | 'metalLore'
  | 'woodLore'
  | 'waterLore'
  | 'fireLore'
  | 'combatMastery'
  | 'animalHandling'
  | 'magicMastery'
  | 'performance'
  | 'smithing'
  | 'alchemy'
  | 'woodwork'
  | 'leatherwork'
  | 'formationMastery'
  | 'cooking'
  | 'haggling';

export type AttributeObject = {
  description: string;
  value: number;
  displayKey: WritableSignal<string>;
  displayValue: WritableSignal<number>;
  lifeStartValue: number;
  aptitude: number;
  displayAptitude: WritableSignal<number>;
  aptitudeMult: number;
  icon: string;
  attributeGroup: string;
};

export type AttributesObject = {
  [key in AttributeType]: AttributeObject;
};

export type SavedAttributeObject = {
  value: number;
  lifeStartValue: number;
  aptitude: number;
  aptitudeMult: number;
};

export type SavedAttributesObject = {
  [key in AttributeType]: SavedAttributeObject;
};

export type EquipmentPosition = 'head' | 'feet' | 'body' | 'legs' | 'leftHand' | 'rightHand';

export type EquipmentSlots = { [key in EquipmentPosition]: Equipment | null };

export type StatusType = 'health' | 'stamina' | 'qi' | 'nutrition';
export type CharacterStatus = {
  [key in StatusType]: {
    description: string;
    value: number;
    displayValue: WritableSignal<number>;
    max: number;
    displayMax: WritableSignal<number>;
    battleTickRecovery: number;
  };
};

export interface CharacterProperties {
  attributes: SavedAttributesObject;
  money: number;
  stashedMoney: number;
  hellMoney: number;
  equipment: EquipmentSlots;
  stashedEquipment: EquipmentSlots;
  itemPouches: ItemStack[];
  age: number;
  status: CharacterStatus;
  baseLifespan: number;
  foodLifespan: number;
  alchemyLifespan: number;
  statLifespan: number;
  spiritualityLifespan: number;
  magicLifespan: number;
  hygieneLifespan: number;
  attributeScalingLimit: number;
  attributeSoftCap: number;
  aptitudeGainDivider: number;
  condenseSoulCoreCost: number;
  reinforceMeridiansCost: number;
  bloodlineRank: number;
  qiUnlocked: boolean;
  totalLives: number;
  healthBonusFood: number;
  healthBonusBath: number;
  healthBonusMagic: number;
  healthBonusSoul: number;
  empowermentPillsTaken: number;
  immortal: boolean;
  god: boolean;
  easyMode: boolean;
  highestMoney: number;
  highestAge: number;
  highestHealth: number;
  highestStamina: number;
  highestQi: number;
  highestAttributeValues: { [key: string]: number };
  yinYangBoosted: boolean;
  yin: number;
  yang: number;
  righteousWrathUnlocked: boolean;
  bonusMuscles: boolean;
  bonusBrains: boolean;
  bonusHealth: boolean;
  showLifeSummary: boolean;
  showTips: boolean;
  showUpdateAnimations: boolean;
  startingStaminaBoost: boolean;
  keepPouchItems: boolean;
  empowermentMax: number;
}

const INITIAL_AGE = 18 * 365;
export const BASIC_ATTRIBUTES = 'Basic Attributes';
export const SPIRITUAL_ATTRIBUTES = 'Spiritual Attributes';
export const DIVINE_ATTRIBUTES = 'Divine Attributes';
export const LORE_ATTRIBUTES = 'Lore';
export const SKILL_ATTRIBUTES = 'Skills';

@Injectable({
  providedIn: 'root',
})
export class CharacterService {
  private camelToTitlePipe = new CamelToTitlePipe();
  private bigNumberPipe: BigNumberPipe;
  private activityService?: ActivityService;
  private achievementService?: AchievementService;
  forceRebirth = false;
  fatherGift = false;
  lifespanTooltip = signal<string>('');
  private hellService?: HellService;
  private snackBar: MatSnackBar;
  private snackBarObservable?: Subscription;
  maxMoney = 9.9999e23;
  totalLives = 1;
  dead = false;
  attributeScalingLimit = 10;
  attributeSoftCap = 100000;
  aptitudeGainDivider = 5 * Math.pow(1.5, 9); // Exponential Soul Core ranks, up to 20%
  condenseSoulCoreCost = 10;
  condenseSoulCoreOriginalCost = 10;
  reinforceMeridiansCost = 1000;
  reinforceMeridiansOriginalCost = 1000;
  bloodlineCost = 1000;
  bloodlineRank = 0;
  qiUnlocked = false;
  attackPower: { [key in AttributeType]?: number } = {
    strength: 0,
    toughness: 0,
    speed: 0,
    intelligence: 0,
    charisma: 0,
    spirituality: 0,
    earthLore: 0,
    metalLore: 0,
    woodLore: 0,
    waterLore: 0,
    fireLore: 0,
  };
  defense = 0;
  healthBonusFood = 0;
  healthBonusBath = 0;
  healthBonusMagic = 0;
  healthBonusSoul = 0;
  empowermentPillsTaken = 0;
  empowermentMult = 1;
  empowermentMax = 99;
  imperial = false;
  immortal = signal<boolean>(false);
  god = signal<boolean>(false);
  easyMode = false;
  ascensionUnlocked = false;
  yinYangBoosted = false;
  yin = 1;
  yang = 1;
  displayYin = signal<number>(1);
  displayYang = signal<number>(1);
  yinYangBalance = 0;
  righteousWrathUnlocked = false;
  bonusMuscles = false;
  bonusBrains = false;
  bonusHealth = false;
  showLifeSummary = true;
  showTips = false;
  showUpdateAnimations = true;
  dialogRef: MatDialogRef<LifeSummaryComponent> | null = null;
  moneyUpdates = 0;
  statusToFlash: string[] = [];
  fengshuiScore = 0;
  startingStaminaBoost = false;
  attributes: AttributesObject = {
    strength: {
      description: 'An immortal must have raw physical power.',
      value: 1,
      displayKey: signal<string>('strength'),
      displayValue: signal<number>(1),
      lifeStartValue: 1,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'fitness_center',
      attributeGroup: BASIC_ATTRIBUTES,
    },
    toughness: {
      description: 'An immortal must develop resilience to endure hardship.',
      value: 1,
      displayKey: signal<string>('toughness'),
      displayValue: signal<number>(1),
      lifeStartValue: 1,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'castle',
      attributeGroup: BASIC_ATTRIBUTES,
    },
    speed: {
      description: 'An immortal must be quick of foot and hand.',
      value: 1,
      displayKey: signal<string>('speed'),
      displayValue: signal<number>(1),
      lifeStartValue: 1,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'directions_run',
      attributeGroup: BASIC_ATTRIBUTES,
    },
    intelligence: {
      description: 'An immortal must understand the workings of the universe.',
      value: 1,
      displayKey: signal<string>('intelligence'),
      displayValue: signal<number>(1),
      lifeStartValue: 1,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'local_library',
      attributeGroup: BASIC_ATTRIBUTES,
    },
    charisma: {
      description: 'An immortal must influence the hearts and minds of others.',
      value: 1,
      displayKey: signal<string>('charisma'),
      displayValue: signal<number>(1),
      lifeStartValue: 1,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'forum',
      attributeGroup: BASIC_ATTRIBUTES,
    },
    spirituality: {
      description: 'An immortal must find deep connections to the divine.',
      value: 0,
      displayKey: signal<string>('spirituality'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'self_improvement',
      attributeGroup: SPIRITUAL_ATTRIBUTES,
    },
    wisdom: {
      description: 'A true deity must have a depth of understanding that exceeds that of mere mortals.',
      value: 0,
      displayKey: signal<string>('wisdom'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'cognition',
      attributeGroup: DIVINE_ATTRIBUTES,
    },
    justice: {
      description: 'A true deity must have a deep sense of what is fair and right.',
      value: 0,
      displayKey: signal<string>('justice'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'balance',
      attributeGroup: DIVINE_ATTRIBUTES,
    },
    mercy: {
      description: 'A true deity must have compassion on lesser beings.',
      value: 0,
      displayKey: signal<string>('mercy'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'volunteer_activism',
      attributeGroup: DIVINE_ATTRIBUTES,
    },
    wrath: {
      description: 'A true deity is capable of fierce anger far beyond mortal capability.',
      value: 0,
      displayKey: signal<string>('wrath'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'swords',
      attributeGroup: DIVINE_ATTRIBUTES,
    },
    presence: {
      description: 'A true deity projects an aura of commands and majesty.',
      value: 0,
      displayKey: signal<string>('presence'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'settings_accessibility',
      attributeGroup: DIVINE_ATTRIBUTES,
    },
    earthLore: {
      description: 'Understanding the earth and how to draw power and materials from it.',
      value: 0,
      displayKey: signal<string>('earthLore'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'landslide',
      attributeGroup: LORE_ATTRIBUTES,
    },
    metalLore: {
      description: 'Understanding metals and how to forge and use them.',
      value: 0,
      displayKey: signal<string>('metalLore'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'view_module',
      attributeGroup: LORE_ATTRIBUTES,
    },
    woodLore: {
      description: 'Understanding plants and how to grow and care for them.',
      value: 0,
      displayKey: signal<string>('woodLore'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'forest',
      attributeGroup: LORE_ATTRIBUTES,
    },
    waterLore: {
      description: 'Understanding potions and pills and how to make and use them.',
      value: 0,
      displayKey: signal<string>('waterLore'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'emoji_food_beverage',
      attributeGroup: LORE_ATTRIBUTES,
    },
    fireLore: {
      description: 'Burn! Burn! BURN!!!',
      value: 0,
      displayKey: signal<string>('fireLore'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'local_fire_department',
      attributeGroup: LORE_ATTRIBUTES,
    },
    combatMastery: {
      description: 'Mastery of combat skills.',
      value: 0,
      displayKey: signal<string>('combatMastery'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'sports_martial_arts',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    magicMastery: {
      description: 'Mastery of magical skills.',
      value: 0,
      displayKey: signal<string>('magicMastery'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'auto_awesome',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    animalHandling: {
      description: 'Skill in working with animals and monsters.',
      value: 0,
      displayKey: signal<string>('animalHandling'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'cruelty_free',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    performance: {
      description: 'Skill in manipulating others with your voice.',
      value: 0,
      displayKey: signal<string>('performance'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'record_voice_over',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    smithing: {
      description: 'Skill with the forge and anvil.',
      value: 0,
      displayKey: signal<string>('smithing'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'hardware',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    alchemy: {
      description: 'Mastery of potions and pills.',
      value: 0,
      displayKey: signal<string>('alchemy'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'emoji_food_beverage',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    woodwork: {
      description: 'Skill with saws and chisels.',
      value: 0,
      displayKey: signal<string>('woodwork'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'carpenter',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    leatherwork: {
      description: 'Skill shaping hides into useful items.',
      value: 0,
      displayKey: signal<string>('leatherwork'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'pets',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    formationMastery: {
      description: 'Experience creating formation flags.',
      value: 0,
      displayKey: signal<string>('formationMastery'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'flag',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    cooking: {
      description: 'Mastery of the wok and other kitchen essentials.',
      value: 0,
      displayKey: signal<string>('cooking'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'soup_kitchen',
      attributeGroup: SKILL_ATTRIBUTES,
    },
    haggling: {
      description: 'Mastery of financial matters.',
      value: 0,
      displayKey: signal<string>('haggling'),
      displayValue: signal<number>(0),
      lifeStartValue: 0,
      aptitude: 1,
      displayAptitude: signal<number>(1),
      aptitudeMult: 1,
      icon: 'money_bag',
      attributeGroup: SKILL_ATTRIBUTES,
    },
  };
  status: CharacterStatus = {
    health: {
      description: 'Physical well-being. Take too much damage and you will die.',
      value: 100,
      displayValue: signal<number>(100),
      max: 100,
      displayMax: signal<number>(100),
      battleTickRecovery: 0,
    },
    stamina: {
      description:
        'Physical energy to accomplish tasks. Most activities use stamina, and if you let yourself run down you could get sick and have to stay in bed for a few days.',
      value: 100,
      displayValue: signal<number>(100),
      max: 100,
      displayMax: signal<number>(100),
      battleTickRecovery: 1,
    },
    qi: {
      description: 'Magical energy required for mysterious spiritual activities.',
      value: 0,
      displayValue: signal<number>(0),
      max: 0,
      displayMax: signal<number>(0),
      battleTickRecovery: 0,
    },
    nutrition: {
      description:
        'Eating is essential to life. You will automatically eat whatever food you have available when you are hungry. If you run out of food, you will automatically spend some money on cheap scraps each day.',
      value: 30,
      displayValue: signal<number>(30),
      max: 30,
      displayMax: signal<number>(30),
      battleTickRecovery: 0,
    },
  };
  money = 0;
  displayMoney = signal<number>(this.money);
  stashedMoney = 0;
  hellMoney = 0;
  // age in days
  age = INITIAL_AGE;
  displayAge = signal<number>(this.age / 365);
  displayAgeYears = signal<number>(Math.floor(this.age / 365));
  displayAgeDays = signal<number>(this.age % 365);
  baseLifespan = 30 * 365;
  foodLifespan = 0; // bonus to lifespan based on food you've eaten
  alchemyLifespan = 0; // bonus to lifespan based on pills you've eaten
  statLifespan = 0; // bonus to lifespan based on base stat aptitudes
  spiritualityLifespan = 0; // bonus to lifespan based on spirituality
  hygieneLifespan = 0; // bonus to lifespan based good hygiene
  magicLifespan = 0;
  lifespan =
    this.baseLifespan +
    this.foodLifespan +
    this.alchemyLifespan +
    this.statLifespan +
    this.spiritualityLifespan +
    this.magicLifespan +
    this.hygieneLifespan;
  displayLifespan = signal<number>(this.lifespan);
  equipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null,
  };
  stashedEquipment: EquipmentSlots = {
    head: null,
    body: null,
    leftHand: null,
    rightHand: null,
    legs: null,
    feet: null,
  };
  itemPouches: ItemStack[] = [];
  highestMoney = 0;
  highestAge = 0;
  highestHealth = 0;
  highestStamina = 0;
  highestQi = 0;
  highestAttributes: { [key: string]: WritableSignal<number> };
  keepPouchItems = false;

  constructor(
    private injector: Injector,
    private mainLoopService: MainLoopService,
    private logService: LogService,
    private dialog: MatDialog
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    setTimeout(() => (this.activityService = this.injector.get(ActivityService)));
    setTimeout(() => (this.achievementService = this.injector.get(AchievementService)));

    this.snackBar = this.injector.get(MatSnackBar);
    this.bigNumberPipe = this.injector.get(BigNumberPipe);

    this.highestAttributes = {};
    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      this.highestAttributes[keys[key]] = signal<number>(0);
    }

    mainLoopService.tickSubject.subscribe(() => {
      if (!this.dead) {
        this.age++;
      }
      this.checkForDeath();
    });

    mainLoopService.longTickSubject.subscribe(elapsedDays => {
      if (this.bloodlineRank >= 9 && this.activityService?.currentRealm === Realm.MortalRealm) {
        this.increaseAptitudeDaily(elapsedDays);
      }

      this.displayMoney.set(this.money);
      this.displayAge.set(this.age / 365);
      this.displayAgeYears.set(Math.floor(this.age / 365));
      this.displayAgeDays.set(this.age % 365);

      this.displayLifespan.set(this.lifespan / 365);
      this.displayYin.set(this.yin);
      this.displayYang.set(this.yang);
      const statusKeys = Object.keys(this.status);
      for (const key of statusKeys) {
        const statusKey = key as StatusType;
        this.status[statusKey].displayValue.set(this.status[statusKey].value);
        this.status[statusKey].displayMax.set(this.status[statusKey].max);
      }
      const attributeKeys = Object.keys(this.attributes);
      for (const key of attributeKeys) {
        const attributeKey = key as AttributeType;
        this.attributes[attributeKey].displayValue.set(this.attributes[attributeKey].value);
        this.attributes[attributeKey].displayAptitude.set(this.attributes[attributeKey].aptitude);
      }

      if (this.highestMoney < this.money) {
        this.highestMoney = this.money;
      }
      if (this.highestAge < this.age) {
        this.highestAge = this.age;
      }
      if (this.highestHealth < this.status.health.value) {
        this.highestHealth = this.status.health.value;
      }
      if (this.highestStamina < this.status.stamina.value) {
        this.highestStamina = this.status.stamina.value;
      }
      if (this.highestQi < this.status.qi.value) {
        this.highestQi = this.status.qi.value;
      }

      if (this.dead) {
        return;
      }

      this.recalculateDerivedStats();
      if (
        this.activityService!.currentRealm === Realm.CrushingBoulder &&
        !this.hellService!.completedHellTasks.includes(Realm.CrushingBoulder)
      ) {
        for (const keyString in this.attackPower) {
          const key = keyString as AttributeType;
          this.attackPower[key] = 1;
        }
      }
      this.setLifespanTooltip();
    });

    mainLoopService.doneReincarnatingSubject.subscribe(() => {
      this.dead = false;
    });
  }

  checkForDeath(): boolean {
    let deathMessage = '';
    if (this.forceRebirth) {
      deathMessage = 'You release your soul from your body at the age of ' + this.formatAge() + '.';
    } else if (this.age >= this.lifespan && !this.immortal()) {
      deathMessage =
        'You reach the end of your natural life and pass away from natural causes at the age of ' +
        this.formatAge() +
        '.';
    } else if (this.status.nutrition.value <= 0) {
      this.status.nutrition.value = 0;
      if (this.attributes.spirituality.value > 0) {
        // you're spritual now, you can fast!
        const starvationDamage = Math.max(this.status.health.value * 0.2, 20);
        this.logService.injury(
          LogTopic.COMBAT,
          'You take ' + this.bigNumberPipe.transform(starvationDamage) + ' damage from starvation.'
        ); // it's not really a combat message, but I didn't want to spam the event log
        this.status.health.value -= starvationDamage;
        if (this.status.health.value < 0) {
          this.status.health.value = 0;
        }
        this.increaseAttribute('spirituality', 0.1);
        if (this.status.health.value <= 0) {
          if (!this.immortal()) {
            deathMessage = 'You starve to death at the age of ' + this.formatAge() + '.';
          } else if (this.hellService?.inHell()) {
            this.hellService.beaten = true;
          }
        }
      } else if (!this.immortal()) {
        deathMessage = 'You starve to death at the age of ' + this.formatAge() + '.';
      }
    } else if (this.status.health.value <= 0 && !this.immortal()) {
      if (this.activityService!.activityDeath) {
        deathMessage = 'You die from overwork at the age of ' + this.formatAge() + '.';
      } else {
        deathMessage = 'You succumb to your wounds and die at the age of ' + this.formatAge() + '.';
      }
    } else if (this.immortal() && this.status.health.value < 0) {
      this.status.health.value = 0;
    }
    if (deathMessage !== '') {
      if (!this.immortal()) {
        this.logService.injury(LogTopic.EVENT, deathMessage);
        if (!this.forceRebirth) {
          this.logService.log(
            LogTopic.EVENT,
            "You have failed to achieve immortality and your life has ended. Don't worry, I'm sure you'll achieve immortality in your next life."
          );
        }
      }
      this.dead = true;
      if (!this.showLifeSummary) {
        this.toast('A new life begins.');
      }
      this.reincarnate(deathMessage); // make sure character reincarnation fires before other things reset
      this.mainLoopService.reincarnating = true;
      this.forceRebirth = false;
      if (this.immortal()) {
        this.logService.log(LogTopic.EVENT, 'You are born anew, still an immortal but with the fresh vigor of youth.');
      } else {
        this.logService.log(
          LogTopic.EVENT,
          'Congratulations! The cycle of reincarnation has brought you back into the world. You have been born again. You are certain that lucky life number ' +
            this.totalLives +
            ' will be the one.'
        );
        this.logService.log(
          LogTopic.EVENT,
          "It takes you a few years to grow up and remember your purpose: to become an immortal. You're all grown up now, so get to it!"
        );
      }
      return true;
    }
    return false;
  }

  private formatAge(): string {
    const years = Math.floor(this.age / 365);
    const days = this.age % 365;
    return years + ' years, ' + days + ' days';
  }

  private setLifespanTooltip() {
    if (
      this.foodLifespan +
        this.alchemyLifespan +
        this.statLifespan +
        this.spiritualityLifespan +
        this.magicLifespan +
        this.hygieneLifespan <=
      0
    ) {
      this.lifespanTooltip.set('You have done nothing to extend your lifespan.');
      return;
    }
    let tooltip = 'Your base lifespan of ' + this.yearify(this.baseLifespan) + ' is extended by';
    if (this.immortal()) {
      tooltip =
        'You are immortal. If you had remained mortal, your base lifespan of ' +
        this.yearify(this.baseLifespan) +
        ' would be extended by';
    }
    if (this.foodLifespan > 0) {
      tooltip += '<br>Healthy Food: ' + this.yearify(this.foodLifespan);
    }
    if (this.alchemyLifespan > 0) {
      tooltip += '<br>Alchemy: ' + this.yearify(this.alchemyLifespan);
    }
    if (this.statLifespan > 0) {
      tooltip += '<br>Basic Attributes: ' + this.yearify(this.statLifespan);
    }
    if (this.spiritualityLifespan > 0) {
      tooltip += '<br>Spirituality and Balance: ' + this.yearify(this.spiritualityLifespan);
    }
    if (this.magicLifespan > 0) {
      tooltip += '<br>Magic: ' + this.yearify(this.magicLifespan);
    }
    if (this.hygieneLifespan > 0) {
      tooltip += '<br>Hygiene: ' + this.yearify(this.hygieneLifespan);
    }
    this.lifespanTooltip.set(tooltip);
  }

  yearify(value: number) {
    if (value < 365) {
      return '< 1 year';
    } else if (value < 730) {
      return '1 year';
    } else {
      return this.bigNumberPipe.transform(Math.floor(value / 365)) + ' years';
    }
  }

  private resetAptitudes() {
    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      const attribute = this.attributes[keys[key]];
      attribute.lifeStartValue = 0;
      if (attribute.attributeGroup !== DIVINE_ATTRIBUTES) {
        attribute.aptitude = 1 + attribute.aptitude / this.aptitudeGainDivider; // keep up to 20% of aptitudes after Ascension
      }
      if (attribute.attributeGroup === BASIC_ATTRIBUTES) {
        attribute.value = 1;
      } else {
        attribute.value = 0;
      }
    }
    this.activityService!.checkRequirements(true);
    this.forceRebirth = true;
    this.mainLoopService.tick();
  }

  condenseSoulCore() {
    if (this.aptitudeGainDivider <= 5) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'Your spirituality coelesces around the core of your soul, strengthening it and reforging it into something stronger.'
    );
    this.logService.log(LogTopic.STORY, 'You now gain additional aptitude each time you reincarnate.');
    this.condenseSoulCoreCost *= 10;
    this.aptitudeGainDivider /= 1.5;
    this.resetAptitudes();
  }

  soulCoreRank(): number {
    return Math.log10(this.condenseSoulCoreCost / this.condenseSoulCoreOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  reinforceMeridians() {
    if (this.attributeScalingLimit >= 10240) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'The pathways that carry your chi through your body have been strengthened and reinforced.'
    );
    this.logService.log(LogTopic.STORY, 'Your aptitudes can now give you a greater increase when gaining attributes.');

    this.reinforceMeridiansCost *= 10;
    this.attributeScalingLimit *= 2;
    this.resetAptitudes();
  }

  meridianRank(): number {
    return Math.log10(this.reinforceMeridiansCost / this.reinforceMeridiansOriginalCost); // Log base 10 because the cost is multiplied by 10 per rank.
  }

  upgradeBloodline() {
    if (this.bloodlineRank >= 9) {
      // double check we're not going over the max rank
      return;
    }
    this.logService.log(
      LogTopic.STORY,
      'You sacrifice your current life to strengthen a permanent bloodline that will pass on to all of your descendants.'
    );
    this.logService.log(
      LogTopic.STORY,
      'You will be reborn into your own family line and reap greater benefits from your previous lives.'
    );
    this.bloodlineCost *= 100;
    this.bloodlineRank++;
    this.resetAptitudes();
  }

  stashWeapons() {
    this.stashedEquipment.rightHand = this.equipment.rightHand;
    this.stashedEquipment.leftHand = this.equipment.leftHand;
    this.equipment.rightHand = null;
    this.equipment.leftHand = null;
  }

  restoreWeapons() {
    this.equipment.rightHand = this.stashedEquipment.rightHand;
    this.equipment.leftHand = this.stashedEquipment.leftHand;
    this.stashedEquipment.rightHand = null;
    this.stashedEquipment.leftHand = null;
  }

  stashArmor() {
    this.stashedEquipment.head = this.equipment.head;
    this.stashedEquipment.body = this.equipment.body;
    this.stashedEquipment.legs = this.equipment.legs;
    this.stashedEquipment.feet = this.equipment.feet;
    this.equipment.head = null;
    this.equipment.body = null;
    this.equipment.legs = null;
    this.equipment.feet = null;
  }

  restoreArmor() {
    this.equipment.head = this.stashedEquipment.head;
    this.equipment.body = this.stashedEquipment.body;
    this.equipment.legs = this.stashedEquipment.legs;
    this.equipment.feet = this.stashedEquipment.feet;
    this.stashedEquipment.head = null;
    this.stashedEquipment.body = null;
    this.stashedEquipment.legs = null;
    this.stashedEquipment.feet = null;
  }

  stashMoney() {
    this.stashedMoney = this.money;
    this.updateMoney(0, true);
  }

  restoreMoney() {
    this.updateMoney(this.stashedMoney, true);
    this.stashedMoney = 0;
  }

  // this doesn't really belong here, but nearly everything accesses this service and I didn't want to make a whole service for one function, so here it will live for now
  toast(message: string, duration = 5000) {
    const snackBar = this.snackBar.open(message, 'Close', {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackBar', 'darkMode'],
    });
    this.snackBarObservable = snackBar.onAction().subscribe(() => {
      this.snackBarObservable?.unsubscribe();
    });
  }

  // reset everything but increase aptitudes
  reincarnate(causeOfDeath: string): void {
    this.totalLives++;

    let attributeGains = '';

    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      if (this.attributes[keys[key]].value > 0 && this.attributes[keys[key]].attributeGroup !== DIVINE_ATTRIBUTES) {
        // gain aptitude based on last life's value
        const addedValue =
          (this.attributes[keys[key]].value - (this.attributes[keys[key]].lifeStartValue || 0)) /
          this.aptitudeGainDivider;
        if (addedValue > 0) {
          // never reduce aptitudes during reincarnation
          this.attributes[keys[key]].aptitude += addedValue;
          const message =
            'Your aptitude for ' +
            this.camelToTitlePipe.transform(keys[key]) +
            ' increased by ' +
            this.bigNumberPipe.transform(addedValue) +
            '\n    New aptitude: ' +
            this.bigNumberPipe.transform(this.attributes[keys[key]].aptitude);
          this.logService.log(LogTopic.EVENT, message);
          attributeGains +=
            message +
            '\n    New starting value: ' +
            this.bigNumberPipe.transform(
              this.getAttributeStartingValue(this.attributes[keys[key]].value, this.attributes[keys[key]].aptitude)
            ) +
            '\n';
        }
        // start at the aptitude value
        this.attributes[keys[key]].value = this.getAttributeStartingValue(
          this.attributes[keys[key]].value,
          this.attributes[keys[key]].aptitude
        );
        this.attributes[keys[key]].lifeStartValue = this.attributes[keys[key]].value;
      }
    }

    if (this.showLifeSummary) {
      if (this.dialogRef) {
        this.dialogRef.close();
      }
      this.dialogRef = this.dialog.open(LifeSummaryComponent, {
        width: '600px',
        data: { causeOfDeath: causeOfDeath, attributeGains: attributeGains },
        autoFocus: false,
      });
    }

    this.status.health.value = 100;
    this.status.health.max = 100;
    if (this.startingStaminaBoost) {
      this.status.stamina.value = 1000;
      this.status.stamina.max = 1000;
    } else {
      this.status.stamina.value = 100;
      this.status.stamina.max = 100;
    }
    this.status.nutrition.value = 30;
    this.status.nutrition.max = 30;
    if (this.qiUnlocked) {
      this.status.qi.max = 1;
      this.status.qi.value = 1;
    } else {
      this.status.qi.max = 0;
      this.status.qi.value = 0;
    }

    this.healthBonusFood = 0;
    this.healthBonusBath = 0;
    this.healthBonusMagic = 0;

    // age in days
    this.age = INITIAL_AGE;
    this.foodLifespan = 0;
    this.alchemyLifespan = 0;
    this.spiritualityLifespan = 0;
    this.magicLifespan = 0;
    this.hygieneLifespan = 0;
    let totalAptitude = 0;
    totalAptitude +=
      this.attributes.strength.aptitude +
      this.attributes.toughness.aptitude +
      this.attributes.speed.aptitude +
      this.attributes.intelligence.aptitude +
      this.attributes.charisma.aptitude;
    this.statLifespan = this.getAptitudeMultipier(totalAptitude / 5);
    if (this.bloodlineRank < 5) {
      this.statLifespan *= 0.1;
    } else {
      this.statLifespan *= 5;
    }

    if (this.money < 0) {
      //sanity check that we're not persisting/growing debt at higher bloodline levels
      this.updateMoney(0, true);
    }
    if (this.bloodlineRank < 3) {
      this.updateMoney(0, true);
    } else if (this.bloodlineRank < 4) {
      this.updateMoney(this.money / 8, true);
    } else {
      this.updateMoney(4 * this.money, true);
    }
    if (this.money > this.maxMoney) {
      this.updateMoney(this.maxMoney, true);
    }
    this.hellMoney = 0;
    this.recalculateDerivedStats();
    if (this.bloodlineRank === 0) {
      this.equipment = {
        head: null,
        body: null,
        leftHand: null,
        rightHand: null,
        legs: null,
        feet: null,
      };
    } else if (this.bloodlineRank <= 1) {
      this.equipment.body = null;
      this.equipment.head = null;
      this.equipment.legs = null;
      this.equipment.feet = null;
    }
    this.yin = 1;
    this.yang = 1;
  }

  getAttributeStartingValue(value: number, aptitude: number): number {
    if (value <= 0) {
      return 0;
    }
    if (aptitude < 0) {
      aptitude = 0;
    }
    if (value < 1) {
      return value / 10;
    }
    if (aptitude < this.attributeSoftCap) {
      return 1 + aptitude / 10;
    }
    return this.attributeSoftCap / 10 + Math.log2(aptitude - (this.attributeSoftCap - 1));
  }

  recalculateDerivedStats(): void {
    let bonusFactor = 1;
    if (this.bonusHealth) {
      bonusFactor = 5;
    }
    bonusFactor += this.fengshuiScore / 20;
    this.status.health.max =
      (100 +
        this.healthBonusFood +
        this.healthBonusBath +
        this.healthBonusMagic +
        this.healthBonusSoul +
        Math.floor(Math.log2(this.attributes.toughness.value + 2) * 5)) *
      bonusFactor;
    if (this.money > this.maxMoney) {
      this.updateMoney(this.maxMoney, true);
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }

    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      this.attributes[keys[key]].aptitudeMult = this.getAptitudeMultipier(
        this.attributes[keys[key]].aptitude,
        false,
        this.attributes[keys[key]].attributeGroup === DIVINE_ATTRIBUTES
      );
      if ((keys[key] === 'strength' || keys[key] === 'speed' || keys[key] === 'toughness') && this.bonusMuscles) {
        this.attributes[keys[key]].aptitudeMult *= 1000;
      }
      if ((keys[key] === 'intelligence' || keys[key] === 'charisma') && this.bonusBrains) {
        this.attributes[keys[key]].aptitudeMult *= 1000;
      }
      if (this.highestAttributes[keys[key]]() < this.attributes[keys[key]].value) {
        this.highestAttributes[keys[key]].set(this.attributes[keys[key]].value);
      }
    }

    this.spiritualityLifespan = this.getAptitudeMultipier(this.attributes.spirituality.value, true) * 5; // No empowerment for lifespan
    this.lifespan =
      this.baseLifespan +
      this.foodLifespan +
      this.alchemyLifespan +
      this.statLifespan +
      this.spiritualityLifespan +
      this.magicLifespan +
      this.hygieneLifespan;
    let head = 1;
    let body = 1;
    let legs = 1;
    let feet = 1;
    if (this.equipment.head) {
      head = this.equipment.head.armorStats?.defense || 1;
    }
    if (this.equipment.body) {
      body = this.equipment.body.armorStats?.defense || 1;
    }
    if (this.equipment.legs) {
      legs = this.equipment.legs.armorStats?.defense || 1;
    }
    if (this.equipment.feet) {
      feet = this.equipment.feet.armorStats?.defense || 1;
    }
    for (const keyString in this.attackPower) {
      const key = keyString as AttributeType;
      const attributePower = Math.sqrt(this.attributes[key].value) || 1;
      this.attackPower[key] = Math.floor(attributePower) || 1;
      if (this.attributes.combatMastery.value > 1) {
        // multiply by log base 100 of combatMastery
        // Math.log(100)=4.605170185988092
        this.attackPower[key] *= Math.log(this.attributes.combatMastery.value + 100) / 4.605170185988092;
      }
      if (this.righteousWrathUnlocked) {
        this.attackPower[key] *= 2;
      }
    }
    const toughnessDefense = Math.sqrt(this.attributes.toughness.value) || 1;
    this.defense = Math.floor(toughnessDefense * (head + body + legs + feet)) || 1;
    if (this.righteousWrathUnlocked) {
      this.defense *= 2;
    }
    if (this.yinYangBoosted) {
      // calculate yin/yang balance bonus, 10 for perfect balance, 0 at worst
      this.yinYangBalance = Math.max(10 - (10 * Math.abs(this.yang - this.yin)) / ((this.yang + this.yin) / 2), 0);
    } else {
      // calculate yin/yang balance bonus, 1 for perfect balance, 0 at worst
      this.yinYangBalance = Math.max(1 - Math.abs(this.yang - this.yin) / ((this.yang + this.yin) / 2), 0);
    }
    this.empowermentMult = this.getEmpowermentMult();
  }

  getEmpowermentMult(): number {
    const max = this.empowermentMax;
    const empowermentFactor = this.empowermentPillsTaken * 0.01;
    let returnValue = 1 + (2 * max) / (1 + Math.pow(1.02, -empowermentFactor / 3)) - max;
    if (this.easyMode) {
      returnValue *= 100;
    }
    return returnValue;
  }

  //TODO: maybe cache the results on aptitude change instead of recalculating regularly
  getAptitudeMultipier(aptitude: number, noEmpowerment = false, divineAttribute = false): number {
    if (aptitude < 0) {
      // should not happen, but sanity check it
      aptitude = 0;
    }
    const empowermentMultiplier = noEmpowerment || divineAttribute ? 1 : this.empowermentMult;
    let x = 1;
    if (aptitude < this.attributeScalingLimit) {
      // linear up to the scaling limit
      x = aptitude * empowermentMultiplier;
    } else if (aptitude < this.attributeScalingLimit * 10) {
      // from the limit to 10x the limit, change growth rate to 1/4
      x = (this.attributeScalingLimit + (aptitude - this.attributeScalingLimit) / 4) * empowermentMultiplier;
    } else if (aptitude < this.attributeScalingLimit * 100) {
      // from the 10x limit to 100x the limit, change growth rate to 1/20
      x =
        (this.attributeScalingLimit +
          (this.attributeScalingLimit * 9) / 4 +
          (aptitude - this.attributeScalingLimit * 10) / 20) *
        empowermentMultiplier;
    } else if (aptitude <= this.attributeSoftCap) {
      // from the 100x limit to softcap, change growth rate to 1/100
      x =
        (this.attributeScalingLimit +
          (this.attributeScalingLimit * 9) / 4 +
          (this.attributeScalingLimit * 90) / 20 +
          (aptitude - this.attributeScalingLimit * 100) / 100) *
        empowermentMultiplier;
    } else {
      const d =
        this.attributeScalingLimit +
        (this.attributeScalingLimit * 9) / 4 +
        (this.attributeScalingLimit * 90) / 20 +
        (this.attributeSoftCap - this.attributeScalingLimit * 100) / 100; // Pre-softcap
      x =
        (Math.pow((aptitude - this.attributeSoftCap) * Math.pow(this.attributeScalingLimit / 1e13, 0.15), 0.5) + d) *
        empowermentMultiplier; // Softcap
    }
    if (this.bloodlineRank >= 8) {
      if (this.attributes.wisdom.value > 0 && !divineAttribute) {
        x *= this.attributes.wisdom.value + 1;
      }
      return x;
    }
    let c = 365000; // Hardcap
    if (this.yinYangBoosted) {
      // TODO: tune this
      c += this.yinYangBalance * c;
    } else {
      c += this.yinYangBalance * c * 0.1;
    }
    c = c / (-1 - Math.log((x + c) / c)) + c; // soft-hardcap math
    if (this.attributes.wisdom.value > 0 && !divineAttribute) {
      c *= this.attributes.wisdom.value + 1;
    }
    return c;
  }

  updateMoney(amount: number, justSetIt = false): number {
    if (justSetIt) {
      if (this.showUpdateAnimations) {
        this.moneyUpdates = amount - this.money;
      }
      this.money = amount;
    } else {
      if (amount > 0) {
        const multiplier = 1 + Math.pow(this.fengshuiScore, 1.5) / 100;
        amount *= multiplier;
      } else {
        let divider = 10 - 9 * Math.exp(-0.1 * Math.log10(this.attributes.haggling.value));
        if (divider < 1) {
          divider = 1;
        }
        amount /= divider;
      }
      this.money += amount;
      if (this.showUpdateAnimations) {
        this.moneyUpdates += amount;
      }
    }
    return amount;
  }

  flashStatus(statusToFlash: string) {
    if (!this.statusToFlash.includes(statusToFlash)) {
      this.statusToFlash.push(statusToFlash);
    }
  }

  increaseAttribute(attribute: AttributeType, amount: number): number {
    let increaseAmount = amount * (1 + this.achievementService!.unlockedAchievements.length * 0.02); // 2% bonus per achievement
    increaseAmount *= this.attributes[attribute].aptitudeMult;
    this.attributes[attribute].value += increaseAmount;
    return increaseAmount;
  }

  increaseAptitudeDaily(days: number) {
    for (const key in this.attributes) {
      const typedKey = key as AttributeType;
      const attribute = this.attributes[typedKey];
      if (attribute.attributeGroup === BASIC_ATTRIBUTES) {
        attribute.aptitude += (attribute.value / 1e7) * days;
      }
    }
  }

  checkOverage() {
    if (this.healthBonusFood > 19000) {
      this.healthBonusFood = 19000;
    }
    if (this.healthBonusBath > 80000) {
      this.healthBonusBath = 80000;
    }
    let healthBonusMagicCap = 1000000;
    let healthBonusSoulCap = 2000000;
    if (this.yinYangBoosted) {
      healthBonusMagicCap += 2 * this.yinYangBalance * healthBonusMagicCap;
      healthBonusSoulCap += 2 * this.yinYangBalance * healthBonusSoulCap;
    }
    if (this.healthBonusMagic > healthBonusMagicCap) {
      this.healthBonusMagic = healthBonusMagicCap;
    }
    if (this.healthBonusSoul > healthBonusSoulCap) {
      this.healthBonusSoul = healthBonusSoulCap;
    }
    if (this.status.stamina.max > 1000000) {
      this.status.stamina.max = 1000000;
    }
    if (this.status.qi.max > 1000000) {
      this.status.qi.max = 1000000;
    }
    if (this.status.nutrition.max > 1000) {
      this.status.nutrition.max = 1000;
    }
    if (this.status.health.value > this.status.health.max) {
      this.status.health.value = this.status.health.max;
    }
    if (this.status.stamina.value > this.status.stamina.max) {
      this.status.stamina.value = this.status.stamina.max;
    }
    if (this.status.nutrition.value > this.status.nutrition.max) {
      this.status.nutrition.value = this.status.nutrition.max;
    }
    if (this.status.qi.value > this.status.qi.max) {
      this.status.qi.value = this.status.qi.max;
    }
    if (this.money > this.maxMoney) {
      this.updateMoney(this.maxMoney, true);
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }
  }

  getProperties(): CharacterProperties {
    const savedAttributes: SavedAttributesObject = JSON.parse(JSON.stringify(this.attributes));
    for (const key in savedAttributes) {
      const typedKey = key as AttributeType;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].description;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].displayKey;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].displayValue;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].displayAptitude;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].icon;
      // @ts-expect-error removing fields that don't need saving
      delete savedAttributes[typedKey].attributeGroup;
    }

    const highestAttributeValues: { [key: string]: number } = {};
    const keys = Object.keys(this.attributes) as AttributeType[];
    for (const key in keys) {
      highestAttributeValues[keys[key]] = this.highestAttributes[keys[key]]();
    }

    return {
      attributes: savedAttributes,
      money: this.money,
      stashedMoney: this.stashedMoney,
      hellMoney: this.hellMoney,
      equipment: this.equipment,
      stashedEquipment: this.stashedEquipment,
      itemPouches: this.itemPouches,
      age: this.age,
      status: this.status,
      baseLifespan: this.baseLifespan,
      foodLifespan: this.foodLifespan,
      alchemyLifespan: this.alchemyLifespan,
      statLifespan: this.statLifespan,
      spiritualityLifespan: this.spiritualityLifespan,
      magicLifespan: this.magicLifespan,
      hygieneLifespan: this.hygieneLifespan,
      attributeScalingLimit: this.attributeScalingLimit,
      attributeSoftCap: this.attributeSoftCap,
      aptitudeGainDivider: this.aptitudeGainDivider,
      condenseSoulCoreCost: this.condenseSoulCoreCost,
      reinforceMeridiansCost: this.reinforceMeridiansCost,
      bloodlineRank: this.bloodlineRank,
      qiUnlocked: this.qiUnlocked,
      totalLives: this.totalLives,
      healthBonusFood: this.healthBonusFood,
      healthBonusBath: this.healthBonusBath,
      healthBonusMagic: this.healthBonusMagic,
      healthBonusSoul: this.healthBonusSoul,
      empowermentPillsTaken: this.empowermentPillsTaken,
      empowermentMax: this.empowermentMax,
      immortal: this.immortal(),
      god: this.god(),
      easyMode: this.easyMode,
      highestMoney: this.highestMoney,
      highestAge: this.highestAge,
      highestHealth: this.highestHealth,
      highestStamina: this.highestStamina,
      highestQi: this.highestQi,
      highestAttributeValues: highestAttributeValues,
      yinYangBoosted: this.yinYangBoosted,
      yin: this.yin,
      yang: this.yang,
      righteousWrathUnlocked: this.righteousWrathUnlocked,
      bonusMuscles: this.bonusMuscles,
      bonusBrains: this.bonusBrains,
      bonusHealth: this.bonusHealth,
      showLifeSummary: this.showLifeSummary,
      showTips: this.showTips,
      showUpdateAnimations: this.showUpdateAnimations,
      startingStaminaBoost: this.startingStaminaBoost,
      keepPouchItems: this.keepPouchItems,
    };
  }

  setProperties(properties: CharacterProperties): void {
    for (const key in properties.attributes) {
      const typedKey = key as AttributeType;
      this.attributes[typedKey].aptitude = properties.attributes[typedKey].aptitude;
      this.attributes[typedKey].aptitudeMult = properties.attributes[typedKey].aptitudeMult;
      this.attributes[typedKey].value = properties.attributes[typedKey].value;
      this.attributes[typedKey].lifeStartValue = properties.attributes[typedKey].lifeStartValue;
      this.highestAttributes[typedKey].set(properties.highestAttributeValues[typedKey] || 0);
    }
    this.updateMoney(properties.money, true);
    this.stashedMoney = properties.stashedMoney;
    this.hellMoney = properties.hellMoney;
    if (this.money > this.maxMoney) {
      this.updateMoney(this.maxMoney, true);
    }
    if (this.hellMoney > this.maxMoney) {
      this.hellMoney = this.maxMoney;
    }
    this.equipment = properties.equipment;
    this.stashedEquipment = properties.stashedEquipment;
    this.itemPouches = properties.itemPouches;
    this.age = properties.age;
    this.status = properties.status;
    this.baseLifespan = properties.baseLifespan;
    this.foodLifespan = properties.foodLifespan;
    this.alchemyLifespan = properties.alchemyLifespan;
    this.statLifespan = properties.statLifespan;
    this.spiritualityLifespan = properties.spiritualityLifespan;
    this.magicLifespan = properties.magicLifespan;
    this.hygieneLifespan = properties.hygieneLifespan;
    this.condenseSoulCoreCost = properties.condenseSoulCoreCost;
    // This is derived to avoid save issues. Calculate rank and subtract from power to reduce the exponential aptitude divider.
    this.aptitudeGainDivider =
      5 * Math.pow(1.5, 9 - Math.log10(this.condenseSoulCoreCost / this.condenseSoulCoreOriginalCost));
    this.reinforceMeridiansCost = properties.reinforceMeridiansCost;
    // Similarly here, 10 * 2 ^ rank.
    this.attributeScalingLimit =
      10 * Math.pow(2, Math.log10(this.reinforceMeridiansCost / this.reinforceMeridiansOriginalCost));
    this.attributeSoftCap = properties.attributeSoftCap;
    this.bloodlineRank = properties.bloodlineRank;
    this.bloodlineCost = 1000 * Math.pow(100, this.bloodlineRank); // This is derived to avoid save issues.
    this.qiUnlocked = properties.qiUnlocked;
    this.totalLives = properties.totalLives;
    this.healthBonusFood = properties.healthBonusFood;
    this.healthBonusBath = properties.healthBonusBath;
    this.healthBonusMagic = properties.healthBonusMagic;
    this.healthBonusSoul = properties.healthBonusSoul;
    this.empowermentPillsTaken = properties.empowermentPillsTaken;
    this.empowermentMax = properties.empowermentMax;
    this.immortal.set(properties.immortal);
    this.god.set(properties.god);
    this.easyMode = properties.easyMode;
    this.highestMoney = properties.highestMoney;
    this.highestAge = properties.highestAge;
    this.highestHealth = properties.highestHealth;
    this.highestStamina = properties.highestStamina;
    this.highestQi = properties.highestQi;
    this.yinYangBoosted = properties.yinYangBoosted;
    this.yin = properties.yin;
    this.yang = properties.yang;
    this.righteousWrathUnlocked = properties.righteousWrathUnlocked;
    this.bonusMuscles = properties.bonusMuscles;
    this.bonusBrains = properties.bonusBrains;
    this.bonusHealth = properties.bonusHealth;
    this.showLifeSummary = properties.showLifeSummary;
    this.showTips = properties.showTips;
    this.showUpdateAnimations = properties.showUpdateAnimations;
    this.startingStaminaBoost = properties.startingStaminaBoost;
    this.keepPouchItems = properties.keepPouchItems;

    this.recalculateDerivedStats();
  }
}
