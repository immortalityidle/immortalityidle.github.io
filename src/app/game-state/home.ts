export interface Home {
  name: string;
  description: string;
  cost: number;
  costPerDay: number;
  landRequired: number;
  consequence: () => void;
}

