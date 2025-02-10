import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { HellService } from './hell.service';
import { BigNumberPipe } from '../app.component';

export interface Enemy {
  name: string;
  baseName: string;
  health: number;
  maxHealth: number;
  accuracy: number;
  attack: number;
  defense: number;
  loot: Item[];
  unique?: boolean;
  defeatEffect?: string;
  attackEffect?: string;
  hitTracker?: number;
}

export interface EnemyStack {
  enemy: Enemy;
  quantity: number;
}

export interface BattleProperties {
  enemies: EnemyStack[];
  currentEnemy: EnemyStack | null;
  kills: number;
  troubleKills: number;
  godSlayerKills: number;
  totalKills: number;
  autoTroubleUnlocked: boolean;
  autoTroubleEnabled: boolean;
  monthlyMonsterDay: number;
  manaShieldUnlocked: boolean;
  manaAttackUnlocked: boolean;
  pyroclasmUnlocked: boolean;
  metalFistUnlocked: boolean;
  fireShieldUnlocked: boolean;
  iceShieldUnlocked: boolean;
  enableManaShield: boolean;
  enableManaAttack: boolean;
  enablePyroclasm: boolean;
  enableMetalFist: boolean;
  enableFireShield: boolean;
  enableIceShield: boolean;
  highestDamageTaken: number;
  highestDamageDealt: number;
  godSlayersUnlocked: boolean;
  godSlayersEnabled: boolean;
  totalEnemies: number;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  bigNumberPipe: BigNumberPipe;
  hellService?: HellService;
  enemies: EnemyStack[];
  currentEnemy: EnemyStack | null;
  kills: number;
  troubleKills: number;
  godSlayerKills: number;
  autoTroubleUnlocked = false;
  autoTroubleEnabled = false;
  yearlyMonsterDay: number;
  enableManaShield = false;
  enableManaAttack = false;
  enablePyroclasm = false;
  enableMetalFist = false;
  enableFireShield = false;
  enableIceShield = false;
  manaShieldUnlocked = false;
  manaAttackUnlocked = false;
  pyroclasmUnlocked = false;
  metalFistUnlocked = false;
  fireShieldUnlocked = false;
  iceShieldUnlocked = false;
  tickCounter: number;
  ticksPerFight = 10;
  highestDamageTaken = 0;
  highestDamageDealt = 0;
  totalKills = 0;
  skipEnemyAttack = 0;
  degradeFactor = 0.0000001;
  godSlayersUnlocked = false;
  godSlayersEnabled = false;
  totalEnemies = 0;

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    private itemRepoService: ItemRepoService,
    private inventoryService: InventoryService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.enemies = [];
    this.currentEnemy = null;
    this.kills = 0;
    this.troubleKills = 0;
    this.godSlayerKills = 0;
    this.yearlyMonsterDay = 0;
    this.tickCounter = 0;

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }
      if (this.tickCounter < this.ticksPerFight) {
        this.tickCounter++;
        return;
      }
      this.tickCounter = 0;
      if (this.currentEnemy === null && this.enemies.length > 0) {
        this.currentEnemy = this.enemies[0];
      }
      this.enemiesAttack();
      this.youAttack();
      this.yearlyMonsterDay++;
      if (this.yearlyMonsterDay >= 365 || this.autoTroubleEnabled) {
        this.yearlyMonsterDay = 0;
        this.trouble();
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  reset() {
    this.clearEnemies();
    this.kills = 0;
    this.troubleKills = 0;
    this.godSlayerKills = 0;
    this.yearlyMonsterDay = 0;
  }

  getProperties(): BattleProperties {
    return {
      enemies: this.enemies,
      currentEnemy: this.currentEnemy,
      kills: this.kills,
      troubleKills: this.troubleKills,
      godSlayerKills: this.godSlayerKills,
      totalKills: this.totalKills,
      autoTroubleUnlocked: this.autoTroubleUnlocked,
      autoTroubleEnabled: this.autoTroubleEnabled,
      monthlyMonsterDay: this.yearlyMonsterDay,
      manaShieldUnlocked: this.manaShieldUnlocked,
      manaAttackUnlocked: this.manaAttackUnlocked,
      pyroclasmUnlocked: this.pyroclasmUnlocked,
      metalFistUnlocked: this.metalFistUnlocked,
      fireShieldUnlocked: this.fireShieldUnlocked,
      iceShieldUnlocked: this.iceShieldUnlocked,
      enableManaShield: this.enableManaShield,
      enableManaAttack: this.enableManaAttack,
      enablePyroclasm: this.enablePyroclasm,
      enableMetalFist: this.enableMetalFist,
      enableFireShield: this.enableFireShield,
      enableIceShield: this.enableIceShield,
      highestDamageDealt: this.highestDamageDealt,
      highestDamageTaken: this.highestDamageTaken,
      godSlayersUnlocked: this.godSlayersUnlocked,
      godSlayersEnabled: this.godSlayersEnabled,
      totalEnemies: this.totalEnemies,
    };
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.currentEnemy = properties.currentEnemy;
    this.kills = properties.kills;
    this.troubleKills = properties.troubleKills;
    this.godSlayerKills = properties.godSlayerKills || 0;
    this.totalKills = properties.totalKills || 0;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.autoTroubleEnabled = properties.autoTroubleEnabled;
    this.yearlyMonsterDay = properties.monthlyMonsterDay;
    this.enableManaShield = properties.enableManaShield;
    this.enableManaAttack = properties.enableManaAttack;
    this.enablePyroclasm = properties.enablePyroclasm || false;
    this.enableMetalFist = properties.enableMetalFist || false;
    this.enableFireShield = properties.enableFireShield || false;
    this.enableIceShield = properties.enableIceShield || false;
    this.manaShieldUnlocked = properties.manaShieldUnlocked || false;
    this.manaAttackUnlocked = properties.manaAttackUnlocked || false;
    this.pyroclasmUnlocked = properties.pyroclasmUnlocked || false;
    this.metalFistUnlocked = properties.metalFistUnlocked || false;
    this.fireShieldUnlocked = properties.fireShieldUnlocked || false;
    this.iceShieldUnlocked = properties.iceShieldUnlocked || false;
    this.highestDamageDealt = properties.highestDamageDealt || 0;
    this.highestDamageTaken = properties.highestDamageTaken || 0;
    this.godSlayersUnlocked = properties.godSlayersUnlocked || false;
    this.godSlayersEnabled = properties.godSlayersEnabled || false;
    this.totalEnemies = properties.totalEnemies || 0;
  }

  enemiesAttack() {
    if (this.skipEnemyAttack > 0) {
      this.skipEnemyAttack--;
      return;
    }
    let toughnessIncrease = 0;
    for (const enemyStack of this.enemies) {
      for (let i = 0; i < enemyStack.quantity; i++) {
        if (Math.random() < enemyStack.enemy.accuracy) {
          let damage = enemyStack.enemy.attack;
          const defense = this.characterService.characterState.defense;
          // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
          if (defense >= 1) {
            damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
          }
          //Keep mice scary
          if (damage < 0.3) {
            damage = 0.3;
          }
          if (this.enableManaShield && this.characterService.characterState.status.mana.value > 10) {
            damage /= 2;
            this.characterService.characterState.status.mana.value -= 10;
          }
          let damageBack = false;
          if (this.enableFireShield && this.characterService.characterState.status.mana.value > 10000) {
            let fireDivisor = Math.log(this.characterService.characterState.attributes.fireLore.value) / Math.log(100);
            if (fireDivisor < 1) {
              fireDivisor = 1;
            }
            if (fireDivisor > 10) {
              fireDivisor = 10;
            }
            damage /= fireDivisor;
            this.characterService.characterState.status.mana.value -= 10000;
            damageBack = true;
          }
          if (this.enableIceShield && this.characterService.characterState.status.mana.value > 10000) {
            let waterDivisor =
              Math.log(this.characterService.characterState.attributes.waterLore.value) / Math.log(100);
            if (waterDivisor < 1) {
              waterDivisor = 1;
            }
            if (waterDivisor > 10) {
              waterDivisor = 10;
            }
            damage /= waterDivisor;
            this.characterService.characterState.status.mana.value -= 10000;
            this.skipEnemyAttack++;
          }
          // reduce damage by up to half
          // TODO: tune this
          damage -= damage * (this.characterService.characterState.yinYangBalance / 2);
          this.logService.injury(
            LogTopic.COMBAT,
            'Ow! ' + enemyStack.enemy.name + ' hit you for ' + this.bigNumberPipe.transform(damage) + ' damage'
          );
          if (damageBack) {
            this.damageEnemy(
              damage,
              'The flames of your shield strike back, damaging the enemy for ' + damage + ' damage.'
            );
          }
          if (damage > this.highestDamageTaken) {
            this.highestDamageTaken = damage;
          }
          this.characterService.characterState.status.health.value -= damage;
          toughnessIncrease += 0.01;
          this.attackEffect(enemyStack.enemy);
          // degrade armor
          const degradables = [];
          if (this.characterService.characterState.equipment.head) {
            degradables.push(this.characterService.characterState.equipment.head);
          }
          if (this.characterService.characterState.equipment.body) {
            degradables.push(this.characterService.characterState.equipment.body);
          }
          if (this.characterService.characterState.equipment.legs) {
            degradables.push(this.characterService.characterState.equipment.legs);
          }
          if (this.characterService.characterState.equipment.feet) {
            degradables.push(this.characterService.characterState.equipment.feet);
          }
          if (degradables.length > 0) {
            this.degradeArmor(degradables[Math.floor(Math.random() * degradables.length)], damage);
          }

          if (this.characterService.characterState.status.health.value <= 0) {
            if (enemyStack.enemy.name === 'Death itself') {
              this.logService.injury(
                LogTopic.EVENT,
                enemyStack.enemy.name +
                  ' overkilled you by ' +
                  Math.floor(-this.characterService.characterState.status.health.value) +
                  ' damage. You were defeated.'
              );
            } else {
              this.logService.injury(LogTopic.EVENT, 'You were defeated by ' + enemyStack.enemy.name);
            }
            if (!this.characterService.characterState.immortal) {
              this.characterService.characterState.dead = true;
            }
            if (this.hellService?.inHell) {
              this.hellService.beaten = true;
              this.clearEnemies();
            }
            return;
          }
        } else {
          this.logService.log(LogTopic.COMBAT, 'Miss! ' + enemyStack.enemy.name + ' tries to hit you but fails.');
        }
      }
    }
    this.characterService.characterState.increaseAttribute('toughness', toughnessIncrease);
  }

  youAttack() {
    this.characterService.characterState.accuracy = Math.min(
      Math.sqrt(this.characterService.characterState.attributes.speed.value),
      1
    );
    if (this.currentEnemy && this.characterService.characterState.status.health.value > 0) {
      // Check health for immortals
      if (Math.random() > this.characterService.characterState.accuracy) {
        this.logService.log(LogTopic.COMBAT, 'You attack ' + this.currentEnemy.enemy.name + ' but miss.');
        return;
      }

      let damage = this.characterService.characterState.attackPower;
      const defense = this.currentEnemy.enemy.defense;
      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      if (this.enableManaAttack && this.characterService.characterState.status.mana.value > 10) {
        damage *= 2;
        this.characterService.characterState.status.mana.value -= 10;
      }
      let blowthrough = false;
      if (this.enableMetalFist && this.characterService.characterState.status.mana.value > 10000) {
        let metalMultiplier = Math.log(this.characterService.characterState.attributes.metalLore.value) / Math.log(50);
        if (metalMultiplier < 1) {
          metalMultiplier = 1;
        }
        if (metalMultiplier > 100) {
          metalMultiplier = 100;
        }
        damage *= metalMultiplier;
        this.characterService.characterState.status.mana.value -= 10000;
      }
      if (this.enablePyroclasm && this.characterService.characterState.status.mana.value > 10000) {
        let fireMultiplier = Math.log(this.characterService.characterState.attributes.fireLore.value) / Math.log(100);
        if (fireMultiplier < 1) {
          fireMultiplier = 1;
        }
        if (fireMultiplier > 10) {
          fireMultiplier = 10;
        }
        damage *= fireMultiplier;
        this.characterService.characterState.status.mana.value -= 10000;
        blowthrough = true;
      }
      // TODO: tune this
      damage += damage * this.characterService.characterState.yinYangBalance;
      if (this.characterService.characterState.equipment?.leftHand?.weaponStats?.effect === 'corruption') {
        damage *= 10;
      }
      if (this.characterService.characterState.equipment?.rightHand?.weaponStats?.effect === 'corruption') {
        damage *= 10;
      }
      if (this.characterService.characterState.equipment?.head?.armorStats?.effect === 'corruption') {
        damage *= 2;
      }
      if (this.characterService.characterState.equipment?.body?.armorStats?.effect === 'corruption') {
        damage *= 2;
      }
      if (this.characterService.characterState.equipment?.legs?.armorStats?.effect === 'corruption') {
        damage *= 2;
      }
      if (this.characterService.characterState.equipment?.feet?.armorStats?.effect === 'corruption') {
        damage *= 2;
      }

      if (damage > this.highestDamageDealt) {
        this.highestDamageDealt = damage;
      }

      let durabilityDamage = 1;
      if (defense > 20000) {
        // TODO: tune this
        durabilityDamage += Math.sqrt(defense - 20000);
      }
      // degrade weapons
      const degradeFactor = this.degradeFactor / 4; // degrade weapons more slowly since they take the hit every time
      if (
        this.characterService.characterState.equipment.leftHand &&
        this.characterService.characterState.equipment.leftHand.weaponStats
      ) {
        if (this.characterService.characterState.equipment.leftHand.weaponStats.effect === 'corruption') {
          this.characterService.characterState.equipment.leftHand.weaponStats.durability -=
            100 *
            (durabilityDamage +
              Math.floor(
                this.characterService.characterState.equipment.leftHand.weaponStats.durability * degradeFactor
              ));
        } else {
          this.characterService.characterState.equipment.leftHand.weaponStats.durability -=
            durabilityDamage +
            Math.floor(this.characterService.characterState.equipment.leftHand.weaponStats.durability * degradeFactor);
        }
        this.characterService.characterState.equipment.leftHand.value -=
          1 + Math.floor(this.characterService.characterState.equipment.leftHand.value * degradeFactor);
        if (this.characterService.characterState.equipment.leftHand.value < 1) {
          this.characterService.characterState.equipment.leftHand.value = 1;
        }
        this.characterService.characterState.equipment.leftHand.weaponStats.baseDamage -=
          1 +
          Math.floor(this.characterService.characterState.equipment.leftHand.weaponStats.baseDamage * degradeFactor);
        if (this.characterService.characterState.equipment.leftHand.weaponStats.baseDamage < 1) {
          this.characterService.characterState.equipment.leftHand.weaponStats.baseDamage = 1;
        }
        if (this.characterService.characterState.equipment.leftHand.weaponStats.effect === 'life') {
          this.logService.log(
            LogTopic.COMBAT,
            'Your ' +
              this.characterService.characterState.equipment.leftHand.name +
              ' healed you for ' +
              durabilityDamage +
              ' as you struck the enemy.'
          );
          this.characterService.characterState.status.health.value += durabilityDamage;
          this.characterService.characterState.checkOverage();
        }
        if (this.characterService.characterState.equipment.leftHand.weaponStats.durability <= 0) {
          this.inventoryService.addItem(this.characterService.characterState.equipment.leftHand);
          this.characterService.characterState.equipment.leftHand = null;
        }
      }
      if (
        this.characterService.characterState.equipment.rightHand &&
        this.characterService.characterState.equipment.rightHand.weaponStats
      ) {
        if (this.characterService.characterState.equipment.rightHand.weaponStats.effect === 'corruption') {
          this.characterService.characterState.equipment.rightHand.weaponStats.durability -=
            100 *
            (durabilityDamage +
              Math.floor(
                this.characterService.characterState.equipment.rightHand.weaponStats.durability * degradeFactor
              ));
        } else {
          this.characterService.characterState.equipment.rightHand.weaponStats.durability -=
            durabilityDamage +
            Math.floor(this.characterService.characterState.equipment.rightHand.weaponStats.durability * degradeFactor);
        }
        this.characterService.characterState.equipment.rightHand.value -=
          1 + Math.floor(this.characterService.characterState.equipment.rightHand.value * degradeFactor);
        if (this.characterService.characterState.equipment.rightHand.value < 1) {
          this.characterService.characterState.equipment.rightHand.value = 1;
        }
        this.characterService.characterState.equipment.rightHand.weaponStats.baseDamage -=
          1 +
          Math.floor(this.characterService.characterState.equipment.rightHand.weaponStats.baseDamage * degradeFactor);
        if (this.characterService.characterState.equipment.rightHand.weaponStats.baseDamage < 1) {
          this.characterService.characterState.equipment.rightHand.weaponStats.baseDamage = 1;
        }
        if (this.characterService.characterState.equipment.rightHand.weaponStats.effect === 'life') {
          this.logService.log(
            LogTopic.COMBAT,
            'Your ' +
              this.characterService.characterState.equipment.rightHand.name +
              ' healed you for ' +
              durabilityDamage +
              ' as you struck the enemy.'
          );
          this.characterService.characterState.status.health.value += durabilityDamage;
          this.characterService.characterState.checkOverage();
        }
        if (this.characterService.characterState.equipment.rightHand.weaponStats.durability <= 0) {
          this.inventoryService.addItem(this.characterService.characterState.equipment.rightHand);
          this.characterService.characterState.equipment.rightHand = null;
        }
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

  damageEnemy(damage: number, customMessage = ''): number {
    if (!this.currentEnemy) {
      return 0;
    }
    const enemyHealth = this.currentEnemy.enemy.health;
    this.currentEnemy.enemy.health = Math.floor(this.currentEnemy.enemy.health - damage);
    if (customMessage === '') {
      customMessage =
        'You attack ' + this.currentEnemy.enemy.name + ' for ' + this.bigNumberPipe.transform(damage) + ' damage';
    }
    damage -= enemyHealth;
    if (this.currentEnemy.enemy.health <= 0) {
      this.kills++;
      this.totalKills++;
      this.logService.log(LogTopic.COMBAT, 'You manage to kill ' + this.currentEnemy.enemy.name);
      if (this.currentEnemy.enemy.name === 'Death itself') {
        this.characterService.toast('HURRAY! Check your inventory. You just got something special!', 0);
      }
      for (const item of this.currentEnemy.enemy.loot) {
        const lootItem = this.itemRepoService.getItemById(item.id);
        if (lootItem) {
          this.inventoryService.addItem(lootItem);
        } else {
          // the item was generated, not part of the repo, so just add it instead of using the lookup
          this.inventoryService.addItem(item);
        }
      }
      this.currentEnemy.quantity--;
      this.defeatEffect(this.currentEnemy.enemy);
      if (this.currentEnemy.quantity <= 0) {
        const index = this.enemies.indexOf(this.currentEnemy);
        this.enemies.splice(index, 1);
        this.currentEnemy = null;
      } else {
        this.currentEnemy.enemy.health = this.currentEnemy.enemy.maxHealth;
      }
      return (damage - enemyHealth) / 2; // return half the damage left over
    } else {
      this.logService.log(LogTopic.COMBAT, customMessage);
      return 0;
    }
  }

  fight(enemyStack: EnemyStack) {
    this.currentEnemy = enemyStack;
  }

  addEnemy(enemy: Enemy) {
    this.totalEnemies++;
    this.logService.log(LogTopic.COMBAT, 'A new enemy comes along to trouble your sleep: ' + enemy.name);
    for (const enemyIterator of this.enemies) {
      if (enemyIterator.enemy.name === enemy.name) {
        // it matches an existing enemy, add it to the stack and bail out
        if (!enemy.unique) {
          enemyIterator.quantity++;
        }
        return;
      }
    }
    // it didn't match any, create a new enemyStack
    this.enemies.push({ enemy: enemy, quantity: 1 });
    if (this.currentEnemy === null) {
      this.currentEnemy = this.enemies[0];
    }
  }

  clearEnemies() {
    this.enemies = [];
    this.currentEnemy = null;
  }

  // generate a monster based on current troubleKills
  trouble() {
    if (this.enemies.length !== 0) {
      return;
    }
    if (this.hellService && this.hellService.inHell) {
      // let hellService handle the trouble while we're in hell
      this.hellService.trouble();
      return;
    }

    let health = this.troubleKills * 10;
    let attack = this.troubleKills / 5;
    let defense = this.troubleKills / 5;
    let gem;
    let monsterName;
    let monsterBaseName;
    if (this.godSlayersEnabled) {
      const index = this.godSlayerKills % this.monsterNames.length;
      const rank = Math.floor(this.godSlayerKills / this.monsterNames.length);
      monsterBaseName = this.monsterNames[index];
      monsterName = 'Godslaying ' + monsterBaseName;

      if (rank > 0) {
        monsterName += ' ' + (rank + 1);
      }

      attack = Math.round(Math.pow(1.1, this.godSlayerKills));
      defense = attack * 10;
      health = attack * 200;
      gem = this.inventoryService.generateSpiritGem(Math.ceil(this.godSlayerKills / 20));
      this.godSlayerKills++;
    } else {
      const rank = Math.floor(this.troubleKills / (this.monsterNames.length * this.monsterQualities.length));
      const index = this.troubleKills % (this.monsterNames.length * this.monsterQualities.length);
      const nameIndex = Math.floor(index / this.monsterQualities.length);
      const qualityIndex = index % this.monsterQualities.length;
      monsterBaseName = this.monsterNames[nameIndex];
      monsterName = this.monsterQualities[qualityIndex] + ' ' + this.monsterNames[nameIndex];
      if (rank > 0) {
        monsterName += ' ' + (rank + 1);
      }

      gem = this.inventoryService.generateSpiritGem(Math.floor(Math.log2(this.troubleKills + 2)));
      this.troubleKills++;
    }

    this.addEnemy({
      name: monsterName,
      baseName: monsterBaseName,
      health: health,
      maxHealth: health,
      accuracy: 0.5,
      attack: attack,
      defense: defense,
      loot: [gem],
    });
  }

  degradeArmor(armor: Equipment, damage: number) {
    let durabilityDamage = 1;
    if (damage > 20000) {
      // TODO: tune this
      durabilityDamage += Math.sqrt(damage - 20000);
    }
    if (armor.armorStats) {
      if (armor.armorStats.effect === 'corruption') {
        armor.armorStats.durability -=
          100 * (durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor));
      } else {
        armor.armorStats.durability -= durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor);
      }
      armor.value -= 1 + Math.floor(armor.value * this.degradeFactor);
      if (armor.value < 1) {
        armor.value = 1;
      }
      armor.armorStats.defense -= 1 + Math.floor(armor.armorStats.defense * this.degradeFactor);
      if (armor.armorStats.defense < 1) {
        armor.armorStats.defense = 1;
      }
      if (armor.armorStats.effect === 'life') {
        const amountHealed = (durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor)) * 10;
        this.logService.log(
          LogTopic.COMBAT,
          'Your ' + armor.name + ' healed you for ' + amountHealed + ' as the enemy struck it.'
        );
        this.characterService.characterState.status.health.value += amountHealed;
        this.characterService.characterState.checkOverage();
      }
      if (armor.armorStats.durability <= 0) {
        // it broke, unequip it
        this.inventoryService.addItem(armor);
        this.characterService.characterState.equipment[armor.slot] = null;
      }
    }
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
        accuracy: enemy.accuracy,
        attack: enemy.attack,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot,
      });
      this.addEnemy({
        name: enemy.name,
        baseName: enemy.baseName,
        health: enemy.maxHealth,
        maxHealth: enemy.maxHealth,
        accuracy: enemy.accuracy,
        attack: enemy.attack,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot,
      });
    }
  }

  attackEffect(enemy: Enemy) {
    if (!enemy.attackEffect) {
      return;
    }
    if (enemy.attackEffect === 'feeder' && this.hellService) {
      if (enemy.hitTracker !== undefined && enemy.hitTracker < 2) {
        enemy.hitTracker++;
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
    }
  }

  monsterNames = [
    'spider',
    'rat',
    'scorpion',
    'lizard',
    'snake',
    'jack-o-lantern',
    'gnome',
    'imp',
    'ooze',
    'jackalope',
    'pixie',
    'goblin',
    'monkey',
    'redcap',
    'boar',
    'skeleton',
    'zombie',
    'hobgoblin',
    'kobold',
    'chupacabra',
    'siren',
    'crocodile',
    'incubus',
    'succubus',
    'jackal', // need image
    'basilisk',
    'mogwai',
    'ghoul',
    'gremlin',
    'orc',
    'tiger',
    'ghost',
    'centaur',
    'troll',
    'manticore',
    'merlion',
    'mummy',
    'landshark',
    'bugbear',
    'yeti',
    'dreameater',
    'kelpie',
    'unicorn',
    'hippo',
    'ogre',
    'banshee',
    'harpy',
    'sphinx',
    'werewolf',
    'boogeyman',
    'golem',
    'leshy',
    'hellhound',
    'chimaera',
    'undine',
    'minotaur',
    'bunyip',
    'cyclops', //
    'rakshasa',
    'oni',
    'nyuk',
    'cavebear',
    'wendigo',
    'dinosaur',
    'wyvern',
    'doomworm',
    'lich',
    'thunderbird',
    'vampire',
    'beholder',
    'hydra',
    'roc',
    'wyrm',
    'giant',
    'kraken',
    'behemoth',
    'phoenix',
    'pazuzu',
    'titan',
    'leviathan',
    'stormbringer',
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
