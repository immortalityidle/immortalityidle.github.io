export interface Requirements {
  strength: number;
  toughness: number;
  speed: number;
  intelligence: number;
  charisma: number;
  spirituality: number;
}

export interface Activity {
  name: string;
  description: string;
  consequenceDescription: string;
  requirements: Requirements;
  consequence: () => void;
}

export interface ActivityLoopEntry {
  activity: Activity;
  repeatTimes: number;
}
