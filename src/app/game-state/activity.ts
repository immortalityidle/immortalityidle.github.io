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
  Hell = 'Hell',
}
