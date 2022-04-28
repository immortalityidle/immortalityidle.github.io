import { Injectable, Injector } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
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
  id: ItemType;
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

export type ItemType = 'rice' | 'herb' | 'log' | 'junk' | 'farmingManual' | 'weapon';

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
  activityService: ActivityService | null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private injector: Injector
  ) {
    this.homeService = null; // initially null to avoid circular dependency
    this.activityService = null; // initially null to avoid circular dependency
    this.noFood = false;
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



  // Make sure the id field matches the object name, it's used to restore the use function on gameState load
  // TODO: Maybe we want to create an item repo service and have these as first-class objects instead of properties in an object
  itemRepo: {[key in ItemType]: Item} = {
    rice: {
      id: 'rice',
      name: 'rice',
      type: 'food',
      value: 1,
      description: 'A basic staple of life. One pouch will sustain you for a day.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.checkOverage();
      },
    },
    cabbage: {
      name: 'cabbage',
      type: 'food',
      value: 5,
      description: 'A simple, healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.01){
          this.characterService.characterState.status.health.max++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    beans: {
      name: 'beans',
      type: 'food',
      value: 10,
      description: 'A handful of healthy vegetables.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.02){
          this.characterService.characterState.status.health.max++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    broccoli: {
      name: 'broccoli',
      type: 'food',
      value: 10,
      description: 'A very healthy vegetable.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.05){
          this.characterService.characterState.status.health.max++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    melon: {
      name: 'melon',
      type: 'food',
      value: 15,
      description: 'A delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and helps you be healthy.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.1){
          this.characterService.characterState.status.health.max++;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    peach: {
      name: 'peach',
      type: 'food',
      value: 20,
      description: 'A highly prized and delicious fruit.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly and can even extend your life.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        if (Math.random() < 0.2){
          this.characterService.characterState.status.health.max++;
          this.characterService.characterState.lifespan += 10;
        }
        this.characterService.characterState.checkOverage();
      },
    },
    meat: {
      name: 'meat',
      type: 'food',
      value: 50,
      description: 'Some delicious meat.',
      useLabel: 'Eat',
      useDescription: 'Fills your belly. Can also improve your health and stamina.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.nourishment.value++;
        this.characterService.characterState.status.health.max++;
        this.characterService.characterState.status.stamina.max++;
        this.characterService.characterState.checkOverage();
      },
    },
    herb: {
      name: 'herb',
      type: 'ingredient',
      value: 2,
      description: 'Useful herbs. Can used in creating pills or potions.',
      useLabel: 'Use',
      useDescription: 'Restores a bit of health.',
      useConsumes: true,
      use: () => {
        this.characterService.characterState.status.health.value += 5;
        this.characterService.characterState.checkOverage();
      },
    },
    log: {
      id: 'log',
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
      id: 'junk',
      name: 'junk',
      type: 'metal',
      value: 1,
      description: 'Some metal junk.',
    },
    perpetualFarmingManual: {
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
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.", "STANDARD");
      },
      owned: () => {
        // check if homeService is injected yet, if not, inject it (circular dependency issues)
        if (!this.homeService){
          this.homeService = this.injector.get(HomeService);
        }
        return this.homeService?.autoReplant;
      }
    },
    restartActivityManual: {
      name: "Manual of Remembered Plans",
      type: "manual",
      description: "This manual teaches you to automatically resume activities from your previous life. Only activities that you qualify for when you reach adulthood are available to resume.",
      value: 1000000,
      useLabel: "Read",
      useDescription: "Permanently unlock preserving activity plans across reincarnations.",
      useConsumes: true,
      use: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        this.activityService.autoRestart = true;
        this.logService.addLogMessage("The teachings of the manual sink deep into your soul. You'll be able to apply this knowledge in all future reincarnations.");
      },
      owned: () => {
        // check if actvityService is injected yet, if not, inject it (circular dependency issues)
        if (!this.activityService){
          this.activityService = this.injector.get(ActivityService);
        }
        return this.activityService?.autoRestart;
      }
    },
    weapon: { // This is just a placeholder so typescript doesn't yell at us when we create custom weapons.
      id: 'weapon',
      name: '',
      type: '',
      description: '',
      value: 0,
    }
  };

  farmFoodList = [
    this.itemRepo['rice'],
    this.itemRepo['cabbage'],
    this.itemRepo['beans'],
    this.itemRepo['melon'],
    this.itemRepo['peach'],
  ]


  // weapon grades from 1-10, materials are wood or metal (TODO: more detail on materials)
  generateWeapon(grade: number, material: string): Item {
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
      'Your hard work paid off! You got a ' + name + '.',
      'STANDARD'
    );
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

  reset(): void {
    this.itemStacks = [];
    if (Math.random() < 0.3) {
      this.logService.addLogMessage(
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.',
        'STANDARD'
      );
      this.itemStacks = [
        { item: this.itemRepo['rice'], quantity: 99 },
        { item: this.itemRepo['rice'], quantity: 99 },
        { item: this.itemRepo['rice'], quantity: 99 },
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
        'STANDARD'
      );
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
}

export function instanceOfEquipment(object: any): object is Equipment {
  return 'slot' in object;
}
