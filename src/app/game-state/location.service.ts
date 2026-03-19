/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { LogService, LogTopic } from './log.service';
import { HellService } from './hell.service';

export enum Realm {
  Hell = 'Hell',
  MortalRealm = 'Mortal Realm',
  DivineRealm = 'Divine Realm',
  RealmOfFire = 'Realm of Fire',
  RealmOfWater = 'Realm of Water',
  RealmOfEarth = 'Realm of Earth',
  RealmOfMetal = 'Realm of Metal',
  RealmOfWood = 'Realm of Wood',
  PhilosopherStates = 'Realm of the Philosopher States',
  LegionOfArchitects = 'Realm of the Legion Of Architects',
  RiverThroughTheSand = 'Realm of the River Through The Sand',
  FrozenNorthlands = 'Realm of the Frozen Northlands',
  MysteriousJungles = 'Realm of the Mysterious Jungles',
  DistantIslands = 'Realm of the Distant Islands',
  CultOfTheOldOnes = 'Realm of the Cult Of The Old Ones',
  SunsoakedPlains = 'Realm of the Sunsoaked Plains',
  DarkForests = 'Realm of the Dark Forests',
  EnlightenedMultitude = 'Realm of the Enlightened Multitude',
  FertileValleys = 'Realm of the Fertile Valleys',
  LandOfLegends = 'Realm of the Land Of Legends',
  IslandsOfTheDawn = 'Realm of the Islands Of The Dawn',
  ShadowCultists = 'Realm of the Shadow Cultists',
}

export enum LocationType {
  Self = 'Self',
  SmallTown = 'SmallTown',
  LargeCity = 'LargeCity',
  SmallPond = 'SmallPond',
  Forest = 'Forest',
  Mine = 'Mine',
  Desert = 'Desert',
  Jungle = 'Jungle',
  Dungeon = 'Dungeon',
  Beach = 'Beach',
  DeepSea = 'DeepSea',
  MountainTops = 'MountainTops',
  AshenCrater = 'AshenCrater',
  Gates = 'Gates of Hell',
  TongueRipping = 'Hell of Tongue Ripping',
  Scissors = 'Hell of Scissors',
  TreesOfKnives = 'Hell of Trees of Knives',
  Mirrors = 'Hell of Mirrors',
  Steamers = 'Hell of Steamers',
  CopperPillars = 'Hell of Copper Pillars',
  MountainOfKnives = 'Hell of the Mountain of the Knives',
  MountainOfIce = 'Hell of the Mountain of Ice',
  CauldronsOfOil = 'Hell of the Cauldrons of Oil',
  CattlePit = 'Hell of the Cattle Pit',
  CrushingBoulder = 'Hell of the Crushing Boulder',
  MortarsAndPestles = 'Hell of Mortars and Pestles',
  BloodPool = 'Hell of the Blood Pool',
  WrongfulDead = 'Hell of the Wrongful Dead',
  Dismemberment = 'Hell of Dismemberment',
  MountainOfFire = 'Hell of the Mountain of Fire',
  Mills = 'Hell of Mills',
  Saws = 'Hell of Saws',
  BurningInferno = 'Burning Inferno',
  VastOcean = 'Vast Ocean',
  EndlessTunnels = 'Endless Tunnels',
  IronCaverns = 'Iron Caverns',
  EverTree = 'Ever Tree',
  LightningLodge = 'LightningLodge',
  MaritalSanctuary = 'MaritalSanctuary',
  OceanPalace = 'OceanPalace',
  HarvestHome = 'HarvestHome',
  FortressOfWisdom = 'FortressOfWisdom',
  AuditoriumOfLight = 'AuditoriumOfLight',
  Woodlands = 'Woodlands',
  MartialCamp = 'MartialCamp',
  GardenOfDelights = 'GardenOfDelights',
  TheMightyForge = 'TheMightyForge',
  MessageDepot = 'MessageDepot',
  VerdantVineyard = 'VerdantVineyard',
}

export interface LocationEntry {
  name: string;
  description: string;
  realm?: Realm;
  unlock: () => boolean;
}

export interface LocationProperties {
  unlockedLocations: LocationType[];
  notifiedLocations: LocationType[];
  location: LocationType;
  currentRealm: Realm;
  locationLocked: boolean;
  distanceMultiplier: number;
}

