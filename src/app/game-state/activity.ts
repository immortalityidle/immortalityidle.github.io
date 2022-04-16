import { CharacterAttribute } from "./character";

export interface Activity {
  name: string;
  repeatTimes: number;
  consequence: () => void;
}

