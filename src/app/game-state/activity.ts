import { CharacterAttribute } from "./character";

export interface Activity {
  name: string;
  description: string;
  requirements: CharacterAttribute;
  consequence: () => void;
}

export interface ActivityLoopEntry {
  activity: Activity;
  repeatTimes: number;
}
