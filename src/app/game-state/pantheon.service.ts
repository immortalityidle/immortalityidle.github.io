import { Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { LocationType, Realm } from './location.service';
import { BattleService, EFFECT_DOOM, EFFECT_POISON, Technique } from './battle.service';
import { Item } from './inventory.service';
import { MainLoopService } from './main-loop.service';

export const PANTHEON_CELESTIAL_EMPIRE = 'Celestial Empire';

export const GOD_YAMA = 'Yama';

export const GOD_HERMES = 'Hermes';
export const GOD_ARES = 'Ares';
export const GOD_DIONYSUS = 'Dionysus';
export const GOD_HEPHAESTUS = 'Hephaestus';
export const GOD_APHRODITE = 'Aphrodite';
export const GOD_ARTEMIS = 'Artemis';
export const GOD_APOLLO = 'Apollo';
export const GOD_ATHENA = 'Athena';
export const GOD_DEMETER = 'Demeter';
export const GOD_HERA = 'Hera';
export const GOD_POSEIDON = 'Poseidon';
export const GOD_HADES = 'Hades';
export const GOD_ZEUS = 'Zeus';

export interface God {
  name: WritableSignal<string>;
  description: WritableSignal<string>;
  timesDefeated: WritableSignal<number>;
  discovered: WritableSignal<boolean>;
  unlocked: WritableSignal<boolean>;
  unlockProgress: WritableSignal<number>;
  unlockProgressRequired: WritableSignal<number>;
  unlockProgressPercent: WritableSignal<number>;
  baseDamage: number;
  baseDefense: number;
  baseHealth: number;
  techniqueNames: string[];
  techniqueCooldowns: number[];
  challengeMessage: WritableSignal<string>;
  attributes: string[];
}

export interface Pantheon {
  name: WritableSignal<string>;
  description: WritableSignal<string>;
  gods: God[];
  unlocked: WritableSignal<boolean>;
  collapsed: WritableSignal<boolean>;
}

export interface GodSaveData {
  name: string;
  timesDefeated: number;
  discovered: boolean;
  unlocked: boolean;
  unlockProgress: number;
}

export interface PantheonSaveData {
  name: string;
  unlocked: boolean;
  collapsed: boolean;
  godSaveData: GodSaveData[];
}

export interface PantheonProperties {
  pantheons: PantheonSaveData[];
}

@Injectable({
  providedIn: 'root',
})
export class PantheonService {
  greekBaseHealth = 1e44;
  greekBaseDefense = 1e28;
  greekBaseDamage = 1e30;

  pantheons: Pantheon[] = [
    {
      name: signal<string>(Realm.PhilosopherStates),
      description: signal<string>(
        'The domain of fractious gods worshipped by strange city states far away from the civilized world.'
      ),
      unlocked: signal<boolean>(false),
      collapsed: signal<boolean>(false),
      gods: [
        {
          name: signal<string>(GOD_HERMES),
          description: signal<string>(
            'The messenger of the philospher states gods, a god of travel and thieves. He seems weak but quick.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(10000),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage,
          baseDefense: this.greekBaseDefense,
          baseHealth: this.greekBaseHealth,
          techniqueNames: ['Fast Jab', 'Winged Kick', 'Staff Strike'],
          techniqueCooldowns: [1, 2, 20],
          challengeMessage: signal<string>(
            "You're looking for a duel?<br><br>Are you mad, barbarian?<br><br>I don't have time to fight you right now!<br><br>I need to get these messages delivered!"
          ),
          attributes: ['justice', 'wisdom', 'mercy', 'presence', 'wrath'],
        },
        {
          name: signal<string>(GOD_DIONYSUS),
          description: signal<string>(
            'A god of wine, which is strangely made from grapes instead of rice in his land.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e9,
          baseDefense: this.greekBaseDefense * 1e9,
          baseHealth: this.greekBaseHealth * 1e9,
          techniqueNames: ['Wine Splash', 'Grape Crush', 'Drowned Sorrows'],
          techniqueCooldowns: [5, 50, 500],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_ARTEMIS),
          description: signal<string>(
            'A goddess of the hunting, wilderness, and the moon who seems mostly adored by women.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e15,
          baseDefense: this.greekBaseDefense * 1e15,
          baseHealth: this.greekBaseHealth * 1e15,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_APHRODITE),
          description: signal<string>(
            'A goddess of love, beauty, and desire. Her balance is terribly skewed toward Yin energy.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e21,
          baseDefense: this.greekBaseDefense * 1e21,
          baseHealth: this.greekBaseHealth * 1e21,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_HEPHAESTUS),
          description: signal<string>(
            'A blacksmith god of fire, metallurgy, and crafts. His forge is almost as good as one of yours.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e27,
          baseDefense: this.greekBaseDefense * 1e27,
          baseHealth: this.greekBaseHealth * 1e27,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_APOLLO),
          description: signal<string>('A god of music, prophecy, healing, and the sun.'),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e33,
          baseDefense: this.greekBaseDefense * 1e33,
          baseHealth: this.greekBaseHealth * 1e33,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_DEMETER),
          description: signal<string>(
            'A goddess of harvest and agriculture. Her fields seem as fine as any in Mount Penglin.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e39,
          baseDefense: this.greekBaseDefense * 1e39,
          baseHealth: this.greekBaseHealth * 1e39,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_ARES),
          description: signal<string>('A god of war, bloodshed, and violence. Perhaps he will be a worth duelist.'),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e45,
          baseDefense: this.greekBaseDefense * 1e45,
          baseHealth: this.greekBaseHealth * 1e45,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_ATHENA),
          description: signal<string>(
            'A goddess of wisdom and strategy. She sems crafty enough to make a worthy opponent.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e51,
          baseDefense: this.greekBaseDefense * 1e51,
          baseHealth: this.greekBaseHealth * 1e51,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_HERA),
          description: signal<string>(
            "The queen of the philospher state gods, a goddess of marriage and women. Can't seem to keep her husband in line."
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e57,
          baseDefense: this.greekBaseDefense * 1e57,
          baseHealth: this.greekBaseHealth * 1e57,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_POSEIDON),
          description: signal<string>(
            'A god of the sea, earthquakes, and horses. Has he ever made the swim to the deepest depths?'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e63,
          baseDefense: this.greekBaseDefense * 1e63,
          baseHealth: this.greekBaseHealth * 1e63,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_HADES),
          description: signal<string>(
            'A king of the underworld, wealth, and death. You wonder if he and Yama would get along.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e69,
          baseDefense: this.greekBaseDefense * 1e69,
          baseHealth: this.greekBaseHealth * 1e69,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
        {
          name: signal<string>(GOD_ZEUS),
          description: signal<string>(
            'King of the philosopher states gods with power over the sky, thunder, and justice.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * 1e75,
          baseDefense: this.greekBaseDefense * 1e75,
          baseHealth: this.greekBaseHealth * 1e75,
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
      ],
    },
    {
      name: signal<string>(PANTHEON_CELESTIAL_EMPIRE),
      description: signal<string>('The domain of the true and proper gods. Much better than all the other gods.'),
      unlocked: signal<boolean>(true),
      collapsed: signal<boolean>(false),
      gods: [
        {
          name: signal<string>(GOD_YAMA),
          description: signal<string>(
            'The god of justice and death, who judges the souls of mortals and delivers to them their proper retribution. Are you ready to see him at his full strength?'
          ),
          timesDefeated: signal<number>(1),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(100),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: 1e250,
          baseDefense: 1e250,
          baseHealth: 1e250,
          techniqueNames: ['Karmic Crush', 'Penance', 'Condemnation', 'Eternal Damnation'],
          techniqueCooldowns: [28, 7, 88, 2828],
          challengeMessage: signal<string>(''),
          attributes: [],
        },
      ],
    },
  ];

  battleService?: BattleService;

  constructor(private injector: Injector, private mainLoopService: MainLoopService) {
    setTimeout(() => (this.battleService = this.injector.get(BattleService)));
  }

  unlockPantheon(pantheonName: string) {
    const pantheon = this.pantheons.find(pantheon => pantheon.name() === pantheonName);
    if (pantheon && !pantheon.unlocked()) {
      this.mainLoopService.toast('A new pantheon to duel: ' + pantheonName);
      pantheon.unlocked.set(true);
    }
  }

  togglePantheon(pantheon: Pantheon) {
    pantheon.collapsed.set(!pantheon.collapsed());
  }

  getGod(godName: string): God | null {
    for (const pantheon of this.pantheons) {
      const godEntry = pantheon.gods.find(entry => entry.name() === godName);
      if (godEntry) {
        return godEntry;
      }
    }
    return null;
  }

  defeatGod(godName: string) {
    for (const pantheon of this.pantheons) {
      for (let i = 0; i < pantheon.gods.length; i++) {
        if (pantheon.gods[i].name() === godName) {
          pantheon.gods[i].timesDefeated.set(pantheon.gods[i].timesDefeated() + 1);
          if (pantheon.gods[i].timesDefeated() === 1) {
            // first defeat, discover the next one
            if (pantheon.gods.length > i + 1) {
              pantheon.gods[i + 1].discovered.set(true);
            }
          }
          return;
        }
      }
    }
  }

  increaseGodProgress(godName: string, amount: number = 1) {
    const god = this.getGod(godName);
    if (!god) {
      return;
    }
    god.unlockProgress.set(god?.unlockProgress() + amount);
    god.unlockProgressPercent.set((100 * god.unlockProgress()) / god.unlockProgressRequired());
    if (god.unlockProgress() >= god.unlockProgressRequired()) {
      god.unlocked.set(true);
    }
  }

  isGodDiscovered(godName: string): boolean {
    const god = this.getGod(godName);
    if (!god) {
      return false;
    }
    return god.discovered();
  }

  discoverGod(godName: string) {
    const god = this.getGod(godName);
    if (!god) {
      return false;
    }
    return god.discovered.set(true);
  }

  challengeGod(god: God) {
    let rematchString = '';
    if (god.timesDefeated() > 0) {
      rematchString = ' - Rematch #' + god.timesDefeated();
    }
    const techniques: Technique[] = [];
    for (let i = 0; i < god.techniqueNames.length; i++) {
      techniques.push({
        name: god.techniqueNames[i],
        ticks: 0,
        ticksRequired: god.techniqueCooldowns[i],
        baseDamage: god.baseDamage * Math.pow(100, god.timesDefeated()) * Math.pow(god.techniqueCooldowns[i], 3),
        unlocked: true,
      });
    }
    const loot: Item[] = [];
    for (const attribute of god.attributes) {
      loot.push(this.generateToken(attribute, god.timesDefeated()));
    }

    this.battleService!.addEnemy({
      name: god.name() + rematchString,
      baseName: god.name(),
      health: god.baseHealth * Math.pow(100, god.timesDefeated()),
      maxHealth: god.baseHealth * Math.pow(100, god.timesDefeated()),
      defense: god.baseDefense * Math.pow(100, god.timesDefeated()),
      loot: loot,
      techniques: techniques,
      location: LocationType.DivineArena,
      divine: true,
      immunities: [EFFECT_DOOM, EFFECT_POISON],
    });
  }

  generateToken(attribute: string, level: number): Item {
    return {
      id: 'tokenof' + attribute,
      imageFile: 'tokenof' + attribute,
      name: 'Token of ' + attribute,
      type: 'pill',
      value: Infinity,
      description: 'A divine token that can be absorbed to improve your divine attributes.',
      useLabel: 'Absorb the token',
      useDescription: '',
      useConsumes: true,
      effect: attribute,
      increaseAmount: 0.1 * Math.pow(10, level),
      noGreed: true,
      shopable: false,
    };
  }

  getProperties(): PantheonProperties {
    const pantheonData: PantheonSaveData[] = [];
    for (const pantheon of this.pantheons) {
      const godData: GodSaveData[] = [];

      for (const god of pantheon.gods) {
        godData.push({
          name: god.name(),
          timesDefeated: god.timesDefeated(),
          discovered: god.discovered(),
          unlocked: god.unlocked(),
          unlockProgress: god.unlockProgress(),
        });
      }
      pantheonData.push({
        name: pantheon.name(),
        unlocked: pantheon.unlocked(),
        collapsed: pantheon.collapsed(),
        godSaveData: godData,
      });
    }
    return {
      pantheons: pantheonData,
    };
  }

  setProperties(properties: PantheonProperties) {
    for (const pantheon of this.pantheons) {
      const pantheonSaveEntry = properties.pantheons.find(p => p.name === pantheon.name());
      if (pantheonSaveEntry) {
        pantheon.unlocked.set(pantheonSaveEntry.unlocked);
        pantheon.collapsed.set(pantheonSaveEntry.collapsed);
        for (const god of pantheon.gods) {
          const godSaveEntry = pantheonSaveEntry.godSaveData.find(g => g.name === god.name());
          if (godSaveEntry) {
            god.timesDefeated.set(godSaveEntry.timesDefeated);
            god.discovered.set(godSaveEntry.discovered);
            god.unlocked.set(godSaveEntry.unlocked);
            god.unlockProgress.set(godSaveEntry.unlockProgress);
          } else {
            god.timesDefeated.set(0);
            god.discovered.set(false);
            god.unlocked.set(false);
            god.unlockProgress.set(0);
          }
        }
      } else {
        pantheon.unlocked.set(false);
        pantheon.collapsed.set(false);
        for (const god of pantheon.gods) {
          god.timesDefeated.set(0);
          god.discovered.set(false);
          god.unlocked.set(false);
          god.unlockProgress.set(0);
        }
      }
    }
  }
}
