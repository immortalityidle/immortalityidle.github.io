import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from './character.service';

export interface Item {
  name: string;
  description: string;
  value: number;
  useLabel?: string;
  useDescription?: string;
  useConsumes?: boolean;
  use?: () => void;
}

export interface ItemStack {
  item: Item;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})

export class InventoryService {
  itemStacks: ItemStack[] = [];
  maxItems: number = 32;
  maxStackSize = 99;

  constructor(private logService: LogService, private characterService: CharacterService) { }

  itemRepo = {
    herbs: {
      name: "herbs", 
      value: 2, 
      description: "Useful herbs. Can be eaten directly or used in creating pills or potions.", 
      useLabel: "Eat",
      useDescription: "Restores a bit of health.",
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.checkOverage();
      }
    }
  }

  reset(){
    this.itemStacks = [];
  }

  addItem(item: Item){
    for (const itemIterator of this.itemStacks){
      if (itemIterator.item.name == item.name && (itemIterator.quantity < this.maxStackSize)){
        // it matches an existing item and there's room in the stack, add it to the stack and bail out
        itemIterator.quantity++;
        return;
      }
    }
    // couldn't stack it, make a new stack
    if (this.itemStacks.length < this.maxItems){
      this.itemStacks.push({item: item, quantity: 1});
    } else {
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you threw it away.`);
    }
  }

  sell(itemStack: ItemStack, quantity: number){
    let index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity){
      this.itemStacks.splice(index, 1);
      this.characterService.characterState.money += (itemStack.quantity * itemStack.item.value);
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.money += (quantity * itemStack.item.value);
    }
  }

  useItem(itemStack: ItemStack){
    if (itemStack.item.use){
      itemStack.item.use();
    }
    if (itemStack.item.useConsumes){
      itemStack.quantity--;
      if (itemStack.quantity <= 0){
        let index = this.itemStacks.indexOf(itemStack);
        this.itemStacks.splice(index, 1);
      }
    }
  }
}
