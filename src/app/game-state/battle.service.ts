import { Injectable } from '@angular/core';
import { Equipment, Item } from '../game-state/inventory.service';
import { BigNumberPipe } from '../app.component';
import { ServicesService } from './services.service';

export interface Enemy {
  name: string,
  health: number,
  maxHealth: number,
  accuracy: number,
  attack: number,
  defense: number,
  loot: Item[],
  unique?: boolean,
  defeatEffect?: string,
  attackEffect?: string,
  hitTracker?: number
}

export interface EnemyStack {
  enemy: Enemy,
  quantity: number
}

export interface BattleProperties {
  enemies: EnemyStack[],
  currentEnemy: EnemyStack | null,
  kills: number,
  troubleKills: number,
  totalKills: number,
  autoTroubleUnlocked: boolean,
  autoTroubleEnabled: boolean,
  monthlyMonsterDay: number,
  manaShieldUnlocked: boolean,
  manaAttackUnlocked: boolean,
  pyroclasmUnlocked: boolean,
  metalFistUnlocked: boolean,
  fireShieldUnlocked: boolean,
  iceShieldUnlocked: boolean,
  enableManaShield: boolean,
  enableManaAttack: boolean,
  enablePyroclasm: boolean,
  enableMetalFist: boolean,
  enableFireShield: boolean,
  enableIceShield: boolean,
  highestDamageTaken: number,
  highestDamageDealt: number
}


@Injectable({
  providedIn: 'root'
})
export class BattleService {
  enemies: EnemyStack[] = [];
  currentEnemy: EnemyStack | null = null;
  kills = 0;
  troubleKills = 0;
  autoTroubleUnlocked = false;
  autoTroubleEnabled = false;
  yearlyMonsterDay = 0;
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
  tickCounter = 0;
  ticksPerFight = 10;
  highestDamageTaken = 0;
  highestDamageDealt = 0;
  totalKills = 0;
  skipEnemyAttack = 0;
  degradeFactor = 0.0000001;

  constructor(
    private services: ServicesService,
    private bigNumberPipe: BigNumberPipe,
  ) {}