// TODO: lock locations for hells and some impossible tasks

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  location: LocationType = LocationType.SmallTown;
  currentRealm: Realm = Realm.MortalRealm;
  distanceMultiplier = 1;
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
      realm: Realm.MortalRealm,
      unlock: () => {
        return true;
      },
    },
    [LocationType.LargeCity]: {
      name: 'A Large City',
      description: 'A bustling city. A thriving hub of crafts and trades.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 50;
      },
    },
    [LocationType.SmallPond]: {
      name: 'A Lake',
      description: 'A freshwater lake ideal for fishing.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 100;
      },
    },
    [LocationType.Forest]: {
      name: 'A Forest',
      description: 'A forest where you can chop wood or look for a wide variety of herbs.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 200;
      },
    },
    [LocationType.Mine]: {
      name: 'A Mine',
      description: 'A mine where you can find coal or metal ores.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 500;
      },
    },
    [LocationType.Desert]: {
      name: 'A Desert',
      description: 'A sandy desert wasteland.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 2000;
      },
    },
    [LocationType.Jungle]: {
      name: 'A Jungle',
      description: 'A lush tropical jungle.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 10000;
      },
    },
    [LocationType.Dungeon]: {
      name: 'A Creepy Dungeon',
      description: 'This dark and dank dungeon is full of monsters.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 200000;
      },
    },
    [LocationType.Beach]: {
      name: 'A Sunny Beach',
      description:
        'A beautiful beach where you can definitely relax without worrying about any monsters creeping from the waves to murder you.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 1e6;
      },
    },

    [LocationType.DeepSea]: {
      name: 'The Deep Sea',
      description: 'The depths of the sea.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 1e8;
      },
    },
    [LocationType.MountainTops]: {
      name: 'The Mountain Tops',
      description: 'The tops of the highest mountains.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 1e10;
      },
    },
    [LocationType.AshenCrater]: {
      name: 'The Ashen Crater',
      description:
        'A huge empty hole in the ground, covered in gray ash and smoke. The ground here is scorching, with glowing red cracks revealing fire just under the surface.',
      realm: Realm.MortalRealm,
      unlock: () => {
        return this.characterService.attributes.speed.value * this.distanceMultiplier > 1e14;
      },
    },
    [LocationType.Gates]: {
      name: LocationType.Gates,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.TongueRipping]: {
      name: LocationType.TongueRipping,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Scissors]: {
      name: LocationType.Scissors,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.TreesOfKnives]: {
      name: LocationType.TreesOfKnives,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Mirrors]: {
      name: LocationType.Mirrors,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Steamers]: {
      name: LocationType.Steamers,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.CopperPillars]: {
      name: LocationType.CopperPillars,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MountainOfKnives]: {
      name: LocationType.MountainOfKnives,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MountainOfIce]: {
      name: LocationType.MountainOfIce,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.CauldronsOfOil]: {
      name: LocationType.CauldronsOfOil,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.CattlePit]: {
      name: LocationType.CattlePit,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.CrushingBoulder]: {
      name: LocationType.CrushingBoulder,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MortarsAndPestles]: {
      name: LocationType.MortarsAndPestles,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.BloodPool]: {
      name: LocationType.BloodPool,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.WrongfulDead]: {
      name: LocationType.WrongfulDead,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Dismemberment]: {
      name: LocationType.Dismemberment,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MountainOfFire]: {
      name: LocationType.MountainOfFire,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Mills]: {
      name: LocationType.Mills,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Saws]: {
      name: LocationType.Saws,
      realm: Realm.Hell,
      description: '',
      unlock: () => {
        return false;
      },
    },
    [LocationType.BurningInferno]: {
      name: LocationType.BurningInferno,
      realm: Realm.RealmOfFire,
      description: 'Nothing but fire as far as you can see.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.VastOcean]: {
      name: LocationType.VastOcean,
      realm: Realm.RealmOfWater,
      description: 'Nothing but water as far as you can see.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.EndlessTunnels]: {
      name: LocationType.EndlessTunnels,
      realm: Realm.RealmOfEarth,
      description: 'Nothing but earth as far as you can see.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.IronCaverns]: {
      name: LocationType.IronCaverns,
      realm: Realm.RealmOfMetal,
      description: 'Nothing but metal as far as you can see.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.EverTree]: {
      name: LocationType.EverTree,
      realm: Realm.RealmOfWood,
      description: 'Nothing but wood as far as you can see.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MessageDepot]: {
      name: LocationType.MessageDepot,
      realm: Realm.PhilosopherStates,
      description: 'Home of Hermes, messenger of the gods, god of travel and thieves.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MartialCamp]: {
      name: LocationType.MartialCamp,
      realm: Realm.PhilosopherStates,
      description: 'Home of Ares, god of war, bloodshed, and violence.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.VerdantVineyard]: {
      name: LocationType.VerdantVineyard,
      realm: Realm.PhilosopherStates,
      description: 'Home of Dionysus, god of wine.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.TheMightyForge]: {
      name: LocationType.TheMightyForge,
      realm: Realm.PhilosopherStates,
      description: 'Home of Hephaestus, god of fire, metallurgy, and crafts.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.GardenOfDelights]: {
      name: LocationType.GardenOfDelights,
      realm: Realm.PhilosopherStates,
      description: 'Home of Aphrodite, goddess of love, beauty, and desire.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.Woodlands]: {
      name: LocationType.Woodlands,
      realm: Realm.PhilosopherStates,
      description: 'Home of Artemis, goddess of the hunt, wilderness, and the moon.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.AuditoriumOfLight]: {
      name: LocationType.AuditoriumOfLight,
      realm: Realm.PhilosopherStates,
      description: 'Home of Apollo, god of music, prophecy, healing, and the sun.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.FortressOfWisdom]: {
      name: LocationType.FortressOfWisdom,
      realm: Realm.PhilosopherStates,
      description: 'Home of Athena, goddess of wisdom, war strategy, and crafts.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.HarvestHome]: {
      name: LocationType.HarvestHome,
      realm: Realm.PhilosopherStates,
      description: 'Home of Demeter, goddess of harvest and agriculture.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.OceanPalace]: {
      name: LocationType.OceanPalace,
      realm: Realm.PhilosopherStates,
      description: 'Home of Poseidon, god of the sea, earthquakes, and horses.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.MaritalSanctuary]: {
      name: LocationType.MaritalSanctuary,
      realm: Realm.PhilosopherStates,
      description: 'Home of Hera, Queen of the gods, goddess of marriage and women.',
      unlock: () => {
        return false;
      },
    },
    [LocationType.LightningLodge]: {
      name: LocationType.LightningLodge,
      realm: Realm.PhilosopherStates,
      description: 'Home of Zeus, King of the gods with power over the sky, thunder, and justice.',
      unlock: () => {
        return false;
      },
    },
  };

  unlockedLocations: LocationType[] = [];
  notifiedLocations: LocationType[] = [];
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
      this.notifiedLocations = [];
      this.checkForUnlocks();
    });
  }

  setRealm(realm: Realm) {
    this.currentRealm = realm;
    if (this.locationMap[this.location].realm !== this.currentRealm) {
      // location is in the wrong realm, update it with the default for the realm
      if (this.currentRealm === Realm.MortalRealm) {
        this.location = LocationType.SmallTown;
      } else if (this.currentRealm === Realm.Hell) {
        this.location = LocationType.Gates;
      }
    }
  }

  checkForUnlocks() {
    if (this.hellService.inHell()) {
      // don't do any unlocking
      return;
    } else {
      this.unlockedLocations = [];
      for (const keyString in LocationType) {
        const key = keyString as LocationType;
        if (!this.unlockedLocations.includes(key)) {
          if (this.locationMap[key]) {
            if (this.locationMap[key].unlock()) {
              this.unlockedLocations.push(key);
              if (
                !this.notifiedLocations.includes(key) &&
                key !== LocationType.Self &&
                key !== LocationType.SmallTown
              ) {
                this.notifiedLocations.push(key);
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
  }

  setLocation(location: LocationType | null) {
    if (this.locationLocked) {
      this.logService.log(LogTopic.EVENT, "You can't select a new location now.");
      return;
    }
    if (location === null) {
      this.location = LocationType.SmallTown;
    } else {
      this.location = location;
    }
  }

  getProperties(): LocationProperties {
    return {
      unlockedLocations: this.unlockedLocations,
      notifiedLocations: this.notifiedLocations,
      location: this.location,
      currentRealm: this.currentRealm,
      locationLocked: this.locationLocked,
      distanceMultiplier: this.distanceMultiplier,
    };
  }

  setProperties(properties: LocationProperties) {
    this.unlockedLocations = properties.unlockedLocations;
    this.notifiedLocations = properties.notifiedLocations;
    this.setRealm(properties.currentRealm);
    this.location = properties.location;
    this.locationLocked = properties.locationLocked;
    this.distanceMultiplier = properties.distanceMultiplier;
  }
}
