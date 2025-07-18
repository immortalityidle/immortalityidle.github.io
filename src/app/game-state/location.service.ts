/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { LogService, LogTopic } from './log.service';
import { LocationType } from './activity';
import { HellService } from './hell.service';

export interface LocationEntry {
  name: string;
  description: string;
  unlock: () => boolean;
}

export interface LocationProperties {
  unlockedLocations: LocationType[];
  troubleTarget: LocationType;
  locationLocked: boolean;
}

// TODO: lock locations for hells and some impossible tasks

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  troubleTarget: LocationType = LocationType.SmallTown;
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
        return this.characterService.attributes.speed.value > 50;
      },
    },
    [LocationType.SmallPond]: {
      name: 'A Lake',
      description: 'A freshwater lake ideal for fishing.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 100;
      },
    },
    [LocationType.Forest]: {
      name: 'A Forest',
      description: 'A forest where you can chop wood or look for a wide variety of herbs.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 200;
      },
    },
    [LocationType.Mine]: {
      name: 'A Mine',
      description: 'A mine where you can find coal or metal ores.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 500;
      },
    },
    [LocationType.Desert]: {
      name: 'A Desert',
      description: 'A sandy desert wasteland.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 2000;
      },
    },
    [LocationType.Jungle]: {
      name: 'A Jungle',
      description: 'A lush tropical jungle.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 10000;
      },
    },
    [LocationType.Dungeon]: {
      name: 'A Creepy Dungeon',
      description: 'This dark and dank dungeon is full of monsters.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 200000;
      },
    },
    [LocationType.Beach]: {
      name: 'A Sunny Beach',
      description:
        'A beautiful beach where you can definitely relax without worrying about any monsters creeping from the waves to murder you.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 1e6;
      },
    },

    [LocationType.DeepSea]: {
      name: 'The Deep Sea',
      description: 'The depths of the sea.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 1e8;
      },
    },
    [LocationType.MountainTops]: {
      name: 'The Mountain Tops',
      description: 'The tops of the highest mountains.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 1e10;
      },
    },
    [LocationType.AshenCrater]: {
      name: 'The Ashen Crater',
      description:
        'A huge empty hole in the ground, covered in gray ash and smoke. The ground here is scorching, with glowing red cracks revealing fire just under the surface.',
      unlock: () => {
        return this.characterService.attributes.speed.value > 1e12;
      },
    },
    [LocationType.Hell]: {
      name: 'Hell',
      description: 'The depths of Hell.',
      unlock: () => {
        return false;
      },
    },
  };
  unlockedLocations: LocationType[] = [];
  locationLocked = false;

  constructor(
    private mainLoopService: MainLoopService,
    private characterService: CharacterService,
    private logService: LogService,
    private hellService: HellService
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
    if (this.hellService.inHell()) {
      this.unlockedLocations = [LocationType.Hell];
      this.troubleTarget = LocationType.Hell;
    } else {
      if (this.troubleTarget === LocationType.Hell) {
        // we're out of hell, make sure trouble target isn't set there anymore
        this.troubleTarget = LocationType.SmallTown;
      }
      if (this.unlockedLocations.includes(LocationType.Hell)) {
        this.unlockedLocations = [];
      }
      for (const keyString in LocationType) {
        const key = keyString as LocationType;
        if (!this.unlockedLocations.includes(key)) {
          if (this.locationMap[key].unlock()) {
            this.unlockedLocations.push(key);
            if (logNewLocations && key !== LocationType.Self && key !== LocationType.SmallTown) {
              this.logService.log(
                LogTopic.EVENT,
                'You have expanded your available locations and can now explore ' + this.locationMap[key].name
              );
            }
          }
        }
      }
    }
  }

  setTroubleLocation(location: LocationType | null) {
    if (this.locationLocked) {
      this.logService.log(LogTopic.EVENT, "You can't select a new location now.");
      return;
    }
    if (location === null) {
      if (this.hellService.inHell()) {
        this.troubleTarget = LocationType.Hell;
      } else {
        this.troubleTarget = LocationType.SmallTown;
      }
    } else {
      this.troubleTarget = location;
    }
  }

  getProperties(): LocationProperties {
    return {
      unlockedLocations: this.unlockedLocations,
      troubleTarget: this.troubleTarget,
      locationLocked: this.locationLocked,
    };
  }

  setProperties(properties: LocationProperties) {
    this.unlockedLocations = properties.unlockedLocations;
    this.troubleTarget = properties.troubleTarget;
    this.locationLocked = properties.locationLocked;
  }
}
