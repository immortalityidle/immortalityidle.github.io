import { Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { LogService, LogTopic } from './log.service';

export interface ContemplationProperties {
  contemplationStarted: boolean;
  conceptProgress: { [key: string]: number };
  discoveredConcepts: string[];
  currentConcept: string;
}

export interface Concept {
  name: string;
  description: string;
  progress: number;
  effect: string;
  discovered: boolean;
  discoveryRequirements?: { [key: string]: number };
}

export interface DisplayConcept {
  name: WritableSignal<string>;
  description: WritableSignal<string>;
  progress: WritableSignal<number>;
  concept: Concept;
}

export const CONCEPT_EFFECT_DAMAGE = 'damage';
export const CONCEPT_EFFECT_DEFENCE = 'defense';
export const CONCEPT_EFFECT_FERAL = 'feral';
export const CONCEPT_EFFECT_DRAGON = 'dragon';
export const CONCEPT_EFFECT_DEVASTATION = 'devastation';
export const CONCEPT_EFFECT_FLOW = 'flow';
export const CONCEPT_EFFECT_VERDANT = 'verdant';
export const CONCEPT_EFFECT_TRADITION = 'tradition';
export const CONCEPT_EFFECT_FOOD_YIELD = 'foodYield';
export const CONCEPT_EFFECT_HOME_RECOVERY = 'homeRecovery';
export const CONCEPT_EFFECT_ARMOR_REDUCTION = 'armorReduction';
export const CONCEPT_EFFECT_STEEL = 'steel';
export const CONCEPT_EFFECT_WOODSHAPED = 'woodshaped';
export const CONCEPT_WOOD = 'Tao of Wood';
export const CONCEPT_FIRE = 'Tao of Fire';
export const CONCEPT_WATER = 'Tao of Water';
export const CONCEPT_METAL = 'Tao of Metal';
export const CONCEPT_EARTH = 'Tao of Earth';

@Injectable({
  providedIn: 'root',
})
export class ContemplationService {
  contemplationStarted = signal<boolean>(false);
  displayConcepts: DisplayConcept[] = [];
  currentConcept: Concept | null = null;
  techniqueConcepts = [
    CONCEPT_EFFECT_FERAL,
    CONCEPT_EFFECT_DEVASTATION,
    CONCEPT_EFFECT_STEEL,
    CONCEPT_EFFECT_WOODSHAPED,
    CONCEPT_EFFECT_DRAGON,
    CONCEPT_EFFECT_VERDANT,
    CONCEPT_EFFECT_FLOW,
    CONCEPT_EFFECT_TRADITION,
  ];

  concepts: Concept[] = [
    {
      name: CONCEPT_EARTH,
      description:
        'Contemplate the true nature of earth, coming to understand its deepest secrets.<br><br>Increases your Earth Lore gain.',
      progress: 0,
      effect: 'earthLore',
      discovered: false,
    },
    {
      name: CONCEPT_METAL,
      description:
        'Contemplate the true nature of metal, coming to understand its strongest aspects.<br><br>Increases your Metal Lore gain.',
      progress: 0,
      effect: 'metalLore',
      discovered: false,
    },
    {
      name: CONCEPT_WOOD,
      description:
        'Contemplate the true nature of wood, coming to understand its growing enigmas.<br><br>Increases your Wood Lore gain.',
      progress: 0,
      effect: 'woodLore',
      discovered: false,
    },
    {
      name: CONCEPT_WATER,
      description:
        'Contemplate the true nature of water, coming to understand its fluid keys.<br><br>Increases your Water Lore gain.',
      progress: 0,
      effect: 'waterLore',
      discovered: false,
    },
    {
      name: CONCEPT_FIRE,
      description:
        'Contemplate the true nature of fire, coming to understand its burning mysteries.<br><br>Increases your Fire Lore gain.',
      progress: 0,
      effect: 'fireLore',
      discovered: false,
    },
    {
      name: 'Tao of Life',
      description:
        'Contemplate the true nature of life, coming to understand its vital essence.<br><br>Increases maximum health.',
      progress: 0,
      effect: 'life',
      discovered: false,
    },
    {
      name: 'Tao of Beasts',
      description:
        'Contemplate the true nature of beasts, coming to understand both their domestic and feral natures.<br><br>Increases Animal Handling gain and the power of certain techniques.',
      progress: 0,
      effect: 'animalHandling,' + CONCEPT_EFFECT_FERAL,
      discovered: false,
    },
    {
      name: 'Tao of Death',
      description:
        'Contemplate the true nature of death, coming to understand its destructive power.<br><br>Increases power of all techniques.',
      progress: 0,
      effect: CONCEPT_EFFECT_DAMAGE,
      discovered: false,
    },
    {
      name: 'Tao of Scorched Earth',
      description:
        'Contemplate the devastating aspects of fire combined with earth.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'earthLore,fireLore,' + CONCEPT_EFFECT_DEVASTATION,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_EARTH]: 1e8,
        [CONCEPT_FIRE]: 1e8,
      },
    },
    {
      name: 'Tao of Irrigation',
      description:
        'Contemplate the nourishing aspects of water combined with earth.<br><br>Increases some lore gains and all food production.',
      progress: 0,
      effect: 'earthLore,waterLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_EARTH]: 1e8,
        [CONCEPT_WATER]: 1e8,
      },
    },
    {
      name: 'Tao of Fortication',
      description:
        'Contemplate the enduring aspects of metal combined with earth.<br><br>Increases toughness and some lore gains.',
      progress: 0,
      effect: 'earthLore,metalLore,toughness',
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_EARTH]: 1e8,
        [CONCEPT_METAL]: 1e8,
      },
    },
    {
      name: 'Tao of Agriculture',
      description:
        'Contemplate the cultivating aspects of wood combined with earth.<br><br>Increases some lore gains and all food production.',
      progress: 0,
      effect: 'earthLore,woodLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_EARTH]: 1e8,
        [CONCEPT_WOOD]: 1e8,
      },
    },
    {
      name: 'Tao of Brewing',
      description:
        'Contemplate the simmering aspects of fire combined with water.<br><br>Increases intelligence and some lore gains.',
      progress: 0,
      effect: 'fireLore,waterLore,intelligence',
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_FIRE]: 1e8,
        [CONCEPT_WATER]: 1e8,
      },
    },
    {
      name: 'Tao of Air',
      description:
        'Contemplate the flow of air as fire combines with wood.<br><br>Increases speed and some lore gains.',
      progress: 0,
      effect: 'fireLore,woodLore,speed',
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_FIRE]: 1e8,
        [CONCEPT_WOOD]: 1e8,
      },
    },
    {
      name: 'Tao of the Forge',
      description:
        'Contemplate the powerful combination of fire and metal.<br><br>Increases strength and some lore gains.',
      progress: 0,
      effect: 'fireLore,metalLore,strength',
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_FIRE]: 1e8,
        [CONCEPT_METAL]: 1e8,
      },
    },
    {
      name: 'Tao of Flexibility',
      description:
        'Contemplate the flowing aspects of water combined with wood.<br><br>Increases charisma and some lore gains.',
      progress: 0,
      effect: 'waterLore,woodLore,charisma',
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_WATER]: 1e8,
        [CONCEPT_WOOD]: 1e8,
      },
    },
    {
      name: 'Tao of Corrosion',
      description:
        'Contemplate the destructive aspects of water combined with metal.<br><br>Increases some lore gains and reduces enemy defense.',
      progress: 0,
      effect: 'waterLore,metalLore,' + CONCEPT_EFFECT_ARMOR_REDUCTION,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_WATER]: 1e8,
        [CONCEPT_METAL]: 1e8,
      },
    },
    {
      name: 'Tao of the Harvest',
      description:
        'Contemplate the gathering aspects of metal combined with wood.<br><br>Increases some lore gains and all food production.',
      progress: 0,
      effect: 'metalLore,woodLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 1e8,
        [CONCEPT_WOOD]: 1e8,
      },
    },
    {
      name: 'Tao of Steel',
      description:
        'Contemplate the strong and flexible aspects of metal tempered by fire and wood.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'metalLore,woodLore,fireLore,' + CONCEPT_EFFECT_STEEL,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 1e9,
        [CONCEPT_WOOD]: 1e9,
        [CONCEPT_FIRE]: 1e9,
      },
    },
    {
      name: 'Tao of Woodshaping',
      description:
        'Contemplate the strong and flexible aspects of wood shaped by steam.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'waterLore,woodLore,fireLore' + CONCEPT_EFFECT_WOODSHAPED,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_WATER]: 1e9,
        [CONCEPT_WOOD]: 1e9,
        [CONCEPT_FIRE]: 1e9,
      },
    },
    {
      name: 'Tao of the Hearth',
      description:
        'Contemplate the comforting aspects of the hearth and home.<br><br>Increases some lore gains and the recovery that your home provides.',
      progress: 0,
      effect: 'earthLore,woodLore,fireLore,' + CONCEPT_EFFECT_HOME_RECOVERY,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_EARTH]: 5e9,
        [CONCEPT_WOOD]: 5e9,
        [CONCEPT_FIRE]: 5e9,
      },
    },
    {
      name: 'Tao of the Sea Dragon',
      description:
        'Contemplate the shining metalic scales and fiery breath of the great sea dragons.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'metalLore,fireLore,waterLore,' + CONCEPT_EFFECT_DRAGON,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 1e10,
        [CONCEPT_FIRE]: 1e10,
        [CONCEPT_WATER]: 1e10,
      },
    },
    {
      name: 'Tao of the Deep Dwellers',
      description:
        'Contemplate the shining metalic scales and fiery breath of the great dragons that slumber deep under the earth.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'metalLore,fireLore, earthLore' + CONCEPT_EFFECT_DRAGON,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 2e10,
        [CONCEPT_FIRE]: 2e10,
        [CONCEPT_EARTH]: 2e10,
      },
    },
    {
      name: 'Tao of the Mighty Dam',
      description:
        'Contemplate the powerful combination of earth and metal in containing and directing the flow of water.<br><br>Increases some lore gains and the power of certain techniques.',
      progress: 0,
      effect: 'metalLore,earthLore,waterLore,' + CONCEPT_EFFECT_FLOW,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 5e8,
        [CONCEPT_EARTH]: 5e8,
        [CONCEPT_WATER]: 5e8,
      },
    },
    {
      name: 'Tao of the Shimmering Rice Field',
      description:
        'Contemplate the swift strike of a scythe cutting through a perfect rice stalk.<br><br>Increases some lore gains, food production, and the power of certain techniques.',
      progress: 0,
      effect: 'metalLore,woodLore,waterLore,' + CONCEPT_EFFECT_FOOD_YIELD + ',' + CONCEPT_EFFECT_VERDANT,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 5e10,
        [CONCEPT_WOOD]: 5e10,
        [CONCEPT_WATER]: 5e10,
      },
    },
    {
      name: 'Tao of the Invincible Stronghold',
      description:
        'Contemplate the enduring stability of earth combined with metai and wood.<br><br>Increases some lore gains, and reduced damage taken.',
      progress: 0,
      effect: 'metalLore,woodLore,earthLore,' + CONCEPT_EFFECT_DEFENCE,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_METAL]: 5e10,
        [CONCEPT_WOOD]: 5e10,
        [CONCEPT_EARTH]: 5e10,
      },
    },
    {
      name: 'Tao of Unbridled Growth',
      description:
        'Contemplate the verdant combination of water, wood, and earth.<br><br>Increases some lore gains, food production, and the power of certain techniques.',
      progress: 0,
      effect: 'waterLore,woodLore,earthLore,' + CONCEPT_EFFECT_VERDANT + ',' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_WATER]: 6e10,
        [CONCEPT_WOOD]: 6e10,
        [CONCEPT_EARTH]: 6e10,
      },
    },
    {
      name: 'Tao of the Kiln',
      description:
        'Contemplate the enduring tradition and artistry of fired clay.<br><br>Increases some lore gains, and the power of certain techniques.',
      progress: 0,
      effect: 'waterLore,fireLore,earthLore,' + CONCEPT_EFFECT_TRADITION,
      discovered: false,
      discoveryRequirements: {
        [CONCEPT_WATER]: 7e8,
        [CONCEPT_FIRE]: 7e8,
        [CONCEPT_EARTH]: 7e8,
      },
    },
  ];

  constructor(private injector: Injector, private mainLoopService: MainLoopService, private logService: LogService) {
    mainLoopService.tickSubject.subscribe(() => {
      this.tick();
    });
    mainLoopService.battleTickSubject.subscribe(() => {
      this.tick();
    });
    mainLoopService.longTickSubject.subscribe(() => {
      if (!this.contemplationStarted) {
        return;
      }
      const discoverable = this.concepts.filter(concept => !concept.discovered && concept.discoveryRequirements);
      for (const concept of discoverable) {
        let requirementsMet = true;
        for (const key in concept.discoveryRequirements) {
          const checkConcept = this.concepts.find(concept => concept.name === key);
          if ((checkConcept?.progress || 0) < concept.discoveryRequirements[key]) {
            requirementsMet = false;
            break;
          }
        }
        if (requirementsMet) {
          this.discoverConcept(concept.name);
        }
      }

      const discovered = this.concepts.filter(concept => concept.discovered);
      for (const concept of discovered) {
        const displayConcept = this.displayConcepts.find(dc => dc.name() === concept.name);
        if (displayConcept) {
          displayConcept.name.set(concept.name);
          displayConcept.description.set(concept.description);
          displayConcept.progress.set(concept.progress);
          displayConcept.concept = concept;
        } else {
          this.displayConcepts.push({
            name: signal<string>(concept.name),
            description: signal<string>(concept.description),
            progress: signal<number>(concept.progress),
            concept: concept,
          });
        }
      }
    });
  }

  tick() {
    if (!this.contemplationStarted) {
      return;
    }
    if (this.currentConcept !== null) {
      this.currentConcept.progress++;
    }
  }

  discoverConcept(conceptName: string) {
    const concept = this.concepts.find(concept => concept.name === conceptName);
    if (concept) {
      if (!concept.discovered) {
        this.logService.log(LogTopic.EVENT, 'A concept is available for contemplation: ' + conceptName);
        this.mainLoopService.toast('A concept is available for contemplation: ' + conceptName);
      }
      concept.discovered = true;
    }
  }

  getProperties(): ContemplationProperties {
    const conceptProgress: { [key: string]: number } = {};
    const discoveredConcepts: string[] = [];
    for (const concept of this.concepts) {
      conceptProgress[concept.name] = concept.progress;
      if (concept.discovered) {
        discoveredConcepts.push(concept.name);
      }
    }
    return {
      contemplationStarted: this.contemplationStarted(),
      conceptProgress: conceptProgress,
      discoveredConcepts: discoveredConcepts,
      currentConcept: this.currentConcept?.name || '',
    };
  }

  setProperties(properties: ContemplationProperties) {
    this.contemplationStarted.set(properties.contemplationStarted);
    for (const concept of this.concepts) {
      concept.progress = properties.conceptProgress[concept.name] || 0;
      concept.discovered = properties.discoveredConcepts.includes(concept.name);
    }
    this.currentConcept = this.concepts.find(concept => concept.name === properties.currentConcept) || null;
  }
}
