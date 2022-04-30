import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';

export interface Enemy {
  name: string,
  health: number,
  maxHealth: number,
  accuracy: number,
  attack: number,
  defense: number,
};

export interface EnemyStack {
  enemy: Enemy,
  quantity: number
}

@Injectable({
  providedIn: 'root'
})
export class BattleService {
  //TODO: add this to save/load functions

  enemies: EnemyStack[];
  currentEnemy: EnemyStack | null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    this.enemies = [];
    this.currentEnemy = null;

    mainLoopService.tickSubject.subscribe((newDay) => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (newDay) {
        if (this.currentEnemy == null && this.enemies.length > 0){
          this.currentEnemy = this.enemies[0];
        }
        this.enemiesAttack();
        this.youAttack();
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  reset(){
    this.enemies = [];
  }

  enemiesAttack(){
    for (const enemyStack of this.enemies){
      for (let i = 0; i < enemyStack.quantity; i++){
        if (Math.random() < enemyStack.enemy.accuracy / 100){
          this.logService.addLogMessage("Ow! " + enemyStack.enemy.name + " hit you for " + enemyStack.enemy.attack + " damage", 'INJURY', 'COMBAT');
          this.characterService.characterState.status.health.value -= enemyStack.enemy.attack;
          // TODO: decide if we always get tougher by getting attacked
          this.characterService.characterState.attributes.toughness.value += .01;
        }
      }
    }
  }

  youAttack(){
    if (this.currentEnemy){
      // TODO make this depend on things like your stats and gear and the enemy's defense
      this.currentEnemy.enemy.health -= 1;
      if (this.currentEnemy.enemy.health <= 0){
        this.logService.addLogMessage("You manage to kill " + this.currentEnemy.enemy.name, 'STANDARD', 'COMBAT');
        this.currentEnemy.quantity--;
        if (this.currentEnemy.quantity <= 0){
          let index = this.enemies.indexOf(this.currentEnemy);
          this.enemies.splice(index, 1);
          this.currentEnemy = null;
        } else {
          this.currentEnemy.enemy.health = this.currentEnemy.enemy.maxHealth;
        }
      } else {
        this.logService.addLogMessage("You attack " + this.currentEnemy.enemy.name, 'STANDARD', 'COMBAT');
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

  addItem(item: Item): void {
  }

  enemyRepo = {
    mouse: {
      name: "a pesky mouse",
      health: 2,
      maxHealth: 2,
      accuracy: 5,
      attack: 0.5,
      defense: 0,
    }
  }

}
