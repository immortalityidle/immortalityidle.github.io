import { CharacterAttribute, StatusType } from '../game-state/character';

export enum ActivityType {
  OddJobs,
  Resting,
  Begging,
  Blacksmithing,
  GatherHerbs,
  ChopWood,
  Woodworking,
  Leatherworking,
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
  ConquerTheWorld,
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
  imageBaseName?: string;
  level: number;
  activityType: ActivityType;
  description: string[];
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
  resourceUse?: ActivityResource[];
  projectionOnly?: boolean;
  portal?: boolean;
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
  disabled?: boolean;
}