  init(): BattleService {
    this.services.mainLoopService.tickSubject.subscribe(() => {
      if (this.services.characterService.characterState.dead) {
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

    this.services.reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

    return this;
  }

  reset() {
    this.clearEnemies();
    this.kills = 0;
    this.troubleKills = 0;
    this.yearlyMonsterDay = 0;
  }

  getProperties(): BattleProperties {
    return {
      enemies: this.enemies,
      currentEnemy: this.currentEnemy,
      kills: this.kills,
      troubleKills: this.troubleKills,
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
      highestDamageTaken: this.highestDamageTaken
    }
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.currentEnemy = properties.currentEnemy;
    this.kills = properties.kills;
    this.troubleKills = properties.troubleKills;
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
  }

  enemiesAttack() {
    if (this.skipEnemyAttack > 0) {
      this.skipEnemyAttack--;
      return;
    }

    for (const enemyStack of this.enemies) {
      for (let i = 0; i < enemyStack.quantity; i++) {
        if (Math.random() < enemyStack.enemy.accuracy) {
          let damage = enemyStack.enemy.attack;
          const defense = this.services.characterService.characterState.defense;
          // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
          if (defense >= 1) {
            damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
          }
          //Keep mice scary
          if (damage < 0.3) {
            damage = 0.3;
          }
          if (this.enableManaShield && this.services.characterService.characterState.status.mana.value > 10) {
            damage /= 2;
            this.services.characterService.characterState.status.mana.value -= 10;
          }
          let damageBack = false;
          if (this.enableFireShield && this.services.characterService.characterState.status.mana.value > 10000) {
            let fireDivisor = Math.log(this.services.characterService.characterState.attributes.fireLore.value) / Math.log(100);
            if (fireDivisor < 1) {
              fireDivisor = 1;
            }
            if (fireDivisor > 10) {
              fireDivisor = 10;
            }
            damage /= fireDivisor;
            this.services.characterService.characterState.status.mana.value -= 10000;
            damageBack = true;
          }
          if (this.enableIceShield && this.services.characterService.characterState.status.mana.value > 10000) {
            let waterDivisor = Math.log(this.services.characterService.characterState.attributes.waterLore.value) / Math.log(100);
            if (waterDivisor < 1) {
              waterDivisor = 1;
            }
            if (waterDivisor > 10) {
              waterDivisor = 10;
            }
            damage /= waterDivisor;
            this.services.characterService.characterState.status.mana.value -= 10000;
            this.skipEnemyAttack++;
          }
          if (this.services.characterService.characterState.yinYangUnlocked) {
            // reduce damage by up to half
            // TODO: tune this
            damage -= damage * (this.services.characterService.characterState.yinYangBalance / 2);
          }
          this.services.logService.addLogMessage("Ow! " + enemyStack.enemy.name + " hit you for " + this.bigNumberPipe.transform(damage) + " damage", 'INJURY', 'COMBAT');
          if (damageBack) {
            this.damageEnemy(damage, "The flames of your shield strike back, damaging the enemy for " + damage + " damage.");
          }
          if (damage > this.highestDamageTaken) {
            this.highestDamageTaken = damage;
          }
          this.services.characterService.characterState.status.health.value -= damage;
          this.services.characterService.characterState.increaseAttribute('toughness', 0.01);
          this.attackEffect(enemyStack.enemy);
          // degrade armor
          const degradables = [];
          if (this.services.characterService.characterState.equipment.head) {
            degradables.push(this.services.characterService.characterState.equipment.head);
          }
          if (this.services.characterService.characterState.equipment.body) {
            degradables.push(this.services.characterService.characterState.equipment.body);
          }
          if (this.services.characterService.characterState.equipment.legs) {
            degradables.push(this.services.characterService.characterState.equipment.legs);
          }
          if (this.services.characterService.characterState.equipment.feet) {
            degradables.push(this.services.characterService.characterState.equipment.feet);
          }
          if (degradables.length > 0) {
            this.degradeArmor(degradables[Math.floor(Math.random() * degradables.length)], damage);
          }

          if (this.services.characterService.characterState.status.health.value <= 0) {
            if (enemyStack.enemy.name === "Death itself") {
              this.services.logService.addLogMessage(enemyStack.enemy.name + " overkilled you by " + Math.floor(-this.services.characterService.characterState.status.health.value) + " damage. You were defeated.", 'INJURY', 'EVENT');
            } else {
              this.services.logService.addLogMessage("You were defeated by " + enemyStack.enemy.name, 'INJURY', 'EVENT');
            }
            if (!this.services.characterService.characterState.immortal) {
              this.services.characterService.characterState.dead = true;
            }
            if (this.services.hellService?.inHell) {
              this.services.hellService.beaten = true;
              this.clearEnemies();
            }
            return;
          }
        } else {
          this.services.logService.addLogMessage("Miss! " + enemyStack.enemy.name + " tries to hit you but fails.", 'STANDARD', 'COMBAT');
        }
      }
    }
  }

  youAttack() {
    this.services.characterService.characterState.accuracy = Math.min((this.troubleKills + Math.sqrt(this.services.characterService.characterState.attributes.speed.value)) / this.troubleKills / 2, 1)
    if (this.currentEnemy && this.services.characterService.characterState.status.health.value > 0) { // Check health for immortals
      if (Math.random() > this.services.characterService.characterState.accuracy) {
        this.services.logService.addLogMessage("You attack " + this.currentEnemy.enemy.name + " but miss.", 'STANDARD', 'COMBAT');
        return;
      }

      let damage = this.services.characterService.characterState.attackPower;
      const defense = this.currentEnemy.enemy.defense;
      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000, (-damage + defense) / defense));
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      if (this.enableManaAttack && this.services.characterService.characterState.status.mana.value > 10) {
        damage *= 2;
        this.services.characterService.characterState.status.mana.value -= 10;
      }
      let blowthrough = false;
      if (this.enableMetalFist && this.services.characterService.characterState.status.mana.value > 10000) {
        let metalMultiplier = Math.log(this.services.characterService.characterState.attributes.metalLore.value) / Math.log(50);
        if (metalMultiplier < 1) {
          metalMultiplier = 1;
        }
        if (metalMultiplier > 100) {
          metalMultiplier = 100;
        }
        damage *= metalMultiplier;
        this.services.characterService.characterState.status.mana.value -= 10000;
      }
      if (this.enablePyroclasm && this.services.characterService.characterState.status.mana.value > 10000) {
        let fireMultiplier = Math.log(this.services.characterService.characterState.attributes.fireLore.value) / Math.log(100);
        if (fireMultiplier < 1) {
          fireMultiplier = 1;
        }
        if (fireMultiplier > 10) {
          fireMultiplier = 10;
        }
        damage *= fireMultiplier;
        this.services.characterService.characterState.status.mana.value -= 10000;
        blowthrough = true;
      }
      if (this.services.characterService.characterState.yinYangUnlocked) {
        // TODO: tune this
        damage += damage * this.services.characterService.characterState.yinYangBalance;
      }
      if (this.services.characterService.characterState.equipment?.leftHand?.weaponStats?.effect === "corruption") {
        damage *= 10;
      }
      if (this.services.characterService.characterState.equipment?.rightHand?.weaponStats?.effect === "corruption") {
        damage *= 10;
      }
      if (this.services.characterService.characterState.equipment?.head?.armorStats?.effect === "corruption") {
        damage *= 2;
      }
      if (this.services.characterService.characterState.equipment?.body?.armorStats?.effect === "corruption") {
        damage *= 2;
      }
      if (this.services.characterService.characterState.equipment?.legs?.armorStats?.effect === "corruption") {
        damage *= 2;
      }
      if (this.services.characterService.characterState.equipment?.feet?.armorStats?.effect === "corruption") {
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
      if (this.services.characterService.characterState.equipment.leftHand && this.services.characterService.characterState.equipment.leftHand.weaponStats) {
        if (this.services.characterService.characterState.equipment.leftHand.weaponStats.effect === "corruption") {
          this.services.characterService.characterState.equipment.leftHand.weaponStats.durability -= 100 * (durabilityDamage + Math.floor(this.services.characterService.characterState.equipment.leftHand.weaponStats.durability * degradeFactor));
        } else {
          this.services.characterService.characterState.equipment.leftHand.weaponStats.durability -= durabilityDamage + Math.floor(this.services.characterService.characterState.equipment.leftHand.weaponStats.durability * degradeFactor);
        }
        this.services.characterService.characterState.equipment.leftHand.value -= 1 + Math.floor(this.services.characterService.characterState.equipment.leftHand.value * degradeFactor);
        if (this.services.characterService.characterState.equipment.leftHand.value < 1){
          this.services.characterService.characterState.equipment.leftHand.value = 1;
        }
        this.services.characterService.characterState.equipment.leftHand.weaponStats.baseDamage -= 1 + Math.floor(this.services.characterService.characterState.equipment.leftHand.weaponStats.baseDamage * degradeFactor);
        if (this.services.characterService.characterState.equipment.leftHand.weaponStats.baseDamage < 1){
          this.services.characterService.characterState.equipment.leftHand.weaponStats.baseDamage = 1;
        }
        if (this.services.characterService.characterState.equipment.leftHand.weaponStats.effect === "life") {
          this.services.logService.addLogMessage("Your " + this.services.characterService.characterState.equipment.leftHand.name + " healed you for " + durabilityDamage + " as you struck the enemy.", "STANDARD", "COMBAT");
          this.services.characterService.characterState.status.health.value += durabilityDamage;
          this.services.characterService.characterState.checkOverage();
        }
        if (this.services.characterService.characterState.equipment.leftHand.weaponStats.durability <= 0) {
          this.services.inventoryService.addItem(this.services.characterService.characterState.equipment.leftHand);
          this.services.characterService.characterState.equipment.leftHand = null;
        }
      }
      if (this.services.characterService.characterState.equipment.rightHand && this.services.characterService.characterState.equipment.rightHand.weaponStats) {
        if (this.services.characterService.characterState.equipment.rightHand.weaponStats.effect === "corruption") {
          this.services.characterService.characterState.equipment.rightHand.weaponStats.durability -= 100 * (durabilityDamage + Math.floor(this.services.characterService.characterState.equipment.rightHand.weaponStats.durability * degradeFactor));
        } else {
          this.services.characterService.characterState.equipment.rightHand.weaponStats.durability -= durabilityDamage + Math.floor(this.services.characterService.characterState.equipment.rightHand.weaponStats.durability * degradeFactor);
        }
        this.services.characterService.characterState.equipment.rightHand.value -= 1 + Math.floor(this.services.characterService.characterState.equipment.rightHand.value * degradeFactor);
        if (this.services.characterService.characterState.equipment.rightHand.value < 1){
          this.services.characterService.characterState.equipment.rightHand.value = 1;
        }
        this.services.characterService.characterState.equipment.rightHand.weaponStats.baseDamage -= 1 + Math.floor(this.services.characterService.characterState.equipment.rightHand.weaponStats.baseDamage * degradeFactor);
        if (this.services.characterService.characterState.equipment.rightHand.weaponStats.baseDamage < 1){
          this.services.characterService.characterState.equipment.rightHand.weaponStats.baseDamage = 1;
        }
        if (this.services.characterService.characterState.equipment.rightHand.weaponStats.effect === "life") {
          this.services.logService.addLogMessage("Your " + this.services.characterService.characterState.equipment.rightHand.name + " healed you for " + durabilityDamage + " as you struck the enemy.", "STANDARD", "COMBAT");
          this.services.characterService.characterState.status.health.value += durabilityDamage;
          this.services.characterService.characterState.checkOverage();
        }
        if (this.services.characterService.characterState.equipment.rightHand.weaponStats.durability <= 0) {
          this.services.inventoryService.addItem(this.services.characterService.characterState.equipment.rightHand);
          this.services.characterService.characterState.equipment.rightHand = null;
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

  damageEnemy(damage: number, customMessage = ""): number {
    if (!this.currentEnemy) {
      return 0;
    }
    const enemyHealth = this.currentEnemy.enemy.health;
    this.currentEnemy.enemy.health = Math.floor(this.currentEnemy.enemy.health - damage);
    if (customMessage === "") {
      customMessage = "You attack " + this.currentEnemy.enemy.name + " for " + this.bigNumberPipe.transform(damage) + " damage";
    }
    damage -= enemyHealth;
    if (this.currentEnemy.enemy.health <= 0) {
      this.kills++;
      this.totalKills++;
      this.services.logService.addLogMessage("You manage to kill " + this.currentEnemy.enemy.name, 'STANDARD', 'COMBAT');
      if (this.currentEnemy.enemy.name === "Death itself") {
        this.services.characterService.toast("HURRAY! Check your inventory. You just got something special!", 0);
      }      
      for (const item of this.currentEnemy.enemy.loot) {
        const lootItem = this.services.itemRepoService.getItemById(item.id);
        if (lootItem) {
          this.services.inventoryService.addItem(lootItem);
        } else {
          // the item was generated, not part of the repo, so just add it instead of using the lookup
          this.services.inventoryService.addItem(item);
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
      this.services.logService.addLogMessage(customMessage, 'STANDARD', 'COMBAT');
      return 0;
    }
  }

  fight(enemyStack: EnemyStack) {
    this.currentEnemy = enemyStack;
  }

  addEnemy(enemy: Enemy) {
    this.services.logService.addLogMessage("A new enemy comes along to trouble your sleep: " + enemy.name, 'STANDARD', 'COMBAT');
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
    if (this.services.hellService && this.services.hellService.inHell) {
      // let hellService handle the trouble while we're in hell
      this.services.hellService.trouble();
      return;
    }

    let health = this.troubleKills * 10;
    let attack = this.troubleKills / 5;
    let defense = this.troubleKills / 5;
    let gem;
    let monsterName;
    if (this.services.characterService.characterState.god){
      const index = this.troubleKills % (this.monsterNames.length);
      const rank = Math.floor(this.troubleKills / this.monsterNames.length);
      monsterName = "Godslaying " + this.monsterNames[index];
      if (rank > 0) {
        monsterName += " " + (rank + 1);
      }

      attack = Math.round(Math.pow(1.1, this.troubleKills));
      defense = attack * 10;
      health = attack * 200;
      gem = this.services.inventoryService.generateSpiritGem(Math.ceil(this.troubleKills / 30));
    } else {
      const rank = Math.floor(this.troubleKills / (this.monsterNames.length * this.monsterQualities.length));
      const index = this.troubleKills % (this.monsterNames.length * this.monsterQualities.length);
      const nameIndex = Math.floor(index / this.monsterQualities.length);
      const qualityIndex = index % this.monsterQualities.length;
      monsterName = this.monsterQualities[qualityIndex] + " " + this.monsterNames[nameIndex];
      if (rank > 0) {
        monsterName += " " + (rank + 1);
      }

      gem = this.services.inventoryService.generateSpiritGem(Math.floor(Math.log2(this.troubleKills + 2)));
    }

    
    this.addEnemy({
      name: monsterName,
      health: health,
      maxHealth: health,
      accuracy: 0.5,
      attack: attack,
      defense: defense,
      loot: [gem]
    });
    this.troubleKills++;
  }

  degradeArmor(armor: Equipment, damage: number) {
    let durabilityDamage = 1;
    if (damage > 20000) {
      // TODO: tune this
      durabilityDamage += Math.sqrt(damage - 20000);
    }
    if (armor.armorStats) {
      if (armor.armorStats.effect === "corruption") {
        armor.armorStats.durability -= 100 * (durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor));
      } else {
        armor.armorStats.durability -= durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor);
      }
      armor.value -= 1 + Math.floor(armor.value * this.degradeFactor);
      if (armor.value < 1){
        armor.value = 1;
      }
      armor.armorStats.defense -= 1 + Math.floor(armor.armorStats.defense * this.degradeFactor);
      if (armor.armorStats.defense < 1){
        armor.armorStats.defense = 1;
      }
      if (armor.armorStats.effect === "life") {
        const amountHealed = (durabilityDamage + Math.floor(armor.armorStats.durability * this.degradeFactor)) * 10;
        this.services.logService.addLogMessage("Your " + armor.name + " healed you for " + amountHealed + " as the enemy struck it.", "STANDARD", "COMBAT");
        this.services.characterService.characterState.status.health.value += amountHealed;
        this.services.characterService.characterState.checkOverage();
      }
      if (armor.armorStats.durability <= 0) {
        // it broke, unequip it
        this.services.inventoryService.addItem(armor);
        this.services.characterService.characterState.equipment[armor.slot] = null;
      }
    }
  }

  defeatEffect(enemy: Enemy) {
    if (!enemy.defeatEffect) {
      return;
    }
    if (enemy.defeatEffect === "respawnDouble") {
      // add two more of the same enemy
      this.services.logService.addLogMessage("They just keep coming! Two more " + enemy.name + " appear!", "STANDARD", "COMBAT");
      this.addEnemy({
        name: enemy.name,
        health: enemy.maxHealth,
        maxHealth: enemy.maxHealth,
        accuracy: enemy.accuracy,
        attack: enemy.attack,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot
      });
      this.addEnemy({
        name: enemy.name,
        health: enemy.maxHealth,
        maxHealth: enemy.maxHealth,
        accuracy: enemy.accuracy,
        attack: enemy.attack,
        defense: enemy.defense,
        defeatEffect: enemy.defeatEffect,
        loot: enemy.loot
      });
    }
  }

  attackEffect(enemy: Enemy) {
    if (!enemy.attackEffect) {
      return;
    }
    if (enemy.attackEffect === "feeder" && this.services.hellService) {
      if (enemy.hitTracker !== undefined && enemy.hitTracker < 2) {
        enemy.hitTracker++;
      } else {
        // force feed on third hit
        this.services.hellService.daysFasted = 0;
        const damage = this.services.characterService.characterState.status.health.value / 4;
        this.services.logService.addLogMessage("The hellfire burns as it goes down, damaging you for " + damage + " extra damage.", 'INJURY', 'COMBAT');
        this.services.characterService.characterState.status.health.value -= damage;
      }
    }
  }

  monsterNames = ["spider", "rat", "scorpion", "lizard", "snake", "jack-o-lantern", "gnome", "imp", "ooze", "jackalope",
    "pixie", "goblin", "monkey", "redcap", "boar", "skeleton", "zombie", "hobgoblin", "kobold",
    "chupacabra", "siren", "crocodile", "incubus", "succubus", "jackal", "basilisk", "mogwai", "ghoul", "gremlin", "orc",
    "tiger", "ghost", "centaur", "troll", "manticore", "merlion", "mummy", "landshark", "bugbear", "yeti",
    "dreameater", "kelpie", "unicorn", "hippo", "ogre", "banshee", "harpy", "sphinx", "werewolf", "boogeyman", "golem",
    "leshy", "hellhound", "chimaera", "undine", "minotaur", "bunyip", "cyclops", "rakshasa", "oni", "nyuk",
    "cavebear", "wendigo", "dinosaur", "wyvern", "doomworm", "lich", "thunderbird", "vampire", "beholder",
    "hydra", "roc", "wyrm", "giant", "kraken", "behemonth", "phoenix", "pazuzu", "titan", "leviathan", "stormbringer"
  ];

  monsterQualities = [
    "an infant", "a puny", "a tiny", "a pathetic", "a sickly", "a starving", "a wimpy", "a frail",
    "an ill", "a weak", "a badly wounded", "a tired", "a poor", "a small", "a despondent", "a frightened",
    "a skinny", "a sad", "a stinking", "a scatterbrained", "a mediocre", "a typical", "an average",
    "a healthy", "a big", "a tough", "a crazy", "a strong", "a fearsome", "a gutsy", "a quick",
    "a hefty", "a grotesque", "a large", "a brawny", "an athletic", "a muscular", "a rugged",
    "a resilient", "an angry", "a clever", "a fierce", "a brutal", "a devious", "a mighty",
    "a frightening", "a massive", "a powerful", "a noble", "a magical", "a dangerous", "a murderous",
    "a terrifying", "a gargantuan", "a flame-shrouded", "an abominable", "a monstrous", "a dominating",
    "a demonic", "a diabolical", "an infernal"
  ];
}
