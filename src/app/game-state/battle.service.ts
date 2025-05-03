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
  troubleCounter: number;
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
  private troubleCounter = 0;
  battleMessageDismissed = false;
  private techniqueDevelopmentCounter = 0;
  maxFamilyTechniques = 0;
  statusEffects: StatusEffect[] = [];
  potionCooldown = 20;
  potionThreshold = 0.5;
  foodCooldown = 60;
  foodThresholdStatusType: StatusType = 'health';
  foodThreshold = 0.5;

  public rightHandTechniqueName = 'Right-Handed Weapon';
  public leftHandTechniqueName = 'Left-Handed Weapon';
  private qiAttackName = 'Qi Strike';
  private pyroclasmAttackName = 'Pyroclasm';
  private metalFistName = 'Metal Fist';
  private qiShieldName = 'Qi Shield';
  private fireShieldName = 'Fire Shield';
  private iceShieldName = 'Ice Shield';

  private fireElementEffectName = 'Fire Essence';
  private earthElementEffectName = 'Earth Essence';
  private metalElementEffectName = 'Metal Essence';
  private woodElementEffectName = 'Wood Essence';
  private waterElementEffectName = 'Water Essence';
  private corruptionEffectName = 'Corruption';
  private lifeEffectName = 'Life';
  private poisonEffectName = 'Poison';
  private doomEffectName = 'Doom';
  private explosiveEffectName = 'Explosions';
  private shieldingEffectName = 'Shielding';
  private piercingEffectName = 'Piercing';
  private hasteEffectName = 'Haste';
  private slowingEffectName = 'Slowing';
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
      name: this.rightHandTechniqueName,
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
      name: this.leftHandTechniqueName,
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
    mainLoopService: MainLoopService
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
        this.trouble();
      }
    });

    mainLoopService.battleTickSubject.subscribe(() => {
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
      this.handleEnemyTechniques();
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

  private reset() {
    this.clearEnemies();
    this.kills = 0;
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
      godSlayerKills: this.godSlayerKills,
      totalKills: this.totalKills,
      autoTroubleUnlocked: this.autoTroubleUnlocked,
      monthlyMonsterDay: this.yearlyMonsterDay,
      highestDamageDealt: this.highestDamageDealt,
      highestDamageTaken: this.highestDamageTaken,
      godSlayersUnlocked: this.godSlayersUnlocked,
      godSlayersEnabled: this.godSlayersEnabled,
      totalEnemies: this.totalEnemies,
      troubleCounter: this.troubleCounter,
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
    };
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.kills = properties.kills;
    this.godSlayerKills = properties.godSlayerKills;
    this.totalKills = properties.totalKills;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.yearlyMonsterDay = properties.monthlyMonsterDay;
    this.highestDamageDealt = properties.highestDamageDealt;
    this.highestDamageTaken = properties.highestDamageTaken;
    this.godSlayersUnlocked = properties.godSlayersUnlocked;
    this.godSlayersEnabled = properties.godSlayersEnabled;
    this.totalEnemies = properties.totalEnemies;
    this.troubleCounter = properties.troubleCounter;
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
      if ((itemStack.item.cooldown || 0) <= 0) {
        if (itemStack.item.type === 'potion') {
          const effect: StatusType = itemStack.item.effect as StatusType;
          if (
            this.characterService.status[effect].value <
            this.characterService.status[effect].max * this.potionThreshold
          ) {
            this.characterService.status[effect].value += itemStack.item.increaseAmount || 1;
            itemStack.quantity--;
            itemStack.item.cooldown = this.potionCooldown;
            itemUsed = true;
          }
        } else if (itemStack.item.type === 'food') {
          if (
            this.characterService.status[this.foodThresholdStatusType].value <
            this.characterService.status[this.foodThresholdStatusType].max * this.foodThreshold
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
      this.fireElementEffectName,
      this.earthElementEffectName,
      this.fireElementEffectName,
      this.earthElementEffectName,
      this.metalElementEffectName,
      this.woodElementEffectName,
      this.waterElementEffectName,
      this.poisonEffectName,
      this.doomEffectName,
      this.explosiveEffectName,
      this.shieldingEffectName,
      this.piercingEffectName,
      this.hasteEffectName,
      this.slowingEffectName,
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
    if (this.techniques.find(technique => technique.name === this.qiAttackName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.qiAttackName,
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
    if (this.techniques.find(technique => technique.name === this.pyroclasmAttackName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.pyroclasmAttackName,
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
    if (this.techniques.find(technique => technique.name === this.metalFistName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.metalFistName,
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
    if (this.techniques.find(technique => technique.name === this.qiShieldName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.qiShieldName,
      description:
        'Focus your Qi to form a protective shroud around your body, protecting you and decreasing the damage that you take. Each use of this ability requires 10 Qi.',
      ticksRequired: 5,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'intelligence',
      qiCost: 10,
      statusEffect: {
        name: this.qiShieldName,
        description: 'A shield of concentrated qi that reduces damage taken.',
        ticksLeft: 5,
        power: 1,
      },
    });
  }

  addFireShield() {
    if (this.techniques.find(technique => technique.name === this.fireShieldName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.fireShieldName,
      description:
        'Bring forth your inner fire to form a blistering barrier around you. Each use of this ability requires 10,000 Qi.',
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'fireLore',
      qiCost: 10000,
      statusEffect: {
        name: this.fireShieldName,
        description: 'A blazing shield tha harms your enemies.',
        ticksLeft: 10,
        power: 1,
      },
    });
  }

  addIceShield() {
    if (this.techniques.find(technique => technique.name === this.iceShieldName)) {
      // already added, bail out
      return;
    }
    this.techniques.push({
      name: this.iceShieldName,
      description:
        "Bring forth the ice inside you to form a freezing barrier around you that will stop your enemy's next attack. Each use of this ability requires 10,000 Qi.",
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 0,
      unlocked: true,
      attribute: 'waterLore',
      qiCost: 10000,
      statusEffect: {
        name: this.iceShieldName,
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
          } else if (enemy.statusEffects[i].name === this.poisonEffectName) {
            enemy.health -= enemy.health * 0.01;
          } else if (enemy.statusEffects[i].name === this.slowingEffectName) {
            slowingEffect = enemy.statusEffects[i];
          }
          enemy.statusEffects[i].ticksLeft--;
        }
      }
      for (const technique of enemy.techniques) {
        if (technique.ticks === technique.ticksRequired) {
          this.enemyAttack(technique);
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

  private enemyAttack(technique: Technique) {
    if (this.skipEnemyAttack > 0) {
      this.skipEnemyAttack--;
      return;
    }
    let damage = technique.baseDamage;
    // Yin/Yang factor
    damage -= damage * (this.characterService.yinYangBalance / 2);

    let damageBack = false;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      if (this.statusEffects[i].name === this.qiShieldName) {
        damage /= 2;
      } else if (this.statusEffects[i].name === this.shieldingEffectName) {
        damage /= 2;
      } else if (this.statusEffects[i].name === this.fireShieldName) {
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
      } else if (this.statusEffects[i].name === this.iceShieldName) {
        damage = 0;
        this.statusEffects.splice(i, 1);
      } else if (this.statusEffects[i].name === this.corruptionEffectName) {
        damage *= 10;
      }
    }

    const defense = this.characterService.defense;
    // TODO: tune this
    // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
    if (defense >= 1) {
      damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
    }

    if (damage > 0) {
      this.logService.injury(
        LogTopic.COMBAT,
        'Ow! You got hit for ' + this.bigNumberPipe.transform(damage) + ' damage'
      );
      this.characterService.increaseAttribute('toughness', 0.01);
      if (damageBack) {
        this.damageEnemy(damage, 'Your shield strikes back, damaging the enemy for ' + damage + ' damage.');
      }
    }
    if (damage > this.highestDamageTaken) {
      this.highestDamageTaken = damage;
    }
    this.characterService.status.health.value -= damage;
    this.attackEffect(technique);
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
      } else if (this.statusEffects[i].name === this.hasteEffectName) {
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
        attackPower = this.characterService.attackPower[technique.attribute] || 1;
      }
      let effect = technique.effect;
      if (technique.name === this.rightHandTechniqueName) {
        effect = this.characterService.equipment.rightHand?.effect;
        if (this.characterService.equipment.rightHand) {
          attackPower =
            Math.floor(
              attackPower * Math.sqrt(this.characterService.equipment.rightHand.weaponStats?.baseDamage || 1)
            ) || 1;
        }
      } else if (technique.name === this.leftHandTechniqueName) {
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
      if (effect === this.corruptionEffectName) {
        damage *= 10;
        const corruptionEffect: StatusEffect = {
          name: this.corruptionEffectName,
          description: 'Your corruption has left you vulnerable.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === this.corruptionEffectName);
        if (statusEffect) {
          statusEffect.ticksLeft += corruptionEffect.ticksLeft;
        } else {
          this.statusEffects.push(corruptionEffect);
        }
      } else if (effect === this.lifeEffectName) {
        const healAmount = damage * 0.01;
        this.logService.log(LogTopic.COMBAT, 'Your attack healed you for ' + healAmount + ' as you struck the enemy.');
        this.characterService.status.health.value += healAmount; // TODO: tune this
        this.characterService.checkOverage();
      } else if (effect === this.fireElementEffectName) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'metal' || this.currentEnemy.element === 'wood') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'earth') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === this.woodElementEffectName) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'earth') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'metal' || this.currentEnemy.element === 'fire') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === this.waterElementEffectName) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'fire' || this.currentEnemy.element === 'metal') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'earth') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === this.metalElementEffectName) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'earth') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'fire' || this.currentEnemy.element === 'water') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === this.earthElementEffectName) {
        if (this.currentEnemy.element) {
          if (this.currentEnemy.element === 'water' || this.currentEnemy.element === 'fire') {
            damage *= this.elementalFactor;
          } else if (this.currentEnemy.element === 'wood' || this.currentEnemy.element === 'metal') {
            damage /= this.elementalFactor;
          }
        }
      } else if (effect === this.poisonEffectName) {
        const statusEffect: StatusEffect = {
          name: this.poisonEffectName,
          description: "Poison is sapping away at this creature's health.",
          ticksLeft: 10,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const poisonEffect = this.currentEnemy.statusEffects.find(e => e.name === this.poisonEffectName);
          if (poisonEffect) {
            poisonEffect.ticksLeft += statusEffect.ticksLeft;
          } else {
            this.currentEnemy.statusEffects.push(statusEffect);
          }
        } else {
          this.currentEnemy.statusEffects = [statusEffect];
        }
      } else if (effect === this.doomEffectName) {
        const statusEffect: StatusEffect = {
          name: this.doomEffectName,
          description: 'Doom is coming for this creature.',
          ticksLeft: 1000,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const doomEffect = this.currentEnemy.statusEffects.find(e => e.name === this.doomEffectName);
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
      } else if (effect === this.explosiveEffectName) {
        damage *= 1000;
        this.characterService.status.health.value -= damage;
        // destroy the weapon
        if (technique.name === this.rightHandTechniqueName) {
          this.characterService.equipment.rightHand = null;
        } else if (technique.name === this.leftHandTechniqueName) {
          this.characterService.equipment.leftHand = null;
        }
      } else if (effect === this.shieldingEffectName) {
        const shieldingEffect: StatusEffect = {
          name: this.shieldingEffectName,
          description: 'Your shielding technique is protecting you.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === this.corruptionEffectName);
        if (statusEffect) {
          statusEffect.ticksLeft += shieldingEffect.ticksLeft;
        } else {
          this.statusEffects.push(shieldingEffect);
        }
      } else if (effect === this.piercingEffectName) {
        defense *= 0.5;
      } else if (effect === this.hasteEffectName) {
        const hasteEffect: StatusEffect = {
          name: this.shieldingEffectName,
          description: 'Your attacks strike more quickly, with less time between them.',
          ticksLeft: 10,
          power: 1,
        };
        const statusEffect = this.statusEffects.find(e => e.name === this.corruptionEffectName);
        if (statusEffect) {
          statusEffect.ticksLeft += hasteEffect.ticksLeft;
        } else {
          this.statusEffects.push(hasteEffect);
        }
      } else if (effect === this.slowingEffectName) {
        const statusEffect: StatusEffect = {
          name: this.doomEffectName,
          description: 'Doom is coming for this creature.',
          ticksLeft: 1000,
          power: 1,
        };
        if (this.currentEnemy.statusEffects) {
          const slowingEffect = this.currentEnemy.statusEffects.find(e => e.name === this.slowingEffectName);
          if (slowingEffect) {
            slowingEffect.ticksLeft += statusEffect.ticksLeft;
          } else {
            this.currentEnemy.statusEffects.push(statusEffect);
          }
        } else {
          this.currentEnemy.statusEffects = [statusEffect];
        }
      }

      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      let blowthrough = false;
      if (technique.name === this.metalFistName) {
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
      if (technique.name === this.pyroclasmAttackName) {
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
        'You attack ' + this.currentEnemy.name + ' for ' + this.bigNumberPipe.transform(damage) + ' damage';
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
    this.logService.log(LogTopic.COMBAT, 'You manage to kill ' + this.currentEnemy.name);
    if (this.currentEnemy.name === 'Death itself') {
      this.characterService.toast('HURRAY! Check your inventory. You just got something special!', 0);
    }
    for (const item of this.currentEnemy.loot) {
      const lootItem = this.itemRepoService.getItemById(item.id);
      if (lootItem) {
        this.inventoryService.addItem(lootItem);
      } else {
        // the item was generated, not part of the repo, so just add it instead of using the lookup
        this.inventoryService.addItem(item);
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
    this.logService.log(LogTopic.COMBAT, 'A new enemy comes to battle: ' + enemy.name);

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

    this.troubleCounter++;

    let targetLocation = this.locationService.troubleTarget;
    if (!targetLocation) {
      const locationIndex = (this.troubleCounter % this.locationService.unlockedLocations.length) - 1;
      targetLocation = this.locationService.unlockedLocations[locationIndex + 1];
    }
    if (!targetLocation) {
      return;
    }
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

    const monsterType = possibleMonsters[this.troubleCounter % possibleMonsters.length];

    const killsToNextQualityRank = ((monsterType.basePower + '').length + 3) * 5;
    const modifier = (this.kills + 1) / killsToNextQualityRank;

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
      if (monsterType.lootType.includes('gem')) {
        loot.push(this.inventoryService.generateSpiritGem(grade, monsterType.element));
      }
      if (monsterType.lootType.includes('hide')) {
        loot.push(this.inventoryService.getHide(grade));
      }
      if (monsterType.lootType.includes('ore')) {
        loot.push(this.inventoryService.getOre(grade));
      }
      if (monsterType.lootType.includes('fruit')) {
        loot.push(this.itemRepoService.items['pear']);
      }
      if (monsterType.lootType.includes('meat')) {
        loot.push(this.inventoryService.getWildMeat(grade));
      }
      if (monsterType.lootType.includes('money')) {
        loot.push(this.inventoryService.getCoinPurse(Math.floor(modifiedBasePower)));
      }
    }

    this.addEnemy({
      name: monsterName,
      baseName: monsterType.name,
      health: health,
      maxHealth: health,
      defense: defense,
      loot: loot,
      techniques: [
        {
          name: 'Attack',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: attack,
          unlocked: true,
        },
      ],
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
      this.logService.log(LogTopic.COMBAT, 'They just keep coming! Two more ' + enemy.name + ' appear!');
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

  private attackEffect(technique: Technique) {
    if (!technique.effect) {
      return;
    }
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
    }
  }

  private monsterTypes: EnemyTypes[] = [
    {
      name: 'spider',
      description: '',
      location: LocationType.SmallTown,
      basePower: 1,
      lootType: ['gem'],
    },
    {
      name: 'rat',
      description: '',
      location: LocationType.SmallTown,
      basePower: 2,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'scorpion',
      description: '',
      location: LocationType.Desert,
      basePower: 3,
      lootType: ['gem'],
    },
    {
      name: 'lizard',
      description: '',
      location: LocationType.Desert,
      basePower: 5,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'snake',
      description: '',
      location: LocationType.Desert,
      basePower: 8,
      element: 'fire',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'jack-o-lantern',
      description: '',
      location: LocationType.LargeCity,
      basePower: 10,
      element: 'fire',
      lootType: ['gem', 'money'],
    },
    {
      name: 'redcap',
      description: '',
      location: LocationType.SmallTown,
      basePower: 12,
      lootType: ['gem', 'money'],
    },
    {
      name: 'gnome',
      description: '',
      location: LocationType.LargeCity,
      basePower: 15,
      element: 'earth',
      lootType: ['gem', 'money'],
    },
    {
      name: 'gremlin',
      description: '',
      location: LocationType.SmallTown,
      basePower: 18,
      lootType: ['gem', 'money'],
    },
    {
      name: 'imp',
      description: '',
      location: LocationType.LargeCity,
      basePower: 20,
      element: 'water',
      lootType: ['gem', 'money'],
    },
    {
      name: 'ooze',
      description: '',
      location: LocationType.Forest,
      basePower: 30,
      lootType: ['gem'],
    },
    {
      name: 'jackalope',
      description: '',
      location: LocationType.Desert,
      basePower: 40,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'pixie',
      description: '',
      location: LocationType.Forest,
      basePower: 50,
      lootType: ['gem', 'fruit'],
    },
    {
      name: 'goblin',
      description: '',
      location: LocationType.Forest,
      basePower: 100,
      lootType: ['gem', 'money'],
    },
    {
      name: 'monkey',
      description: '',
      location: LocationType.Jungle,
      basePower: 100,
      element: 'metal',
      lootType: ['gem', 'hide', 'fruit'],
    },
    {
      name: 'boar',
      description: '',
      location: LocationType.Forest,
      basePower: 200,
      element: 'water',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'skeleton',
      description: '',
      location: LocationType.Mine,
      basePower: 300,
      lootType: ['gem', 'money'],
    },
    {
      name: 'zombie',
      description: '',
      location: LocationType.Dungeon,
      basePower: 400,
      lootType: ['gem', 'money'],
    },
    {
      name: 'kelpie',
      description: '',
      location: LocationType.SmallPond,
      basePower: 500,
      element: 'water',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'bunyip',
      description: '',
      location: LocationType.SmallPond,
      basePower: 600,
      element: 'water',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'hobgoblin',
      description: '',
      location: LocationType.LargeCity,
      basePower: 700,
      lootType: ['gem', 'money'],
    },
    {
      name: 'kobold',
      description: '',
      location: LocationType.Mine,
      basePower: 800,
      element: 'earth',
      lootType: ['gem', 'money'],
    },
    {
      name: 'chupacabra',
      description: '',
      location: LocationType.Desert,
      basePower: 900,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'siren',
      description: '',
      location: LocationType.SmallPond,
      basePower: 1000,
      element: 'water',
      lootType: ['gem'],
    },
    {
      name: 'crocodile',
      description: '',
      location: LocationType.SmallPond,
      basePower: 1200,
      element: 'water',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'golem',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1300,
      element: 'earth',
      lootType: ['gem', 'ore'],
    },
    {
      name: 'incubus',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1400,
      lootType: ['gem', 'money'],
    },
    {
      name: 'succubus',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1500,
      lootType: ['gem', 'money'],
    },
    {
      name: 'jackal',
      description: '',
      location: LocationType.Desert,
      basePower: 1800,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'boogeyman',
      description: '',
      location: LocationType.LargeCity,
      basePower: 2000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'basilisk',
      description: '',
      location: LocationType.Desert,
      basePower: 2100,
      element: 'earth',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'mogwai',
      description: '',
      location: LocationType.LargeCity,
      basePower: 2500,
      lootType: ['gem', 'money'],
    },
    {
      name: 'ghoul',
      description: '',
      location: LocationType.Dungeon,
      basePower: 3000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'orc',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'tiger',
      description: '',
      location: LocationType.Jungle,
      basePower: 4000,
      element: 'wood',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'hippo',
      description: '',
      location: LocationType.SmallPond,
      basePower: 5000,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'rakshasa',
      description: '',
      location: LocationType.LargeCity,
      basePower: 6000,
      element: 'wood',
      lootType: ['gem', 'hide', 'money'],
    },
    {
      name: 'ghost',
      description: '',
      location: LocationType.Dungeon,
      basePower: 5000,
      lootType: ['gem'],
    },
    {
      name: 'centaur',
      description: '',
      location: LocationType.Forest,
      basePower: 8000,
      element: 'wood',
      lootType: ['gem', 'money'],
    },
    {
      name: 'hellhound',
      description: '',
      location: LocationType.Desert,
      basePower: 9000,
      element: 'fire',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'troll',
      description: '',
      location: LocationType.Dungeon,
      basePower: 10000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'werewolf',
      description: '',
      location: LocationType.Forest,
      basePower: 11000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'ogre',
      description: '',
      location: LocationType.Dungeon,
      basePower: 12000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'manticore',
      description: '',
      location: LocationType.Forest,
      basePower: 15000,
      element: 'wood',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'minotaur',
      description: '',
      location: LocationType.Dungeon,
      basePower: 18000,
      element: 'earth',
      lootType: ['gem', 'hide', 'money'],
    },
    {
      name: 'merlion',
      description: '',
      location: LocationType.Beach,
      basePower: 20000,
      element: 'water',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'mummy',
      description: '',
      location: LocationType.Desert,
      basePower: 30000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'landshark',
      description: '',
      location: LocationType.Beach,
      basePower: 40000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'bugbear',
      description: '',
      location: LocationType.Forest,
      basePower: 50000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'cavebear',
      description: '',
      location: LocationType.MountainTops,
      basePower: 70000,
      element: 'earth',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'yeti',
      description: '',
      location: LocationType.MountainTops,
      basePower: 80000,
      element: 'metal',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'dreameater',
      description: '',
      location: LocationType.Dungeon,
      basePower: 100000,
      lootType: ['gem'],
    },
    {
      name: 'unicorn',
      description: '',
      location: LocationType.Forest,
      basePower: 120000,
      element: 'wood',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'banshee',
      description: '',
      location: LocationType.Dungeon,
      basePower: 140000,
      lootType: ['gem'],
    },
    {
      name: 'harpy',
      description: '',
      location: LocationType.MountainTops,
      basePower: 150000,
      lootType: ['gem'],
    },
    {
      name: 'phoenix',
      description: '',
      location: LocationType.Desert,
      basePower: 180000,
      element: 'fire',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'sphinx',
      description: '',
      location: LocationType.Desert,
      basePower: 200000,
      element: 'fire',
      lootType: ['gem', 'hide', 'ore'],
    },
    {
      name: 'oni',
      description: '',
      location: LocationType.Dungeon,
      basePower: 300000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'leshy',
      description: '',
      location: LocationType.Forest,
      basePower: 300000,
      element: 'wood',
      lootType: ['gem', 'money'],
    },
    {
      name: 'chimaera',
      description: '',
      location: LocationType.Dungeon,
      basePower: 400000,
      element: 'wood',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'undine',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000,
      element: 'water',
      lootType: ['gem', 'money'],
    },
    {
      name: 'cyclops',
      description: '',
      location: LocationType.MountainTops,
      basePower: 600000,
      element: 'metal',
      lootType: ['gem', 'money'],
    },
    {
      name: 'nyuk',
      description: '',
      location: LocationType.Dungeon,
      basePower: 700000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'wendigo',
      description: '',
      location: LocationType.Forest,
      basePower: 800000,
      element: 'wood',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'behemoth',
      description: '',
      location: LocationType.Desert,
      basePower: 800000,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'dinosaur',
      description: '',
      location: LocationType.Jungle,
      basePower: 1000000,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'wyvern',
      description: '',
      location: LocationType.MountainTops,
      basePower: 2000000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'doomworm',
      description: '',
      location: LocationType.Desert,
      basePower: 3000000,
      element: 'earth',
      lootType: ['gem', 'hide', 'meat', 'ore'],
    },
    {
      name: 'lich',
      description: '',
      location: LocationType.Dungeon,
      basePower: 5000000,
      element: 'metal',
      lootType: ['gem', 'money'],
    },
    {
      name: 'thunderbird',
      description: '',
      location: LocationType.MountainTops,
      basePower: 8000000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'vampire',
      description: '',
      location: LocationType.Dungeon,
      basePower: 10000000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'beholder',
      description: '',
      location: LocationType.Dungeon,
      basePower: 15000000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'hydra',
      description: '',
      location: LocationType.DeepSea,
      basePower: 20000000,
      element: 'water',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'roc',
      description: '',
      location: LocationType.MountainTops,
      basePower: 40000000,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'wyrm',
      description: '',
      location: LocationType.MountainTops,
      basePower: 50000000,
      lootType: ['gem', 'hide'],
    },
    {
      name: 'giant',
      description: '',
      location: LocationType.MountainTops,
      basePower: 60000000,
      element: 'earth',
      lootType: ['gem', 'money'],
    },
    {
      name: 'kraken',
      description: '',
      location: LocationType.DeepSea,
      basePower: 80000000,
      element: 'water',
      lootType: ['gem', 'hide'],
    },
    {
      name: 'pazuzu',
      description: '',
      location: LocationType.MountainTops,
      basePower: 100000000,
      lootType: ['gem', 'hide', 'money'],
    },
    {
      name: 'titan',
      description: '',
      location: LocationType.MountainTops,
      basePower: 200000000,
      element: 'metal',
      lootType: ['gem', 'money', 'ore'],
    },
    {
      name: 'leviathan',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000000,
      element: 'water',
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'stormbringer',
      description: '',
      location: LocationType.MountainTops,
      basePower: 1000000000,
      lootType: ['gem', 'hide', 'meat'],
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
