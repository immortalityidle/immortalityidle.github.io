import { Injectable, Injector } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from '../reincarnation/reincarnation.service';
import { EquipmentPosition } from './character';
import { CharacterService } from './character.service';
import { HomeService } from './home.service';
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
  owned?: () => boolean; // used for single-use permanent upgrades so we can see if they need to be bought again
}

export interface Equipment extends Item {
  slot: EquipmentPosition;
}

export interface ItemStack {
  item: Item;
  quantity: number;
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
  homeService: HomeService | null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private injector: Injector
  ) {
    this.homeService = null; // initially null to avoid circular dependency
    this.noFood = false;
    mainLoopService.tickSubject.subscribe(() => {
      this.eatFood();
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  // TODO: Not sure that I love it, but key should probably be enumerated to possible items
  // Make sure the name field matches the object name, it's used to restore the use function on gameState load
  itemRepo: {[key:string]: Item} = {
    rice: {
      name: 'rice',
      type: 'food',
      value: 1,
      description:
        'A basic staple of life. One pouch will sustain you for a day.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.checkOverage();
      },
    },
    herb: {
      name: 'herb',
      type: 'food',
      value: 2,
      description:
        'Useful herbs. Can be eaten directly or used in creating pills or potions.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and restores a bit of health.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.checkOverage();
      },
    },
    log: {
      name: 'log',
      type: 'wood',
      value: 1,
      description: 'A good-quality log.',
    },
    metalOre: {
      name: 'metal ore',
      type: 'metal',
      value: 1,
      description: 'A chunk of metal ore.',
    },
    junk: {
      name: 'junk',
      type: 'metal',
      value: 1,
      description: 'Some metal junk.',
    },
    farmingManual: {
      name: "Manual of Perpetual Farming",
      type: "manual",
      description: "This manual teaches you to automatically replant fields when they are harvested.",
      value: 10000,
      useLabel: "Read",
      useDescription: "Permanently unlock automatic farm replanting.",
      useConsumes: true,
      use: () => {
        // check if homeService is injected yet, if not, inject it (circular dependency issues)
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        this.homeService.autoReplant = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.");
      },
      owned: () => {
        // check if homeService is injected yet, if not, inject it (circular dependency issues)
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService?.autoReplant;
      }
    }
  };

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
    this.logService.addLogMessage(
      'Your hard work paid off! You got a ' + name + '.'
    );
    return {
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

  reset() {
    this.itemStacks = [];
    if (Math.random() < 0.3) {
      this.logService.addLogMessage(
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.'
      );
      this.itemStacks = [
        { item: this.itemRepo['rice'], quantity: 99 },
        { item: this.itemRepo['rice'], quantity: 99 },
        { item: this.itemRepo['rice'], quantity: 99 },
      ];
    }
  }

  // find the cheapest food in the inventory and use it
  eatFood() {
    let foodStack = null;
    let foodValue = Number.MAX_VALUE;
    for (const itemIterator of this.itemStacks) {
      if (
        itemIterator.item.type == 'food' &&
        itemIterator.item.value < foodValue
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

  addItems(item: Item, quantity: number) {
    //doing this the slacker inefficient way, optimize later if needed
    for (let i = 0; i < quantity; i++) {
      this.addItem(item);
    }
  }

  addItem(item: Item) {
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
        `You don't have enough room for the ${item.name} so you threw it away.`
      );
    }
  }

  sell(itemStack: ItemStack, quantity: number) {
    let index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks.splice(index, 1);
      this.characterService.characterState.money +=
        itemStack.quantity * itemStack.item.value;
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.money +=
        quantity * itemStack.item.value;
    }
  }

  useItem(itemStack: ItemStack) {
    if (itemStack.item.use) {
      itemStack.item.use();
    }
    if (itemStack.item.useConsumes) {
      itemStack.quantity--;
      if (itemStack.quantity <= 0) {
        let index = this.itemStacks.indexOf(itemStack);
        this.itemStacks.splice(index, 1);
      }
    }
  }
  
  equip(itemStack: ItemStack) {
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
}

export function instanceOfEquipment(object: any): object is Equipment {
  return 'slot' in object;
}
