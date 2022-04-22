import { CharacterAttribute } from '../game-state/character';

export interface Activity {
  name: string;
  description: string;
  consequenceDescription: string;
  requirements: CharacterAttribute;
  consequence: () => void;
}

export interface ActivityLoopEntry {
  activity: Activity;
  repeatTimes: number;
}
