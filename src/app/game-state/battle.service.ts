import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { formatNumber } from '@angular/common';

export interface Enemy {
  name: string,
  health: number,
  maxHealth: number,
  accuracy: number,
  attack: number,
  defense: number,
  loot: Item[]
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
  autoTroubleUnlocked: boolean,
  autoTroubleEnabled: boolean,
  monthlyMonsterDay: number,
  manaShieldUnlocked: boolean,
  manaAttackUnlocked: boolean,
  enableManaShield: boolean,
  enableManaAttack: boolean
}


@Injectable({
  providedIn: 'root'
})
export class BattleService {

  enemies: EnemyStack[];
  currentEnemy: EnemyStack | null;
  kills: number;
  troubleKills: number;
  autoTroubleUnlocked = false;
  autoTroubleEnabled = false;
  yearlyMonsterDay: number;
  enableManaShield = false;
  enableManaAttack = false;
  manaShieldUnlocked = false;
  manaAttackUnlocked = false;
  tickCounter: number;
  ticksPerFight = 10;
  highestGem = 0;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private itemRepoService: ItemRepoService,
    private inventoryService: InventoryService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    this.enemies = [];
    this.currentEnemy = null;
    this.kills = 0;
    this.troubleKills = 0;
    this.yearlyMonsterDay = 0;
    this.tickCounter = 0;

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.tickCounter < this.ticksPerFight){
        this.tickCounter++;
        return;
      }
      this.tickCounter = 0;
      if (this.currentEnemy === null && this.enemies.length > 0){
        this.currentEnemy = this.enemies[0];
      }
      this.enemiesAttack();
      this.youAttack();
      this.yearlyMonsterDay++;
      if (this.yearlyMonsterDay >= 365){
        this.yearlyMonsterDay = 0;
        this.trouble();
      }
      if (this.autoTroubleEnabled){
        this.trouble();
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  reset(){
    this.enemies = [];
    this.currentEnemy = null;
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
      autoTroubleUnlocked: this.autoTroubleUnlocked,
      autoTroubleEnabled: this.autoTroubleEnabled,
      monthlyMonsterDay: this.yearlyMonsterDay,
      manaShieldUnlocked: this.manaShieldUnlocked,
      manaAttackUnlocked: this.manaAttackUnlocked,
      enableManaShield: this.enableManaShield,
      enableManaAttack: this.enableManaAttack,
    }
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.currentEnemy = properties.currentEnemy;
    this.kills = properties.kills;
    this.troubleKills = properties.troubleKills;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.autoTroubleEnabled = properties.autoTroubleEnabled;
    this.yearlyMonsterDay = properties.monthlyMonsterDay;
    this.enableManaShield = properties.enableManaShield;
    this.enableManaAttack = properties.enableManaAttack;
  }

  enemiesAttack(){
    for (const enemyStack of this.enemies){
      for (let i = 0; i < enemyStack.quantity; i++){
        if (Math.random() < enemyStack.enemy.accuracy){
          let damage = enemyStack.enemy.attack;
          const defense = this.characterService.characterState.defense;
          // The curve slopes nicely at 20k. No reason, just relative comparison. Higher for gentler slope, closer to 1 for sharper.
          if (defense >= 1) {
            damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000 , (-damage + defense) / defense) );
          }
          //Keep mice scary
          if (damage < this.enemyRepo.mouse.attack) {
            damage = this.enemyRepo.mouse.attack;
          }
          if (this.enableManaShield && this.characterService.characterState.status.mana.value > 10){
            damage /= 2;
            this.characterService.characterState.status.mana.value -= 10;
          }
          this.logService.addLogMessage("Ow! " + enemyStack.enemy.name + " hit you for " + formatNumber(damage,"en-US", "1.0-2") + " damage", 'INJURY', 'COMBAT');
          this.characterService.characterState.status.health.value -= damage;
          this.characterService.characterState.increaseAttribute('toughness', 0.01);

          // degrade armor
          const degradables = [];
          if (this.characterService.characterState.equipment.head){
            degradables.push(this.characterService.characterState.equipment.head);
          }
          if (this.characterService.characterState.equipment.body){
            degradables.push(this.characterService.characterState.equipment.body);
          }
          if (this.characterService.characterState.equipment.legs){
            degradables.push(this.characterService.characterState.equipment.legs);
          }
          if (this.characterService.characterState.equipment.feet){
            degradables.push(this.characterService.characterState.equipment.feet);
          }
          if (degradables.length > 0){
            this.degradeArmor(degradables[Math.floor(Math.random() * degradables.length)]);
          }

          if (this.characterService.characterState.status.health.value <= 0){
            this.logService.addLogMessage("You were defeated by " + enemyStack.enemy.name, 'INJURY', 'EVENT');
            if (!this.characterService.characterState.immortal){
              this.characterService.characterState.dead = true;
            }
            return;
          }
        } else {
          this.logService.addLogMessage("Miss! " + enemyStack.enemy.name + " tries to hit you but fails.", 'STANDARD', 'COMBAT');
        }
      }
    }
  }

  youAttack(){
    if (this.currentEnemy){

      if (Math.random() > this.characterService.characterState.accuracy){
        this.logService.addLogMessage("You attack " + this.currentEnemy.enemy.name + " but miss.", 'STANDARD', 'COMBAT');
        return;
      }

      let damage = this.characterService.characterState.attackPower;
      const defense = this.currentEnemy.enemy.defense;
      if (defense >= 1) {
        damage = damage / (Math.pow(defense, 0.2) + Math.pow(20000 , (-damage + defense) / defense) );
      }
      // pity damage
      if (damage < 1) {
        damage = 1;
      }
      if (this.enableManaAttack && this.characterService.characterState.status.mana.value > 10){
        damage *= 2;
        this.characterService.characterState.status.mana.value -= 10;
      }
      this.currentEnemy.enemy.health = Math.floor(this.currentEnemy.enemy.health - damage);
      // degrade weapon
      if (this.characterService.characterState.equipment.leftHand && this.characterService.characterState.equipment.leftHand.weaponStats){
        this.characterService.characterState.equipment.leftHand.weaponStats.durability--;
        this.inventoryService.updateWeaponDescription(this.characterService.characterState.equipment.leftHand);
        if (this.characterService.characterState.equipment.leftHand.weaponStats.durability <= 0){
          this.inventoryService.addItem(this.characterService.characterState.equipment.leftHand);
          this.characterService.characterState.equipment.leftHand = null;
        }
      }
      if (this.characterService.characterState.equipment.rightHand && this.characterService.characterState.equipment.rightHand.weaponStats){
        this.characterService.characterState.equipment.rightHand.weaponStats.durability--;
        this.inventoryService.updateWeaponDescription(this.characterService.characterState.equipment.rightHand);
        if (this.characterService.characterState.equipment.rightHand.weaponStats.durability <= 0){
          this.inventoryService.addItem(this.characterService.characterState.equipment.rightHand);
          this.characterService.characterState.equipment.rightHand = null;
        }
      }

      if (this.currentEnemy.enemy.health <= 0){
        this.kills++;
        this.logService.addLogMessage("You manage to kill " + this.currentEnemy.enemy.name, 'STANDARD', 'COMBAT');
        for (const item of this.currentEnemy.enemy.loot){
          const lootItem = this.itemRepoService.getItemById(item.id);
          if (lootItem){
            this.inventoryService.addItem(lootItem);
          } else {
            // the item was generated, not part of the repo, so just add it instead of using the lookup
            this.inventoryService.addItem(item);
          }
        }
        this.currentEnemy.quantity--;
        if (this.currentEnemy.quantity <= 0){
          const index = this.enemies.indexOf(this.currentEnemy);
          this.enemies.splice(index, 1);
          this.currentEnemy = null;
        } else {
          this.currentEnemy.enemy.health = this.currentEnemy.enemy.maxHealth;
        }
      } else {
        this.logService.addLogMessage("You attack " + this.currentEnemy.enemy.name + " for " + damage + " damage", 'STANDARD', 'COMBAT');
      }
    }
  }

  fight(enemyStack: EnemyStack){
    this.currentEnemy = enemyStack;
  }

  addEnemy(enemy: Enemy){
    this.logService.addLogMessage("A new enemy comes along to trouble your sleep: " + enemy.name, 'STANDARD', 'COMBAT');
    for (const enemyIterator of this.enemies) {
      if (enemyIterator.enemy.name === enemy.name) {
        // it matches an existing enemy, add it to the stack and bail out
        enemyIterator.quantity++;
        return;
      }
    }
    // it didn't match any, create a new enemyStack
    this.enemies.push({enemy: JSON.parse(JSON.stringify(enemy)), quantity: 1});
    if (this.currentEnemy === null){
      this.currentEnemy = this.enemies[0];
    }

  }

  // generate a monster based on current troubleKills
  trouble(){
    if (this.enemies.length != 0){
      return;
    }
    const rank = Math.floor(this.troubleKills / (this.monsterNames.length * this.monsterQualities.length));
    const index = this.troubleKills % (this.monsterNames.length * this.monsterQualities.length);
    const nameIndex = Math.floor(index / this.monsterQualities.length);
    const qualityIndex = index % this.monsterQualities.length;

    let monsterName = this.monsterQualities[qualityIndex] + " " + this.monsterNames[nameIndex];
    if (rank > 0){
      monsterName += " " + (rank + 1);
    }

    const gem = this.inventoryService.generateSpiritGem(Math.floor(Math.log2(this.troubleKills + 2)));
    this.addEnemy({
      name: monsterName,
      health: this.troubleKills * 10,
      maxHealth: this.troubleKills * 10,
      accuracy: 0.5,
      attack: this.troubleKills / 5,
      defense: this.troubleKills / 5,
      loot: [gem]
    });
    this.troubleKills++;
  }

  degradeArmor(armor: Equipment){
    if (armor.armorStats){
      armor.armorStats.durability--;
      this.inventoryService.updateArmorDescription(armor);
      if (armor.armorStats.durability <= 0){
        // it broke, unequip it
        this.inventoryService.addItem(armor);
        this.characterService.characterState.equipment[armor.slot] = null;
      }
    }
  }

  // Don't put items with use() functions in the loot (like food). They don't get persisted.
  enemyRepo = {
    mouse: {
      name: "a pesky mouse",
      health: 2,
      maxHealth: 2,
      accuracy: 0.15,
      attack: 0.3,
      defense: 0,
      loot: []
    },
    wolf: {
      name: "a hungry wolf",
      health: 20,
      maxHealth: 20,
      accuracy: 0.5,
      attack: 5,
      defense: 5,
      loot: [
        this.itemRepoService.items['hide']
      ]
    },
    army: {
      name: "an angry army",
      health: 20000000,
      maxHealth: 20000000, 
      accuracy: 0.9,
      attack: 10000000,
      defense: 10000000, 
      loot: []
    },
    death: {
      name: "Death itself",
      health: 1000000000000000, // Make Death last 85k years when fighting with level 10 scount and a 1 billion attack weapon. That's about 3 full days of real time right now.
      maxHealth: 1000000000000000, // but 1 billion attack takes less than a full realtime day, and they'll probably be improving the weapon during the fight too.
      accuracy: 0.99,
      attack: 100000000,
      defense: 100000000,
      loot: [
        this.itemRepoService.items['immortality']
      ]
    }
  }

  monsterNames = ["spider", "rat", "lizard", "snake", "imp", "ooze", "jackalope", "goblin", "monkey", "redcap",
    "skeleton", "zombie", "hobgoblin", "kobold", "chupacabra", "incubus", "succubus", "jackal",
    "basilisk", "mogwai", "ghoul", "gremlin", "orc", "tiger", "ghost", "troll", "manticore", "merlion", "landshark",
    "bugbear", "yeti", "dreameater", "unicorn", "ogre", "banshee", "harpy", "werewolf", "golem", "leshy",
    "hellhound", "chimaera", "undine", "minotaur", "bunyip", "cyclops", "rakshasa", "oni", "nyuk", "cavebear",
    "wendigo", "dinosaur", "wyvern", "doomworm", "thunderbird", "vampire", "beholder", "hydra",
    "roc", "giant", "kraken", "phoenix", "pazuzu", "titan", "leviathan", "stormbringer"];

  monsterQualities = [
    "an infant", "a puny", "a pathetic", "a sickly", "a starving", "a wimpy", "a weak", "a badly wounded",
    "a tired", "a poor", "a small", "a despondent", "a frightened", "a skinny", "a sad", "a stinking", "a typical",
    "an average", "a healthy", "a big", "a tough", "a strong", "a fearsome", "a gutsy", "a quick",
    "a hefty", "a brawny", "an athletic", "a muscular", "a rugged", "a resilient", "an angry",
    "a clever", "a fierce", "a devious", "a mighty", "a powerful", "a noble", "a magical",
    "a dangerous", "a terrifying", "a flame-shrouded", "an abominable", "a monstrous",
    "a dominating", "a demonic", "a diabolical", "an infernal"
  ];
}
