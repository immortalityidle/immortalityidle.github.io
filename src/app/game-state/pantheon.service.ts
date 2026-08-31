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
export const GOD_ARTEMIS = 'Artemis';
export const GOD_HEPHAESTUS = 'Hephaestus';
export const GOD_APHRODITE = 'Aphrodite';
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
  defeatEffect?: string;
  baseLootLevel: number;
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
  identityResets: number;
}

@Injectable({
  providedIn: 'root',
})
export class PantheonService {
  greekBaseHealth = 1e44;
  greekBaseDefense = 1e28;
  greekBaseDamage = 1e29;
  greekScaling = 1e4;
  identityResets = 0;

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
          techniqueCooldowns: [2, 3, 10],
          challengeMessage: signal<string>(
            "You're looking for a duel?<br><br>Are you mad, barbarian?<br><br>I don't have time to fight you right now!<br><br>I need to get these messages delivered!"
          ),
          attributes: ['justice', 'wisdom', 'mercy', 'presence', 'wrath'],
          baseLootLevel: 0,
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
          baseDamage: this.greekBaseDamage * this.greekScaling,
          baseDefense: this.greekBaseDefense * this.greekScaling,
          baseHealth: this.greekBaseHealth * this.greekScaling,
          techniqueNames: ['Wine Splash', 'Grape Crush', 'Drowned Sorrows'],
          techniqueCooldowns: [5, 50, 500],
          challengeMessage: signal<string>(
            "A duel?<br><br>Oh, no, I couldn't possibly.<br><br>The celebrations must continue, so I need to focus on getting this year's vintage ready."
          ),
          attributes: ['mercy', 'mercy', 'mercy', 'wisdom', 'wisdom'],
          defeatEffect: 'unlockNectar',
          baseLootLevel: 5,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 2),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 2),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 2),
          techniqueNames: ['Quick Shot', 'Aimed Shot', 'Woodlands Stampede'],
          techniqueCooldowns: [6, 40, 1000],
          challengeMessage: signal<string>(
            "You want me to duel with you?<br><br>Is that some kind of euphemism?<br><br>I don't go in for any funny business.<br><br>Well, if you want me to waste my time with you, you'll need to prove your hunting skills first.<br><br>I hope you know your wild beasts."
          ),
          attributes: ['justice', 'justice', 'wrath', 'wrath', 'mercy'],
          baseLootLevel: 10,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 3),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 3),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 3),
          techniqueNames: ['Dazzling Smile', 'Irrestable Temptation', 'Heartbreak'],
          techniqueCooldowns: [2, 24, 120],
          challengeMessage: signal<string>(
            'A duel? How fascinating!<br>But we would both need to look our best before we entangle ourselves in any such <i>engagements</i>.'
          ),
          attributes: ['presence', 'presence', 'presence', 'mercy', 'mercy'],
          baseLootLevel: 15,
        },
        {
          name: signal<string>(GOD_HEPHAESTUS),
          description: signal<string>(
            'A blacksmith god of fire, metallurgy, and crafts. His forge might be slightly better than yours.'
          ),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(0),
          unlockProgressRequired: signal<number>(100),
          unlockProgressPercent: signal<number>(0),
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 4),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 4),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 4),
          techniqueNames: ['Hammer Strike', 'Ring the Forge', 'Volcanic Fury'],
          techniqueCooldowns: [6, 40, 200],
          challengeMessage: signal<string>(
            "You want to fight?<br>Impossible.<br> I'm too busy making a present for my wife.<br>Have you seen how good she looks lately?<br>I'm going to need something really special to impress her, something incredible rare.<br>Maybe a dreadsteel necklace loaded with quality gems."
          ),
          attributes: ['justice', 'justice', 'presence', 'wrath', 'wrath'],
          baseLootLevel: 20,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 5),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 5),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 5),
          techniqueNames: ['Rhythmic Beat', 'Philosopher Stoning', 'Solar Flare'],
          techniqueCooldowns: [2, 20, 1000],
          challengeMessage: signal<string>(
            "Exchanging pointers in a duel?<br>An interesting concept.<br>I'd need time to prepare, of course.<br>Would you mind driving the sun across the sky for a few days while I get ready?"
          ),
          attributes: ['wisdom', 'wisdom', 'wisdom', 'justice', 'justice'],
          baseLootLevel: 25,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 6),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 6),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 6),
          techniqueNames: ['Threshing', 'Barley Barrage', 'Harvest Season'],
          techniqueCooldowns: [4, 12, 24],
          challengeMessage: signal<string>(
            "I don't have time to duel with strange barbarians. I need to find my daughter, Persephone."
          ),
          attributes: ['justice', 'justice', 'wisdom', 'mercy', 'mercy'],
          baseLootLevel: 30,
        },
        {
          name: signal<string>(GOD_ARES),
          description: signal<string>('A god of war, bloodshed, and violence. Perhaps he will be a worthy duelist.'),
          timesDefeated: signal<number>(0),
          unlocked: signal<boolean>(false),
          discovered: signal<boolean>(false),
          unlockProgress: signal<number>(1),
          unlockProgressRequired: signal<number>(1),
          unlockProgressPercent: signal<number>(100),
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 7) * 2,
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 7),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 7),
          techniqueNames: ['War Cry', 'Martial Strike', 'Absolute Devastation'],
          techniqueCooldowns: [5, 10, 1000],
          challengeMessage: signal<string>("A fight? Wonderful! Come to my camp and let's get to it!"),
          attributes: ['wrath', 'wrath', 'wrath', 'wrath', 'wrath'],
          baseLootLevel: 35,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 8),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 8) * 2,
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 8),
          techniqueNames: ['Distracting Jab', 'Shield Bash', 'Tactical Strike', 'Fortress Bombardment'],
          techniqueCooldowns: [4, 12, 24, 400],
          challengeMessage: signal<string>(
            "You'd like a duel?<br>Perhaps.<br>But before we compare the strength of our bodies, let's compare the strength of our minds.<br>Perhaps a game of Polis?<br>You have been building your mind as well as your body, haven't you?"
          ),
          attributes: ['wisdom', 'wisdom', 'wisdom', 'wisdom', 'wisdom'],
          baseLootLevel: 40,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 9),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 9),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 9),
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
          baseLootLevel: 45,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 10),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 10),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 10),
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
          baseLootLevel: 50,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 11),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 11),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 11),
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
          baseLootLevel: 55,
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
          baseDamage: this.greekBaseDamage * Math.pow(this.greekScaling, 12),
          baseDefense: this.greekBaseDefense * Math.pow(this.greekScaling, 12),
          baseHealth: this.greekBaseHealth * Math.pow(this.greekScaling, 12),
          techniqueNames: [],
          techniqueCooldowns: [],
          challengeMessage: signal<string>(''),
          attributes: [],
          baseLootLevel: 60,
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
          baseLootLevel: 250,
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
    if (this.battleService!.enemies.length > 0) {
      // don't start a divine duel while you're already in a fight
      return;
    }
    let rematchString = '';
    if (god.timesDefeated() > 0) {
      rematchString = ' - Rematch #' + god.timesDefeated();
    }
    const techniques: Technique[] = [];
    for (let i = 0; i < god.techniqueNames.length; i++) {
      let damage = god.baseDamage * Math.pow(100, god.timesDefeated()) * Math.pow(god.techniqueCooldowns[i], 2);
      if (god.techniqueCooldowns[i] < 3) {
        // special treatment for very fast attacks
        damage *= 0.5;
      }
      techniques.push({
        name: god.techniqueNames[i],
        ticks: 0,
        ticksRequired: god.techniqueCooldowns[i],
        baseDamage: damage,
        unlocked: true,
      });
    }
    const loot: Item[] = [];
    for (const attribute of god.attributes) {
      loot.push(this.generateToken(attribute, god.baseLootLevel + god.timesDefeated()));
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
      defeatEffect: god.defeatEffect,
    });
  }

  resetIdentity() {
    if (this.identityResets < 1) {
      return;
    }
    for (const pantheon of this.pantheons) {
      for (const god of pantheon.gods) {
        god.timesDefeated.set(0);
      }
    }
    this.identityResets--;
  }

  generateToken(attribute: string, level: number): Item {
    let power;
    if (level <= 4) {
      power = 0.1 * Math.pow(10, level);
    } else if (level <= 13) {
      power = 1000 * (level - 3);
    } else if (level <= 23) {
      power = 10000 + 2000 * (level - 13);
    } else {
      power = 30000 + 5000 * (level - 23);
    }

    return {
      id: 'tokenof' + attribute,
      imageFile: 'tokenof' + attribute,
      name: 'Token of ' + attribute,
      type: 'pill',
      subtype: 'divineToken',
      value: Infinity,
      description: 'A divine token that can be absorbed to improve your divine attributes.',
      useLabel: 'Absorb the token',
      useDescription: '',
      useConsumes: true,
      effect: attribute,
      increaseAmount: power,
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
      identityResets: this.identityResets,
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
    this.identityResets = properties.identityResets;
  }
}
