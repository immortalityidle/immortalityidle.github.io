/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Injector } from '@angular/core';
import { ActivityService } from './activity.service';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { LogService, LogTopic } from './log.service';
import { LocationType } from './activity';

export interface LocationEntry {
  name: string;
  description: string;
  unlock: () => boolean;
}

export interface LocationProperties {
  unlockedLocations: LocationType[];
  troubleTarget: LocationType | null;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  troubleTarget: LocationType | null = LocationType.SmallTown;
  locationMap: { [key in LocationType]: LocationEntry } = {
    [LocationType.Self]: {
      name: 'Your Very Self',
      description: 'Your own physical and spiritual being.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.SmallTown]: {
      name: 'Your Home Town',
      description: 'A small village, the ancestral home of your family.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.LargeCity]: {
      name: 'A Large City',
      description: 'A bustling city. A thriving hub of crafts and trades.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 50;
      },
    },
    [LocationType.SmallPond]: {
      name: 'A Lake',
      description: 'A freshwater lake ideal for fishing.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 100;
      },
    },
    [LocationType.Forest]: {
      name: 'A Forest',
      description: 'A forest where you can chop wood.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 200;
      },
    },
    [LocationType.Mine]: {
      name: 'A Mine',
      description: 'A mine where you can find coal or metal ores.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 500;
      },
    },
    [LocationType.Desert]: {
      name: 'A Desert',
      description: 'A sandy desert wasteland.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 2000;
      },
    },
    [LocationType.Jungle]: {
      name: 'A Jungle',
      description: 'A lush tropical jungle.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 10000;
      },
    },
    [LocationType.Dungeon]: {
      name: 'A Creepy Dungeon',
      description: 'The dark and dank dungeon full of monsters.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 200000;
      },
    },
    [LocationType.Beach]: {
      name: 'A Sunny Beach',
      description:
        'A beautiful beach where you can definitely relax without worrying about any monsters creeping from the waves to murder you.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 1e6;
      },
    },

    [LocationType.DeepSea]: {
      name: 'The Deep Sea',
      description: 'The depths of the sea.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 1e8;
      },
    },
    [LocationType.MountainTops]: {
      name: 'The Mountain Tops',
      description: 'The tops of the highest mountains.',
      unlock: () => {
        return this.characterService.characterState.attributes.speed.value > 1e10;
      },
    },
    [LocationType.Hell]: {
      name: 'Hell',
      description: 'Hell',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfTongueRipping]: {
      name: 'HellOfTongueRipping',
      description: 'HellOfTongueRipping',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfScissors]: {
      name: 'HellOfScissors',
      description: 'HellOfScissors',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfTreesOfKnives]: {
      name: 'HellOfTreesOfKnives',
      description: 'HellOfTreesOfKnives',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMirrors]: {
      name: 'HellOfMirrors',
      description: 'HellOfMirrors',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfSteamers]: {
      name: 'HellOfSteamers',
      description: 'HellOfSteamers',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfCopperPillars]: {
      name: 'HellOfCopperPillars',
      description: 'HellOfCopperPillars',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMountainOfKnives]: {
      name: 'HellOfMountainOfKnives',
      description: 'HellOfMountainOfKnives',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMountainOfIce]: {
      name: 'HellOfMountainOfIce',
      description: 'HellOfMountainOfIce',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfCauldronsOfOil]: {
      name: 'HellOfCauldronsOfOil',
      description: 'HellOfCauldronsOfOil',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfCattlePit]: {
      name: 'HellOfCattlePit',
      description: 'HellOfCattlePit',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfCrushingBoulder]: {
      name: 'HellOfCrushingBoulder',
      description: 'HellOfCrushingBoulder',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMortarsAndPestles]: {
      name: 'HellOfMortarsAndPestles',
      description: 'HellOfMortarsAndPestles',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfBloodPool]: {
      name: 'HellOfBloodPool',
      description: 'HellOfBloodPool',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfWrongfulDead]: {
      name: 'HellOfWrongfulDead',
      description: 'HellOfWrongfulDead',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfHellOfDismemberment]: {
      name: 'HellOfHellOfDismemberment',
      description: 'HellOfHellOfDismemberment',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMountainOfFire]: {
      name: 'HellOfMountainOfFire',
      description: 'HellOfMountainOfFire',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfMills]: {
      name: 'HellOfMills',
      description: 'HellOfMills',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HellOfSaws]: {
      name: 'HellOfSaws',
      description: 'HellOfSaws',
      unlock: () => {
        return false;
      },
    },
  };
  unlockedLocations: LocationType[] = [];

  constructor(
    private injector: Injector,
    private activityService: ActivityService,
    private mainLoopService: MainLoopService,
    private characterService: CharacterService,
    private logService: LogService
  ) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      this.checkForUnlocks();
    });
    this.mainLoopService.reincarnateSubject.subscribe(() => {
      this.unlockedLocations = [];
      this.checkForUnlocks(false);
    });
  }

  checkForUnlocks(logNewLocations: boolean = true) {
    for (const keyString in LocationType) {
      const key = keyString as LocationType;
      if (!this.unlockedLocations.includes(key)) {
        if (this.locationMap[key].unlock()) {
          this.unlockedLocations.push(key);
          if (logNewLocations) {
            this.logService.log(
              LogTopic.EVENT,
              'You have expanded your available locations and can now explore the ' + this.locationMap[key].name
            );
          }
        }
      }
    }
  }

  getProperties(): LocationProperties {
    return {
      unlockedLocations: this.unlockedLocations,
      troubleTarget: this.troubleTarget,
    };
  }

  setProperties(properties: LocationProperties) {
    this.unlockedLocations = properties.unlockedLocations;
    this.troubleTarget = properties.troubleTarget;
  }
}
/* eslint-enable @typescript-eslint/ban-ts-comment */
