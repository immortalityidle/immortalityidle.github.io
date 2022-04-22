import { HomeType } from "./home.service";

export interface Home {
  name: string;
  type: HomeType;
  description: string;
  cost: number;
  costPerDay: number;
  landRequired: number;
  consequence: () => void;
}

