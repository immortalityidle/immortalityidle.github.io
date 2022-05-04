import { _isTestEnvironment } from '@angular/cdk/platform';
import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { EquipmentPosition, AttributeType } from './character';
import { CharacterService } from './character.service';
import { ItemRepoService, ItemType } from './item-repo.service';
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


export interface InventoryProperties {
  itemStacks: ItemStack[],
  autoSellUnlocked: boolean,
  autoSellItems: string[],
  autoUseUnlocked: boolean,
  autoUseItems: string[]
}



@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  itemStacks: ItemStack[] = [];
  maxItems: number = 32;
  maxStackSize = 999;
  noFood: boolean;
  selectedItem: ItemStack | null = null;
  autoSellUnlocked: boolean;
  autoSellItems: string[];
  autoUseUnlocked: boolean;
  autoUseItems: string[];

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
    this.noFood = false;
    this.autoSellUnlocked = false;
    this.autoSellItems = [];
    this.autoUseUnlocked = false;
    this.autoUseItems = [];
    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      this.eatFood();
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  getProperties(): InventoryProperties {
    return {
      itemStacks: this.itemStacks,
      autoSellUnlocked: this.autoSellUnlocked,
      autoSellItems: this.autoSellItems,
      autoUseUnlocked: this.autoUseUnlocked,
      autoUseItems: this.autoUseItems,
    }
  }

  setProperties(properties: InventoryProperties) {
    this.itemStacks = properties.itemStacks;
    this.autoSellUnlocked = properties.autoSellUnlocked;
    this.autoSellItems = properties.autoSellItems;
    this.autoUseUnlocked = properties.autoUseUnlocked;
    this.autoUseItems = properties.autoUseItems;
  }

  farmFoodList = [
    this.itemRepoService.rice,
    this.itemRepoService.cabbage,
    this.itemRepoService.beans,
    this.itemRepoService.broccoli,
    this.itemRepoService.melon,
    this.itemRepoService.peach,
  ]

  // weapon grades from 1-10, materials are wood or metal (TODO: more detail on materials)
  generateWeapon(grade: number, material: string): Equipment {
    let prefixMax = (grade / 10) * ItemPrefixes.length;
    let prefixIndex = Math.floor(Math.random() * prefixMax);
    let prefix = ItemPrefixes[prefixIndex];
    let name = prefix + ' ' + WeaponNames[Math.floor(Math.random() * WeaponNames.length)];
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
    if (this.autoUseItems.includes(item.name)){
      if (item.use && item.useConsumes){
        item.use()
      }
      return;
    }
    if (this.autoSellItems.includes(item.name)){
      this.characterService.characterState.money += item.value;
      return;
    }
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

  autoSell(item: Item){
    if (!this.autoSellItems.includes(item.name)){
      this.autoSellItems.push(item.name);
    }
    this.sellAll(item);
  }

  unAutoSell(itemName: string){
    let index = this.autoSellItems.indexOf(itemName);
    this.autoSellItems.splice(index, 1);
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

  autoUse(item: Item){
    if (!this.autoUseItems.includes(item.name)){
      this.autoUseItems.push(item.name);
    }
    // use all the ones you have now
    for (let i = this.itemStacks.length - 1; i >= 0; i--){
      while (this.itemStacks.length > i && this.itemStacks[i].item.name == item.name){
        this.useItem(this.itemStacks[i]);
      }
    }
  }

  unAutoUse(itemName: string){
    let index = this.autoUseItems.indexOf(itemName);
    this.autoUseItems.splice(index, 1);
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
