import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterService } from './character.service';

export interface Item {
  name: string;
  description: string;
  value: number;
  type: string;
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

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    this.reset();
    mainLoopService.tickSubject.subscribe(() => {
      this.eatFood();
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  itemRepo = {
    rice: {
      name: "rice",
      type: "food",
      value: 1,
      description: "A basic staple of life. One pouch will sustain you for a day.",
      useLabel: "Eat",
      useDescription: "Fills your belly.",
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.checkOverage();
      }
    },
    herbs: {
      name: "herbs",
      type: "food",
      value: 2,
      description: "Useful herbs. Can be eaten directly or used in creating pills or potions.",
      useLabel: "Eat",
      useDescription: "Fills your belly and restores a bit of health.",
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.checkOverage();
      }
    },
    junk: {
      name: "junk",
      type: "junk",
      value: 1,
      description: "Some metal junk.",
    }
  }

  reset(){
    this.logService.addLogMessage("Your mother gives you three big bags of rice as she sends you out to make your way in the world");
    this.itemStacks = [
      {item: this.itemRepo.rice, quantity:99},
      {item: this.itemRepo.rice, quantity:99},
      {item: this.itemRepo.rice, quantity:99}
    ];
  }

  // find the cheapest food in the inventory and use it
  eatFood(){
    let foodStack = null;
    let foodValue = Number.MAX_VALUE;
    for (const itemIterator of this.itemStacks){
      if (itemIterator.item.type == "food" && itemIterator.item.value < foodValue){
        foodStack = itemIterator;
      }
    }
    if (foodStack){
      this.useItem(foodStack);
    } else {
      // no food found, buy a bowl of rice automatically
      if (this.characterService.characterState.money > 0){
        this.characterService.characterState.money--;
        this.characterService.characterState.status.nourishment.value++;
      }
    }
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
