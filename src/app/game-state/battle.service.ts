import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from './main-loop.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { HellService } from './hell.service';
import { BigNumberPipe } from '../app.component';
import { HomeService, HomeType } from './home.service';
import { LocationType } from './activity';
import { LocationService } from './location.service';
import { AttributeType } from './character';

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
  qiShieldUnlocked: boolean;
  qiAttackUnlocked: boolean;
  pyroclasmUnlocked: boolean;
  metalFistUnlocked: boolean;
  fireShieldUnlocked: boolean;
  iceShieldUnlocked: boolean;
  enableQiShield: boolean;
  enableQiAttack: boolean;
  enablePyroclasm: boolean;
  enableMetalFist: boolean;
  enableFireShield: boolean;
  enableIceShield: boolean;
  highestDamageTaken: number;
  highestDamageDealt: number;
  godSlayersUnlocked: boolean;
  godSlayersEnabled: boolean;
  totalEnemies: number;
  troubleCounter: number;
  battleMessageDismissed: boolean;
  techniques: Technique[];
  techniqueDevelopmentCounter: number;
  maxTechniques: number;
}

export interface Technique {
  name: string;
  description?: string;
  attribute?: AttributeType;
  ticks: number;
  ticksRequired: number;
  baseDamage: number;
  hitTracker?: number;
  effect?: string;
  unlocked: boolean;
  familyTechnique?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  bigNumberPipe: BigNumberPipe;
  hellService?: HellService;
  locationService?: LocationService;
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  kills: number;
  godSlayerKills: number;
  autoTroubleUnlocked = false;
  yearlyMonsterDay: number;
  enableQiShield = false;
  enableQiAttack = false;
  enablePyroclasm = false;
  enableMetalFist = false;
  enableFireShield = false;
  enableIceShield = false;
  qiShieldUnlocked = false;
  qiAttackUnlocked = false;
  pyroclasmUnlocked = false;
  metalFistUnlocked = false;
  fireShieldUnlocked = false;
  iceShieldUnlocked = false;
  highestDamageTaken = 0;
  highestDamageDealt = 0;
  totalKills = 0;
  skipEnemyAttack = 0;
  godSlayersUnlocked = false;
  godSlayersEnabled = false;
  totalEnemies = 0;
  troubleCounter = 0;
  battleMessageDismissed = false;
  techniqueDevelopmentCounter = 0;
  maxTechniques = 3;

  rightHandTechniqueName = 'Right-Handed Weapon';
  leftHandTechniqueName = 'Left-Handed Weapon';

