import { CharacterAttribute } from '../game-state/character';

export enum ActivityType {
  OddJobs,
  Resting,
  Begging,
  ApprenticeBlacksmithing,
  Blacksmithing,
  GatherHerbs,
  ChopWood,
  Woodworking
}

export interface Activity {
  name: string;
  activityType: ActivityType;
  description: string;
  consequenceDescription: string;
  requirements: CharacterAttribute;
  consequence: () => void;
}

export interface ActivityLoopEntry {
  activity: ActivityType;
  repeatTimes: number;
}
