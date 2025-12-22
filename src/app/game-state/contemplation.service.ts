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
export const CONCEPT_EFFECT_FERAL = 'feral';
export const CONCEPT_EFFECT_DEVASTATION = 'devastation';
export const CONCEPT_EFFECT_FOOD_YIELD = 'foodYield';
export const CONCEPT_EFFECT_ARMOR_REDUCTION = 'armorReduction';

@Injectable({
  providedIn: 'root',
})
export class ContemplationService {
  contemplationStarted = signal<boolean>(false);
  displayConcepts: DisplayConcept[] = [];
  currentConcept: Concept | null = null;
  techniqueConcepts = [CONCEPT_EFFECT_FERAL];

  concepts: Concept[] = [
    {
      name: 'Tao of Earth',
      description: 'Contemplate the true nature of earth, coming to understand its deepest secrets.',
      progress: 0,
      effect: 'earthLore',
      discovered: false,
    },
    {
      name: 'Tao of Metal',
      description: 'Contemplate the true nature of metal, coming to understand its strongest aspects.',
      progress: 0,
      effect: 'metalLore',
      discovered: false,
    },
    {
      name: 'Tao of Wood',
      description: 'Contemplate the true nature of wood, coming to understand its growing enigmas.',
      progress: 0,
      effect: 'woodLore',
      discovered: false,
    },
    {
      name: 'Tao of Water',
      description: 'Contemplate the true nature of water, coming to understand its fluid keys.',
      progress: 0,
      effect: 'waterLore',
      discovered: false,
    },
    {
      name: 'Tao of Fire',
      description: 'Contemplate the true nature of fire, coming to understand its burning mysteries.',
      progress: 0,
      effect: 'fireLore',
      discovered: false,
    },
    {
      name: 'Tao of Life',
      description: 'Contemplate the true nature of life, coming to understand its vital essence.',
      progress: 0,
      effect: 'life',
      discovered: false,
    },
    {
      name: 'Tao of Beasts',
      description: 'Contemplate the true nature of beasts, coming to understand both their domestic and feral natures.',
      progress: 0,
      effect: 'animalHandling,' + CONCEPT_EFFECT_FERAL,
      discovered: false,
    },
    {
      name: 'Tao of Death',
      description: 'Contemplate the true nature of death, coming to understand its destructive power.',
      progress: 0,
      effect: CONCEPT_EFFECT_DAMAGE,
      discovered: false,
    },
    {
      name: 'Tao of Scorched Earth',
      description: 'Contemplate the devastating aspects of fire combined with earth.',
      progress: 0,
      effect: 'earthLore,fireLore,' + CONCEPT_EFFECT_DEVASTATION,
      discovered: false,
      discoveryRequirements: {
        'Tao of Earth': 1e8,
        'Tao of Fire': 1e8,
      },
    },
    {
      name: 'Tao of Irrigation',
      description: 'Contemplate the nourishing aspects of water combined with earth.',
      progress: 0,
      effect: 'earthLore,waterLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        'Tao of Earth': 1e8,
        'Tao of Water': 1e8,
      },
    },
    {
      name: 'Tao of Fortication',
      description: 'Contemplate the enduring aspects of metal combined with earth.',
      progress: 0,
      effect: 'earthLore,metalLore,toughness',
      discovered: false,
      discoveryRequirements: {
        'Tao of Earth': 1e8,
        'Tao of Metal': 1e8,
      },
    },
    {
      name: 'Tao of Agriculture',
      description: 'Contemplate the cultivating aspects of wood combined with earth.',
      progress: 0,
      effect: 'earthLore,woodLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        'Tao of Earth': 1e8,
        'Tao of Wood': 1e8,
      },
    },
    {
      name: 'Tao of Brewing',
      description: 'Contemplate the simmering aspects of fire combined with water.',
      progress: 0,
      effect: 'fireLore,waterLore,intelligence',
      discovered: false,
      discoveryRequirements: {
        'Tao of Fire': 1e8,
        'Tao of Water': 1e8,
      },
    },
    {
      name: 'Tao of Air',
      description: 'Contemplate the flow of air as fire combines with wood.',
      progress: 0,
      effect: 'fireLore,woodLore,speed',
      discovered: false,
      discoveryRequirements: {
        'Tao of Fire': 1e8,
        'Tao of Wood': 1e8,
      },
    },
    {
      name: 'Tao of the Forge',
      description: 'Contemplate the powerful combination of fire and metal.',
      progress: 0,
      effect: 'fireLore,metalLore,strength',
      discovered: false,
      discoveryRequirements: {
        'Tao of Fire': 1e8,
        'Tao of Metal': 1e8,
      },
    },
    {
      name: 'Tao of Flexibility',
      description: 'Contemplate the flowing aspects of water combined with wood.',
      progress: 0,
      effect: 'waterLore,woodLore,charisma',
      discovered: false,
      discoveryRequirements: {
        'Tao of Water': 1e8,
        'Tao of Wood': 1e8,
      },
    },
    {
      name: 'Tao of Corrosion',
      description: 'Contemplate the destructive aspects of water combined with metal.',
      progress: 0,
      effect: 'waterLore,metalLore,' + CONCEPT_EFFECT_ARMOR_REDUCTION,
      discovered: false,
      discoveryRequirements: {
        'Tao of Water': 1e8,
        'Tao of Metal': 1e8,
      },
    },
    {
      name: 'Tao of the Harvest',
      description: 'Contemplate the gathering aspects of metal combined with wood.',
      progress: 0,
      effect: 'metalLore,woodLore,' + CONCEPT_EFFECT_FOOD_YIELD,
      discovered: false,
      discoveryRequirements: {
        'Tao of Metal': 1e8,
        'Tao of wood': 1e8,
      },
    },
  ];

  constructor(private injector: Injector, mainLoopService: MainLoopService, private logService: LogService) {
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
