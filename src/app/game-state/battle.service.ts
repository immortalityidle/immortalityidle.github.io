import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { Equipment, InventoryService, Item } from '../game-state/inventory.service';
import { MainLoopService } from './main-loop.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { HellService } from './hell.service';
import { BigNumberPipe } from '../app.component';
import { HomeService, HomeType } from './home.service';

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

export interface BattleProperties {
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  kills: number;
  troubleKills: number;
  godSlayerKills: number;
  totalKills: number;
  autoTroubleUnlocked: boolean;
  autoTroubleEnabled: boolean;
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
}

export interface Technique {
  name: string;
  ticks: number;
  ticksRequired: number;
  baseDamage: number;
  hitTracker?: number;
  effect?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  bigNumberPipe: BigNumberPipe;
  hellService?: HellService;
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  kills: number;
  troubleKills: number;
  godSlayerKills: number;
  autoTroubleUnlocked = false;
  autoTroubleEnabled = false;
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
  techniques: Technique[] = [
    {
      name: 'Basic Strike',
      ticksRequired: 10,
      ticks: 0,
      baseDamage: 1,
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
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.enemies = [];
    this.currentEnemy = null;
    this.kills = 0;
    this.troubleKills = 0;
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
      if (this.yearlyMonsterDay >= 365 || this.autoTroubleEnabled) {
        this.yearlyMonsterDay = 0;
        this.trouble();
      }
    });

    mainLoopService.battleTickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }

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
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
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
    };
  }

  setProperties(properties: BattleProperties) {
    this.enemies = properties.enemies;
    this.kills = properties.kills;
    this.troubleKills = properties.troubleKills;
    this.godSlayerKills = properties.godSlayerKills || 0;
    this.totalKills = properties.totalKills || 0;
    this.autoTroubleUnlocked = properties.autoTroubleUnlocked;
    this.autoTroubleEnabled = properties.autoTroubleEnabled;
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
    if (this.enemies.length > 0) {
      for (const enemy of this.enemies) {
        if (enemy.name === properties.currentEnemy?.name) {
          this.currentEnemy = enemy;
        }
      }
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
    for (const technique of this.techniques) {
      if (technique.ticks === technique.ticksRequired) {
        this.youAttack(technique);
        technique.ticks = 0;
      } else {
        technique.ticks++;
      }
    }
  }

  youAttack(technique: Technique) {
    if (this.currentEnemy && this.characterService.characterState.status.health.value > 0) {
      let damage = this.characterService.characterState.attackPower * technique.baseDamage;
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
      let blowthrough = false;
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
      return (damage - enemyHealth) / 2; // return half the damage left over
    } else {
      this.logService.log(LogTopic.COMBAT, customMessage);
      return 0;
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
      defense: defense,
      loot: [gem],
      techniques: [
        {
          name: 'Attack',
          ticks: 0,
          ticksRequired: 10,
          baseDamage: attack,
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
    'jackal',
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
