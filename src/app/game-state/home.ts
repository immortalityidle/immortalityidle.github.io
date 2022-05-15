import { FurniturePosition, HomeType } from "./home.service";

export interface Home {
  name: string;
  type: HomeType;
  description: string;
  cost: number;
  costPerDay: number;
  landRequired: number;
  maxInventory: number;
  consequence: () => void;
  furnitureSlots: FurniturePosition[];
}

