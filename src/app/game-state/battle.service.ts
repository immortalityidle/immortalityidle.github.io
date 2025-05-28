import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from './main-loop.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { HellService } from './hell.service';
import { HomeService, HomeType } from './home.service';
import { LocationType } from './activity';
import { LocationService } from './location.service';
import { AttributeType, StatusType } from './character.service';
import { BigNumberPipe } from '../pipes';
import { TitleCasePipe } from '@angular/common';

export interface Enemy {
  name: string;
  baseName: string;
  health: number;
  maxHealth: number;
  defense: number;
  loot: Item[];
  unique?: boolean;
  defeatEffect?: string;
  imageFile?: string;
  techniques: Technique[];
  index?: number;
  element?: string;
  statusEffects?: StatusEffect[];
}

export interface EnemyTypes {
  name: string;
  location: LocationType;
  description: string;
  element?: string;
  basePower: number;
  lootType?: string[];
  techniques?: Technique[];
}

export interface BattleProperties {
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  kills: number;
  godSlayerKills: number;
  totalKills: number;
  autoTroubleUnlocked: boolean;
  monthlyMonsterDay: number;
  highestDamageTaken: number;
  highestDamageDealt: number;
  godSlayersUnlocked: boolean;
  godSlayersEnabled: boolean;
  totalEnemies: number;
  battleMessageDismissed: boolean;
  techniques: Technique[];
  techniqueDevelopmentCounter: number;
  maxFamilyTechniques: number;
  statusEffects: StatusEffect[];
  potionCooldown: number;
  potionThreshold: number;
  foodCooldown: number;
  foodThresholdStatusType: StatusType;
  foodThreshold: number;
  killsByLocation: { [key: string]: number };
  activeFormation: string;
  formationDuration: number;
  formationCooldown: number;
  formationPower: number;
  battlesUnlocked: boolean;
}

export interface Technique {
  name: string;
  description?: string;
  attribute?: AttributeType;
  ticks: number;
  ticksRequired: number;
  baseDamage: number;
  extraMultiplier?: number;
  hitTracker?: number;
  effect?: string;
  unlocked: boolean;
  familyTechnique?: boolean;
  qiCost?: number;
  staminaCost?: number;
  healthCost?: number;
  disabled?: boolean;
  noAttack?: boolean;
  statusEffect?: StatusEffect;
}

export interface StatusEffect {
  name: string;
  description?: string;
  power: number;
  ticksLeft: number;
}

export const LOOT_TYPE_GEM = 'gem';
export const LOOT_TYPE_MONEY = 'money';
export const LOOT_TYPE_HIDE = 'hide';
export const LOOT_TYPE_FRUIT = 'fruit';
export const LOOT_TYPE_MEAT = 'meat';
export const LOOT_TYPE_ORE = 'ore';

export const RIGHT_HAND_TECHNIQUE = 'Right-Handed Weapon';
export const LEFT_HAND_TECHNIQUE = 'Left-Handed Weapon';
export const QI_ATTACK = 'Qi Strike';
export const PYROCLASM_ATTACK = 'Pyroclasm';
export const METAL_FIST_ATTACK = 'Metal Fist';
export const QI_SHIELD = 'Qi Shield';
export const FIRE_SHIELD = 'Fire Shield';
export const ICE_SHIELD = 'Ice Shield';

