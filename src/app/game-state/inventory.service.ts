import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from './character.service';

export interface Item {
  name: string;
  grade: number;
  description: string;
  quantity: number;
  value: number;
}
@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  items: Item[] = [];
  maxItems: number = 32;
  maxStackSize = 99;

  constructor(private logService: LogService, private characterService: CharacterService) { }

  reset(){
    this.items = [];
  }

  addItem(item: Item){
    for (const itemIterator of this.items){
      if (itemIterator.name == item.name && itemIterator.grade == item.grade && (itemIterator.quantity + item.quantity <= this.maxStackSize)){
        // it matches an existing item and there's room in the stack, add it to the stack and bail out
        itemIterator.quantity += item.quantity;
        return;
      }
    }
    // couldn't stack it, make a new stack
    if (this.items.length < this.maxItems){
      this.items.push(item);
    } else {
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you threw it away.`);
    }
  }

  sell(item: Item, quantity: number){
    let index = this.items.indexOf(item);
    if (quantity >= item.quantity){
      this.items.splice(index, 1);
      this.characterService.characterState.money += (item.quantity * item.value);
    } else {
      item.quantity -= quantity;
      this.characterService.characterState.money += (quantity * item.value);
    }

  }
}
