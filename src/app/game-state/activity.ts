import { CharacterAttribute, StatusType } from './character.service';
import { LocationType, Realm } from './location.service';

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
  HellSwim,
  FinishHell,
  MortalRealmPortal,
  DivineRealmPortal,
  FireRealmPortal,
  EarthRealmPortal,
  WaterRealmPortal,
  MetalRealmPortal,
  WoodRealmPortal,
  ContemplateFire,
  ContemplateWater,
  ContemplateEarth,
  ContemplateMetal,
  ContemplateWood,
  RefineTechniques,
  ManipulateEnergy,
  ExtractGems,
  PhilosopherStatesRealmPortal,
  DeliverMessages,
  ProvideWine,
  Hell, // hell needs to be last for indexing purposes
}

export type ActivityResource = {
  [key in StatusType]?: number;
};

export interface Activity {
  name: string[];
  location: LocationType;
  realm?: Realm;
  imageBaseName?: string;
  level: number;
  activityType: ActivityType;
  description: string[];
  yinYangEffect: YinYangEffect[];
  consequenceDescription: string[];
  requirements: CharacterAttribute[];
  divinityRequired?: boolean[];
  conceptRequirements?: string[];
  landRequirements?: number;
  fallowLandRequirements?: number;
  farmedLandRequirements?: number;
  consequence: (() => void)[];
  unlocked: boolean;
  notifiedLevel?: number;
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
