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
  BodyCultivation,
  MindCultivation,
  CoreCultivation,
  Recruiting,
  Swim
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
  impossible?: boolean;
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
}
