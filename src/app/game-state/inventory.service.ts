import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { EquipmentPosition, AttributeType } from './character';
import { CharacterService } from './character.service';
import { ItemRepoService } from './item-repo.service';
import { WeaponNames, ItemPrefixes } from './itemResources';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  durability: number;
  strengthScaling: number;
  speedScaling: number;
}

export interface Item {
  id: ItemType;
  name: string;
  description: string;
  value: number;
  type: string;
  useLabel?: string;
  useDescription?: string;
  useConsumes?: boolean;
  use?: () => void;
  owned?: () => boolean; // used for single-use permanent upgrades so we can see if they need to be bought again
}

export interface Equipment extends Item {
  slot: EquipmentPosition;
  weaponStats?: WeaponStats;
}

export interface Potion extends Item {
  attribute: AttributeType,
  increase: number
}

export interface ItemStack {
  item: Item;
  quantity: number;
}

export type ItemType =
  | 'metalOre'
  | 'rice'
  | 'herb'
  | 'log'
  | 'junk'
  | 'perpetualFarmingManual'
  | 'weapon'
  | 'restartActivityManual'
  | 'cabbage'
  | 'beans'
  | 'melon'
  | 'peach'
  | 'broccoli'
  | 'meat'
  | 'potion';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  itemStacks: ItemStack[] = [];
  maxItems: number = 32;
  maxStackSize = 999;
  noFood: boolean;
  selectedItem: ItemStack | null = null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
    this.noFood = false;
    mainLoopService.tickSubject.subscribe((newDay) => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (newDay) {
        this.eatFood();
      }
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  farmFoodList = [
    this.itemRepoService.rice,
    this.itemRepoService.cabbage,
    this.itemRepoService.beans,
    this.itemRepoService.melon,
    this.itemRepoService.peach,
  ]

  // weapon grades from 1-10, materials are wood or metal (TODO: more detail on materials)
  generateWeapon(grade: number, material: string): Equipment {
    let prefixMax = (grade / 10) * ItemPrefixes.length;
    let prefixIndex = Math.floor(Math.random() * prefixMax);
    let prefix = ItemPrefixes[prefixIndex];
    let name =
      prefix +
      ' ' +
      WeaponNames[Math.floor(Math.random() * WeaponNames.length)];
    let slot: EquipmentPosition = 'rightHand';
    if (Math.random() < 0.5) {
      slot = 'leftHand';
    }
    let value = prefixIndex;
    this.logService.addLogMessage('Your hard work paid off! You got a ' + name + '.','STANDARD', 'EVENT');
    return {
      id: 'weapon',
      name: name,
      type: "equipment",
      slot: slot,
      value: value,
      weaponStats: {
        baseDamage: grade,
        material: material,
        durability: prefixIndex * 10,
        strengthScaling: Math.random() * grade,
        speedScaling: Math.random() * grade,
      },
      description: 'A unique and special weapon.',
    };
  }

  generatePotion(grade: number): Potion {
    const keys = Object.keys(
      this.characterService.characterState.attributes
    ) as AttributeType[];
    // randomly choose any of the first five stats
    const key = keys[Math.floor(Math.random() * 5)];

    return {
      name: "Potion of " + key,
      id: "potion",
      type: "potion",
      value: grade,
      description: "A potion that increases " + key,
      useLabel: 'Drink',
      useDescription: '.',
      useConsumes: true,
      attribute: key,
      increase: grade
    };
  }

  reset(): void {
    this.itemStacks = [];
    if (Math.random() < 0.3) {
      this.logService.addLogMessage(
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.',
        'STANDARD', 'EVENT');
      this.itemStacks = [
        { item: this.itemRepoService.rice, quantity: 99 },
        { item: this.itemRepoService.rice, quantity: 99 },
        { item: this.itemRepoService.rice, quantity: 99 },
      ];
    }
  }

  // find the best food in the inventory and use it
  eatFood(): void {
    let foodStack = null;
    let foodValue = 0;
    for (const itemIterator of this.itemStacks) {
      if (
        itemIterator.item.type == 'food' &&
        itemIterator.item.value > foodValue
      ) {
        foodStack = itemIterator;
      }
    }
    if (foodStack) {
      this.useItem(foodStack);
      this.noFood = false;
    } else {
      // no food found, buy a bowl of rice automatically
      this.noFood = true;
      if (this.characterService.characterState.money > 0) {
        this.characterService.characterState.money--;
        this.characterService.characterState.status.nourishment.value++;
      }
    }
  }

  addItems(item: Item, quantity: number): void {
    //doing this the slacker inefficient way, optimize later if needed
    for (let i = 0; i < quantity; i++) {
      this.addItem(item);
    }
  }

  addItem(item: Item): void {
    for (const itemIterator of this.itemStacks) {
      if (
        itemIterator.item.name == item.name &&
        itemIterator.quantity < this.maxStackSize
      ) {
        // it matches an existing item and there's room in the stack, add it to the stack and bail out
        itemIterator.quantity++;
        return;
      }
    }
    // couldn't stack it, make a new stack
    if (this.itemStacks.length < this.maxItems) {
      this.itemStacks.push({ item: item, quantity: 1 });
    } else {
      this.logService.addLogMessage(
        `You don't have enough room for the ${item.name} so you threw it away.`,
        'STANDARD', 'EVENT');
    }
  }

  sell(itemStack: ItemStack, quantity: number): void {
    let index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks.splice(index, 1);
      this.characterService.characterState.money += itemStack.quantity * itemStack.item.value;
      this.selectedItem = null;
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.money += quantity * itemStack.item.value;
    }
  }

  sellAll(item: Item){
    for  (let i = this.itemStacks.length - 1; i >= 0; i--){
      if (this.itemStacks[i].item.name == item.name){
        this.sell(this.itemStacks[i], this.itemStacks[i].quantity);
      }
    }
  }

  useItem(itemStack: ItemStack): void {
    if (itemStack.item.type == "potion" && instanceOfPotion(itemStack.item)){
      this.usePotion(itemStack.item);
    } else if (itemStack.item.use) {
      itemStack.item.use();
    }
    if (itemStack.item.useConsumes) {
      itemStack.quantity--;
      if (itemStack.quantity <= 0) {
        let index = this.itemStacks.indexOf(itemStack);
        this.itemStacks.splice(index, 1);
        this.selectedItem = null;
      }
    }
  }

  equip(itemStack: ItemStack): void {
    // return the item already in the slot to the inventory, if any
    const item = itemStack.item;
    if (!instanceOfEquipment(item)) {
      throw Error('Tried to equip an item that was not equipable');
    }

    const itemToEquip =
      this.characterService.characterState.equipment[item.slot];
    if (itemToEquip) {
      this.addItem(itemToEquip);
    }
    this.characterService.characterState.equipment[item.slot] = item;
    let index = this.itemStacks.indexOf(itemStack);
    this.itemStacks.splice(index, 1);
  }

  consume(consumeType: string): number{
    let itemValue = -1;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator.item.type == consumeType) {
        itemValue = itemIterator.item.value;
        itemIterator.quantity --;
        if (itemIterator.quantity == 0){
          //remove the stack if empty
          let index = this.itemStacks.indexOf(itemIterator);
          this.itemStacks.splice(index, 1);
        }
        return itemValue;
      }
    }

    return itemValue;
  }

  // a special use function for generated potions
  usePotion(potion: Potion){
    this.characterService.characterState.attributes[potion.attribute].value += potion.increase;
  }
}

export function instanceOfEquipment(object: any): object is Equipment {
  return 'slot' in object;
}

export function instanceOfPotion(object: any): object is Potion {
  return 'attribute' in object;
}
