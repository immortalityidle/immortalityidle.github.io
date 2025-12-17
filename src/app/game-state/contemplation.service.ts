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
}

export interface DisplayConcept {
  name: WritableSignal<string>;
  description: WritableSignal<string>;
  progress: WritableSignal<number>;
  concept: Concept;
}

@Injectable({
  providedIn: 'root',
})
export class ContemplationService {
  contemplationStarted = false;
  displayConcepts: DisplayConcept[] = [];
  currentConcept: Concept | null = null;
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
      name: 'Tao of Death',
      description: 'Contemplate the true nature of death, coming to understand its destructive power.',
      progress: 0,
      effect: 'damage',
      discovered: false,
    },
  ];

  constructor(private injector: Injector, mainLoopService: MainLoopService, private logService: LogService) {
    mainLoopService.tickSubject.subscribe(() => {
      this.tick();
    });
    mainLoopService.longTickSubject.subscribe(() => {
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
        this.logService.log(LogTopic.EVENT, 'A new concept is available for contemplation: ' + conceptName);
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
      contemplationStarted: this.contemplationStarted,
      conceptProgress: conceptProgress,
      discoveredConcepts: discoveredConcepts,
      currentConcept: this.currentConcept?.name || '',
    };
  }

  setProperties(properties: ContemplationProperties) {
    this.contemplationStarted = properties.contemplationStarted;
    for (const concept of this.concepts) {
      concept.progress = properties.conceptProgress[concept.name] || 0;
      concept.discovered = properties.discoveredConcepts.includes(concept.name);
    }
    this.currentConcept = this.concepts.find(concept => concept.name === properties.currentConcept) || null;
  }
}
