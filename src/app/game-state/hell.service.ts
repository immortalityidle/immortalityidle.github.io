import { Injectable, signal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from './main-loop.service';
import { ActivityService } from './activity.service';
import { BattleService, EFFECT_CORRUPTION, EFFECT_FEEDER, EFFECT_POISON, EFFECT_ZOMBIE_DECOY } from './battle.service';
import { Activity, ActivityType, LocationType, Realm, YinYangEffect } from './activity';
import { FollowersService } from './followers.service';
import { InventoryService, Item } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { CONCEPT_BEASTS, ContemplationService } from './contemplation.service';

export interface Hell {
  name: string;
  description: string;
  index: number;
  entryEffect?: () => void;
  setPortals: () => void;
  dailyEffect?: () => void;
  exitEffect?: () => void;
  completeEffect: () => void;
  progress: () => number;
  progressMax: () => number;
  progressCache: number;
  progressMaxCache: number;
  tasksComplete?: boolean;
  complete?: boolean;
  activities: Activity[];
  projectionActivities: Activity[];
  hint: string;
  successCheck: () => boolean;
}

export interface HellProperties {
  inHell: boolean;
  hellUnlocked: boolean;
  completedHellTasks: number[];
  completedHellBosses: number[];
  mountainSteps: number;
  animalsHealed: number;
  boulderHeight: number;
  daysFasted: number;
  swimDepth: number;
  exitFound: boolean;
  soulsEscaped: number;
  relicsReturned: number;
  timesCrushed: number;
  contractsExamined: number;
  atonedKills: number;
  fasterHellMoney: boolean;
  burnedMoney: number;
}

@Injectable({
  providedIn: 'root',
})
export class HellService {
  inHell = signal<boolean>(false);
  hellUnlocked = signal<boolean>(false);
  completedHellTasks: number[] = [];
  completedHellBosses: number[] = [];
  beaten = false;
  mountainSteps = 0;
  animalsHealed = 0;
  boulderHeight = 0;
  daysFasted = 0;
  swimDepth = 0;
  exitFound = false;
  soulsEscaped = 0;
  relicsReturned = 0;
  timesCrushed = 0;
  contractsExamined = 0;
  atonedKills = 0;
  fasterHellMoney = false;
  burnedMoney = 0;
  hellBossBaseHealth = 1e36;
  baseHellBossDamage = 1e17;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    private activityService: ActivityService,
    private followersService: FollowersService,
    private battleService: BattleService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    private contemplationService: ContemplationService
  ) {
    mainLoopService.tickSubject.subscribe(() => {
      if (this.activityService.currentRealm >= this.hells.length) {
        // not currently in a hell, bail out
        return;
      }
      const hell = this.hells[this.activityService.currentRealm];
      if (hell.dailyEffect) {
        hell.dailyEffect();
      }
      if (this.beaten) {
        this.beaten = false;
        this.logService.injury(
          LogTopic.EVENT,
          "You fall to your knees, unable to bear more damage. You crawl back through this hell's gate to get a moment of respite at the gates of Lord Yama's realm."
        );
        this.battleService.enemies = [];
        this.battleService.currentEnemy = null;
        this.moveToHell(Realm.Gates);
      }
      this.checkHellCompletion();
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.returnToMortalRealm();
    });

    mainLoopService.longTickSubject.subscribe(() => {
      for (const hell of this.hells) {
        hell.progressCache = hell.progress();
        hell.progressMaxCache = hell.progressMax();
        hell.tasksComplete = this.completedHellTasks.includes(hell.index);
        hell.complete = this.completedHellBosses.includes(hell.index);
      }
    });
  }

  checkHellCompletion() {
    const hell = this.hells[this.activityService.currentRealm];
    if (!this.completedHellTasks.includes(this.activityService.currentRealm) && hell.successCheck()) {
      hell.completeEffect();
      this.completedHellTasks.push(this.activityService.currentRealm);
    }
  }

  returnToMortalRealm() {
    // reincarnation gets you out and back to the mortal realm
    if (this.inHell() && this.activityService.currentRealm < this.hells.length) {
      const leavingHell = this.hells[this.activityService.currentRealm];
      if (leavingHell.exitEffect) {
        leavingHell.exitEffect();
      }
    }
    this.inHell.set(false);
    this.activityService.portals = [this.activityService.returnToHell];
    this.activityService.currentRealm = Realm.MortalRealm;
  }

  enterTheHells() {
    this.inHell.set(true);
    this.hellUnlocked.set(true);
    this.moveToHell(Realm.Gates);
    this.characterService.updateMoney(0, true);
    this.inventoryService.stashInventory();
    this.followersService.hellPurge();
    this.activityService.checkRequirements(true);
  }

  moveToHell(hellIndex: number) {
    if (this.inHell() && this.activityService.currentRealm < this.hells.length) {
      const currentHell = this.hells[this.activityService.currentRealm];
      if (currentHell.exitEffect) {
        currentHell.exitEffect();
      }
    }
    this.activityService.currentRealm = hellIndex;
    const newHell = this.hells[this.activityService.currentRealm];
    if (newHell.entryEffect) {
      newHell.entryEffect();
    }
    newHell.setPortals();
    this.activityService.checkRequirements(true);
  }

  trouble() {
    if (this.activityService.currentRealm >= this.hells.length) {
      return;
    }
    // TODO: tune all of these values, and they should all scale up the longer you stay in/closer you get to finishing the hell
    const hellProgress = this.hells[this.activityService.currentRealm].progress();
    if (this.activityService.currentRealm === Realm.TongueRipping) {
      // monsters get stronger the more you've recruited/trained
      // tinker with stats/growth
      this.battleService.addEnemy({
        name: 'Tongue Ripper',
        baseName: 'tongueripper',
        health: 1e20 + 1e19 * hellProgress,
        maxHealth: 1e20 + 1e19 * hellProgress,
        defense: 1e8 + 1e7 * hellProgress,
        loot: [this.inventoryService.generateSpiritGem(Math.floor(Math.log2(hellProgress + 2)), EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6 + 1e4 * hellProgress,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.Scissors) {
      this.battleService.addEnemy({
        name: 'Scissors Demon',
        baseName: 'scissorsdemon',
        health: 1e15 + 1e14 * hellProgress,
        maxHealth: 1e15 + 1e14 * hellProgress,
        defense: 1e8 + 1e7 * hellProgress,
        loot: [
          this.inventoryService.generateSpiritGem(Math.floor(Math.log2(hellProgress + 2)), EFFECT_CORRUPTION),
          this.itemRepoService.items['fingers'],
        ],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6 + 1e4 * hellProgress,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.TreesOfKnives) {
      this.battleService.addEnemy({
        name: 'Hungry Crow',
        baseName: 'crow',
        health: 1e6,
        maxHealth: 1e6,
        defense: 1e6,
        loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.Mirrors) {
      this.battleService.addEnemy({
        name: 'Your Reflection',
        baseName: 'mirror',
        health: this.characterService.status.health.value,
        maxHealth: this.characterService.status.health.value,
        defense: this.characterService.defense,
        loot: [this.itemRepoService.items['mirrorShard']],
        techniques: this.battleService.techniques,
      });
    } else if (this.activityService.currentRealm === Realm.CauldronsOfOil) {
      this.battleService.addEnemy({
        name: 'Oiled Demon',
        baseName: 'oileddemon',
        health: 1e20 + 1e19 * hellProgress,
        maxHealth: 1e20 + 1e19 * hellProgress,
        defense: 1e8,
        loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.CattlePit) {
      if (this.animalsHealed <= 1000000) {
        for (let i = 0; i < 10; i++) {
          this.battleService.addEnemy({
            name: 'Demonic Cow',
            baseName: 'demoniccow',
            health: 1e20 + 1e19 * hellProgress,
            maxHealth: 1e20 + 1e19 * hellProgress,
            defense: 1e8,
            loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 1e6,
                unlocked: true,
              },
            ],
          });
        }
      }
    } else if (this.activityService.currentRealm === Realm.MortarsAndPestles) {
      this.battleService.addEnemy({
        name: 'Force Feeder',
        baseName: 'forcefeeder',
        health: 1e6,
        maxHealth: 1e6,
        defense: 1e6,
        loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Force Feeding',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6,
            effect: EFFECT_FEEDER,
            hitTracker: 0,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.Dismemberment) {
      this.battleService.addEnemy({
        name: 'Axe Demon',
        baseName: 'axedemon',
        health: 1e20 + 1e19 * hellProgress,
        maxHealth: 1e20 + 1e19 * hellProgress,
        defense: 1e8,
        loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6,
            unlocked: true,
          },
        ],
      });
    } else if (this.activityService.currentRealm === Realm.Saws) {
      this.battleService.addEnemy({
        name: 'Saw Demon',
        baseName: 'sawdemon',
        health: 1e20 + 1e19 * hellProgress,
        maxHealth: 1e20 + 1e19 * hellProgress,
        defense: 1e8,
        loot: [this.inventoryService.generateSpiritGem(25, EFFECT_CORRUPTION)],
        techniques: [
          {
            name: 'Attack',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1e6,
            unlocked: true,
          },
        ],
      });
    }
  }

  fightHellBoss() {
    if (this.activityService.currentRealm === Realm.TongueRipping) {
      this.battleService.addEnemy({
        name: 'Gorbolash the Gossip Gasher',
        baseName: 'Gorbolash',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownTongueRippers']],
        techniques: [
          {
            name: 'Verbal Barrage',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Cutting Words',
            ticks: 0,
            ticksRequired: 1,
            baseDamage: this.baseHellBossDamage * 0.2,
            unlocked: true,
          },
          {
            name: 'Backbiting Blow',
            ticks: 0,
            ticksRequired: 100,
            baseDamage: this.baseHellBossDamage * 200,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Scissors) {
      this.battleService.addEnemy({
        name: 'Malgorath the Marriage Masher',
        baseName: 'Malgorath',
        health: this.hellBossBaseHealth * 0.001,
        maxHealth: this.hellBossBaseHealth * 0.001,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownScissors']],
        techniques: [
          {
            name: 'Adulterating Strike',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Divisive Slice',
            ticks: 0,
            ticksRequired: 2,
            baseDamage: this.baseHellBossDamage * 0.5,
            unlocked: true,
          },
          {
            name: 'Contemptuous Cleave',
            ticks: 0,
            ticksRequired: 44,
            baseDamage: this.baseHellBossDamage * 444,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.TreesOfKnives) {
      this.battleService.addEnemy({
        name: 'Flamgolus the Family Flayer',
        baseName: 'Flamgolus',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownTreesOfKnives']],
        techniques: [
          {
            name: 'Quarrelous Clash',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage * 2,
            unlocked: true,
          },
          {
            name: 'Contentious Fist',
            ticks: 0,
            ticksRequired: 3,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: "Harmony's End",
            ticks: 0,
            ticksRequired: 777,
            baseDamage: this.baseHellBossDamage * 7777,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Mirrors) {
      this.battleService.addEnemy({
        name: 'Myorshuggath the Mirror Master',
        baseName: 'Myorshuggath',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownMirrors']],
        techniques: [
          {
            name: 'Shame',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Self Loathing',
            ticks: 0,
            ticksRequired: 2,
            baseDamage: this.baseHellBossDamage * 0.5,
            unlocked: true,
          },
          {
            name: 'Unending Guilt',
            ticks: 0,
            ticksRequired: 444,
            baseDamage: this.baseHellBossDamage * 4444,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Steamers) {
      this.battleService.addEnemy({
        name: 'Stactolus the Steamer',
        baseName: 'Stactolus',
        health: this.hellBossBaseHealth * 0.001,
        maxHealth: this.hellBossBaseHealth * 0.001,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownSteamers']],
        techniques: [
          {
            name: 'Flattering Words',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: 1,
            unlocked: true,
          },
          {
            name: 'Kind Face',
            ticks: 0,
            ticksRequired: 2,
            baseDamage: 1,
            unlocked: true,
          },
          {
            name: 'Treacherous Twist',
            ticks: 0,
            ticksRequired: 8888,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.CopperPillars) {
      this.battleService.addEnemy({
        name: 'Ignificor the Forever Burning',
        baseName: 'Ignificor',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownPillars']],
        techniques: [
          {
            name: 'Blazing Bolt',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage * 5,
            unlocked: true,
          },
          {
            name: 'Shower of Sparks',
            ticks: 0,
            ticksRequired: 1,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Tempting Immolation',
            ticks: 0,
            ticksRequired: 4444,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.MountainOfKnives) {
      this.battleService.addEnemy({
        name: 'Malignus the Murderer Muncher',
        baseName: 'Malignus',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownMountainOfKnives']],
        techniques: [
          {
            name: 'Murderous Rampage',
            ticks: 0,
            ticksRequired: 3,
            baseDamage: this.baseHellBossDamage * 20,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.MountainOfIce) {
      this.battleService.addEnemy({
        name: 'The Cheat',
        baseName: 'Cheat',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownMountainOfIce']],
        techniques: [
          {
            name: 'Stacked Deck',
            ticks: 0,
            ticksRequired: 3,
            baseDamage: this.baseHellBossDamage * 10,
            unlocked: true,
          },
          {
            name: 'Loaded Dice',
            ticks: 0,
            ticksRequired: 5,
            baseDamage: this.baseHellBossDamage * 18,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.CauldronsOfOil) {
      this.battleService.addEnemy({
        name: 'Nestor the Molestor',
        baseName: 'Nestor',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownCauldronsOfOil']],
        techniques: [
          {
            name: 'Shameful Thoughts',
            ticks: 0,
            ticksRequired: 1,
            baseDamage: this.baseHellBossDamage * 10,
            unlocked: true,
          },
          {
            name: 'Disgusting Disgrace',
            ticks: 0,
            ticksRequired: 8,
            baseDamage: this.baseHellBossDamage * 18,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.CattlePit) {
      this.battleService.addEnemy({
        name: 'The Cow Emperor',
        baseName: 'CowEmperor',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownCattlePit']],
        techniques: [
          {
            name: 'MOOOOOOO!!!',
            ticks: 0,
            ticksRequired: 10,
            baseDamage: this.baseHellBossDamage * 25,
            unlocked: true,
          },
          {
            name: 'Devil Milk Flood',
            ticks: 0,
            ticksRequired: 1000,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.CrushingBoulder) {
      this.battleService.addEnemy({
        name: 'The Crusher',
        baseName: 'Crusher',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownCrushingBoulder']],
        techniques: [
          {
            name: 'Crush!',
            ticks: 0,
            ticksRequired: 100,
            baseDamage: this.baseHellBossDamage * 250,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.MortarsAndPestles) {
      this.battleService.addEnemy({
        name: 'Glorbulskath the Gluttonous',
        baseName: 'Glorbulskath',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownMortarsAndPestles']],
        techniques: [
          {
            name: 'Greedy Gobbling',
            ticks: 0,
            ticksRequired: 1,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Big Bite',
            ticks: 0,
            ticksRequired: 44,
            baseDamage: this.baseHellBossDamage * 44,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.BloodPool) {
      this.battleService.addEnemy({
        name: 'Gnarlyathor the Ever-Bleeding',
        baseName: 'Gnarlyathor',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownBloodPool']],
        techniques: [
          {
            name: 'Mocking Jeer',
            ticks: 0,
            ticksRequired: 4,
            baseDamage: this.baseHellBossDamage * 4,
            unlocked: true,
          },
          {
            name: 'Disdainful Slap',
            ticks: 0,
            ticksRequired: 44,
            baseDamage: this.baseHellBossDamage * 44,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.WrongfulDead) {
      this.battleService.addEnemy({
        name: 'Azoth-Raketh the Storm Master',
        baseName: 'Azoth-Raketh',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownWrongfulDead']],
        techniques: [
          {
            name: 'Cleansing Rain',
            ticks: 0,
            ticksRequired: 2,
            baseDamage: this.baseHellBossDamage,
            unlocked: true,
          },
          {
            name: 'Merciful Thunderclap',
            ticks: 0,
            ticksRequired: 4444,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Dismemberment) {
      this.battleService.addEnemy({
        name: 'Druskall the Dismemberer',
        baseName: 'Druskall',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownDismemberment']],
        techniques: [
          {
            name: 'Boneyard Reconstruction',
            ticks: 0,
            ticksRequired: 14,
            baseDamage: 1,
            effect: EFFECT_ZOMBIE_DECOY,
            unlocked: true,
          },
          {
            name: 'Sever Limbs',
            ticks: 0,
            ticksRequired: 44,
            baseDamage: this.baseHellBossDamage * 444,
            unlocked: true,
          },
          {
            name: 'Decapitating Strike',
            ticks: 0,
            ticksRequired: 444,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.MountainOfFire) {
      this.battleService.addEnemy({
        name: 'Magmar the Lava King',
        baseName: 'Magmar',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownFireMountain']],
        techniques: [
          {
            name: 'Choking Ash',
            ticks: 0,
            ticksRequired: 4,
            baseDamage: this.baseHellBossDamage * 7,
            unlocked: true,
          },
          {
            name: 'Lava Bomb',
            ticks: 0,
            ticksRequired: 44,
            baseDamage: this.baseHellBossDamage * 444,
            unlocked: true,
          },
          {
            name: 'Eruption',
            ticks: 0,
            ticksRequired: 77,
            baseDamage: this.baseHellBossDamage * 777,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Mills) {
      this.battleService.addEnemy({
        name: 'Grimstone The Human Grinder',
        baseName: 'Grimstone',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownMills']],
        techniques: [
          {
            name: 'Cruel Oppression',
            ticks: 0,
            ticksRequired: 7,
            baseDamage: this.baseHellBossDamage * 77,
            unlocked: true,
          },
          {
            name: 'Tyranical Domination',
            ticks: 0,
            ticksRequired: 77,
            baseDamage: this.baseHellBossDamage * 777,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    } else if (this.activityService.currentRealm === Realm.Saws) {
      this.battleService.addEnemy({
        name: 'Crognaslark the Corrupter',
        baseName: 'Crognaslark',
        health: this.hellBossBaseHealth,
        maxHealth: this.hellBossBaseHealth,
        defense: 1e12,
        loot: [this.itemRepoService.items['hellCrownSaws']],
        techniques: [
          {
            name: 'Sly Swipe',
            ticks: 0,
            ticksRequired: 4,
            baseDamage: this.baseHellBossDamage * 2,
            unlocked: true,
          },
          {
            name: 'Bilking Blow',
            ticks: 0,
            ticksRequired: 22,
            baseDamage: this.baseHellBossDamage * 22,
            unlocked: true,
          },
          {
            name: 'Unrefusable Deal',
            ticks: 0,
            ticksRequired: 4848,
            baseDamage: this.baseHellBossDamage * 1e50,
            unlocked: true,
          },
        ],
        resistances: [EFFECT_POISON],
      });
    }
  }

  getProperties(): HellProperties {
    return {
      inHell: this.inHell(),
      hellUnlocked: this.hellUnlocked(),
      completedHellTasks: this.completedHellTasks,
      completedHellBosses: this.completedHellBosses,
      mountainSteps: this.mountainSteps,
      animalsHealed: this.animalsHealed,
      boulderHeight: this.boulderHeight,
      daysFasted: this.daysFasted,
      swimDepth: this.swimDepth,
      exitFound: this.exitFound,
      soulsEscaped: this.soulsEscaped,
      relicsReturned: this.relicsReturned,
      timesCrushed: this.timesCrushed,
      contractsExamined: this.contractsExamined,
      atonedKills: this.atonedKills,
      fasterHellMoney: this.fasterHellMoney,
      burnedMoney: this.burnedMoney,
    };
  }

  setProperties(properties: HellProperties) {
    this.inHell.set(properties.inHell);
    this.hellUnlocked.set(properties.hellUnlocked);
    this.completedHellTasks = properties.completedHellTasks || [];
    this.completedHellBosses = properties.completedHellBosses || [];
    this.mountainSteps = properties.mountainSteps || 0;
    this.animalsHealed = properties.animalsHealed || 0;
    this.boulderHeight = properties.boulderHeight || 0;
    this.daysFasted = properties.daysFasted || 0;
    this.swimDepth = properties.swimDepth || 0;
    this.exitFound = properties.exitFound || false;
    this.soulsEscaped = properties.soulsEscaped || 0;
    this.relicsReturned = properties.relicsReturned || 0;
    this.timesCrushed = properties.timesCrushed || 0;
    this.contractsExamined = properties.contractsExamined || 0;
    this.atonedKills = properties.atonedKills || 0;
    this.fasterHellMoney = properties.fasterHellMoney || false;
    this.burnedMoney = properties.burnedMoney || 0;
  }

  hells: Hell[] = [
    {
      name: 'Gates of Hell',
      description:
        "The gates of Lord Yama's realm.<br>An array of frightening gates allow you to select the various hells and their challenges.<br>If you are overwhelmed by these horrors, you can always escape back to the mortal realm through reincarnation.",
      index: Realm.Gates,
      setPortals: () => {
        this.activityService.portals = [];
        let allComplete = true;
        for (const hell of this.hells) {
          if (hell.index === Realm.Gates) {
            continue;
          }
          let consequenceDescription = '';
          if (this.completedHellBosses.includes(hell.index)) {
            consequenceDescription = 'You have proven your mastery over this hell.';
          } else if (this.completedHellTasks.includes(hell.index)) {
            consequenceDescription = 'The Lord of this Hell is available to challenge.';
            allComplete = false;
          } else {
            allComplete = false;
          }
          this.activityService.portals.push({
            level: 0,
            name: [hell.name],
            location: LocationType.Hell,
            activityType: ActivityType.Hell + hell.index,
            description: [hell.description],
            yinYangEffect: [YinYangEffect.None],
            consequenceDescription: [consequenceDescription],
            consequence: [
              () => {
                this.moveToHell(hell.index);
              },
            ],
            requirements: [{}],
            unlocked: true,
            skipApprenticeshipLevel: 0,
            resourceUse: [],
          });
        }
        if (allComplete) {
          this.activityService.portals.push(this.activityService.FinishHell);
        }
      },
      completeEffect: () => {
        // Yama's reward drops from killing him
      },
      activities: [
        this.activityService.Resting,
        this.activityService.CombatTraining,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.InfuseBody,
        this.activityService.PurifyGems,
        this.activityService.InfuseEquipment,
      ],
      projectionActivities: [],
      hint: '',
      progress: () => {
        if (this.characterService.god()) {
          return 1;
        } else {
          return 0;
        }
      },
      progressMax: () => {
        return 1;
      },
      successCheck: () => {
        return this.characterService.god();
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Tongue-ripping',
      description:
        'Torment for gossips and everyone one who made trouble with their words.<br>The demons here reach for your tongue to rip it out.',
      index: Realm.TongueRipping,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.followersService.stashFollowers();
      },
      dailyEffect: () => {
        // This might be a stupid way to nerf charisma. Consider other alternatives.
        const reducer = 0.9;
        this.characterService.attributes.charisma.value *= reducer;
      },
      exitEffect: () => {
        this.followersService.restoreFollowers();
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'Together with your new followers, you have seized control of the Hell of Tongue-ripping. Now all that remains is to defeat its lord.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.hellRecruiting,
        this.activityService.TrainingFollowers,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "It's hard to talk with all these demons going for your mouth, but maybe if you can get some help from the other prisoners here you could take control of this place.",
      progress: () => {
        if (this.inHell()) {
          let totalPower = 0;
          for (const follower of this.followersService.followers) {
            totalPower += follower.power;
          }
          return Math.min(totalPower, 5000);
        } else {
          return 0;
        }
      },
      progressMax: () => {
        return 5000;
      },
      successCheck: () => {
        let totalPower = 0;
        for (const follower of this.followersService.followers) {
          totalPower += follower.power;
        }
        return totalPower > 5000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Scissors',
      description: 'Torment for those who ruin marriages.<br>The demons here will cut your fingers right off.',
      index: Realm.Scissors,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.inventoryService.stashWeapons();
      },
      exitEffect: () => {
        this.inventoryService.restoreWeapons();
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'Using nothing but the strength of your body and mind, you have seized control of the Hell of Scissors.<br>Now all that remains is to defeat its lord.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.Taunting,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "These demons don't seem content to just take your fingers. You'd better get ready to defend yourself.",
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('fingers'), 100);
      },
      progressMax: () => {
        return 100;
      },
      successCheck: () => {
        return this.inventoryService.getQuantityByName('fingers') >= 100;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Trees of Knives',
      description:
        'Torment for those who cause trouble between family members.<br>The demons here will tie you to a tree made of sharp knives',
      index: Realm.TreesOfKnives,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.characterService.stashMoney();
      },
      dailyEffect: () => {
        // lose 10% of your health every day
        const damage = this.characterService.status.health.value * 0.1;
        this.logService.injury(LogTopic.COMBAT, 'The knives dig into your flesh, causing ' + damage + ' damage.');
        this.characterService.status.health.value -= damage;
      },
      exitEffect: () => {
        this.characterService.restoreMoney();
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You have reconciled yourself with all of your family members and satisfied the demands of this hell. Now all that remains is to defeat its lord (while still tied to this tree).'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.HonorAncestors,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'Heal your family bonds.',
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('token of gratitude'), 10000);
      },
      progressMax: () => {
        return 10000;
      },
      successCheck: () => {
        return this.inventoryService.getQuantityByName('token of gratitude') >= 10000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Mirrors',
      description:
        'Torment for those who escaped punishment for their crimes.<br>The mirrors here shine with a terrifying glow.',
      index: Realm.Mirrors,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.followersService.stashFollowers();
      },
      exitEffect: () => {
        this.followersService.restoreFollowers();
      },
      completeEffect: () => {
        this.inventoryService.consume('mirrorShard', 1000);
        this.logService.log(
          LogTopic.STORY,
          'You piece together the shards of mirror that you have collected to form a new mirror. A dark shape looms beyond it.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.CombatTraining,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.Taunting,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'Master yourself. All by yourself.',
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('mirror shard'), 1000);
      },
      progressMax: () => {
        return 1000;
      },
      successCheck: () => {
        return this.inventoryService.getQuantityByName('mirror shard') >= 1000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Steamers',
      description: 'Torment for hypocrites and ruffians.<br>The steam baskets here are just the right size for you.',
      index: Realm.Steamers,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.inventoryService.stashWeapons();
        this.inventoryService.stashArmor();
      },
      exitEffect: () => {
        this.activityService.portals = [this.activityService.escapeHell];
        this.inventoryService.restoreWeapons();
        this.inventoryService.restoreArmor();
      },
      dailyEffect: () => {
        // take damage from the steam and get robbed by ruffians
        if (this.inventoryService.consume('iceCore') < 0) {
          const damage = this.characterService.status.health.value * 0.05;
          this.logService.injury(LogTopic.COMBAT, 'The steam cooks your skin, causing ' + damage + ' damage.');
          this.characterService.status.health.value -= damage;
        }
        if (Math.random() < 0.2) {
          this.logService.log(
            LogTopic.EVENT,
            "As if the constant scalding steam isn't enough, one of these ruffians stole some money! Why does this feel so familiar?"
          );
          this.characterService.hellMoney -= this.characterService.hellMoney * 0.1;
        }
      },
      completeEffect: () => {
        this.battleService.clearEnemies();
        this.logService.log(
          LogTopic.STORY,
          'You defeat so many ruffians that the rest all beg to return to their baskets for their regular torment.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.Taunting,
        this.activityService.Rehabilitation,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'There so many ruffians here that deserve some payback from you. I wonder if you can take them all on.',
      progress: () => {
        return Math.min(this.battleService.enemies.length, 100);
      },
      progressMax: () => {
        return 100;
      },
      successCheck: () => {
        return this.battleService.enemies.length > 100; // tune this
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Copper Pillars',
      description:
        'Torment for arsonists.<br>The red-hot copper pillars you will be bound to remind you of all those times you played with fire.',
      index: Realm.CopperPillars,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.inventoryService.stashWeapons();
      },
      exitEffect: () => {
        this.inventoryService.restoreWeapons();
      },
      dailyEffect: () => {
        // take damage from the pillar
        if (this.inventoryService.consume('iceCore') < 0) {
          const damage = Math.max(this.characterService.status.health.value * 0.1, 20);
          this.characterService.status.health.value -= damage;
          this.logService.injury(LogTopic.COMBAT, 'The heat of the pillars burns you for ' + damage + ' damage.');
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You finally forge a hammer powerful enough to break through the chains that bind you to the pillar. The Lord of this Hell comes to investigate all the commotion as the chains fall to the ground.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.CopperMining,
        this.activityService.ForgeHammer,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "You'll need a really strong hammer to break through these hellsteel chain. Too bad the only material around is copper.",
      progress: () => {
        if (this.characterService.equipment.rightHand?.name === 'Copper Hammer') {
          return Math.min(this.characterService.equipment.rightHand?.weaponStats?.baseDamage || 0, 100);
        } else {
          return 0;
        }
      },
      progressMax: () => {
        return 100;
      },
      successCheck: () => {
        return (this.characterService.equipment.rightHand?.weaponStats?.baseDamage || 0) > 100; // tune this
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Mountain of Knives',
      description:
        'Torment for those who killed for pleasure.<br>The mountain of sharp blades looks like it might be rough on footwear.',
      index: Realm.MountainOfKnives,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      dailyEffect: () => {
        let damage = this.battleService.totalKills / 100 - this.mountainSteps - this.atonedKills;
        this.atonedKills++;
        if (damage < 0) {
          damage = 0;
        }
        this.characterService.status.health.value -= damage;
        if (damage > 0) {
          this.logService.injury(LogTopic.COMBAT, "The mountain's blades shred you for " + damage + ' damage.');
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          "You finally reach the peak. The karmic weight of all the killing you've ever done drops from your shoulders. Now to defeat this hell's lord without taking any pleasure in the act."
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.ClimbMountain,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "It seems you've accrued a lot of karma from all the killing you've done over your many lives. The bill is due.",
      progress: () => {
        return Math.min(this.mountainSteps, this.battleService.totalKills / 100);
      },
      progressMax: () => {
        return this.battleService.totalKills / 100;
      },
      successCheck: () => {
        // let's just say that 99% of our kills were justified and we didn't enjoy them one bit. Still gotta pay for the other 1%.
        return this.mountainSteps >= this.battleService.totalKills / 100;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Mountain of Ice',
      description:
        'Torment for adulterers and schemers.<br>The chill wind blowing through the gate is so cold it burns.',
      index: Realm.MountainOfIce,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          "You realize that the power of the ice cores is all that prevents the heat from the neighboring hells from turning the mountain into slush. With enough of these tucked away in your pack, the mountain dwindles down to a managable size. Now to see who's in charge around here."
        );
      },
      dailyEffect: () => {
        // TODO: tune this
        const damage = 1000;
        if (this.inventoryService.consume('fireCore') < 0) {
          this.characterService.status.health.value -= damage;
          this.logService.injury(LogTopic.COMBAT, "The mountain's ice freezes you for " + damage + ' damage.');
        }
        // This might be a stupid way to nerf fireLore. Consider other alternatives.
        const reducer = 0.9;
        this.characterService.attributes.fireLore.value *= reducer;
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.Taunting,
        this.activityService.MeltMountain,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'Burn it down!',
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('ice core'), 10000);
      },
      progressMax: () => {
        return 10000;
      },
      successCheck: () => {
        return this.inventoryService.getQuantityByName('ice core') >= 10000; // TODO: tune this
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Cauldrons of Oil',
      description: 'Torment for rapists and abusers.<br>Next on the menu: deep fried immortal.',
      index: Realm.CauldronsOfOil,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      dailyEffect: () => {
        if (!this.completedHellTasks.includes(Realm.CauldronsOfOil)) {
          if (this.inventoryService.consume('iceCore') > 0) {
            this.logService.injury(
              LogTopic.EVENT,
              'The ice cores you brought in with you make the oil sputter and pop, baking you in a cloud of superheated steam.'
            );
            this.characterService.status.health.value -= 100000;
            return;
          }
          // take damage from the oil
          const damage = Math.max(this.characterService.status.health.value * 0.1, 20);
          this.logService.injury(LogTopic.COMBAT, 'The oil scorches you, causing ' + damage + ' damage.');
          this.characterService.status.health.value -= damage;
        }
        // chance to drop weapon
        if (Math.random() < 0.1) {
          this.logService.injury(LogTopic.COMBAT, 'Your weapons slip from your oily hands.');
          this.inventoryService.autoequipBestEnabled = false;
          let item = this.characterService.equipment.rightHand;
          // check for existence and make sure there's an empty slot for it
          if (item) {
            this.inventoryService.addItem(item as Item);
            this.characterService.equipment.rightHand = null;
          }
          item = this.characterService.equipment.leftHand;
          // check for existence and make sure there's an empty slot for it
          if (item) {
            this.inventoryService.addItem(item as Item);
            this.characterService.equipment.leftHand = null;
          }
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'The pile of ice cores you brought in with you make the oil sputter and pop, but you are tough enough to withstand the superheated steam. Out of the cauldron now, you look around for the boss.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "You'd need to be incredibly resilient to survive this place.",
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('ice core'), 1000);
      },
      progressMax: () => {
        return 1000;
      },
      successCheck: () => {
        return (
          this.inventoryService.getQuantityByName('ice core') >= 1000 &&
          this.characterService.status.health.value > 100000
        );
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Cattle Pit',
      description: 'Torment for animal abusers.<br>The cows are looking a little restless.',
      index: Realm.CattlePit,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      completeEffect: () => {
        this.contemplationService.discoverConcept(CONCEPT_BEASTS);
        this.logService.log(
          LogTopic.STORY,
          "The horde of rampaging cattle finally seems to understand that you're not there to hurt them. They back off and leave you alone. All except for that really big cow over there."
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.HealAnimals,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'Look at those poor sick cows. And those other cows that for some reason are standing up on two legs and charging you with weapons.',
      progress: () => {
        return Math.min(this.animalsHealed, 1000000);
      },
      progressMax: () => {
        return 1000000;
      },
      successCheck: () => {
        return this.animalsHealed > 1000000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Crushing Boulder',
      description:
        'Torment for child-killers and abandoners where the damned have to lift giant boulders or be crushed under them.<br>Atlas had it easy compared to these people.',
      index: Realm.CrushingBoulder,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.boulderHeight = 0;
      },
      dailyEffect: () => {
        if (this.boulderHeight > 100) {
          return;
        }
        // TODO: tune this
        const damage = 500;
        this.characterService.status.health.value -= damage;
        this.logService.injury(LogTopic.COMBAT, 'The boulder crushes you for ' + damage + ' damage.');
        if (Math.random() < 0.1) {
          this.battleService.addEnemy({
            name: 'An Annoying Imp',
            baseName: 'imp',
            health: 10,
            maxHealth: 10,
            defense: 100,
            loot: [],
            techniques: [
              {
                name: 'Attack',
                ticks: 0,
                ticksRequired: 10,
                baseDamage: 100,
                unlocked: true,
              },
            ],
          });
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You hoist the boulder high over your head, then throw it high into the air. It lands with a satisfying thud. Unfortunately, it grows arms and legs and walks back to you, and this time it looks angry.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.LiftBoulder,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "It's leg day. No, it's arm day. Must be both! Lift!",
      progress: () => {
        return Math.min(this.boulderHeight, 1000);
      },
      progressMax: () => {
        return 1000;
      },
      successCheck: () => {
        return this.boulderHeight > 1000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Mortars and Pestles',
      description:
        "Torment for food wasters.<br>You didn't really need to eat all those peaches, did you?<br>The diet here is pure hellfire.",
      index: Realm.MortarsAndPestles,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      dailyEffect: () => {
        this.daysFasted++;
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'Your righteous asceticism have served you well. The lord of this hell has arrived to deal with you personally.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'You begin to feel remorse for your gluttony across your many lives. Perhaps a nice, long fast would help you feel better. Hopefully you can keep the demons from spoonfeeding you their fiery concoction.',
      progress: () => {
        return Math.min(this.daysFasted, 1000);
      },
      progressMax: () => {
        return 1000;
      },
      successCheck: () => {
        return this.daysFasted > 1000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Blood Pool',
      description:
        "Torment for those who disrespect others.<br>The pool looks deep, but it's hard to tell with all that blood.",
      index: Realm.BloodPool,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        this.swimDepth = 0;
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You finally reach the bottom of the pool where you find a massive plug. When you pull it, the pool begins to drain, revealing the source of all this blood.'
        );
      },
      activities: [this.activityService.HellSwim],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'Not this again!',
      progress: () => {
        return Math.min(this.swimDepth);
      },
      progressMax: () => {
        return 10000;
      },
      successCheck: () => {
        return this.swimDepth > 10000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Wrongful Dead',
      description:
        "Torment for those who gave up their lives too early.<br>Fortunately you've probably never done that.<br>The pounding Rains of Pain and the blowing Winds of Sorrow give unrelenting misery to everyone here.",
      index: Realm.WrongfulDead,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      entryEffect: () => {
        if (this.exitFound) {
          if (!this.hells[Realm.WrongfulDead].activities.includes(this.activityService.TeachTheWay)) {
            this.hells[Realm.WrongfulDead].activities.push(this.activityService.TeachTheWay);
          }
        }
      },
      dailyEffect: () => {
        this.logService.injury(LogTopic.COMBAT, 'The constant storm saps you of 500 health and 100 stamina.');
        this.characterService.status.health.value -= 500;
        this.characterService.status.stamina.value -= 100;
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You sigh in relief as you usher the last of the damned out. The hell is finally empty. Well, empty except for the monstrous Hell Lord coming toward you.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.SearchForExit,
        this.activityService.TeachTheWay,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: "These people don't belong here. Get them out.",
      progress: () => {
        return Math.min(this.soulsEscaped, 1000000);
      },
      progressMax: () => {
        return 1000000;
      },
      successCheck: () => {
        return this.soulsEscaped > 1000000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Dismemberment',
      description:
        'Torment for tomb-raiders and grave-robbers.<br>The demons here look awfully handy with those giant axes.',
      index: Realm.Dismemberment,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'As you help more of the damned here to resolve their crimes, an angry cry sounds through the hell. The lord has arrived.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.Interrogate,
      ],
      projectionActivities: [
        this.activityService.OddJobs,
        this.activityService.BurnMoney,
        this.activityService.RecoverTreasure,
        this.activityService.ReplaceTreasure,
      ],
      hint: 'Unloot those tombs.',
      progress: () => {
        return Math.min(this.relicsReturned, 10000);
      },
      progressMax: () => {
        return 10000;
      },
      successCheck: () => {
        // TODO: tune this
        return this.relicsReturned > 10000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of the Mountain of Fire',
      description:
        'Torment for thieves.<br>The volcano where the poor souls are thrown looks a little toasty for comfort.',
      index: Realm.MountainOfFire,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      dailyEffect: () => {
        // take damage from the volcano
        if (this.inventoryService.consume('iceCore') < 0) {
          const damage = Math.max(this.characterService.status.health.value * 0.1, 20);
          this.logService.injury(
            LogTopic.COMBAT,
            'The oppressive heat of the volcano burns you for ' + damage + ' damage.'
          );
          this.characterService.status.health.value -= damage;
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You realize that the power of the fire cores is essential to keeping the lava in the volcano liquid. With enough of these tucked away in your pack, the the surface finally cools enough to turn back to stone. Someone is not happy with this change.'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.FreezeMountain,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'How does this volcano stay so hot?',
      progress: () => {
        return Math.min(this.inventoryService.getQuantityByName('fire core'), 10000);
      },
      progressMax: () => {
        return 10000;
      },
      successCheck: () => {
        return this.inventoryService.getQuantityByName('fire core') >= 10000; // TODO: tune this
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Mills',
      description:
        "Torment for any who abused their power to oppress the weak.<br>You don't look forward to being ground into immortal flour.",
      index: Realm.Mills,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          "Your karmic debt for all the oppression you've ever inflicted is paid off. Now you just need to show the strongest demon here not to pick on the weak."
        );
      },
      activities: [this.activityService.EndureTheMill],
      projectionActivities: [],
      hint: 'Just endure.',
      progress: () => {
        return Math.min(this.timesCrushed, this.characterService.totalLives * 100);
      },
      progressMax: () => {
        return this.characterService.totalLives * 100;
      },
      successCheck: () => {
        return this.timesCrushed > this.characterService.totalLives * 100;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
    {
      name: 'Hell of Saws',
      description:
        "Torment for swindlers and business cheats.<br>The demons sharpen their saws and grin at you.<br>You wish now that you'd stayed out of politics.",
      index: Realm.Saws,
      setPortals: () => {
        this.activityService.portals = [this.activityService.escapeHell];
      },
      dailyEffect: () => {
        if (this.contractsExamined <= 20000) {
          // saw damage
          this.logService.injury(LogTopic.COMBAT, 'The saws tear into your flesh, causing 100 damage.');
          this.characterService.status.health.value -= 100;
        }
      },
      completeEffect: () => {
        this.logService.log(
          LogTopic.STORY,
          'You finally find article 131 of bylaw 8888 subsection 42(b)6.42 where paragraph fourty-eight clearly states that you have the right to confront the Hell Lord. Time to party!'
        );
      },
      activities: [
        this.activityService.Resting,
        this.activityService.MindCultivation,
        this.activityService.BodyCultivation,
        this.activityService.CoreCultivation,
        this.activityService.SoulCultivation,
        this.activityService.ExamineContracts,
      ],
      projectionActivities: [this.activityService.OddJobs, this.activityService.BurnMoney],
      hint: 'You read legalese, right?',
      progress: () => {
        return Math.min(this.contractsExamined, 20000);
      },
      progressMax: () => {
        return 20000;
      },
      successCheck: () => {
        // TODO: tune this
        return this.contractsExamined > 20000;
      },
      progressCache: 0,
      progressMaxCache: 1,
    },
  ];
}
