import { CharacterAttribute } from '../game-state/character';

export enum ActivityType {
  OddJobs,
  Resting,
  Begging,
  ApprenticeBlacksmithing,
  Blacksmithing,
  GatherHerbs,
  ChopWood,
  Woodworking,
  Farming
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
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
}
