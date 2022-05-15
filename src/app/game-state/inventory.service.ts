import { _isTestEnvironment } from '@angular/cdk/platform';
import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { EquipmentPosition, AttributeType } from './character';
import { CharacterService } from './character.service';
import { ItemRepoService } from './item-repo.service';
import { WeaponNames, ItemPrefixes, ItemSuffixes, ItemSuffixModifiers, herbNames, herbQuality } from './itemResources';
import { FurniturePosition } from './home.service';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  durability: number;
  strengthScaling: number;
  speedScaling: number;
}

export interface Item {
  id: string;
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

export interface Furniture extends Item {
  slot: FurniturePosition
}

export interface ItemStack {
  item: Item;
  quantity: number;
}

export interface BalanceItem {
  useNumber: number;
  sellNumber: number;
  index: number;
  name: string;
}

export interface InventoryProperties {
  itemStacks: (ItemStack | null)[],
  autoSellUnlocked: boolean,
  autoSellItems: string[],
  autoUseUnlocked: boolean,
  autoUseItems: string[],
  autoBalanceUnlocked: boolean,
  autoBalanceItems: BalanceItem[],
  autoPotionUnlocked: boolean
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  itemStacks: (ItemStack | null)[] = [];
  maxItems: number = 10;
  maxStackSize = 999;
  noFood: boolean;
  selectedItem: ItemStack | null = null;
  autoSellUnlocked: boolean;
  autoSellItems: string[];
  autoUseUnlocked: boolean;
  autoUseItems: string[];
  autoBalanceUnlocked: boolean;
  autoBalanceItems: BalanceItem[];
  autoPotionUnlocked: boolean;

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
    this.autoBalanceUnlocked = false;
    this.autoBalanceItems = [];
    this.autoPotionUnlocked = false;