export const ELEMENT_EFFECT_FIRE = 'Fire Essence';
export const ELEMENT_EFFECT_EARTH = 'Earth Essence';
export const ELEMENT_EFFECT_METAL = 'Metal Essence';
export const ELEMENT_EFFECT_WOOD = 'Wood Essence';
export const ELEMENT_EFFECT_WATER = 'Water Essence';
export const EFFECT_CORRUPTION = 'Corruption';
export const EFFECT_LIFE = 'Life';
export const EFFECT_POISON = 'Poison';
export const EFFECT_DOOM = 'Doom';
export const EFFECT_EXPLOSIVE = 'Explosions';
export const EFFECT_SHIELDING = 'Shielding';
export const EFFECT_PIERCING = 'Piercing';
export const EFFECT_HASTE = 'Haste';
export const EFFECT_SLOW = 'Slowing';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  private bigNumberPipe: BigNumberPipe;
  private hellService?: HellService;
  private locationService?: LocationService;
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  kills: number;
  killsByLocation: { [key: string]: number } = {};
  godSlayerKills: number;
  autoTroubleUnlocked = false;
  private yearlyMonsterDay: number;
  highestDamageTaken = 0;
  highestDamageDealt = 0;
  totalKills = 0;
  private skipEnemyAttack = 0;
  godSlayersUnlocked = false;
  godSlayersEnabled = false;
  totalEnemies = 0;
  battleMessageDismissed = false;
  private techniqueDevelopmentCounter = 0;
  maxFamilyTechniques = 0;
  statusEffects: StatusEffect[] = [];
  potionCooldown = 20;
  potionThreshold = 50;
  foodCooldown = 60;
  foodThresholdStatusType: StatusType = 'health';
  foodThreshold = 50;
  activeFormation = '';
  formationDuration = 0;
  formationCooldown = 0;
  formationPower = 0;
  battlesUnlocked = false;
  lores: AttributeType[] = ['metalLore', 'earthLore', 'waterLore', 'fireLore', 'woodLore'];

  private elementalFactor = 2;
  // elemental logic:
  // fire weakens metal and burns wood
  // wood absorbs water and rootbinds earth
  // water quenches fire and rusts metal
  // metal cuts wood and breaks earth
  // earth dams water and smothers fire

  techniques: Technique[] = [
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
  ];

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private itemRepoService: ItemRepoService,
    private inventoryService: InventoryService,
    private homeService: HomeService,
    mainLoopService: MainLoopService,
    private titleCasePipe: TitleCasePipe
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    setTimeout(() => (this.locationService = this.injector.get(LocationService)));
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.enemies = [];
    this.currentEnemy = null;
    this.kills = 0;
    this.godSlayerKills = 0;
    this.yearlyMonsterDay = 0;

    mainLoopService.tickSubject.subscribe(() => {
      this.ageFormation();
      this.yearlyMonsterDay++;
      if (this.homeService.homeValue === HomeType.SquatterTent && this.yearlyMonsterDay > 100) {
        this.yearlyMonsterDay = 0;
        this.logService.injury(LogTopic.EVENT, 'The shabby tent you live in has attracted some nasty mice.');
        this.addMouse();
        return;
      } else if (this.homeService.homeValue === HomeType.OwnTent && this.yearlyMonsterDay > 150) {
        this.yearlyMonsterDay = 0;
        this.logService.injury(
          LogTopic.EVENT,
          "Your increased wealth has attracted a ruffian who's looking to steal your money."
        );
        this.addRuffian();
        return;
      }
      if (this.yearlyMonsterDay >= 365) {
        this.yearlyMonsterDay = 0;
        if (this.activeFormation === '') {
          // let repulsion formations trigger before a trouble fight starts
          const repulsionFormationStack = this.characterService.itemPouches.find(
            itemStack =>
              itemStack.item?.type === 'formationKit' &&
              itemStack.item?.effect === 'repulsion' &&
              itemStack.quantity > 0
          );
          if (repulsionFormationStack && repulsionFormationStack.item) {
            repulsionFormationStack.quantity--;
            this.inventoryService.useItem(repulsionFormationStack.item);
          }
        }
        if (this.activeFormation !== 'repulsion') {
          this.trouble();
        }
      }
    });

    mainLoopService.battleTickSubject.subscribe(() => {
      this.ageFormation();
      if (this.characterService.dead) {
        return;
      }

      this.usePouchItems();

      for (const keyString in this.characterService.status) {
        const key = keyString as StatusType;
        const statusEntry = this.characterService.status[key];
        statusEntry.value += statusEntry.battleTickRecovery;
      }
      this.characterService.checkOverage();

      if (this.currentEnemy === null && this.enemies.length > 0) {
        this.currentEnemy = this.enemies[0];
      }
      this.handleYourTechniques();
      if (this.activeFormation !== 'stealth') {
        this.handleEnemyTechniques();
      }
      if (this.characterService.checkForDeath()) {
        this.clearEnemies();
      }
    });

    mainLoopService.longTickSubject.subscribe(() => {
      // only update the picture files on each long tick for performance
      for (const enemy of this.enemies) {
        if (!enemy.imageFile) {
          enemy.imageFile = 'assets/images/monsters/' + enemy.baseName + '.png';
        }
      }
      this.techniques[1].unlocked = this.characterService.equipment.rightHand !== null;
      this.techniques[2].unlocked = this.characterService.equipment.leftHand !== null;

      const familyTechniques = this.techniques.filter(technique => technique.familyTechnique === true);
      if (
        this.techniqueDevelopmentCounter > 20000 * Math.pow(10, familyTechniques.length) &&
        familyTechniques.length < this.maxFamilyTechniques
      ) {
        this.developNewTechnique();
        this.techniqueDevelopmentCounter = 0;
      }
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  ageFormation() {
    if (this.formationDuration > 0) {
      this.formationDuration--;
    }
    if (this.formationCooldown > 0) {
      this.formationCooldown--;
    }
    if (this.formationDuration <= 0) {
      this.activeFormation = '';
      this.formationPower = 0;
      this.formationDuration = 0;
    }
  }

  private reset() {
    this.clearEnemies();
    this.kills = 0;
    this.killsByLocation = {};
    this.godSlayerKills = 0;
    this.yearlyMonsterDay = 0;
    for (const itemStack of this.characterService.itemPouches) {
      if (itemStack.item) {
        itemStack.item.cooldown = 0;
      }
    }
  }

  getProperties(): BattleProperties {
    return {
      enemies: this.enemies,
      currentEnemy: this.currentEnemy,
      kills: this.kills,
      killsByLocation: this.killsByLocation,
      godSlayerKills: this.godSlayerKills,
      totalKills: this.totalKills,
      autoTroubleUnlocked: this.autoTroubleUnlocked,
      monthlyMonsterDay: this.yearlyMonsterDay,
      highestDamageDealt: this.highestDamageDealt,
      highestDamageTaken: this.highestDamageTaken,
      godSlayersUnlocked: this.godSlayersUnlocked,
      godSlayersEnabled: this.godSlayersEnabled,
      totalEnemies: this.totalEnemies,
      battleMessageDismissed: this.battleMessageDismissed,
      techniques: this.techniques,
      techniqueDevelopmentCounter: this.techniqueDevelopmentCounter,
      maxFamilyTechniques: this.maxFamilyTechniques,
      statusEffects: this.statusEffects,
      potionCooldown: this.potionCooldown,
      potionThreshold: this.potionThreshold,
      foodCooldown: this.foodCooldown,
      foodThresholdStatusType: this.foodThresholdStatusType,
      foodThreshold: this.foodThreshold,
      activeFormation: this.activeFormation,
      formationDuration: this.formationDuration,
      formationCooldown: this.formationCooldown,
      formationPower: this.formationPower,
      battlesUnlocked: this.battlesUnlocked,
    };
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.kills = properties.kills;
    this.killsByLocation = properties.killsByLocation;
    this.godSlayerKills = properties.godSlayerKills;
    this.totalKills = properties.totalKills;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.yearlyMonsterDay = properties.monthlyMonsterDay;
    this.highestDamageDealt = properties.highestDamageDealt;
    this.highestDamageTaken = properties.highestDamageTaken;
    this.godSlayersUnlocked = properties.godSlayersUnlocked;
    this.godSlayersEnabled = properties.godSlayersEnabled;
    this.totalEnemies = properties.totalEnemies;
    this.battleMessageDismissed = properties.battleMessageDismissed;
    this.techniques = properties.techniques;
    this.techniqueDevelopmentCounter = properties.techniqueDevelopmentCounter;
    this.maxFamilyTechniques = properties.maxFamilyTechniques;
    this.statusEffects = properties.statusEffects;
    this.potionCooldown = properties.potionCooldown;
    this.potionThreshold = properties.potionThreshold;
    this.foodCooldown = properties.foodCooldown;
    this.foodThresholdStatusType = properties.foodThresholdStatusType;
    this.foodThreshold = properties.foodThreshold;
    this.activeFormation = properties.activeFormation;
    this.formationDuration = properties.formationDuration;
    this.formationCooldown = properties.formationCooldown;
    this.formationPower = properties.formationPower;
    this.battlesUnlocked = properties.battlesUnlocked;
    if (this.enemies.length > 0) {
      for (const enemy of this.enemies) {
        if (enemy.name === properties.currentEnemy?.name) {
          this.currentEnemy = enemy;
        }
      }
    }
  }

  usePouchItems() {
    // use pouch items if needed
    let itemUsed = false;
    for (let i = 0; i < this.characterService.itemPouches.length; i++) {
      const itemStack = this.characterService.itemPouches[i];
      if (!itemStack || !itemStack.item || itemStack.quantity === 0 || !itemStack.item?.pouchable) {
        continue;
      }
      if (this.activeFormation === '' && itemStack.item.type === 'formationKit' && itemStack.quantity > 0) {
        itemStack.quantity--;
        this.inventoryService.useItem(itemStack.item);
      } else if ((itemStack.item.cooldown || 0) <= 0) {
        if (itemStack.item.type === 'potion') {
          const effect: StatusType = itemStack.item.effect as StatusType;
          if (
            this.characterService.status[effect].value <
            this.characterService.status[effect].max * (this.potionThreshold / 100)
          ) {
            this.characterService.status[effect].value += itemStack.item.increaseAmount || 1;
            itemStack.quantity--;
            itemStack.item.cooldown = this.potionCooldown;
            itemUsed = true;
          }
        } else if (itemStack.item.type === 'food') {
          if (
            this.characterService.status[this.foodThresholdStatusType].value <
            this.characterService.status[this.foodThresholdStatusType].max * (this.foodThreshold / 100)
          ) {
            this.inventoryService.eatFood(itemStack.item, 1);
            itemStack.quantity--;
            itemStack.item.cooldown = this.foodCooldown;
            itemUsed = true;
          }
        }
      } else {
        itemStack!.item!.cooldown = (itemStack.item?.cooldown || 0) - 1;
      }
    }
    if (itemUsed) {
      this.characterService.checkOverage();
    }
  }

  private developNewTechnique() {
    const prefixAdjectiveList = [
      'Northern',
      'Southern',
      'Eastern',
      'Western',
      'Brutal',
      'Devastating',
      'Flowing',
      'Fierce',
      'Verdant',
      'Stealthy',
      "Dragon's",
      'Devilish',
      'Angelic',
      'Fearsome',
      'Ancient',
      'Traditional',
      'Lucky',
      'Imprudent',
      'Reckless',
      'Wild',
    ];
    const prefix = prefixAdjectiveList[Math.floor(Math.random() * prefixAdjectiveList.length)];
    let healthCost = 0;
    let extraMultiplier = 1;
    if (prefix === 'Imprudent') {
      healthCost = 10;
      extraMultiplier = 2;
    } else if (prefix === 'Reckless') {
      healthCost = 100;
      extraMultiplier = 4;
    } else if (prefix === 'Wild') {
      healthCost = 1000;
      extraMultiplier = 10;
    }
    const attributeKeys = Object.keys(this.characterService.attackPower);

    const attribute = attributeKeys[Math.floor(Math.random() * attributeKeys.length)] as AttributeType;
    let attributePrefix = '';
    if (attribute === 'strength') {
      attributePrefix = 'Strong';
    } else if (attribute === 'toughness') {
      attributePrefix = 'Tough';
    } else if (attribute === 'speed') {
      attributePrefix = 'Swift';
    } else if (attribute === 'intelligence') {
      attributePrefix = 'Cunning';
    } else if (attribute === 'charisma') {
      attributePrefix = 'Charming';
    } else if (attribute === 'spirituality') {
      attributePrefix = 'Holy';
    } else if (attribute === 'earthLore') {
      attributePrefix = 'Stone';
    } else if (attribute === 'metalLore') {
      attributePrefix = 'Steel';
    } else if (attribute === 'woodLore') {
      attributePrefix = 'Oaken';
    } else if (attribute === 'waterLore') {
      attributePrefix = 'Icy';
    } else if (attribute === 'fireLore') {
      attributePrefix = 'Fiery';
    }
    const attackNouns = ['Fist', 'Strike', 'Kick', 'Blow', 'Slam', 'Slap', 'Smack', 'Pumelling', 'Barrage', 'Attack'];
    const attackNoun = attackNouns[Math.floor(Math.random() * attackNouns.length)];
    const ticksRequired = 5 + Math.floor(Math.random() * 10);
    const staminaCost = Math.max(Math.floor(Math.random() * 20) - 5, 0);
    const qiCost = Math.max(Math.floor(Math.random() * 10) - 5, 0);
    if (qiCost > 1) {
      extraMultiplier += qiCost / 10;
    }

    const effects = [
      ELEMENT_EFFECT_FIRE,
      ELEMENT_EFFECT_EARTH,
      ELEMENT_EFFECT_METAL,
      ELEMENT_EFFECT_WOOD,
      ELEMENT_EFFECT_WATER,
      EFFECT_POISON,
      EFFECT_DOOM,
      EFFECT_EXPLOSIVE,
      EFFECT_SHIELDING,
      EFFECT_PIERCING,
      EFFECT_HASTE,
      EFFECT_SLOW,
    ];

    const effectIndex = Math.floor(Math.random() * effects.length * 5);
    let effect = undefined;
    let suffix = '';
    if (effectIndex < effects.length) {
      effect = effects[effectIndex];
      suffix = ' of ' + effect;
    }

    this.techniques.push({
      name: prefix + ' ' + attributePrefix + ' ' + attackNoun + suffix,
      description: 'A special family technique that can be passed to your descendants.',
      ticksRequired: ticksRequired,
      ticks: 0,
      baseDamage: 1,
      unlocked: true,
      attribute: attribute,
      familyTechnique: true,
      staminaCost: staminaCost,
      healthCost: healthCost,
      qiCost: qiCost,
      extraMultiplier: extraMultiplier,
      effect: effect,
    });

    this.logService.log(
      LogTopic.EVENT,
      'Enlightenment! Your combat experience has allowed you to develop a new family technique!'
    );
  }

  forsakeTechnique(technique: Technique) {
    if (!technique.familyTechnique) {
      return;
    }
    const index = this.techniques.indexOf(technique);
    if (index > 2) {
      this.techniques.splice(index, 1);
    }
  }

  addQiAttack() {
    if (this.techniques.find(technique => technique.name === QI_ATTACK)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: QI_ATTACK,
      description: 'Focus your Qi into a concentrated blast. Each use of this ability requires 10 Qi.',
      ticksRequired: 5,
      ticks: 0,
      baseDamage: 2,
      unlocked: true,
      attribute: 'intelligence',
      qiCost: 10,
    });
  }

  addPyroclasm() {
    if (this.techniques.find(technique => technique.name === PYROCLASM_ATTACK)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: PYROCLASM_ATTACK,
      description:
        "Focus your Qi and blast your enemies with heat so intense their children's children will get burned. Each use of this ability requires 10,000 Qi.",
      ticksRequired: 20,
      ticks: 0,
      baseDamage: 100000,
      unlocked: true,
      attribute: 'fireLore',
      qiCost: 10000,
    });
  }

  addMetalFist() {
    if (this.techniques.find(technique => technique.name === METAL_FIST_ATTACK)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: METAL_FIST_ATTACK,
      description:
        'Focus your Qi and summon a massive metal fist to crush your enemy. Each use of this ability requires 10,000 Qi.',
      ticksRequired: 20,
      ticks: 0,
      baseDamage: 100000,
      unlocked: true,
      attribute: 'metalLore',
      qiCost: 10000,
    });
  }

  addQiShield() {
    if (this.techniques.find(technique => technique.name === QI_SHIELD)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: QI_SHIELD,
      description:
        'Focus your Qi to form a protective shroud around your body, protecting you and decreasing the damage that you take. Each use of this ability requires 10 Qi.',
      ticksRequired: 5,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'intelligence',
      qiCost: 10,
      statusEffect: {
        name: QI_SHIELD,
        description: 'A shield of concentrated qi that reduces damage taken.',
        ticksLeft: 5,
        power: 1,
      },
    });
  }

  addFireShield() {
    if (this.techniques.find(technique => technique.name === FIRE_SHIELD)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: FIRE_SHIELD,
      description:
        'Bring forth your inner fire to form a blistering barrier around you. Each use of this ability requires 10,000 Qi.',
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'fireLore',
      qiCost: 10000,
      statusEffect: {
        name: FIRE_SHIELD,
        description: 'A blazing shield tha harms your enemies.',
        ticksLeft: 10,
        power: 1,
      },
    });
  }

  addIceShield() {
    if (this.techniques.find(technique => technique.name === ICE_SHIELD)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: ICE_SHIELD,
      description:
        "Bring forth the ice inside you to form a freezing barrier around you that will stop your enemy's next attack. Each use of this ability requires 10,000 Qi.",
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'waterLore',
      qiCost: 10000,
      statusEffect: {
        name: ICE_SHIELD,
        description: 'A frozen shield that will negate damage from the next enemy attack.',
        ticksLeft: 10,
        power: 1,
      },
    });
  }

  private handleEnemyTechniques() {
    for (const enemy of this.enemies) {
      let slowingEffect = undefined;
      if (enemy.statusEffects) {
        for (let i = enemy.statusEffects.length - 1; i >= 0; i--) {
          if (enemy.statusEffects[i].ticksLeft <= 0) {
            enemy.statusEffects.splice(i, 1);
          } else if (enemy.statusEffects[i].name === EFFECT_POISON) {
            enemy.health -= enemy.health * 0.01;
          } else if (enemy.statusEffects[i].name === EFFECT_SLOW) {
            slowingEffect = enemy.statusEffects[i];
          }
          enemy.statusEffects[i].ticksLeft--;
        }
      }
      for (const technique of enemy.techniques) {
        if (technique.ticks === technique.ticksRequired) {
          this.enemyAttack(technique, enemy);
          technique.ticks = 0;
        } else {
          if (slowingEffect) {
            slowingEffect.ticksLeft -= 2;
          } else {
            technique.ticks++;
          }
        }
      }
    }
  }

  private enemyAttack(technique: Technique, enemy: Enemy) {
    if (this.skipEnemyAttack > 0) {
      this.skipEnemyAttack--;
      return;
    }
    let damage = technique.baseDamage;
    // Yin/Yang factor
    damage -= damage * (this.characterService.yinYangBalance / 2);

    let damageBack = false;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      if (this.statusEffects[i].name === QI_SHIELD) {
        damage /= 2;
      } else if (this.statusEffects[i].name === EFFECT_SHIELDING) {
        damage /= 2;
      } else if (this.statusEffects[i].name === FIRE_SHIELD) {
        let fireDivisor = Math.log(this.characterService.attributes.fireLore.value) / Math.log(100);
        if (fireDivisor < 1) {
          fireDivisor = 1;
        }
        if (fireDivisor > 10) {
          fireDivisor = 10;
        }
        damage /= fireDivisor;
        this.characterService.status.qi.value -= 10000;
        damageBack = true;
      } else if (this.statusEffects[i].name === ICE_SHIELD) {
        damage = 0;
        this.statusEffects.splice(i, 1);
      } else if (this.statusEffects[i].name === EFFECT_CORRUPTION) {
        damage *= 10;
      }
    }

    let defense = this.characterService.defense;

    if (this.activeFormation === 'defense') {
      const formationPowerString = this.formationPower + '';
      defense *= Math.ceil(formationPowerString.length / 2);
    }

    // TODO: tune this
    // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
    if (defense >= 1) {
      damage = damage / (Math.pow(defense, 0.5) + Math.pow(1000000, (-damage + defense) / defense));
    }
    const enemyName = this.titleCasePipe.transform(enemy.name);
    if (damage > 0) {
      this.logService.injury(
        LogTopic.COMBAT,
        'Ow! ' + enemyName + ' hit you for ' + this.bigNumberPipe.transform(damage) + ' damage'
      );
      this.characterService.increaseAttribute('toughness', 0.01);
      if (damageBack) {
        this.damageEnemy(damage, 'Your shield strikes back! ' + enemyName + ' receives ' + damage + ' damage.');
      }
    }
    if (damage > this.highestDamageTaken) {
      this.highestDamageTaken = damage;
    }
    this.characterService.status.health.value -= damage;
    if (technique.effect) {
      if (technique.effect === 'feeder' && this.hellService) {
        if (technique.hitTracker !== undefined && technique.hitTracker < 2) {
          technique.hitTracker++;
        } else {
          // force feed on third hit
          this.hellService.daysFasted = 0;
          const damage = this.characterService.status.health.value / 4;
          this.logService.injury(
            LogTopic.COMBAT,
            'The hellfire burns as it goes down, damaging you for ' + damage + ' extra damage.'
          );
          this.characterService.status.health.value -= damage;
        }
      } else if (technique.effect === 'theft') {
        this.characterService.updateMoney(0 - this.characterService.money / 10);
      } else if (technique.effect === EFFECT_LIFE) {
        enemy.health += damage * 0.1;
      }
    }

    if (this.activeFormation === 'survival' && this.characterService.status.health.value <= 0) {
      this.activeFormation = '';
      this.formationDuration = 0;
      this.formationPower = 0;
      this.characterService.status.health.value = 1;
    }
  }

  private handleYourTechniques() {
    if (this.enemies.length <= 0) {
      return;
    }
    let hasteTicks = 0;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      this.statusEffects[i].ticksLeft--;
      if (this.statusEffects[i].ticksLeft <= 0) {
        this.statusEffects.splice(i, 1);
      } else if (this.statusEffects[i].name === EFFECT_HASTE) {
        hasteTicks = this.statusEffects[i].power;
      }
    }

    let familyTechniquesCounter = 0;
    for (const technique of this.techniques) {
      if (technique.familyTechnique) {
        familyTechniquesCounter++;
      }
      if (technique.unlocked && !technique.disabled) {
        if (technique.ticks === technique.ticksRequired) {
          if (technique.familyTechnique) {
            technique.baseDamage++;
          }
          this.youAttack(technique);
          if (this.activeFormation === 'stealth') {
            this.activeFormation = '';
            this.formationDuration = 0;
          }
          if (this.enemies.length === 0) {
            // killed the last enemey in this encounter, reset all technique counters
            for (const cleartechnique of this.techniques) {
              cleartechnique.ticks = 0;
            }
            this.statusEffects = [];
            return;
          }
          technique.ticks = 0;
        } else {
          technique.ticks += 1 + hasteTicks;
        }
      }
    }
    if (familyTechniquesCounter < this.maxFamilyTechniques) {
      this.techniqueDevelopmentCounter++;
    }
  }

  private youAttack(technique: Technique) {
    if (!this.currentEnemy) {
      return;
    }
    if (technique.disabled) {
      return;
    }
    if (technique.qiCost) {
      if (this.characterService.status.qi.value < technique.qiCost) {
        return;
      }
      this.characterService.status.qi.value -= technique.qiCost;
    }
    if (technique.staminaCost) {
      if (this.characterService.status.stamina.value < technique.staminaCost) {
        return;
      }
      this.characterService.status.stamina.value -= technique.staminaCost;
    }
    if (technique.healthCost) {
      if (this.characterService.status.health.value <= technique.healthCost) {
        return;
      }
      this.characterService.status.health.value -= technique.healthCost;
    }
    if (technique.statusEffect) {
      this.statusEffects.push({
        name: technique.statusEffect.name,
        description: technique.statusEffect.description,
        ticksLeft: technique.statusEffect.ticksLeft,
        power: technique.statusEffect.power,
      });
    }

    if (this.currentEnemy && this.characterService.status.health.value > 0) {
      let attackPower = this.characterService.attackPower['strength'] || 1;
      if (technique.attribute) {
        if (this.lores.includes(technique.attribute)) {
          attackPower += (this.characterService.attackPower[technique.attribute] || 1) * 100;
        } else {
          attackPower = this.characterService.attackPower[technique.attribute] || 1;
        }
      }
      let effect = technique.effect;
      if (technique.name === RIGHT_HAND_TECHNIQUE) {
        effect = this.characterService.equipment.rightHand?.effect;
        if (this.characterService.equipment.rightHand) {
          attackPower =
            Math.floor(
              attackPower * Math.sqrt(this.characterService.equipment.rightHand.weaponStats?.baseDamage || 1)
            ) || 1;
        }
      } else if (technique.name === LEFT_HAND_TECHNIQUE) {
        effect = this.characterService.equipment.leftHand?.effect;
        if (this.characterService.equipment.leftHand) {
          attackPower =
            Math.floor(
              attackPower * Math.sqrt(this.characterService.equipment.leftHand.weaponStats?.baseDamage || 1)
            ) || 1;
        }
      }

      let damage = attackPower * technique.baseDamage;
      let defense = this.currentEnemy.defense;
      if (this.characterService.status.nutrition.value > this.characterService.status.nutrition.max * 0.8) {
        // tummy is mostly full, hit harder
        damage *= 1.2;
      }

      if (technique.extraMultiplier) {
        damage *= technique.extraMultiplier;
      }

      // TODO: tune all of this
      // apply effects
      if (effect === EFFECT_CORRUPTION) {
        damage *= 10;
        const corruptionEffect: StatusEffect = {
          name: EFFECT_CORRUPTION,
          description: 'Your corruption has left you vulnerable.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === EFFECT_CORRUPTION);
        if (statusEffect) {
          statusEffect.ticksLeft += corruptionEffect.ticksLeft;
        } else {
          this.statusEffects.push(corruptionEffect);
        }
      } else if (effect === EFFECT_LIFE) {
        const healAmount = damage * 0.01;
        this.logService.log(LogTopic.COMBAT, 'Your attack healed you for ' + healAmount + ' as you struck the enemy.');
        this.characterService.status.health.value += healAmount; // TODO: tune this
        this.characterService.checkOverage();
      } else if (effect === ELEMENT_EFFECT_FIRE) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'metal' || this.currentEnemy.element === 'wood') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'earth') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === ELEMENT_EFFECT_WOOD) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'earth') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'metal' || this.currentEnemy.element === 'fire') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === ELEMENT_EFFECT_WATER) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'fire' || this.currentEnemy.element === 'metal') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'earth') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === ELEMENT_EFFECT_METAL) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'earth') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'fire' || this.currentEnemy.element === 'water') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === ELEMENT_EFFECT_EARTH) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'fire') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'metal') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === EFFECT_POISON) {
        const statusEffect: StatusEffect = {
          name: EFFECT_POISON,
          description: "Poison is sapping away at this creature's health.",
          ticksLeft: 10,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const poisonEffect = this.currentEnemy.statusEffects.find(e => e.name === EFFECT_POISON);
          if (poisonEffect) {
            poisonEffect.ticksLeft += statusEffect.ticksLeft;
          } else {
            this.currentEnemy.statusEffects.push(statusEffect);
          }
        } else {
          this.currentEnemy.statusEffects = [statusEffect];
        }
      } else if (effect === EFFECT_DOOM) {
        const statusEffect: StatusEffect = {
          name: EFFECT_DOOM,
          description: 'Doom is coming for this creature.',
          ticksLeft: 1000,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const doomEffect = this.currentEnemy.statusEffects.find(e => e.name === EFFECT_DOOM);
          if (doomEffect) {
            doomEffect.power += doomEffect.power;
            if (doomEffect.power > 3) {
              damage *= doomEffect.power;
            }
          } else {
            this.currentEnemy.statusEffects.push(statusEffect);
          }
        } else {
          this.currentEnemy.statusEffects = [statusEffect];
        }
      } else if (effect === EFFECT_EXPLOSIVE) {
        damage *= 1000;
        this.characterService.status.health.value -= damage;
        // destroy the weapon
        if (technique.name === RIGHT_HAND_TECHNIQUE) {
          this.characterService.equipment.rightHand = null;
        } else if (technique.name === LEFT_HAND_TECHNIQUE) {
          this.characterService.equipment.leftHand = null;
        }
      } else if (effect === EFFECT_SHIELDING) {
        const shieldingEffect: StatusEffect = {
          name: EFFECT_SHIELDING,
          description: 'Your shielding technique is protecting you.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === EFFECT_CORRUPTION);
        if (statusEffect) {
          statusEffect.ticksLeft += shieldingEffect.ticksLeft;
        } else {
          this.statusEffects.push(shieldingEffect);
        }
      } else if (effect === EFFECT_PIERCING) {
        defense *= 0.5;
      } else if (effect === EFFECT_HASTE) {
        const hasteEffect: StatusEffect = {
          name: EFFECT_HASTE,
          description: 'Your attacks strike more quickly, with less time between them.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === EFFECT_HASTE);
        if (statusEffect) {
          statusEffect.ticksLeft += hasteEffect.ticksLeft;
        } else {
          this.statusEffects.push(hasteEffect);
        }
      } else if (effect === EFFECT_SLOW) {
        const statusEffect: StatusEffect = {
          name: EFFECT_SLOW,
          description: 'Doom is coming for this creature.',
          ticksLeft: 1000,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const slowingEffect = this.currentEnemy.statusEffects.find(e => e.name === EFFECT_SLOW);
          if (slowingEffect) {
            slowingEffect.ticksLeft += statusEffect.ticksLeft;
          } else {
            this.currentEnemy.statusEffects.push(statusEffect);
          }
        } else {
          this.currentEnemy.statusEffects = [statusEffect];
        }
      }

      if (this.activeFormation === 'power') {
        const formationPowerString = this.formationPower + '';
        damage *= Math.ceil(formationPowerString.length / 2);
      }

      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      let blowthrough = false;
      if (technique.name === METAL_FIST_ATTACK) {
        // TODO: tune this
        let metalMultiplier = Math.log(this.characterService.attributes.metalLore.value) / Math.log(50);
        if (metalMultiplier < 1) {
          metalMultiplier = 1;
        }
        if (metalMultiplier > 100) {
          metalMultiplier = 100;
        }
        damage *= metalMultiplier;
      }
      if (technique.name === PYROCLASM_ATTACK) {
        // TODO: tune this
        let fireMultiplier = Math.log(this.characterService.attributes.fireLore.value) / Math.log(100);
        if (fireMultiplier < 1) {
          fireMultiplier = 1;
        }
        if (fireMultiplier > 10) {
          fireMultiplier = 10;
        }
        damage *= fireMultiplier;
        blowthrough = true;
      }
      damage += damage * this.characterService.yinYangBalance;

      if (damage > this.highestDamageDealt) {
        this.highestDamageDealt = damage;
      }
      if (technique.attribute) {
        this.characterService.increaseAttribute(technique.attribute, 0.01);
      }

      let overage = this.damageEnemy(damage);
      if (blowthrough) {
        while (overage > 0 && this.enemies.length > 0) {
          // keep using extra damage until it's gone or the enemies are
          this.currentEnemy = this.enemies[0];
          overage = this.damageEnemy(overage);
        }
      }
    }
  }

  private damageEnemy(damage: number, customMessage = ''): number {
    if (!this.currentEnemy) {
      return 0;
    }
    const enemyHealth = this.currentEnemy.health;
    this.currentEnemy.health = Math.floor(this.currentEnemy.health - damage);
    if (customMessage === '') {
      customMessage =
        'You attack ' +
        this.titleCasePipe.transform(this.currentEnemy.name) +
        ' for ' +
        this.bigNumberPipe.transform(damage) +
        ' damage';
    }
    damage -= enemyHealth;
    if (this.currentEnemy.health <= 0) {
      this.killCurrentEnemy();
      return (damage - enemyHealth) / 2; // return half the damage left over
    } else {
      this.logService.log(LogTopic.COMBAT, customMessage);
      return 0;
    }
  }

  private killCurrentEnemy() {
    if (!this.currentEnemy) {
      return;
    }
    this.kills++;
    this.totalKills++;
    this.killsByLocation[this.locationService!.troubleTarget] =
      (this.killsByLocation[this.locationService!.troubleTarget] || 0) + 1;
    this.logService.log(LogTopic.COMBAT, 'You manage to kill ' + this.titleCasePipe.transform(this.currentEnemy.name));
    if (this.currentEnemy.name === 'Death itself') {
      this.characterService.toast('HURRAY! Check your inventory. You just got something special!', 0);
    }
    for (const item of this.currentEnemy.loot) {
      const lootItem = this.itemRepoService.getItemById(item.id);
      let quantity = 1;
      if (this.activeFormation === 'greed') {
        const formationPowerString = this.formationPower + '';
        quantity += Math.ceil(formationPowerString.length / 3);
      }
      if (lootItem) {
        this.inventoryService.addItem(lootItem, quantity);
      } else {
        // the item was generated, not part of the repo, so just add it instead of using the lookup
        this.inventoryService.addItem(item, quantity);
      }
    }
    this.defeatEffect(this.currentEnemy);
    const index = this.enemies.indexOf(this.currentEnemy);
    this.enemies.splice(index, 1);
    this.currentEnemy = null;
    if (this.enemies.length === 0) {
      for (const itemStack of this.characterService.itemPouches) {
        if (itemStack.item) {
          itemStack.item.cooldown = 0;
        }
      }
    }
  }

  fight(enemy: Enemy) {
    this.currentEnemy = enemy;
  }

  addEnemy(enemy: Enemy) {
    this.totalEnemies++;
    this.logService.log(LogTopic.COMBAT, 'A new enemy comes to battle: ' + this.titleCasePipe.transform(enemy.name));

    // check to see if we already have an enemy with the same name
    let highestIndex = 0;
    for (const e of this.enemies) {
      if (e.baseName === enemy.baseName) {
        if (e.index !== undefined && e.index >= highestIndex) {
          highestIndex = e.index + 1;
        }
      }
    }

    if (highestIndex > 0) {
      enemy.name = enemy.name + ' #' + (highestIndex + 1);
    }
    enemy.index = highestIndex;

    this.enemies.push(enemy);
    if (this.currentEnemy === null) {
      this.currentEnemy = this.enemies[0];
    }
  }

  clearEnemies() {
    this.enemies = [];
    this.currentEnemy = null;
    for (const technique of this.techniques) {
      technique.ticks = 0;
    }
  }

  flee() {
    this.handleEnemyTechniques();
    this.handleEnemyTechniques();
    this.handleEnemyTechniques();
    this.clearEnemies();
  }

  // generate a monster based on current trouble location and lifetime kills
  trouble() {
    if (this.enemies.length !== 0) {
      return;
    }
    if (this.hellService && this.hellService.inHell) {
      // let hellService handle the trouble while we're in hell
      this.hellService.trouble();
      return;
    }

    if (!this.locationService) {
      // location service not injected yet, bail out
      return;
    }

    const targetLocation = this.locationService.troubleTarget;
    /*
    if (this.godSlayersEnabled) {
      const index = this.godSlayerKills % this.monsterTypes.length;
      const rank = Math.floor(this.godSlayerKills / this.monsterTypes.length);
      monsterType = this.monsterTypes[index];
      monsterName = 'Godslaying ' + monsterType;

      if (rank > 0) {
        monsterName += ' ' + (rank + 1);
      }

      attack = Math.round(Math.pow(1.1, this.godSlayerKills));
      defense = attack * 10;
      health = attack * 200;
      gem = this.inventoryService.generateSpiritGem(Math.ceil(this.godSlayerKills / 20));
      this.godSlayerKills++;
    }
     */
    const possibleMonsters = this.monsterTypes.filter(monsterType => targetLocation === monsterType.location);

    const monsterType = possibleMonsters[(this.killsByLocation[targetLocation] || 0) % possibleMonsters.length];

    const killsToNextQualityRank = ((monsterType.basePower + '').length + 3) * 5;
    const modifier = ((this.killsByLocation[targetLocation] || 0) + 1) / killsToNextQualityRank;

    let qualityIndex = Math.floor(modifier);
    if (qualityIndex >= this.monsterQualities.length) {
      qualityIndex = this.monsterQualities.length - 1;
    }
    const modifiedBasePower = monsterType.basePower * modifier;

    const monsterName = this.monsterQualities[qualityIndex] + ' ' + monsterType.name;
    const health = modifiedBasePower * modifiedBasePower * 10;
    const attack = modifiedBasePower / 5;
    const defense = modifiedBasePower / 10;
    const loot: Item[] = [];
    if (monsterType.lootType) {
      const grade = Math.floor(Math.log2(modifiedBasePower + 2));
      if (monsterType.lootType.includes(LOOT_TYPE_GEM)) {
        loot.push(this.inventoryService.generateSpiritGem(grade, monsterType.element));
      }
      if (monsterType.lootType.includes(LOOT_TYPE_HIDE)) {
        loot.push(this.inventoryService.getHide(grade));
      }
      if (monsterType.lootType.includes(LOOT_TYPE_ORE)) {
        loot.push(this.inventoryService.getOre(grade));
      }
      if (monsterType.lootType.includes(LOOT_TYPE_FRUIT)) {
        loot.push(this.itemRepoService.items['pear']);
      }
      if (monsterType.lootType.includes(LOOT_TYPE_MEAT)) {
        loot.push(this.inventoryService.getWildMeat(grade));
      }
      if (monsterType.lootType.includes(LOOT_TYPE_MONEY)) {
        loot.push(this.inventoryService.getCoinPurse(Math.floor(modifiedBasePower)));
      }
    }

    const techniques: Technique[] = [];
    if (monsterType.techniques) {
      for (const templateTechnique of monsterType.techniques) {
        techniques.push({
          name: templateTechnique.name,
          ticks: templateTechnique.ticks,
          ticksRequired: templateTechnique.ticksRequired,
          baseDamage: attack * templateTechnique.baseDamage,
          unlocked: templateTechnique.unlocked,
        });
      }
    } else {
      techniques.push({
        name: 'Attack',
        ticks: 0,
        ticksRequired: 10,
        baseDamage: attack,
        unlocked: true,
      });
    }

    this.addEnemy({
      name: monsterName,
      baseName: monsterType.name,
      health: health,
      maxHealth: health,
      defense: defense,
      loot: loot,
      techniques: techniques,
    });
  }

  private addMouse() {
    this.addEnemy({
      name: 'a gang of nasty mice',
      baseName: 'mouse',
      health: 8,
      maxHealth: 8,
      defense: 0,
      loot: [],
      techniques: [
        {
          name: 'Gnawing Swarm',
          ticks: 0,
          ticksRequired: 8,
          baseDamage: 13,
          unlocked: true,
        },
      ],
    });
  }

  private addRuffian() {
    this.addEnemy({
      name: 'a ruffian',
      baseName: 'ruffian',
      health: 20,
      maxHealth: 20,
      defense: 0,
      loot: [],
      techniques: [
        {
          name: 'Mugging',
          ticks: 0,
          ticksRequired: 20,
          baseDamage: 1,
          effect: 'theft',
          unlocked: true,
        },
      ],
    });
  }

  private addWolf() {
    this.addEnemy({
      name: 'a hungry wolf',
      baseName: 'wolf',
      health: 20,
      maxHealth: 20,
      defense: 5,
      loot: [this.inventoryService.getHide()],
      techniques: [
        {
          name: 'Attack',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 3,
          unlocked: true,
        },
      ],
    });
  }

  addArmy() {
    this.addEnemy({
      name: 'an angry army',
      baseName: 'army',
      health: 2e11,
      maxHealth: 2e11,
      defense: 1e7,
      loot: [],
      techniques: [
        {
          name: 'Attack',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 1e7,
          unlocked: true,
        },
      ],
    });
  }

  addDeath() {
    this.addEnemy({
      name: 'Death itself',
      baseName: 'death',
      health: 1e24,
      maxHealth: 1e24,
      defense: 3e8,
      loot: [this.itemRepoService.items['immortality']],
      unique: true,
      techniques: [
        {
          name: 'Attack',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 3e8,
          unlocked: true,
        },
      ],
    });
  }

  private defeatEffect(enemy: Enemy) {
    if (!enemy.defeatEffect) {
      return;
    }
    if (enemy.defeatEffect === 'respawnDouble') {
      // add two more of the same enemy
      this.logService.log(
        LogTopic.COMBAT,
        'They just keep coming! Two more ' + this.titleCasePipe.transform(enemy.name) + ' appear!'
      );
      this.addEnemy({
        name: enemy.name,
        baseName: enemy.baseName,
        health: enemy.maxHealth,
        maxHealth: enemy.maxHealth,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot,
        techniques: enemy.techniques,
      });
      this.addEnemy({
        name: enemy.name,
        baseName: enemy.baseName,
        health: enemy.maxHealth,
        maxHealth: enemy.maxHealth,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot,
        techniques: enemy.techniques,
      });
    }
  }

  private monsterTypes: EnemyTypes[] = [
    {
      name: 'spider',
      description: '',
      location: LocationType.SmallTown,
      basePower: 1,
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Sting',
          ticks: 0,
          ticksRequired: 15,
          baseDamage: 1,
          unlocked: true,
        },
      ],
    },
    {
      name: 'rat',
      description: '',
      location: LocationType.SmallTown,
      basePower: 2,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
      techniques: [
        {
          name: 'Gnaw',
          ticks: 0,
          ticksRequired: 12,
          baseDamage: 1,
          unlocked: true,
        },
      ],
    },
    {
      name: 'scorpion',
      description: '',
      location: LocationType.Desert,
      basePower: 3,
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Sting',
          ticks: 0,
          ticksRequired: 20,
          baseDamage: 3,
          unlocked: true,
        },
        {
          name: 'Claw Snap',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.1,
          unlocked: true,
        },
      ],
    },
    {
      name: 'lizard',
      description: '',
      location: LocationType.Desert,
      basePower: 5,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'snake',
      description: '',
      location: LocationType.Desert,
      basePower: 8,
      element: 'fire',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'jack-o-lantern',
      description: '',
      location: LocationType.LargeCity,
      basePower: 10,
      element: 'fire',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'redcap',
      description: '',
      location: LocationType.SmallTown,
      basePower: 12,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Poke',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.2,
          unlocked: true,
        },
      ],
    },
    {
      name: 'gnome',
      description: '',
      location: LocationType.LargeCity,
      basePower: 15,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'gremlin',
      description: '',
      location: LocationType.SmallTown,
      basePower: 18,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'imp',
      description: '',
      location: LocationType.LargeCity,
      basePower: 20,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'ooze',
      description: '',
      location: LocationType.Forest,
      basePower: 30,
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Blorp',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Consume',
          ticks: 0,
          ticksRequired: 30,
          baseDamage: 2,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'jackalope',
      description: '',
      location: LocationType.Desert,
      basePower: 40,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'pixie',
      description: '',
      location: LocationType.Forest,
      basePower: 50,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_FRUIT],
    },
    {
      name: 'goblin',
      description: '',
      location: LocationType.Forest,
      basePower: 100,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'monkey',
      description: '',
      location: LocationType.Jungle,
      basePower: 100,
      element: 'metal',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_FRUIT],
    },
    {
      name: 'boar',
      description: '',
      location: LocationType.Forest,
      basePower: 200,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
      techniques: [
        {
          name: 'Charge',
          ticks: 0,
          ticksRequired: 60,
          baseDamage: 5,
          unlocked: true,
        },
      ],
    },
    {
      name: 'skeleton',
      description: '',
      location: LocationType.Mine,
      basePower: 300,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'zombie',
      description: '',
      location: LocationType.Dungeon,
      basePower: 400,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'kelpie',
      description: '',
      location: LocationType.SmallPond,
      basePower: 500,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'bunyip',
      description: '',
      location: LocationType.SmallPond,
      basePower: 600,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'hobgoblin',
      description: '',
      location: LocationType.LargeCity,
      basePower: 700,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'kobold',
      description: '',
      location: LocationType.Mine,
      basePower: 800,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'chupacabra',
      description: '',
      location: LocationType.Desert,
      basePower: 900,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'siren',
      description: '',
      location: LocationType.SmallPond,
      basePower: 1000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Drowning Call',
          ticks: 0,
          ticksRequired: 100,
          baseDamage: 100,
          unlocked: true,
        },
      ],
    },
    {
      name: 'crocodile',
      description: '',
      location: LocationType.SmallPond,
      basePower: 1200,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'golem',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1300,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_ORE],
      techniques: [
        {
          name: 'Stomp',
          ticks: 0,
          ticksRequired: 20,
          baseDamage: 3,
          unlocked: true,
        },
      ],
    },
    {
      name: 'incubus',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1400,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'succubus',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1500,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Seduction',
          ticks: 0,
          ticksRequired: 50,
          baseDamage: 10,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'jackal',
      description: '',
      location: LocationType.Desert,
      basePower: 1800,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'boogeyman',
      description: '',
      location: LocationType.LargeCity,
      basePower: 2000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'basilisk',
      description: '',
      location: LocationType.Desert,
      basePower: 2100,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'mogwai',
      description: '',
      location: LocationType.LargeCity,
      basePower: 2500,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'ghoul',
      description: '',
      location: LocationType.Dungeon,
      basePower: 3000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Claw',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Devour',
          ticks: 0,
          ticksRequired: 30,
          baseDamage: 2,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'orc',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'tiger',
      description: '',
      location: LocationType.Jungle,
      basePower: 4000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'hippo',
      description: '',
      location: LocationType.SmallPond,
      basePower: 5000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'rakshasa',
      description: '',
      location: LocationType.LargeCity,
      basePower: 6000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MONEY],
    },
    {
      name: 'ghost',
      description: '',
      location: LocationType.Dungeon,
      basePower: 5000,
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Haunt',
          ticks: 0,
          ticksRequired: 2,
          baseDamage: 0.1,
          unlocked: true,
        },
        {
          name: 'Shriek',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 1.2,
          unlocked: true,
        },
      ],
    },
    {
      name: 'centaur',
      description: '',
      location: LocationType.Forest,
      basePower: 8000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'hellhound',
      description: '',
      location: LocationType.Desert,
      basePower: 9000,
      element: 'fire',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'troll',
      description: '',
      location: LocationType.Dungeon,
      basePower: 10000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Club Swipe',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Regrowth Bite',
          ticks: 0,
          ticksRequired: 30,
          baseDamage: 2,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'werewolf',
      description: '',
      location: LocationType.Forest,
      basePower: 11000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'ogre',
      description: '',
      location: LocationType.Dungeon,
      basePower: 12000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Smash',
          ticks: 0,
          ticksRequired: 15,
          baseDamage: 0.8,
          unlocked: true,
        },
      ],
    },
    {
      name: 'manticore',
      description: '',
      location: LocationType.Forest,
      basePower: 15000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'minotaur',
      description: '',
      location: LocationType.Dungeon,
      basePower: 18000,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MONEY],
    },
    {
      name: 'merlion',
      description: '',
      location: LocationType.Beach,
      basePower: 20000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'mummy',
      description: '',
      location: LocationType.Desert,
      basePower: 30000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'landshark',
      description: '',
      location: LocationType.Beach,
      basePower: 40000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'bugbear',
      description: '',
      location: LocationType.Forest,
      basePower: 50000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'cavebear',
      description: '',
      location: LocationType.MountainTops,
      basePower: 70000,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'yeti',
      description: '',
      location: LocationType.MountainTops,
      basePower: 80000,
      element: 'metal',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'dreameater',
      description: '',
      location: LocationType.Dungeon,
      basePower: 100000,
      lootType: [LOOT_TYPE_GEM],
      techniques: [
        {
          name: 'Nightmare',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
      ],
    },
    {
      name: 'unicorn',
      description: '',
      location: LocationType.Forest,
      basePower: 120000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'banshee',
      description: '',
      location: LocationType.Dungeon,
      basePower: 140000,
      lootType: [LOOT_TYPE_GEM],
    },
    {
      name: 'harpy',
      description: '',
      location: LocationType.MountainTops,
      basePower: 150000,
      lootType: [LOOT_TYPE_GEM],
    },
    {
      name: 'phoenix',
      description: '',
      location: LocationType.Desert,
      basePower: 180000,
      element: 'fire',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'sphinx',
      description: '',
      location: LocationType.Desert,
      basePower: 200000,
      element: 'fire',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_ORE],
    },
    {
      name: 'oni',
      description: '',
      location: LocationType.Dungeon,
      basePower: 300000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'leshy',
      description: '',
      location: LocationType.Forest,
      basePower: 300000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'chimaera',
      description: '',
      location: LocationType.Dungeon,
      basePower: 400000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'undine',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Splash',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Drown',
          ticks: 0,
          ticksRequired: 600,
          baseDamage: 1000,
          unlocked: true,
        },
      ],
    },
    {
      name: 'cyclops',
      description: '',
      location: LocationType.MountainTops,
      basePower: 600000,
      element: 'metal',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Clobber',
          ticks: 0,
          ticksRequired: 20,
          baseDamage: 2,
          unlocked: true,
        },
      ],
    },
    {
      name: 'nyuk',
      description: '',
      location: LocationType.Dungeon,
      basePower: 700000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
    },
    {
      name: 'wendigo',
      description: '',
      location: LocationType.Forest,
      basePower: 800000,
      element: 'wood',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'behemoth',
      description: '',
      location: LocationType.Desert,
      basePower: 800000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'dinosaur',
      description: '',
      location: LocationType.Jungle,
      basePower: 1000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'wyvern',
      description: '',
      location: LocationType.MountainTops,
      basePower: 2000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'doomworm',
      description: '',
      location: LocationType.Desert,
      basePower: 3000000,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT, LOOT_TYPE_ORE],
      techniques: [
        {
          name: 'Swallow',
          ticks: 0,
          ticksRequired: 200,
          baseDamage: 1000,
          unlocked: true,
        },
      ],
    },
    {
      name: 'lich',
      description: '',
      location: LocationType.Dungeon,
      basePower: 5000000,
      element: 'metal',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Magic Missile',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Fireball',
          ticks: 0,
          ticksRequired: 40,
          baseDamage: 8,
          unlocked: true,
        },
        {
          name: 'Lifesteal',
          ticks: 0,
          ticksRequired: 40,
          baseDamage: 8,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'thunderbird',
      description: '',
      location: LocationType.MountainTops,
      basePower: 8000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
      techniques: [
        {
          name: 'Zap',
          ticks: 0,
          ticksRequired: 6,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Thunderbolt',
          ticks: 0,
          ticksRequired: 40,
          baseDamage: 8,
          unlocked: true,
        },
      ],
    },
    {
      name: 'vampire',
      description: '',
      location: LocationType.Dungeon,
      basePower: 10000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Blood Drain',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 0.2,
          effect: EFFECT_LIFE,
          unlocked: true,
        },
      ],
    },
    {
      name: 'beholder',
      description: '',
      location: LocationType.Dungeon,
      basePower: 15000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Gaze',
          ticks: 0,
          ticksRequired: 4,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Magic Blast',
          ticks: 0,
          ticksRequired: 25,
          baseDamage: 3,
          unlocked: true,
        },
      ],
    },
    {
      name: 'hydra',
      description: '',
      location: LocationType.DeepSea,
      basePower: 20000000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
      techniques: [
        {
          name: 'Chomp!',
          ticks: 0,
          ticksRequired: 3,
          baseDamage: 1,
          unlocked: true,
        },
      ],
    },
    {
      name: 'roc',
      description: '',
      location: LocationType.MountainTops,
      basePower: 40000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
    },
    {
      name: 'wyrm',
      description: '',
      location: LocationType.MountainTops,
      basePower: 50000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
    },
    {
      name: 'giant',
      description: '',
      location: LocationType.MountainTops,
      basePower: 60000000,
      element: 'earth',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Stomp',
          ticks: 0,
          ticksRequired: 50,
          baseDamage: 10,
          unlocked: true,
        },
      ],
    },
    {
      name: 'kraken',
      description: '',
      location: LocationType.DeepSea,
      basePower: 80000000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE],
      techniques: [
        {
          name: 'Strangulation',
          ticks: 0,
          ticksRequired: 2,
          baseDamage: 0.1,
          unlocked: true,
        },
        {
          name: 'Tentacle Lash',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: 1,
          unlocked: true,
        },
      ],
    },
    {
      name: 'pazuzu',
      description: '',
      location: LocationType.MountainTops,
      basePower: 100000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MONEY],
      techniques: [
        {
          name: 'Swift Strike',
          ticks: 0,
          ticksRequired: 5,
          baseDamage: 0.5,
          unlocked: true,
        },
      ],
    },
    {
      name: 'titan',
      description: '',
      location: LocationType.MountainTops,
      basePower: 200000000,
      element: 'metal',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_MONEY, LOOT_TYPE_ORE],
      techniques: [
        {
          name: 'Gigastomp',
          ticks: 0,
          ticksRequired: 100,
          baseDamage: 100,
          unlocked: true,
        },
      ],
    },
    {
      name: 'leviathan',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000000,
      element: 'water',
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
      techniques: [
        {
          name: 'Wave Slap',
          ticks: 0,
          ticksRequired: 8,
          baseDamage: 1,
          unlocked: true,
        },
        {
          name: 'Tsunami',
          ticks: 0,
          ticksRequired: 1000,
          baseDamage: 100,
          unlocked: true,
        },
      ],
    },
    {
      name: 'stormbringer',
      description: '',
      location: LocationType.MountainTops,
      basePower: 1000000000,
      lootType: [LOOT_TYPE_GEM, LOOT_TYPE_HIDE, LOOT_TYPE_MEAT],
      techniques: [
        {
          name: 'Storm Strike',
          ticks: 0,
          ticksRequired: 5,
          baseDamage: 0.5,
          unlocked: true,
        },
        {
          name: 'Hurrican Force',
          ticks: 0,
          ticksRequired: 100,
          baseDamage: 10,
          unlocked: true,
        },
      ],
    },
  ];

  private monsterQualities = [
    'an infant',
    'a puny',
    'a tiny',
    'a pathetic',
    'a sickly',
    'a starving',
    'a wimpy',
    'a frail',
    'an ill',
    'a weak',
    'a badly wounded',
    'a tired',
    'a poor',
    'a small',
    'a despondent',
    'a frightened',
    'a skinny',
    'a sad',
    'a stinking',
    'a scatterbrained',
    'a mediocre',
    'a typical',
    'an average',
    'a healthy',
    'a big',
    'a tough',
    'a crazy',
    'a strong',
    'a fearsome',
    'a gutsy',
    'a quick',
    'a hefty',
    'a grotesque',
    'a large',
    'a brawny',
    'an athletic',
    'a muscular',
    'a rugged',
    'a resilient',
    'an angry',
    'a clever',
    'a fierce',
    'a brutal',
    'a devious',
    'a mighty',
    'a frightening',
    'a massive',
    'a powerful',
    'a noble',
    'a magical',
    'a dangerous',
    'a murderous',
    'a terrifying',
    'a gargantuan',
    'a flame-shrouded',
    'an abominable',
    'a monstrous',
    'a dominating',
    'a demonic',
    'a diabolical',
    'an infernal',
  ];
}
