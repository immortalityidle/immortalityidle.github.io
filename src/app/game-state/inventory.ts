import { max } from "rxjs";

export interface Item {
  name: string;
  description: string;
  quantity: number;
}

export class Inventory {
  items: Item[];
  maxItems: number;

  constructor(maxItems: number){
    this.items = [];
    this.maxItems = maxItems;
  }

  addItem(item: Item){
    if (this.items.length < this.maxItems){
      this.items.push(item);
    } else {
      // log that the item got thrown away cause you couldn't carry it
    }
  }
}
