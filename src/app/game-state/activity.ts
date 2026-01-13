import { CharacterAttribute, StatusType } from './character.service';

export enum YinYangEffect {
  Yin,
  Yang,
  Balance,
  None,
}

export enum ActivityType {
  OddJobs,
  Resting,
  GatherHerbs,
  ChopWood,
  Begging,
  Cooking,
  Blacksmithing,
  Woodworking,
  Leatherworking,
  FormationCreation,
  Plowing,
  Clearing,
  Farming,
  Mining,
  Smelting,
  Hunting,
  Fishing,
  Alchemy,
  Merchant,
  Burning,
  BalanceChi,
  BodyCultivation,
  MindCultivation,
  CoreCultivation,
  SoulCultivation,
  InfuseBody,
  InfuseEquipment,
  ExtendLife,
  Recruiting,
  TrainingFollowers,
  SynthesizingGems,
  Swim,
  ForgeChains,
  AttachChains,
  MakeBrick,
  MakeMortar,
  MakeScaffold,
  BuildTower,
  ResearchWind,
  TameWinds,
  LearnToFly,
  OfferDragonFood,
  OfferDragonWealth,
  TalkToDragon,
  GatherArmies,
  ConquerTheNation,
  MoveStars,
  Taunting,
  EscapeHell,
  ReturnToHell,
  HellRecruiting,
  BurnMoney,
  HonorAncestors,
  CombatTraining,
  Rehabilitation,
  CopperMining,
  ForgeHammer,
  ClimbMountain,
  AttackClimbers,
  MeltMountain,
  HealAnimals,
  PetRecruiting,
  PetTraining,
  LiftBoulder,
  SearchForExit,
  TeachTheWay,
  Interrogate,
  RecoverTreasure,
  ReplaceTreasure,
  PurifyGems,
  Endure,
  FreezeMountain,
  ExamineContracts,
  FinishHell,
  Hell, // hell needs to be last for indexing purposes
}

export type ActivityResource = {
  [key in StatusType]?: number;
};

export interface Activity {
  name: string[];
  location: LocationType;
  imageBaseName?: string;
  level: number;
  activityType: ActivityType;
  description: string[];
  yinYangEffect: YinYangEffect[];
  consequenceDescription: string[];
  requirements: CharacterAttribute[];
  conceptRequirements?: string[];
  landRequirements?: number;
  fallowLandRequirements?: number;
  farmedLandRequirements?: number;
  consequence: (() => void)[];
  unlocked: boolean;
  relockable?: boolean;
  discovered?: boolean;
  skipApprenticeshipLevel: number;
  lastIncome?: number;
  resourceUse: ActivityResource[];
  projectionOnly?: boolean;
  impossibleTaskIndex?: number;
  hells?: number[];
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
  disabled?: boolean;
  userDisabled?: boolean;
}

export interface SavedActivityLoop {
  name: string;
  activities: ActivityLoopEntry[];
}

export interface LoopChangeTrigger {
  attribute: string;
  value: number;
  scheduleName: string;
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
  Hell = 'Hell',
}

// note: hells need to go first in this list
export enum Realm {
  Gates,
  TongueRipping,
  Scissors,
  TreesOfKnives,
  Mirrors,
  Steamers,
  CopperPillars,
  MountainOfKnives,
  MountainOfIce,
  CauldronsOfOil,
  CattlePit,
  CrushingBoulder,
  MortarsAndPestles,
  BloodPool,
  WrongfulDead,
  Dismemberment,
  MountainOfFire,
  Mills,
  Saws,
  MortalRealm,
  DivineRealm,
}

export const RealmNames = [
  'Gates of Hell',
  'Hell of Tongue Ripping',
  'Hell of Scissors',
  'Hell of the Trees of Knives',
  'Hell of Mirrors',
  'Hell of Steamers',
  'Hell of Copper Pillars',
  'Hell of the Mountain of Knives',
  'Hell of the Mountain of Ice',
  'Hell of the Cauldrons of Oil',
  'Hell of the Cattle Pit',
  'Hell of the Crushing Boulder',
  'Hell of Mortars and Pestles',
  'Hell of the Blood Pool',
  'Hell of the Wrongful Dead',
  'Hell of Dismemberment',
  'Hell of the Mountain of Fire',
  'Hell of Mills',
  'Hell of Saws',
  'Mortal Realm',
  'Divine Realm',
];
