import { CharacterAttribute } from '../game-state/character';

export enum ActivityType {
  OddJobs,
  Resting,
  Begging,
  Blacksmithing,
  GatherHerbs,
  ChopWood,
  Woodworking,
  Leatherworking,
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
  Hell // hell needs to be last for indexing purposes

}

export interface ActivityResource {
  health?: number,
  stamina?: number,
  mana?: number,
  nourishment?: number;
}

export interface Activity {
  name: string[];
  level: number;
  activityType: ActivityType;
  description: string[];
  consequenceDescription: string[];
  requirements: CharacterAttribute[];
  landRequirements?: number;
  consequence: (() => void)[];
  unlocked: boolean;
  discovered?: boolean;
  skipApprenticeshipLevel: number;
  lastIncome?: number;
  resourceUse?: ActivityResource[]
  projectionOnly?: boolean
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
  disabled?: boolean;
}
