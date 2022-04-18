import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';

export interface Item {
  name: string;
  description: string;
  quantity: number;
}
@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  items: Item[] = [];
  maxItems: number = 32;

  constructor(private logService: LogService) { }

  addItem(item: Item){
    if (this.items.length < this.maxItems){
      this.items.push(item);
    } else {
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you threw it away.`);
    }
  }
}
