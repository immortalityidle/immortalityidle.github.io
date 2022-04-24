import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { CharacterService } from './character.service';
import { WeaponNames, ItemPrefixes } from './itemResources';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  durability: number;
  strengthScaling: number;
  speedScaling: number;
}

export interface Item {
  name: string;
  description: string;
  value: number;
  type: string;
  useLabel?: string;
  useDescription?: string;
  useConsumes?: boolean;
  use?: () => void;
  weaponStats?: WeaponStats;
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
  noFood: boolean;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {
    this.noFood = false;
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
    herb: {
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
    log: {
      name: "log",
      type: "wood",
      value: 1,
      description: "A good-quality log."
    },
    junk: {
      name: "junk",
      type: "junk",
      value: 1,
      description: "Some metal junk.",
    }
  }

  // weapon grades from 1-10, materials are wood or metal (TODO: more detail on materials)
  generateWeapon(grade: number, material: string){
    let prefixMax = (grade / 10) * ItemPrefixes.length;
    let prefixIndex = Math.floor(Math.random() * prefixMax);
    let prefix = ItemPrefixes[prefixIndex];
    let name = prefix + " " + WeaponNames[Math.floor(Math.random() * WeaponNames.length)];
    let type = "rightHand";
    if (Math.random() < 0.5){
      type = "leftHand";
    }
    let value = prefixIndex;
    this.logService.addLogMessage("Your hard work paid off! You got a " + name + ".");
    return {
      name: name,
      type: type,
      value: value,
      weaponStats: {
        baseDamage: grade,
        material: material,
        durability: (prefixIndex * 10),
        strengthScaling: (Math.random() * grade),
        speedScaling: (Math.random() * grade)
      },
      description: "A unique and special weapon."
    };
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
      this.noFood = false;
    } else {
      // no food found, buy a bowl of rice automatically
      this.noFood = true;
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
  equip(itemStack: ItemStack){
      //return the item already in the slot to the inventory, if any
      // I hate typescript, can you make this right?
      //@ts-ignore
      if (this.characterService.characterState.equipment[itemStack.item.type]){
        //@ts-ignore
        this.addItem(this.characterService.characterState.equipment[itemStack.item.type]);
      }
      //@ts-ignore
      this.characterService.characterState.equipment[itemStack.item.type] = itemStack.item;
      let index = this.itemStacks.indexOf(itemStack);
      this.itemStacks.splice(index, 1);
  }
}