    for (let i = 0; i < this.maxItems; i++){
      this.itemStacks.push(null);
    }

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
      autoBalanceUnlocked: this.autoBalanceUnlocked,
      autoBalanceItems: this.autoBalanceItems,
      autoPotionUnlocked: this.autoPotionUnlocked
    }
  }

  setProperties(properties: InventoryProperties) {
    this.itemStacks = properties.itemStacks;
    this.autoSellUnlocked = properties.autoSellUnlocked;
    this.autoSellItems = properties.autoSellItems;
    this.autoUseUnlocked = properties.autoUseUnlocked;
    this.autoUseItems = properties.autoUseItems;
    this.autoBalanceUnlocked = properties.autoBalanceUnlocked;
    this.autoBalanceItems = properties.autoBalanceItems;
    this.autoPotionUnlocked = properties.autoPotionUnlocked;
  }

  farmFoodList = [
    this.itemRepoService.items['rice'],
    this.itemRepoService.items['cabbage'],
    this.itemRepoService.items['beans'],
    this.itemRepoService.items['broccoli'],
    this.itemRepoService.items['melon'],
    this.itemRepoService.items['peach']
  ]

  changeMaxItems(newValue: number){
    this.maxItems = newValue;
    while (this.itemStacks.length < newValue){
      this.itemStacks.push(null);
    }
  }

  // materials are wood or metal (TODO: more detail on materials)
  generateWeapon(grade: number, material: string): Equipment {
    let prefixIndex = grade % ItemPrefixes.length;
    let suffixIndex = Math.floor(grade / ItemPrefixes.length);
    let prefix = ItemPrefixes[prefixIndex];
    let suffix = "";
    if (suffixIndex > 0){
      let suffixModifierIndex = Math.floor(suffixIndex / ItemSuffixes.length);
      if (suffixModifierIndex > 0){
        if (suffixModifierIndex > ItemSuffixModifiers.length){
          suffixModifierIndex = ItemSuffixModifiers.length;
          suffixIndex = ItemSuffixes.length - 1;
        } else {
          suffixIndex = suffixIndex % ItemSuffixes.length;
        }
        let suffixModifier = ItemSuffixModifiers[suffixModifierIndex - 1];
        suffix = " of " + suffixModifier + " " + ItemSuffixes[suffixIndex];
      } else {
        suffix = " of " + ItemSuffixes[suffixIndex - 1];
      }
    }
    let name = prefix + ' ' + WeaponNames[Math.floor(Math.random() * WeaponNames.length)] + suffix;
    let slot: EquipmentPosition = 'rightHand';
    if (material === "wood") {
      // incentivizing to do both metal and wood. Maybe change this later.
      slot = 'leftHand';
    }
    this.logService.addLogMessage('Your hard work paid off! You created a new weapon: ' + name + '!','STANDARD', 'EVENT');
    let durability = Math.floor(Math.random() * grade * 10);
    return {
      id: 'weapon',
      name: name,
      type: "equipment",
      slot: slot,
      value: grade,
      weaponStats: {
        baseDamage: grade,
        material: material,
        durability: durability,
        strengthScaling: Math.random() * grade,
        speedScaling: Math.random() * grade,
      },
      description: 'A unique weapon made of ' + material + ".<br/>Base Damage: " + grade + "<br/>Durability: " + durability
    };
  }

  generatePotion(grade: number): Potion {
    const keys = Object.keys(
      this.characterService.characterState.attributes
    ) as AttributeType[];
    // randomly choose any of the first five stats
    const key = keys[Math.floor(Math.random() * 5)];

    return {
      name: "Potion of " + key + " +" + grade,
      id: "potion",
      type: "potion",
      value: grade,
      description: "A potion that increases " + key,
      useLabel: 'Drink',
      useDescription: 'Drink to increase your ' + key + '.',
      useConsumes: true,
      attribute: key,
      increase: grade
    };
  }

  generateHerb(): Item {
    let grade = 0;
    if (this.characterService.characterState.attributes.plantLore.value >= 2){
      // TODO: tune this
      grade = Math.floor(Math.log2(this.characterService.characterState.attributes.plantLore.value));
    }
    let name: string;
    let quality: string;
    if (grade >= herbNames.length * herbQuality.length){
      // maxed out
      name = herbNames[herbNames.length - 1];
      quality = herbQuality[herbQuality.length - 1];
    } else {
      let nameIndex = grade % herbNames.length;
      let qualityIndex = Math.floor(grade / herbNames.length);
      name = herbNames[nameIndex];
      quality = herbQuality[qualityIndex];
    }
    return {
      id: 'herb',
      name: quality + " " + name,
      type: 'ingredient',
      value: grade + 1,
      description: 'Useful herbs. Can be used in creating pills or potions.'
    };
  }

  getOre(): Item {
    if (this.characterService.characterState.attributes.metalLore.value < 3){
      return this.itemRepoService.items['copperOre'];
    } else if (this.characterService.characterState.attributes.metalLore.value < 6){
      return this.itemRepoService.items['bronzeOre'];
    } else {
      return this.itemRepoService.items['ironOre'];
    }
  }

  getBar(grade: number): Item{
    if (grade == 3){
      return this.itemRepoService.items['ironBar'];
    } else if (grade == 2){
      return this.itemRepoService.items['bronzeBar'];
    } else {
      return this.itemRepoService.items['copperBar'];
    }
  }

  getWood(): Item{
    if (this.characterService.characterState.attributes.plantLore.value > 300 &&
      this.characterService.characterState.attributes.spirituality.value > 10){
        return  this.itemRepoService.items['peachwoodLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 200 &&
      this.characterService.characterState.attributes.spirituality.value > 1){
        return  this.itemRepoService.items['blackwoodLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 100){
        return  this.itemRepoService.items['zitanLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 50){
      return  this.itemRepoService.items['rosewoodLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 40){
      return  this.itemRepoService.items['pearwoodLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 30){
      return  this.itemRepoService.items['laurelwoodLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 20){
      return  this.itemRepoService.items['walnutLog'];
    } else if (this.characterService.characterState.attributes.plantLore.value > 10){
      return  this.itemRepoService.items['cypressLog'];
    } else {
      return  this.itemRepoService.items['elmLog'];
    }
  }

  reset(): void {
    this.itemStacks = [];
    this.maxItems = 10;
    for (let i = 0; i < this.maxItems; i++){
      this.itemStacks.push(null);
    }

    if (Math.random() < 0.3) {
      this.logService.addLogMessage(
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.',
        'STANDARD', 'EVENT');
      this.itemStacks = [
        { item: this.itemRepoService.items['rice'], quantity: 300 }
      ];
    }
  }

  // find the best food in the inventory and use it
  eatFood(): void {
    let foodStack = null;
    let foodValue = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator == null){
        continue;
      }
      if (
        itemIterator.item.type == 'food' &&
        itemIterator.item.value > foodValue
      ) {
        foodStack = itemIterator;
      }
    }
    if (foodStack) {
      this.useItemStack(foodStack);
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

  addItem(item: Item): number {
    for (let balanceItem of this.autoBalanceItems){
      if (balanceItem.name == item.name){
        if (balanceItem.index < balanceItem.useNumber){
          if (item.use && item.useConsumes){
            item.use();
          }
        } else {

          this.characterService.characterState.money += item.value;
        }
        balanceItem.index++;
        if (balanceItem.index >= balanceItem.sellNumber + balanceItem.useNumber){
          balanceItem.index = 0;
        }
        return -1;
      }
    }
    if (this.autoPotionUnlocked && item.type == "potion"){
      this.useItem(item);
      return -1;
    }
    if (this.autoUseItems.includes(item.name)){
      this.useItem(item);
      return -1;
    }
    if (this.autoSellItems.includes(item.name)){
      this.characterService.characterState.money += item.value;
      return -1;
    }
    if (item.type != "equipment"){
      // try to stack the new item with existing items
      for (let i = 0; i < this.itemStacks.length; i++) {
        let itemIterator = this.itemStacks[i];
        if (itemIterator == null){
          continue;
        }
        if (
          itemIterator.item.name == item.name &&
          itemIterator.quantity < this.maxStackSize
        ) {
          // it matches an existing item and there's room in the stack, add it to the stack and bail out
          itemIterator.quantity++;
          return i;
        }
      }
    }
    // couldn't stack it, make a new stack
    for (let i = 0; i < this.itemStacks.length; i++) {
      if (this.itemStacks[i] == null){
        this.itemStacks[i] = { item: item, quantity: 1 };
        return i;
      }
    }
    // if we're here we didn't find a slot for it.
    this.logService.addLogMessage(
      `You don't have enough room for the ${item.name} so you threw it away.`,
      'STANDARD', 'EVENT');
    return -1;
  }

  sell(itemStack: ItemStack, quantity: number): void {
    let index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks[index] = null;
      this.characterService.characterState.money += itemStack.quantity * itemStack.item.value;
      this.selectedItem = null;
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.money += quantity * itemStack.item.value;
    }
  }

  sellAll(item: Item){
    for (let itemIterator of this.itemStacks) {
      if (itemIterator ==  null){
        continue;
      }
      if (itemIterator.item.name == item.name){
        this.sell(itemIterator, itemIterator.quantity);
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

  useItemStack(itemStack: ItemStack): void {
    this.useItem(itemStack.item);
    if (itemStack.item.useConsumes) {
      itemStack.quantity--;
      if (itemStack.quantity <= 0) {
        let index = this.itemStacks.indexOf(itemStack);
        this.itemStacks[index] = null;
        this.selectedItem = null;
      }
    }
  }

  useItem(item: Item): void {
    if (item.type == "potion" && instanceOfPotion(item)){
      this.usePotion(item);
    } else if (item.use) {
      item.use();
    }
  }

  autoUse(item: Item){
    if (item.type != "potion" && !item.use){
      // it's not usable, bail out.
      return;
    }
    if (!this.autoUseItems.includes(item.name)){
      this.autoUseItems.push(item.name);
    }
    if (item.useConsumes){
      // use all the ones you have now
      for (let i = 0; i < this.itemStacks.length; i++) {
        if (this.itemStacks[i] == null){
          continue;
        }
        if (this.itemStacks[i]?.item.name == item.name && item.useConsumes){
          while (this.itemStacks[i] != null){
            // this code is stupid because typescript is stupid.
            let itemStack = this.itemStacks[i];
            if (itemStack == null){
              continue;
            }
            this.useItemStack(itemStack);
          }
        }
      }
    }
  }

  unAutoUse(itemName: string){
    let index = this.autoUseItems.indexOf(itemName);
    this.autoUseItems.splice(index, 1);
  }

  autoBalance(item: Item){
    for (let balanceItem of this.autoBalanceItems){
      if (balanceItem.name == item.name){
        // it's already in the list, bail out
        return;
      }
    }
    this.autoBalanceItems.push({
      name: item.name,
      index: 0,
      useNumber: 1,
      sellNumber: 1
    });
    // sell current stock, incoming items will be balanced
    this.sellAll(item);
  }

  unAutoBalance(itemName: string){
    for (let index = 0; index < this.autoBalanceItems.length; index++){

      if (this.autoBalanceItems[index].name == itemName){
        this.autoBalanceItems.splice(index, 1);
        return;
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
    this.itemStacks[index] = null;
  }

  consume(consumeType: string): number{
    let itemValue = -1;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.type == consumeType) {
        itemValue = itemIterator.item.value;
        itemIterator.quantity --;
        if (itemIterator.quantity == 0){
          //remove the stack if empty
          let index = this.itemStacks.indexOf(itemIterator);
          this.itemStacks[index] = null;
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

  // return the number of open inventory slots
  openInventorySlots(){
    let openSlots = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator == null){
        openSlots++;
      }
    }
    return openSlots;
  }

  // Create a new piece of equipment based on the two provided. Caller needs to do the destroying of the old items.
  mergeEquipment(item1: Equipment, item2: Equipment, destinationInventoryIndex: number){
    if (item1.slot != item2.slot){
      // not the same slot, bail out
      return;
    }
    // TODO: make this work for other things than weapons eventually
    let inventoryIndex = this.addItem(this.generateWeapon(item1.value + item2.value, item1.weaponStats?.material + ""));
    // if we can, move the new item to the desired destination index
    if (inventoryIndex != destinationInventoryIndex && this.itemStacks[destinationInventoryIndex] == null){
      this.itemStacks[destinationInventoryIndex] = this.itemStacks[inventoryIndex];
      this.itemStacks[inventoryIndex] = null;
    }

  }
}

export function instanceOfEquipment(object: any): object is Equipment {
  return 'slot' in object;
}

export function instanceOfPotion(object: any): object is Potion {
  return 'attribute' in object;
}

export function instanceOfFurniture(object: any): object is Furniture {
  return 'slot' in object;
}
