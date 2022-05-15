import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { ItemRepoService } from '../game-state/item-repo.service';

export interface Enemy {
  name: string,
  health: number,
  maxHealth: number,
  accuracy: number,
  attack: number,
  defense: number,
  loot: Item[]
};

export interface EnemyStack {
  enemy: Enemy,
  quantity: number
}

export interface BattleProperties {
  enemies: EnemyStack[],
  currentEnemy: EnemyStack | null,
  kills: number,
  troubleKills: number
}


@Injectable({
  providedIn: 'root'
})
export class BattleService {
  //TODO: add this to save/load functions

  enemies: EnemyStack[];
  currentEnemy: EnemyStack | null;
  kills: number;
  troubleKills: number;


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

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.currentEnemy == null && this.enemies.length > 0){
        this.currentEnemy = this.enemies[0];
      }
      this.enemiesAttack();
      this.youAttack();
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  reset(){
    this.enemies = [];
    this.currentEnemy = null;
    this.kills = 0;
  }

  getProperties(): BattleProperties {
    return {
      enemies: this.enemies,
      currentEnemy: this.currentEnemy,
      kills: this.kills,
      troubleKills: this.troubleKills
    }
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.currentEnemy = properties.currentEnemy;
    this.kills = properties.kills;
    this.troubleKills = properties.troubleKills;
  }

  enemiesAttack(){
    for (const enemyStack of this.enemies){
      for (let i = 0; i < enemyStack.quantity; i++){
        if (Math.random() < enemyStack.enemy.accuracy / 100){
          this.logService.addLogMessage("Ow! " + enemyStack.enemy.name + " hit you for " + enemyStack.enemy.attack + " damage", 'INJURY', 'COMBAT');
          this.characterService.characterState.status.health.value -= enemyStack.enemy.attack;
          // TODO: decide if we always get tougher by getting attacked
          this.characterService.characterState.attributes.toughness.value += .01;
        } else {
          this.logService.addLogMessage("Miss! " + enemyStack.enemy.name + " tries to hit you but fails.", 'STANDARD', 'COMBAT');
        }
      }
    }
  }

  youAttack(){
    if (this.currentEnemy){
      // TODO add stat scaling
      let damage = 1;
      if (this.characterService.characterState.equipment.leftHand){
        damage += (this.characterService.characterState.equipment.leftHand.weaponStats?.baseDamage || 0);
      }
      if (this.characterService.characterState.equipment.rightHand){
        damage += (this.characterService.characterState.equipment.rightHand.weaponStats?.baseDamage || 0);
      }
      damage -= this.currentEnemy.enemy.defense;
      if (damage < 1){
        // pity damage
        damage = 1;
      }

      this.currentEnemy.enemy.health -= damage;

      if (this.currentEnemy.enemy.health <= 0){
        this.kills++;
        this.logService.addLogMessage("You manage to kill " + this.currentEnemy.enemy.name, 'STANDARD', 'COMBAT');
        for (let item of this.currentEnemy.enemy.loot){
          this.inventoryService.addItem(item);
        }
        this.currentEnemy.quantity--;
        if (this.currentEnemy.quantity <= 0){
          let index = this.enemies.indexOf(this.currentEnemy);
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
      if (enemyIterator.enemy.name == enemy.name) {
        // it matches an existing enemy, add it to the stack and bail out
        enemyIterator.quantity++;
        return;
      }
    }
    // it didn't match any, create a new enemyStack
    this.enemies.push({enemy: JSON.parse(JSON.stringify(enemy)), quantity: 1});
  }

  // generate a monster based on current troubleKills
  trouble(){
    if (this.enemies.length != 0){
      return;
    }
    let rank = Math.floor(this.troubleKills / (this.monsterNames.length * this.monsterQualities.length));
    let index = this.troubleKills % (this.monsterNames.length * this.monsterQualities.length);
    let nameIndex = Math.floor(index / this.monsterQualities.length);
    let qualityIndex = index % this.monsterQualities.length;

    let monsterName = this.monsterQualities[qualityIndex] + " " + this.monsterNames[nameIndex];
    if (rank > 0){
      monsterName += " " + (rank + 1);
    }

    this.addEnemy({
      name: monsterName,
      health: this.troubleKills * 10,
      maxHealth: this.troubleKills * 10,
      accuracy: 50,
      attack: this.troubleKills / 10,
      defense: Math.floor(Math.log2(this.troubleKills)),
      loot: []
    });
    this.troubleKills++;
  }

  enemyRepo = {
    mouse: {
      name: "a pesky mouse",
      health: 2,
      maxHealth: 2,
      accuracy: 5,
      attack: 0.5,
      defense: 0,
      loot: []
    },
    wolf: {
      name: "a hungry wolf",
      health: 20,
      maxHealth: 20,
      accuracy: 50,
      attack: 5,
      defense: 2,
      loot: [
        this.itemRepoService.items['meat'],
        this.itemRepoService.items['hide']
      ]
    }
  }

  monsterNames = ["spider", "rat", "lizard", "snake", "imp", "jackalope", "goblin", "zombie", "hobgoblin",
    "basilisk", "mogwai", "gremlin", "orc", "tiger", "ghost", "troll", "manticore", "merlion",
    "bugbear", "yeti", "dreameater", "unicorn", "hellhound", "chimaera", "undine", "minotaur", "bunyip",
    "wyvern", "doomworm", "giant", "phoenix", "titan", "stormbringer"];

  monsterQualities = [
    "a pathetic", "an infant", "a sickly", "a wimpy", "a weak", "a tired", "a poor",
    "an average", "a healthy", "a big", "a tough", "a strong", "a mighty", "a powerful",
    "a dangerous", "a terrifying", "an abominable", "a demonic", "a diabolical", "an infernal"
  ];
}