  techniques: Technique[] = [
    {
      name: 'Basic Strike',
      description: 'A very simple strike that even the weakest mortal could perform.',
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 1,
      unlocked: true,
      attribute: 'strength',
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
      }
      if (this.yearlyMonsterDay >= 365) {
        this.yearlyMonsterDay = 0;
        this.trouble();
      }
    });

    mainLoopService.battleTickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }
      this.inventoryService.usePouchItem(1);

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
      this.techniques[1].unlocked = this.characterService.characterState.equipment.rightHand !== null;
      this.techniques[2].unlocked = this.characterService.characterState.equipment.leftHand !== null;

      if (
        this.techniqueDevelopmentCounter > 20000 * Math.pow(10, this.techniques.length - 3) &&
        this.techniques.length < this.maxTechniques
      ) {
        this.developNewTechnique();
        this.techniqueDevelopmentCounter = 0;
      }
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  reset() {
    this.clearEnemies();
    this.kills = 0;
    this.godSlayerKills = 0;
    this.yearlyMonsterDay = 0;
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
      qiShieldUnlocked: this.qiShieldUnlocked,
      qiAttackUnlocked: this.qiAttackUnlocked,
      pyroclasmUnlocked: this.pyroclasmUnlocked,
      metalFistUnlocked: this.metalFistUnlocked,
      fireShieldUnlocked: this.fireShieldUnlocked,
      iceShieldUnlocked: this.iceShieldUnlocked,
      enableQiShield: this.enableQiShield,
      enableQiAttack: this.enableQiAttack,
      enablePyroclasm: this.enablePyroclasm,
      enableMetalFist: this.enableMetalFist,
      enableFireShield: this.enableFireShield,
      enableIceShield: this.enableIceShield,
      highestDamageDealt: this.highestDamageDealt,
      highestDamageTaken: this.highestDamageTaken,
      godSlayersUnlocked: this.godSlayersUnlocked,
      godSlayersEnabled: this.godSlayersEnabled,
      totalEnemies: this.totalEnemies,
      troubleCounter: this.troubleCounter,
      battleMessageDismissed: this.battleMessageDismissed,
      techniques: this.techniques,
      techniqueDevelopmentCounter: this.techniqueDevelopmentCounter,
      maxTechniques: this.maxTechniques,
    };
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.kills = properties.kills;
    this.godSlayerKills = properties.godSlayerKills || 0;
    this.totalKills = properties.totalKills || 0;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.yearlyMonsterDay = properties.monthlyMonsterDay;
    this.enableQiShield = properties.enableQiShield;
    this.enableQiAttack = properties.enableQiAttack;
    this.enablePyroclasm = properties.enablePyroclasm || false;
    this.enableMetalFist = properties.enableMetalFist || false;
    this.enableFireShield = properties.enableFireShield || false;
    this.enableIceShield = properties.enableIceShield || false;
    this.qiShieldUnlocked = properties.qiShieldUnlocked || false;
    this.qiAttackUnlocked = properties.qiAttackUnlocked || false;
    this.pyroclasmUnlocked = properties.pyroclasmUnlocked || false;
    this.metalFistUnlocked = properties.metalFistUnlocked || false;
    this.fireShieldUnlocked = properties.fireShieldUnlocked || false;
    this.iceShieldUnlocked = properties.iceShieldUnlocked || false;
    this.highestDamageDealt = properties.highestDamageDealt || 0;
    this.highestDamageTaken = properties.highestDamageTaken || 0;
    this.godSlayersUnlocked = properties.godSlayersUnlocked || false;
    this.godSlayersEnabled = properties.godSlayersEnabled || false;
    this.totalEnemies = properties.totalEnemies || 0;
    this.troubleCounter = properties.troubleCounter || 0;
    this.battleMessageDismissed = properties.battleMessageDismissed || false;
    if (properties.techniques) {
      this.techniques = properties.techniques;
    }
    this.techniqueDevelopmentCounter = properties.techniqueDevelopmentCounter || 0;
    this.maxTechniques = properties.maxTechniques || 3;
    if (this.enemies.length > 0) {
      for (const enemy of this.enemies) {
        if (enemy.name === properties.currentEnemy?.name) {
          this.currentEnemy = enemy;
        }
      }
    }
  }

  developNewTechnique() {
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
    ];
    const prefix = prefixAdjectiveList[Math.floor(Math.random() * prefixAdjectiveList.length)];
    const attributeKeys = Object.keys(this.characterService.characterState.attackPower);

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
    this.techniques.push({
      name: prefix + ' ' + attributePrefix + ' ' + attackNoun,
      description: 'A special family technique that can be passed to your descendants.',
      ticksRequired: ticksRequired,
      ticks: 0,
      baseDamage: 1,
      unlocked: true,
      attribute: attribute,
      familyTechnique: true,
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

  handleEnemyTechniques() {
    for (const enemy of this.enemies) {
      for (const technique of enemy.techniques) {
        if (technique.ticks === technique.ticksRequired) {
          this.enemyAttack(technique);
          technique.ticks = 0;
        } else {
          technique.ticks++;
        }
      }
    }
  }

  enemyAttack(technique: Technique) {
    if (this.skipEnemyAttack > 0) {
      this.skipEnemyAttack--;
      return;
    }
    let toughnessIncrease = 0;
    let damage = technique.baseDamage;
    const defense = this.characterService.characterState.defense;
    // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
    if (defense >= 1) {
      damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
    }
    //Keep mice scary
    if (damage < 0.3) {
      damage = 0.3;
    }
    if (this.enableQiShield && this.characterService.characterState.status.qi.value > 10) {
      damage /= 2;
      this.characterService.characterState.status.qi.value -= 10;
    }
    let damageBack = false;
    if (this.enableFireShield && this.characterService.characterState.status.qi.value > 10000) {
      let fireDivisor = Math.log(this.characterService.characterState.attributes.fireLore.value) / Math.log(100);
      if (fireDivisor < 1) {
        fireDivisor = 1;
      }
      if (fireDivisor > 10) {
        fireDivisor = 10;
      }
      damage /= fireDivisor;
      this.characterService.characterState.status.qi.value -= 10000;
      damageBack = true;
    }
    if (this.enableIceShield && this.characterService.characterState.status.qi.value > 10000) {
      let waterDivisor = Math.log(this.characterService.characterState.attributes.waterLore.value) / Math.log(100);
      if (waterDivisor < 1) {
        waterDivisor = 1;
      }
      if (waterDivisor > 10) {
        waterDivisor = 10;
      }
      damage /= waterDivisor;
      this.characterService.characterState.status.qi.value -= 10000;
      this.skipEnemyAttack++;
    }
    // reduce damage by up to half
    // TODO: tune this
    damage -= damage * (this.characterService.characterState.yinYangBalance / 2);
    this.logService.injury(LogTopic.COMBAT, 'Ow! You got hit for ' + this.bigNumberPipe.transform(damage) + ' damage');
    if (damageBack) {
      this.damageEnemy(damage, 'The flames of your shield strike back, damaging the enemy for ' + damage + ' damage.');
    }
    if (damage > this.highestDamageTaken) {
      this.highestDamageTaken = damage;
    }
    this.characterService.characterState.status.health.value -= damage;
    toughnessIncrease += 0.01;
    this.attackEffect(technique);
    this.characterService.characterState.increaseAttribute('toughness', toughnessIncrease);
  }

  handleYourTechniques() {
    if (this.enemies.length <= 0) {
      return;
    }
    for (const technique of this.techniques) {
      if (technique.unlocked) {
        if (technique.ticks === technique.ticksRequired) {
          if (this.techniques.length < this.maxTechniques) {
            this.techniqueDevelopmentCounter++;
          }
          if (technique.familyTechnique) {
            technique.baseDamage++;
          }
          this.youAttack(technique);
          if (this.enemies.length === 0) {
            // killed the last enemey in this encounter, reset all technique counters
            for (const cleartechnique of this.techniques) {
              cleartechnique.ticks = 0;
            }
            return;
          }
          technique.ticks = 0;
        } else {
          technique.ticks++;
        }
      }
    }
  }

  youAttack(technique: Technique) {
    if (this.currentEnemy && this.characterService.characterState.status.health.value > 0) {
      let attackPower = this.characterService.characterState.attackPower['strength'] || 1;
      if (technique.attribute) {
        attackPower = this.characterService.characterState.attackPower[technique.attribute] || 1;
      }
      if (technique.name === this.rightHandTechniqueName) {
        if (this.characterService.characterState.equipment.rightHand) {
          attackPower =
            Math.floor(
              attackPower *
                Math.sqrt(this.characterService.characterState.equipment.rightHand.weaponStats?.baseDamage || 1)
            ) || 1;
        }
      } else if (technique.name === this.leftHandTechniqueName) {
        if (this.characterService.characterState.equipment.leftHand) {
          attackPower =
            Math.floor(
              attackPower *
                Math.sqrt(this.characterService.characterState.equipment.leftHand.weaponStats?.baseDamage || 1)
            ) || 1;
        }
      }

      let damage = attackPower * technique.baseDamage;
      if (
        this.characterService.characterState.status.nutrition.value >
        this.characterService.characterState.status.nutrition.max * 0.8
      ) {
        // tummy is mostly full, hit harder
        damage *= 1.2;
      }
      const defense = this.currentEnemy.defense;
      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      if (this.enableQiAttack && this.characterService.characterState.status.qi.value > 10) {
        damage *= 2;
        this.characterService.characterState.status.qi.value -= 10;
      }
      const blowthrough = false;
      /*
      if (this.enableMetalFist && this.characterService.characterState.status.qi.value > 10000) {
        let metalMultiplier = Math.log(this.characterService.characterState.attributes.metalLore.value) / Math.log(50);
        if (metalMultiplier < 1) {
          metalMultiplier = 1;
        }
        if (metalMultiplier > 100) {
          metalMultiplier = 100;
        }
        damage *= metalMultiplier;
        this.characterService.characterState.status.qi.value -= 10000;
      }
      if (this.enablePyroclasm && this.characterService.characterState.status.qi.value > 10000) {
        let fireMultiplier = Math.log(this.characterService.characterState.attributes.fireLore.value) / Math.log(100);
        if (fireMultiplier < 1) {
          fireMultiplier = 1;
        }
        if (fireMultiplier > 10) {
          fireMultiplier = 10;
        }
        damage *= fireMultiplier;
        this.characterService.characterState.status.qi.value -= 10000;
        blowthrough = true;
      }
        */
      // TODO: tune this
      damage += damage * this.characterService.characterState.yinYangBalance;

      if (damage > this.highestDamageDealt) {
        this.highestDamageDealt = damage;
      }

      this.applyWeaponEffect(this.characterService.characterState.equipment.leftHand, damage);
      this.applyWeaponEffect(this.characterService.characterState.equipment.rightHand, damage);

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

  applyWeaponEffect(weapon: Equipment | null, damage: number) {
    if (!weapon) {
      return;
    }
    if (weapon.weaponStats?.effect === 'corruption') {
      // TODO: add a different corruption effect
    } else if (weapon.weaponStats?.effect === 'life') {
      const healAmount = damage * 0.01;
      this.logService.log(
        LogTopic.COMBAT,
        'Your ' + weapon.name + ' healed you for ' + healAmount + ' as you struck the enemy.'
      );
      this.characterService.characterState.status.health.value += healAmount; // TODO: tune this
      this.characterService.characterState.checkOverage();
    }
  }

  damageEnemy(damage: number, customMessage = ''): number {
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

  killCurrentEnemy() {
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
    const health = modifiedBasePower * 10;
    const attack = modifiedBasePower / 5;
    const defense = modifiedBasePower / 10;
    const loot: Item[] = [];
    if (monsterType.lootType) {
      const grade = Math.floor(Math.log2(modifiedBasePower + 2));
      if (monsterType.lootType.includes('gem')) {
        loot.push(this.inventoryService.generateSpiritGem(grade));
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

  addMouse() {
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

  addRuffian() {
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

  addWolf() {
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

  defeatEffect(enemy: Enemy) {
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

  attackEffect(technique: Technique) {
    if (!technique.effect) {
      return;
    }
    if (technique.effect === 'feeder' && this.hellService) {
      if (technique.hitTracker !== undefined && technique.hitTracker < 2) {
        technique.hitTracker++;
      } else {
        // force feed on third hit
        this.hellService.daysFasted = 0;
        const damage = this.characterService.characterState.status.health.value / 4;
        this.logService.injury(
          LogTopic.COMBAT,
          'The hellfire burns as it goes down, damaging you for ' + damage + ' extra damage.'
        );
        this.characterService.characterState.status.health.value -= damage;
      }
    } else if (technique.effect === 'theft') {
      this.characterService.characterState.updateMoney(0 - this.characterService.characterState.money / 10);
    }
  }

  monsterTypes: EnemyTypes[] = [
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
      lootType: ['gem', 'hide'],
    },
    {
      name: 'jack-o-lantern',
      description: '',
      location: LocationType.LargeCity,
      basePower: 10,
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
      lootType: ['gem', 'hide', 'fruit'],
    },
    {
      name: 'boar',
      description: '',
      location: LocationType.Forest,
      basePower: 200,
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
      lootType: ['gem', 'hide'],
    },
    {
      name: 'bunyip',
      description: '',
      location: LocationType.SmallPond,
      basePower: 600,
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
      lootType: ['gem'],
    },
    {
      name: 'crocodile',
      description: '',
      location: LocationType.SmallPond,
      basePower: 1200,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'golem',
      description: '',
      location: LocationType.LargeCity,
      basePower: 1300,
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
      lootType: ['gem', 'money'],
    },
    {
      name: 'hellhound',
      description: '',
      location: LocationType.Desert,
      basePower: 9000,
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
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'minotaur',
      description: '',
      location: LocationType.Dungeon,
      basePower: 18000,
      lootType: ['gem', 'hide', 'money'],
    },
    {
      name: 'merlion',
      description: '',
      location: LocationType.Beach,
      basePower: 20000,
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
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'yeti',
      description: '',
      location: LocationType.MountainTops,
      basePower: 80000,
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
      lootType: ['gem', 'hide'],
    },
    {
      name: 'sphinx',
      description: '',
      location: LocationType.Desert,
      basePower: 200000,
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
      lootType: ['gem', 'money'],
    },
    {
      name: 'chimaera',
      description: '',
      location: LocationType.Dungeon,
      basePower: 400000,
      lootType: ['gem', 'hide', 'meat'],
    },
    {
      name: 'undine',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000,
      lootType: ['gem', 'money'],
    },
    {
      name: 'cyclops',
      description: '',
      location: LocationType.MountainTops,
      basePower: 600000,
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
      lootType: ['gem', 'hide', 'meat', 'ore'],
    },
    {
      name: 'lich',
      description: '',
      location: LocationType.Dungeon,
      basePower: 5000000,
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
      lootType: ['gem', 'money'],
    },
    {
      name: 'kraken',
      description: '',
      location: LocationType.DeepSea,
      basePower: 80000000,
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
      lootType: ['gem', 'money', 'ore'],
    },
    {
      name: 'leviathan',
      description: '',
      location: LocationType.DeepSea,
      basePower: 500000000,
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

  monsterQualities = [
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
