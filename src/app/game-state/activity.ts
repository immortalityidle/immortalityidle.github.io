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
  ManaControl,
  BodyCultivation,
  MindCultivation,
  CoreCultivation,
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
  EscapeHell,
  HellRecruiting,
  BurnMoney,
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
  skipApprenticeshipLevel: number;
  lastIncome?: number;
  resourceUse?: ActivityResource[]
  projectionOnly?: boolean
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
}
