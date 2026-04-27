/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { CharacterService } from './character.service';
import { LogService, LogTopic } from './log.service';
import { HellService } from './hell.service';
import {
  GOD_APHRODITE,
  GOD_APOLLO,
  GOD_ARES,
  GOD_ARTEMIS,
  GOD_ATHENA,
  GOD_DEMETER,
  GOD_DIONYSUS,
  GOD_HADES,
  GOD_HEPHAESTUS,
  GOD_HERA,
  GOD_POSEIDON,
  GOD_ZEUS,
  PantheonService,
} from './pantheon.service';

export enum Realm {
  Hell = 'Hell',
  MortalRealm = 'Mortal Realm',
  DivineRealm = 'Divine Realm',
  RealmOfFire = 'Realm of Fire',
  RealmOfWater = 'Realm of Water',
  RealmOfEarth = 'Realm of Earth',
  RealmOfMetal = 'Realm of Metal',
  RealmOfWood = 'Realm of Wood',
  PhilosopherStates = 'The Philosopher States',
  LegionOfArchitects = 'The Legion Of Architects',
  RiverThroughTheSand = 'The River Through The Sand',
  FrozenNorthlands = 'The Frozen Northlands',
  MysteriousJungles = 'The Mysterious Jungles',
  DistantIslands = 'The Distant Islands',
  CultOfTheOldOnes = 'The Cult Of The Old Ones',
  SunsoakedPlains = 'The Sunsoaked Plains',
  DarkForests = 'The Dark Forests',
  EnlightenedMultitude = 'The Enlightened Multitude',
  FertileValleys = 'The Fertile Valleys',
  LandOfLegends = 'The Land Of Legends',
  IslandsOfTheDawn = 'The Islands Of The Dawn',
  ShadowCultists = 'The Shadow Cultists',
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
  MountPenglai = 'Mount Penglai',
  DivineArena = 'Divine Arena',
  BurningInferno = 'Burning Inferno',
  VastOcean = 'Vast Ocean',
  EndlessTunnels = 'Endless Tunnels',
  IronCaverns = 'Iron Caverns',
  EverTree = 'Ever Tree',
  LightningLodge = 'LightningLodge',
  TartarusPalace = 'TartarusPalace',
  MaritalSanctuary = 'MaritalSanctuary',
  OceanAbode = 'OceanAbode',
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
    [LocationType.MountPenglai]: {
      name: LocationType.MountPenglai,
      realm: Realm.DivineRealm,
      description: 'The home of the gods. an immortal isl shrouded in mists and crowned with golden light.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.DivineArena]: {
      name: LocationType.DivineArena,
      realm: Realm.DivineRealm,
      description: 'The arena where the gods gather to spar for fun and glory.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.BurningInferno]: {
      name: LocationType.BurningInferno,
      realm: Realm.RealmOfFire,
      description: 'Nothing but fire as far as you can see.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.VastOcean]: {
      name: LocationType.VastOcean,
      realm: Realm.RealmOfWater,
      description: 'Nothing but water as far as you can see.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.EndlessTunnels]: {
      name: LocationType.EndlessTunnels,
      realm: Realm.RealmOfEarth,
      description: 'Nothing but earth as far as you can see.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.IronCaverns]: {
      name: LocationType.IronCaverns,
      realm: Realm.RealmOfMetal,
      description: 'Nothing but metal as far as you can see.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.EverTree]: {
      name: LocationType.EverTree,
      realm: Realm.RealmOfWood,
      description: 'Nothing but wood as far as you can see.',
      unlock: () => {
        return true;
      },
    },
    [LocationType.MessageDepot]: {
      name: LocationType.MessageDepot,
      realm: Realm.PhilosopherStates,
      description: 'A strange outpost with rows of scrolls and winged shoes. What sort of god would want to live here?',
      unlock: () => {
        return true;
      },
    },
    [LocationType.VerdantVineyard]: {
      name: LocationType.VerdantVineyard,
      realm: Realm.PhilosopherStates,
      description:
        'A vineyard overflowing with juicy grapes. Some mortals seem to be fermenting them in leather skins and clay pots.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_DIONYSUS);
      },
    },
    [LocationType.Woodlands]: {
      name: LocationType.Woodlands,
      realm: Realm.PhilosopherStates,
      description:
        'A verdant wooded grove rife with game animals but no home. Does the goddess of this place simply sleep on the ground?',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_ARTEMIS);
      },
    },
    [LocationType.GardenOfDelights]: {
      name: LocationType.GardenOfDelights,
      realm: Realm.PhilosopherStates,
      description: 'A lush garden where mortals cavort and preen. What vanity!',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_APHRODITE);
      },
    },
    [LocationType.TheMightyForge]: {
      name: LocationType.TheMightyForge,
      realm: Realm.PhilosopherStates,
      description:
        'A huge anvil in a massive cavern. A river of molten bronze flows past a row of giant hammers. A painting of Aphrodite hangs on one wall.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_HEPHAESTUS);
      },
    },
    [LocationType.AuditoriumOfLight]: {
      name: LocationType.AuditoriumOfLight,
      realm: Realm.PhilosopherStates,
      description: 'A great sun-lit auditorium where mortals play out scenes from their poems.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_APOLLO);
      },
    },
    [LocationType.HarvestHome]: {
      name: LocationType.HarvestHome,
      realm: Realm.PhilosopherStates,
      description:
        'Mortals gather large bushels of wheat from all around this fruitful plain. The orchards all around are rich with apples and figs.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_DEMETER);
      },
    },
    [LocationType.MartialCamp]: {
      name: LocationType.MartialCamp,
      realm: Realm.PhilosopherStates,
      description:
        'An army camp in the middle of a battlefield. The mortals here seem to be fighting for no reason at all.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_ARES);
      },
    },
    [LocationType.FortressOfWisdom]: {
      name: LocationType.FortressOfWisdom,
      realm: Realm.PhilosopherStates,
      description: 'A well-defended fort guarded by soldiers in gleaming bronze armor.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_ATHENA);
      },
    },
    [LocationType.MaritalSanctuary]: {
      name: LocationType.MaritalSanctuary,
      realm: Realm.PhilosopherStates,
      description: 'A temple dedicated to the faithful and jealous wife of a scoundrel husband.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_HERA);
      },
    },
    [LocationType.OceanAbode]: {
      name: LocationType.OceanAbode,
      realm: Realm.PhilosopherStates,
      description: 'An undersea estate surrounded by colorful coral and statues of horses.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_POSEIDON);
      },
    },
    [LocationType.TartarusPalace]: {
      name: LocationType.TartarusPalace,
      realm: Realm.PhilosopherStates,
      description: 'A dark and gloomy palace buried deep in the earth below the philosopher states.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_HADES);
      },
    },
    [LocationType.LightningLodge]: {
      name: LocationType.LightningLodge,
      realm: Realm.PhilosopherStates,
      description: 'A lofty palace at the peak of one of the local mountains. Thunderclouds loom overhead.',
      unlock: () => {
        return this.pantheonService.isGodDiscovered(GOD_ZEUS);
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
    private hellService: HellService,
    private pantheonService: PantheonService
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
      } else if (this.currentRealm === Realm.DivineRealm) {
        this.location = LocationType.MountPenglai;
      } else if (this.currentRealm === Realm.RealmOfFire) {
        this.location = LocationType.BurningInferno;
      } else if (this.currentRealm === Realm.RealmOfWater) {
        this.location = LocationType.VastOcean;
      } else if (this.currentRealm === Realm.RealmOfEarth) {
        this.location = LocationType.EndlessTunnels;
      } else if (this.currentRealm === Realm.RealmOfMetal) {
        this.location = LocationType.IronCaverns;
      } else if (this.currentRealm === Realm.RealmOfWood) {
        this.location = LocationType.EverTree;
      } else if (this.currentRealm === Realm.PhilosopherStates) {
        this.location = LocationType.MessageDepot;
      }
    }
  }

  checkForUnlocks() {
    if (this.hellService.inHell()) {
      // don't do any unlocking
      return;
    } else {
      this.unlockedLocations = [];
      for (const keyString in this.locationMap) {
        const key = keyString as LocationType;
        const location = this.locationMap[key];
        if (location && (!location.realm || location.realm === this.currentRealm) && location.unlock()) {
          this.unlockedLocations.push(key);
          if (!this.notifiedLocations.includes(key) && key !== LocationType.Self && key !== LocationType.SmallTown) {
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
