import { Injectable, Injector, signal, WritableSignal } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { EquipmentPosition, AttributeType, StatusType } from './character.service';
import { CharacterService } from './character.service';
import { ItemRepoService } from './item-repo.service';
import { TitleCasePipe } from '@angular/common';
import {
  WeaponNames,
  ItemPrefixes,
  WeaponSuffixes,
  WeaponSuffixModifiers,
  ArmorSuffixes,
  ArmorSuffixModifiers,
  Herbs,
  herbQuality,
  ChestArmorNames,
  LegArmorNames,
  ShoeNames,
  HelmetNames,
} from './itemResources';
import { HellService } from './hell.service';
import { HomeService } from './home.service';
import { LocationType } from './activity';
import { LocationService } from './location.service';
import { BigNumberPipe } from '../pipes';
import { BattleService, LOOT_TYPE_GEM } from './battle.service';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  baseName?: string;
}

export interface ArmorStats {
  defense: number;
  baseName?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  value: number;
  type: string;
  subtype?: string;
  color?: string;
  elements?: string[];
  attribute?: AttributeType;
  effect?: string;
  useLabel?: string;
  useDescription?: string;
  useConsumes?: boolean;
  use?: (quantity?: number) => void;
  /** Used for single-use permanent upgrades so we can see if they need to be bought again */
  owned?: () => boolean;
  imageFile?: string;
  imageColor?: string;
  pouchable?: boolean;
  increaseAmount?: number;
  cooldown?: number;
  locked?: boolean;
  shopable: boolean;
}

export interface Equipment extends Item {
  slot: EquipmentPosition;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
}

export interface ItemStack {
  item?: Item | null;
  quantity: number;
  id: string;
}

export interface DisplayItemStack {
  name: WritableSignal<string>;
  description: WritableSignal<string>;
  imageFile: WritableSignal<string>;
  imageColor: WritableSignal<string>;
  quantity: WritableSignal<number>;
  type: WritableSignal<string>;
  value: WritableSignal<number>;
  stackValue: WritableSignal<number>;
  useLabel: WritableSignal<string>;
  useDescription: WritableSignal<string>;
  pouchable: WritableSignal<boolean>;
  sellable: WritableSignal<boolean>;
  equipment: WritableSignal<boolean>;
  id: WritableSignal<string>;
  tooltip: WritableSignal<string>;
}

export interface BalanceItem {
  useNumber: number;
  sellNumber: number;
  index: number;
  name: string;
}

export interface AutoItemEntry {
  name: string;
  type: string;
  reserve: number;
}

export interface Herb {
  name: string;
  attribute: AttributeType;
  locations: LocationType[];
}

export interface InventoryProperties {
  itemStacks: ItemStack[];
  stashedItemStacks: ItemStack[];
  autoSellUnlocked: boolean;
  autoSellEntries: AutoItemEntry[];
  autoUseUnlocked: boolean;
  autoEatUnlocked: boolean;
  autoEatNutrition: boolean;
  autoEatHealth: boolean;
  autoEatStamina: boolean;
  autoEatQi: boolean;
  autoEatAll: boolean;
  autoUseEntries: AutoItemEntry[];
  autoBalanceUnlocked: boolean;
  autoBalanceItems: BalanceItem[];
  autoPillUnlocked: boolean;
  autoPillEnabled: boolean;
  autoWeaponMergeUnlocked: boolean;
  autoArmorMergeUnlocked: boolean;
  useSpiritGemUnlocked: boolean;
  useSpiritGemWeapons: boolean;
  useCheapestSpiritGem: boolean;
  autoSellOldHerbs: boolean;
  autoSellOldWood: boolean;
  autoSellOldOre: boolean;
  autoSellOldHides: boolean;
  autoSellOldHerbsEnabled: boolean;
  autoSellOldWoodEnabled: boolean;
  autoSellOldOreEnabled: boolean;
  autoSellOldBarsEnabled: boolean;
  autoSellOldHidesEnabled: boolean;
  autoequipBestWeapon: boolean;
  autoequipBestArmor: boolean;
  autoequipBestEnabled: boolean;
  maxStackSize: number;
  thrownAwayItems: number;
  autoSellOldGemsUnlocked: boolean;
  autoSellOldGemsEnabled: boolean;
  autoBuyFood: boolean;
  automergeEquipped: boolean;
  autoSort: boolean;
  descendingSort: boolean;
  divinePeachesUnlocked: boolean;
  equipmentUnlocked: boolean;
  equipmentCreated: number;
  totalItemsReceived: number;
  autoReloadCraftInputs: boolean;
  potionCounter: number;
  herbCounter: number;
  gemsAcquired: number;
  foodEatenToday: number;
  heirloomSlots: number;
  daysGorged: number;
  maxFoodPerDay: number;
  unlockedFurniture: string[];
  herbalUnderstanding: boolean;
  soldGoods: { [key: string]: number };
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  hellService?: HellService;
  homeService?: HomeService;
  battleService?: BattleService;
  locationService?: LocationService;
  bigNumberPipe: BigNumberPipe;
  itemStacks: ItemStack[] = [];
  displayItemStacks: DisplayItemStack[] = [];
  stashedItemStacks: ItemStack[] = [];
  maxItems = 10;
  maxStackSize = 100;
  selectedItem: ItemStack = this.getEmptyItemStack();
  displaySelectedItem: DisplayItemStack = {
    name: signal<string>(''),
    description: signal<string>(''),
    imageFile: signal<string>(''),
    imageColor: signal<string>('white'),
    quantity: signal<number>(0),
    type: signal<string>(''),
    value: signal<number>(0),
    stackValue: signal<number>(0),
    useLabel: signal<string>(''),
    useDescription: signal<string>(''),
    pouchable: signal<boolean>(false),
    sellable: signal<boolean>(false),
    equipment: signal<boolean>(false),
    id: signal<string>(''),
    tooltip: signal<string>(''),
  };
  autoSellUnlocked = signal<boolean>(false);
  autoSellEntries: AutoItemEntry[];
  autoUseUnlocked = signal<boolean>(false);
  autoEatUnlocked = signal<boolean>(false);
  autoEatNutrition: boolean;
  autoEatHealth: boolean;
  autoEatStamina: boolean;
  autoEatQi: boolean;
  autoEatAll: boolean;
  autoUseEntries: AutoItemEntry[];
  autoBalanceUnlocked = signal<boolean>(false);
  autoBalanceItems: BalanceItem[];
  autoPillUnlocked: boolean;
  autoPillEnabled: boolean;
  autoWeaponMergeUnlocked: boolean;
  autoArmorMergeUnlocked: boolean;
  autoequipBestWeapon: boolean;
  autoequipBestArmor: boolean;
  autoequipBestEnabled = true;
  useSpiritGemUnlocked: boolean;
  useSpiritGemWeapons: boolean;
  useSpiritGemPotions: boolean;
  useCheapestSpiritGem: boolean;
  autoSellOldHerbs: boolean;
  autoSellOldWood: boolean;
  autoSellOldOre: boolean;
  autoSellOldHides: boolean;
  autoSellOldHerbsEnabled: boolean;
  autoSellOldWoodEnabled: boolean;
  autoSellOldOreEnabled: boolean;
  autoSellOldBarsEnabled: boolean;
  autoSellOldHidesEnabled: boolean;
  lifetimeUsedItems = 0;
  lifetimeUsedFood = 0;
  lifetimeSoldItems = 0;
  lifetimePotionsUsed = 0;
  lifetimePillsUsed = 0;
  lifetimeGemsSold = 0;
  motherGift = false;
  grandmotherGift = false;
  thrownAwayItems = 0;
  mergeCounter = 0;
  autoSellOldGemsUnlocked: boolean;
  autoSellOldGemsEnabled: boolean;
  autoBuyFood = true;
  automergeEquipped = false;
  autoSortEnabled = signal<boolean>(false);
  descendingSort = signal<boolean>(false);
  divinePeachesUnlocked = false;
  equipmentUnlocked = false;
  equipmentCreated = 0;
  emptyIdCounter = 0;
  emptyIdPrefix = Date.now() + '';
  totalItemsReceived = 0;
  autoReloadCraftInputs = false;
  potionCounter = 0;
  herbCounter = 0;
  gemsAcquired = 0;
  foodEatenToday = 0;
  maxFoodPerDay = 10;
  heirloomSlots = signal<number>(0);
  daysGorged = 0;
  unlockedFurniture: string[] = [];
  herbalUnderstanding = false;
  soldGoods: { [key: string]: number } = {};

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    private itemRepoService: ItemRepoService,
    private titleCasePipe: TitleCasePipe
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    setTimeout(() => (this.homeService = this.injector.get(HomeService)));
    setTimeout(() => (this.battleService = this.injector.get(BattleService)));
    setTimeout(() => (this.locationService = this.injector.get(LocationService)));
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.autoSellEntries = [];
    this.autoEatNutrition = true;
    this.autoEatHealth = false;
    this.autoEatStamina = false;
    this.autoEatQi = false;
    this.autoEatAll = false;
    this.autoBalanceItems = [];
    this.autoPillUnlocked = false;
    this.autoPillEnabled = false;
    this.autoWeaponMergeUnlocked = false;
    this.autoArmorMergeUnlocked = false;
    this.autoequipBestWeapon = false;
    this.autoequipBestArmor = false;
    this.useSpiritGemUnlocked = false;
    this.useSpiritGemWeapons = false;
    this.useSpiritGemPotions = false;
    this.useCheapestSpiritGem = false;
    this.autoSellOldHerbs = false;
    this.autoSellOldWood = false;
    this.autoSellOldOre = false;
    this.autoSellOldHides = false;
    this.autoSellOldHerbsEnabled = false;
    this.autoSellOldWoodEnabled = false;
    this.autoSellOldOreEnabled = false;
    this.autoSellOldBarsEnabled = false;
    this.autoSellOldHidesEnabled = false;
    this.autoSellOldGemsUnlocked = false;
    this.autoSellOldGemsEnabled = false;
    this.autoUseEntries = [];

    // basic farm foods should be set to autouse when autoeat unlocks
    for (const item of this.farmFoodList) {
      this.autoUseEntries.push({ name: item.name, type: 'food', reserve: 0 });
    }

    for (let i = 0; i < this.maxItems; i++) {
      this.itemStacks.push(this.getEmptyItemStack());
    }

    mainLoopService.inventoryTickSubject.subscribe(() => {
      this.tick();
    });
    mainLoopService.longTickSubject.subscribe(() => {
      //if autoequip is unlocked, but automerge isn't, equip best
      //automerge will merge into equipped if both are unlocked
      if (this.autoequipBestWeapon && this.autoWeaponMergeUnlocked && this.autoequipBestEnabled) {
        this.autoequipWeapons();
      }
      if (this.autoequipBestArmor && this.autoArmorMergeUnlocked && this.autoequipBestEnabled) {
        this.autoequipArmor();
      }
      for (const key of ['head', 'body', 'legs', 'feet'] as EquipmentPosition[]) {
        const item = this.characterService.equipment[key];
        if (item) {
          this.updateArmorDescription(item);
        }
      }
      for (const key of ['leftHand', 'rightHand'] as EquipmentPosition[]) {
        const item = this.characterService.equipment[key];
        if (item) {
          this.updateWeaponDescription(item);
        }
      }
      for (const itemStack of this.itemStacks) {
        if (itemStack.item) {
          const item = itemStack.item;
          if (instanceOfEquipment(item)) {
            if (item.weaponStats) {
              this.updateWeaponDescription(item);
            } else if (item.armorStats) {
              this.updateArmorDescription(item);
            }
          }
        }
      }

      if (this.autoSortEnabled()) {
        this.sortInventory();
      }
      this.updateDisplayValues();
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  tick() {
    if (this.characterService.dead) {
      return;
    }
    this.characterService.status.nutrition.value--; // tick the day's hunger
    this.foodEatenToday = 0;
    this.eatDailyMeal();

    if (this.mergeCounter >= 20) {
      if (this.autoWeaponMergeUnlocked) {
        this.autoWeaponMerge();
      }
      if (this.autoArmorMergeUnlocked) {
        this.autoArmorMerge();
      }
      this.mergeCounter = 0;
    } else {
      this.mergeCounter++;
    }
    if (this.foodEatenToday === this.maxFoodPerDay) {
      this.daysGorged++;
    }
  }

  updateDisplayValues() {
    if (this.selectedItem.item) {
      this.displaySelectedItem.name.set(this.selectedItem.item.name);
      this.displaySelectedItem.description.set(this.selectedItem.item.description);
      if (this.selectedItem.item.imageFile) {
        this.displaySelectedItem.imageFile.set('assets/images/items/' + this.selectedItem.item.imageFile + '.png');
      } else {
        this.displaySelectedItem.imageFile.set('');
      }
      if (this.selectedItem.item.imageColor) {
        this.displaySelectedItem.imageColor.set(this.selectedItem.item.imageColor);
      } else {
        this.displaySelectedItem.imageColor.set('white');
      }

      this.displaySelectedItem.quantity.set(this.selectedItem.quantity);
      this.displaySelectedItem.type.set(this.selectedItem.item.type);
      this.displaySelectedItem.value.set(this.selectedItem.item.value);
      this.displaySelectedItem.stackValue.set(this.selectedItem.item.value * this.selectedItem.quantity);
      this.displaySelectedItem.useLabel.set(this.selectedItem.item.useLabel || '');
      this.displaySelectedItem.useDescription.set(this.selectedItem.item.useDescription || '');
      this.displaySelectedItem.pouchable.set(this.selectedItem.item.pouchable || false);
      this.displaySelectedItem.sellable.set(isFinite(this.selectedItem.item.value));
      this.displaySelectedItem.equipment.set(instanceOfEquipment(this.selectedItem.item!));
      this.displaySelectedItem.id.set(this.selectedItem.id);
    } else {
      this.displaySelectedItem.name.set('');
      this.displaySelectedItem.description.set('');
      this.displaySelectedItem.imageFile.set('');
      this.displaySelectedItem.quantity.set(0);
      this.displaySelectedItem.type.set('');
      this.displaySelectedItem.value.set(0);
      this.displaySelectedItem.stackValue.set(0);
      this.displaySelectedItem.useLabel.set('');
      this.displaySelectedItem.useDescription.set('');
      this.displaySelectedItem.pouchable.set(false);
      this.displaySelectedItem.sellable.set(false);
      this.displaySelectedItem.equipment.set(false);
      this.displaySelectedItem.id.set('');
    }
    for (let i = 0; i < this.itemStacks.length; i++) {
      if (this.displayItemStacks.length <= i) {
        this.displayItemStacks.push({
          name: signal<string>(''),
          description: signal<string>(''),
          imageFile: signal<string>(''),
          imageColor: signal<string>('white'),
          quantity: signal<number>(0),
          type: signal<string>(''),
          value: signal<number>(0),
          stackValue: signal<number>(0),
          useLabel: signal<string>(''),
          useDescription: signal<string>(''),
          pouchable: signal<boolean>(false),
          sellable: signal<boolean>(false),
          equipment: signal<boolean>(false),
          id: signal<string>(''),
          tooltip: signal<string>(''),
        });
      }
      const itemStack = this.itemStacks[i];
      if (itemStack.item) {
        this.displayItemStacks[i].name.set(itemStack.item.name);
        this.displayItemStacks[i].description.set(itemStack.item.description);
        if (itemStack.item.imageFile) {
          this.displayItemStacks[i].imageFile.set('assets/images/items/' + itemStack.item.imageFile + '.png');
        } else {
          this.displayItemStacks[i].imageFile.set('');
        }
        if (itemStack.item.imageColor) {
          this.displayItemStacks[i].imageColor.set(itemStack.item.imageColor);
        } else {
          this.displayItemStacks[i].imageColor.set('white');
        }
        this.displayItemStacks[i].quantity.set(itemStack.quantity);
        this.displayItemStacks[i].type.set(itemStack.item.type);
        this.displayItemStacks[i].value.set(itemStack.item.value);
        this.displayItemStacks[i].stackValue.set(itemStack.item.value * itemStack.quantity);
        this.displayItemStacks[i].useLabel.set(itemStack.item.useLabel || '');
        this.displayItemStacks[i].useDescription.set(itemStack.item.useDescription || '');
        this.displayItemStacks[i].pouchable.set(itemStack.item.pouchable || false);
        this.displayItemStacks[i].sellable.set(isFinite(itemStack.item.value));
        this.displayItemStacks[i].equipment.set(instanceOfEquipment(itemStack.item!));
        this.displayItemStacks[i].id.set(itemStack.id);
        this.displayItemStacks[i].tooltip.set(
          this.titleCasePipe.transform(itemStack.item.name) + '.<br>' + itemStack?.item?.description
        );
      } else {
        this.displayItemStacks[i].name.set('');
        this.displayItemStacks[i].description.set('');
        this.displayItemStacks[i].imageFile.set('');
        this.displayItemStacks[i].imageColor.set('white');
        this.displayItemStacks[i].quantity.set(0);
        this.displayItemStacks[i].type.set('');
        this.displayItemStacks[i].value.set(0);
        this.displayItemStacks[i].stackValue.set(0);
        this.displayItemStacks[i].useLabel.set('');
        this.displayItemStacks[i].useDescription.set('');
        this.displayItemStacks[i].pouchable.set(false);
        this.displayItemStacks[i].sellable.set(false);
        this.displayItemStacks[i].equipment.set(false);
        this.displayItemStacks[i].id.set(itemStack.id);
        this.displayItemStacks[i].tooltip.set('');
      }
    }
  }

  getProperties(): InventoryProperties {
    return {
      itemStacks: this.itemStacks,
      stashedItemStacks: this.stashedItemStacks,
      autoSellUnlocked: this.autoSellUnlocked(),
      autoSellEntries: this.autoSellEntries,
      autoUseUnlocked: this.autoUseUnlocked(),
      autoEatUnlocked: this.autoEatUnlocked(),
      autoEatNutrition: this.autoEatNutrition,
      autoEatHealth: this.autoEatHealth,
      autoEatStamina: this.autoEatStamina,
      autoEatQi: this.autoEatQi,
      autoEatAll: this.autoEatAll,
      autoUseEntries: this.autoUseEntries,
      autoBalanceUnlocked: this.autoBalanceUnlocked(),
      autoBalanceItems: this.autoBalanceItems,
      autoPillUnlocked: this.autoPillUnlocked,
      autoPillEnabled: this.autoPillEnabled,
      autoWeaponMergeUnlocked: this.autoWeaponMergeUnlocked,
      autoArmorMergeUnlocked: this.autoArmorMergeUnlocked,
      useSpiritGemUnlocked: this.useSpiritGemUnlocked,
      useSpiritGemWeapons: this.useSpiritGemWeapons,
      useCheapestSpiritGem: this.useCheapestSpiritGem,
      autoSellOldHerbs: this.autoSellOldHerbs,
      autoSellOldWood: this.autoSellOldWood,
      autoSellOldOre: this.autoSellOldOre,
      autoSellOldHides: this.autoSellOldHides,
      autoSellOldHerbsEnabled: this.autoSellOldHerbsEnabled,
      autoSellOldWoodEnabled: this.autoSellOldWoodEnabled,
      autoSellOldOreEnabled: this.autoSellOldOreEnabled,
      autoSellOldBarsEnabled: this.autoSellOldBarsEnabled,
      autoSellOldHidesEnabled: this.autoSellOldHidesEnabled,
      autoequipBestWeapon: this.autoequipBestWeapon,
      autoequipBestArmor: this.autoequipBestArmor,
      autoequipBestEnabled: this.autoequipBestEnabled,
      maxStackSize: this.maxStackSize,
      thrownAwayItems: this.thrownAwayItems,
      autoSellOldGemsUnlocked: this.autoSellOldGemsUnlocked,
      autoSellOldGemsEnabled: this.autoSellOldGemsEnabled,
      autoBuyFood: this.autoBuyFood,
      automergeEquipped: this.automergeEquipped,
      autoSort: this.autoSortEnabled(),
      descendingSort: this.descendingSort(),
      divinePeachesUnlocked: this.divinePeachesUnlocked,
      equipmentUnlocked: this.equipmentUnlocked,
      equipmentCreated: this.equipmentCreated,
      totalItemsReceived: this.totalItemsReceived,
      autoReloadCraftInputs: this.autoReloadCraftInputs,
      potionCounter: this.potionCounter,
      herbCounter: this.herbCounter,
      gemsAcquired: this.gemsAcquired,
      foodEatenToday: this.foodEatenToday,
      heirloomSlots: this.heirloomSlots(),
      daysGorged: this.daysGorged,
      maxFoodPerDay: this.maxFoodPerDay,
      unlockedFurniture: this.unlockedFurniture,
      herbalUnderstanding: this.herbalUnderstanding,
      soldGoods: this.soldGoods,
    };
  }

  setProperties(properties: InventoryProperties) {
    this.itemStacks = properties.itemStacks;
    for (let i = 0; i < this.itemStacks.length; i++) {
      if (!this.itemStacks[i]) {
        this.setItemEmptyStack(i);
      } else {
        this.fixId(i);
      }
    }
    this.stashedItemStacks = properties.stashedItemStacks;
    this.autoSellUnlocked.set(properties.autoSellUnlocked);
    this.autoSellEntries = properties.autoSellEntries;
    this.autoUseUnlocked.set(properties.autoUseUnlocked);
    this.autoEatUnlocked.set(properties.autoEatUnlocked);
    this.autoEatNutrition = properties.autoEatNutrition;
    this.autoEatHealth = properties.autoEatHealth;
    this.autoEatStamina = properties.autoEatStamina;
    this.autoEatQi = properties.autoEatQi;
    this.autoEatAll = properties.autoEatAll;
    this.autoUseEntries = properties.autoUseEntries;
    this.autoBalanceUnlocked.set(properties.autoBalanceUnlocked);
    this.autoBalanceItems = properties.autoBalanceItems;
    this.autoPillUnlocked = properties.autoPillUnlocked;
    this.autoPillEnabled = properties.autoPillEnabled;
    this.autoWeaponMergeUnlocked = properties.autoWeaponMergeUnlocked;
    this.autoArmorMergeUnlocked = properties.autoArmorMergeUnlocked;
    this.useSpiritGemUnlocked = properties.useSpiritGemUnlocked;
    this.useSpiritGemWeapons = properties.useSpiritGemWeapons;
    this.useCheapestSpiritGem = properties.useCheapestSpiritGem;
    this.autoSellOldHerbs = properties.autoSellOldHerbs;
    this.autoSellOldWood = properties.autoSellOldWood;
    this.autoSellOldOre = properties.autoSellOldOre;
    this.autoSellOldHides = properties.autoSellOldHides;
    this.autoSellOldHerbsEnabled = properties.autoSellOldHerbsEnabled;
    this.autoSellOldWoodEnabled = properties.autoSellOldWoodEnabled;
    this.autoSellOldOreEnabled = properties.autoSellOldOreEnabled;
    this.autoSellOldBarsEnabled = properties.autoSellOldBarsEnabled;
    this.autoSellOldHidesEnabled = properties.autoSellOldHidesEnabled;
    this.autoequipBestWeapon = properties.autoequipBestWeapon;
    this.autoequipBestArmor = properties.autoequipBestArmor;
    this.autoequipBestEnabled = properties.autoequipBestEnabled;
    this.maxStackSize = properties.maxStackSize;
    this.thrownAwayItems = properties.thrownAwayItems;
    this.autoSellOldGemsUnlocked = properties.autoSellOldGemsUnlocked;
    this.autoSellOldGemsEnabled = properties.autoSellOldGemsEnabled;
    this.autoBuyFood = properties.autoBuyFood;
    this.automergeEquipped = properties.automergeEquipped;
    this.autoSortEnabled.set(properties.autoSort);
    this.descendingSort.set(properties.descendingSort);
    this.divinePeachesUnlocked = properties.divinePeachesUnlocked;
    this.updateFarmFoodList();
    this.equipmentUnlocked = properties.equipmentUnlocked;
    this.equipmentCreated = properties.equipmentCreated;
    this.totalItemsReceived = properties.totalItemsReceived;
    this.autoReloadCraftInputs = properties.autoReloadCraftInputs;
    this.potionCounter = properties.potionCounter;
    this.herbCounter = properties.herbCounter;
    this.gemsAcquired = properties.gemsAcquired;
    this.foodEatenToday = properties.foodEatenToday;
    this.heirloomSlots.set(properties.heirloomSlots);
    this.daysGorged = properties.daysGorged;
    this.maxFoodPerDay = properties.maxFoodPerDay;
    this.unlockedFurniture = properties.unlockedFurniture;
    this.herbalUnderstanding = properties.herbalUnderstanding;
    this.soldGoods = properties.soldGoods;
    for (const furniture of this.itemRepoService.furniture) {
      if (furniture.locked !== undefined) {
        if (this.unlockedFurniture.includes(furniture.name)) {
          furniture.locked = false;
        } else {
          furniture.locked = true;
        }
      }
    }
  }

  farmFoodList = [
    this.itemRepoService.items['rice'],
    this.itemRepoService.items['cabbage'],
    this.itemRepoService.items['beans'],
    this.itemRepoService.items['broccoli'],
    this.itemRepoService.items['calabash'],
    this.itemRepoService.items['taro'],
    this.itemRepoService.items['pear'],
    this.itemRepoService.items['melon'],
    this.itemRepoService.items['plum'],
    this.itemRepoService.items['apricot'],
    this.itemRepoService.items['peach'],
  ];

  updateFarmFoodList() {
    if (this.divinePeachesUnlocked) {
      this.farmFoodList.push(this.itemRepoService.items['divinePeach']);
    }
  }

  changeMaxItems(newValue: number) {
    this.maxItems = newValue;
    while (this.itemStacks.length < newValue) {
      this.itemStacks.push(this.getEmptyItemStack());
    }
  }

  sortInventory() {
    const tempStacks: ItemStack[] = [];
    const gemStacks: ItemStack[] = [];
    const equipStacks: ItemStack[] = [];
    for (let key = this.heirloomSlots(); key < this.itemStacks.length; key++) {
      const itemStack = this.itemStacks[key];
      if (itemStack.item) {
        if (itemStack.item.type === LOOT_TYPE_GEM) {
          gemStacks.push(itemStack);
        } else if (itemStack.item.type === 'equipment') {
          equipStacks.push(itemStack);
        } else {
          tempStacks.push(itemStack);
        }
      }
    }
    if (!this.descendingSort) {
      tempStacks.sort((a, b) => b.quantity - a.quantity);
      tempStacks.sort((a, b) => b.item!.value - a.item!.value);
      tempStacks.sort((a, b) => (b.item!.type > a.item!.type ? -1 : b.item!.type === a.item!.type ? 0 : 1));
      equipStacks.sort((a, b) => (b.item!.name > a.item!.name ? -1 : b.item!.name === a.item!.name ? 0 : 1));
      equipStacks.sort((a, b) => b.item!.value - a.item!.value);
      gemStacks.sort((a, b) => b.quantity - a.quantity);
      gemStacks.sort((a, b) => b.item!.value - a.item!.value);
    } else {
      tempStacks.sort((b, a) => b.quantity - a.quantity);
      tempStacks.sort((b, a) => b.item!.value - a.item!.value);
      tempStacks.sort((b, a) => (b.item!.type > a.item!.type ? -1 : b.item!.type === a.item!.type ? 0 : 1));
      equipStacks.sort((b, a) => (b.item!.name > a.item!.name ? -1 : b.item!.name === a.item!.name ? 0 : 1));
      equipStacks.sort((b, a) => b.item!.value - a.item!.value);
      gemStacks.sort((b, a) => b.quantity - a.quantity);
      gemStacks.sort((b, a) => b.item!.value - a.item!.value);
    }
    const emptySlots =
      this.itemStacks.length - this.heirloomSlots() - tempStacks.length - gemStacks.length - equipStacks.length;
    this.itemStacks.splice(this.heirloomSlots());
    this.itemStacks.push(...tempStacks);
    this.itemStacks.push(...equipStacks);
    this.itemStacks.push(...gemStacks);
    for (let i = 0; i < emptySlots; i++) {
      this.itemStacks.push(this.getEmptyItemStack());
    }
  }

  // materials are wood or metal
  generateWeapon(
    grade: number,
    material: string,
    defaultName: string | undefined = undefined,
    effect: string | undefined = undefined
  ): Equipment {
    this.equipmentCreated++;
    const highestGrade = ItemPrefixes.length * WeaponSuffixes.length * WeaponSuffixModifiers.length;
    const nameGrade = Math.ceil(Math.sqrt(grade / 1e10) * highestGrade); // Name spreads up to 10B Value (coincides with damage)
    let prefixIndex = nameGrade % ItemPrefixes.length;
    if (nameGrade >= highestGrade) {
      prefixIndex = ItemPrefixes.length - 1;
    }
    let suffixIndex = Math.floor(nameGrade / ItemPrefixes.length);
    const prefix = ItemPrefixes[prefixIndex];
    let suffix = '';
    if (suffixIndex > 0) {
      let suffixModifierIndex = Math.floor(suffixIndex / WeaponSuffixes.length);
      if (suffixModifierIndex > 0) {
        if (suffixModifierIndex > WeaponSuffixModifiers.length) {
          suffixModifierIndex = WeaponSuffixModifiers.length;
          suffixIndex = WeaponSuffixes.length - 1;
        } else {
          suffixIndex = suffixIndex % WeaponSuffixes.length;
        }
        const suffixModifier = WeaponSuffixModifiers[suffixModifierIndex - 1];
        suffix = ' of ' + suffixModifier + ' ' + WeaponSuffixes[suffixIndex];
      } else {
        suffix = ' of ' + WeaponSuffixes[suffixIndex - 1];
      }
    }
    let materialPrefix = material;
    let slot: EquipmentPosition = 'rightHand';
    let imageFileName = 'metalWeapon';
    if (material === 'wood') {
      slot = 'leftHand';
      materialPrefix = 'wooden';
      imageFileName = 'woodenWeapon';
    }
    const baseName = defaultName ?? WeaponNames[Math.floor(Math.random() * WeaponNames.length)];
    let name: string;
    if (baseName === "Grandmother's Walking Stick") {
      // don't rename grandma's stick!
      name = baseName;
      imageFileName = 'stick';
    } else {
      name = prefix + ' ' + materialPrefix + ' ' + baseName + suffix;
    }
    this.logService.log(
      LogTopic.CRAFTING,
      'Your hard work paid off! You created a new weapon: ' + this.titleCasePipe.transform(name) + '!'
    );
    const damage = Math.min(Math.sqrt(grade + 1), 1000) * grade;
    return {
      id: 'weapon',
      imageFile: imageFileName,
      name: name,
      type: 'equipment',
      slot: slot,
      value: grade,
      effect: effect,
      shopable: false,
      weaponStats: {
        baseDamage: damage,
        material: material,
        baseName: baseName,
      },
      description:
        'A unique weapon made of ' +
        material +
        '.<br>Drag and drop onto similar weapons to merge them into something better.<br>Base Damage: ' +
        this.bigNumberPipe.transform(damage),
    };
  }

  updateWeaponDescription(weapon: Equipment) {
    if (!weapon.weaponStats) {
      return;
    }
    let effectString = '';
    if (weapon.effect) {
      effectString = ' and imbued with the power of ' + weapon.effect;
    }
    weapon.description =
      'A unique weapon made of ' +
      weapon.weaponStats.material +
      effectString +
      '.<br>Drag and drop onto similar weapons to merge them into something better.<br> Base Damage: ' +
      this.bigNumberPipe.transform(weapon.weaponStats.baseDamage);
  }

  updateArmorDescription(armor: Equipment) {
    if (!armor.armorStats) {
      return;
    }
    let effectString = '';
    if (armor.effect) {
      effectString = ' and imbued with the power of ' + armor.effect;
    }
    armor.description =
      'A unique piece of armor ' +
      effectString +
      '.<br>Drag and drop onto similar armor to merge them into something better.<br>Defense: ' +
      this.bigNumberPipe.transform(armor.armorStats.defense);
  }

  upgradeEquipment(equipment: Equipment, value: number, newEffect = 'spirit') {
    if (equipment.armorStats) {
      equipment.armorStats.defense += Math.max(Math.sqrt(value), 1000) * value;
      if (newEffect !== 'spirit') {
        equipment.effect = newEffect;
      }
    } else if (equipment.weaponStats) {
      equipment.weaponStats.baseDamage += Math.max(Math.sqrt(value), 1000) * value;
      if (newEffect !== 'spirit') {
        equipment.effect = newEffect;
      }
    }
    equipment.value += value;
    this.logService.log(
      LogTopic.CRAFTING,
      'You add ' + value + ' power to your ' + this.titleCasePipe.transform(equipment.name)
    );
  }

  generatePotion(grade: number): void {
    this.potionCounter++;
    let effect = 'health';
    let restoreAmount = grade * grade;
    if (this.characterService.qiUnlocked) {
      const potionType = this.potionCounter % 3;
      if (potionType === 0) {
        effect = 'stamina';
      } else if (potionType === 1) {
        effect = 'qi';
        restoreAmount = Math.floor(restoreAmount / 10);
      }
    } else {
      const potionType = this.potionCounter % 2;
      if (potionType === 0) {
        effect = 'stamina';
      }
    }

    const name = this.titleCasePipe.transform(effect) + ' Potion + ' + restoreAmount;
    this.logService.log(
      LogTopic.CRAFTING,
      'Alchemy Success! Created a ' + this.titleCasePipe.transform(name) + '. Keep up the good work.'
    );

    this.addItem({
      name: name,
      imageFile: effect + 'potion',
      id: 'potion',
      type: 'potion',
      value: grade,
      description: 'A potion that restores ' + effect,
      useLabel: 'Drink',
      useDescription: 'Drink to increase restores ' + effect + '.',
      useConsumes: true,
      pouchable: true,
      effect: effect,
      increaseAmount: restoreAmount,
      shopable: false,
    });
  }

  generateEmpowermentPill(): void {
    const effect = 'empowerment';
    const description = 'A pill that permanently empowers the increase of your attributes based on your aptitudes.';
    const useDescription = 'Use to permanently empower the increase of your attributes based on your aptitudes.';
    const value = 1;
    const name = 'Empowerment Pill';
    const imageFileName = 'empowermentPill';
    this.logService.log(
      LogTopic.CRAFTING,
      'Alchemy Success! Created a ' + this.titleCasePipe.transform(name) + '. Its effect gets worse the more you take.'
    );
    this.addItem({
      name: name,
      imageFile: imageFileName,
      id: 'pill',
      type: 'pill',
      value: value,
      description: description,
      useLabel: 'Swallow',
      useDescription: useDescription,
      useConsumes: true,
      effect: effect,
      increaseAmount: 1,
      shopable: false,
    });
  }

  generateHerb(grade: number = -1, skipSnobbery: boolean = false, quantity = 1): void {
    let targetLocation = LocationType.SmallTown;
    if (this.locationService?.troubleTarget) {
      targetLocation = this.locationService.troubleTarget;
    }
    let filteredHerbs = Herbs.filter(herb => herb.locations.includes(targetLocation));
    if (filteredHerbs.length === 0) {
      filteredHerbs = Herbs.filter(herb => herb.locations.includes(LocationType.SmallTown));
    }
    const woodLore = this.characterService.attributes.woodLore.value;
    if (grade === -1) {
      grade = Math.floor(Math.pow(woodLore / 1e12, 0.16) * herbQuality.length);
    }
    if (grade >= herbQuality.length) {
      grade = herbQuality.length - 1;
    }
    const herb = filteredHerbs[this.herbCounter % filteredHerbs.length];
    this.herbCounter++;
    let extraDescription = '';
    if (this.herbalUnderstanding) {
      extraDescription = '<br>Can be used to produce pills that increase your ' + herb.attribute + '.';
    }
    this.addItem(
      {
        id: 'herb_' + herb.name + grade,
        imageFile: 'herb_' + herb.name,
        imageColor: this.itemRepoService.colorByRank[grade],
        name: herbQuality[grade] + ' ' + herb.name,
        type: 'herb',
        subtype: herb.name,
        attribute: herb.attribute,
        value: grade * 10,
        description: 'Useful herbs.<br>Can be used in creating pills or potions.' + extraDescription,
        shopable: false,
      },
      quantity
    );
    if (this.autoSellOldHerbsEnabled && !skipSnobbery) {
      // sell any herb of the same type that are cheaper than what we just picked
      const oldHerbStack = this.itemStacks.find(
        (itemStack, index) =>
          index >= this.heirloomSlots() &&
          itemStack.item?.type === 'herb' &&
          itemStack.item.subtype === herb.name &&
          itemStack.item.value < grade + 1
      );
      if (oldHerbStack) {
        this.sell(oldHerbStack, oldHerbStack.quantity);
      }
    }
  }

  generateSpiritGem(grade: number, flavor = 'spirit'): Item {
    let description = 'A spirit gem dropped by a monster.';
    if (flavor !== 'spirit') {
      description = 'A spirit gem full of the power of ' + flavor + '.';
    }
    return {
      id: 'spiritGemGrade' + grade,
      imageFile: flavor + 'Gem',
      name: flavor + ' gem grade ' + grade,
      type: LOOT_TYPE_GEM,
      subtype: flavor,
      value: grade * 10,
      description: description,
      shopable: false,
    };
  }

  generateArmor(
    grade: number,
    slot: EquipmentPosition,
    defaultName: string | undefined = undefined,
    effect: string | undefined = undefined
  ): Equipment {
    this.equipmentCreated++;
    const highestGrade = ItemPrefixes.length * ArmorSuffixes.length * ArmorSuffixModifiers.length;
    const nameGrade = Math.ceil(Math.sqrt(grade / 1e10) * highestGrade); // Name spreads up to 10B Value (coincides with defense)
    let prefixIndex = nameGrade % ItemPrefixes.length;
    if (nameGrade >= highestGrade) {
      prefixIndex = ItemPrefixes.length - 1;
    }
    let suffixIndex = Math.floor(nameGrade / ItemPrefixes.length);
    const prefix = ItemPrefixes[prefixIndex];
    let suffix = '';
    if (suffixIndex > 0) {
      let suffixModifierIndex = Math.floor(suffixIndex / ArmorSuffixes.length);
      if (suffixModifierIndex > 0) {
        if (suffixModifierIndex > ArmorSuffixModifiers.length) {
          suffixModifierIndex = ArmorSuffixModifiers.length;
          suffixIndex = ArmorSuffixes.length - 1;
        } else {
          suffixIndex = suffixIndex % ArmorSuffixes.length;
        }
        const suffixModifier = ArmorSuffixModifiers[suffixModifierIndex - 1];
        suffix = ' of ' + suffixModifier + ' ' + ArmorSuffixes[suffixIndex];
      } else {
        suffix = ' of ' + ArmorSuffixes[suffixIndex - 1];
      }
    }
    let namePicker = ChestArmorNames;
    let imageFileName = 'chestArmor';
    if (slot === 'legs') {
      namePicker = LegArmorNames;
      imageFileName = 'legsArmor';
    } else if (slot === 'head') {
      namePicker = HelmetNames;
      imageFileName = 'headArmor';
    } else if (slot === 'feet') {
      imageFileName = 'feetArmor';
      namePicker = ShoeNames;
    }
    const baseName = defaultName ?? namePicker[Math.floor(Math.random() * namePicker.length)];
    const name = prefix + ' ' + baseName + suffix;
    this.logService.log(
      LogTopic.CRAFTING,
      'Your hard work paid off! You created some armor: ' + this.titleCasePipe.transform(name) + '!'
    );
    const defense = Math.min(Math.sqrt(grade), 1000) * grade;
    return {
      id: 'armor',
      imageFile: imageFileName,
      name: name,
      type: 'equipment',
      slot: slot,
      value: grade,
      effect: effect,
      armorStats: {
        defense: defense,
        baseName: baseName,
      },
      description:
        'A unique piece of armor that you made.<br>Drag and drop onto similar armor to merge them into something better.<br>Defense: ' +
        this.bigNumberPipe.transform(defense),
      shopable: false,
    };
  }

  randomArmorSlot(): EquipmentPosition {
    const randomNumber = Math.random();
    if (randomNumber < 0.25) {
      return 'body';
    } else if (randomNumber < 0.5) {
      return 'head';
    } else if (randomNumber < 0.75) {
      return 'feet';
    } else {
      return 'legs';
    }
  }

  getOre(value: number = -1, skipSnobbery: boolean = false): Item {
    let oreValue = value;
    const earthLore = this.characterService.attributes.earthLore.value;
    if (value === -1) {
      oreValue = Math.floor(Math.pow(earthLore / 1e12, 0.15) * 800);
    } else {
      const valueScale = value / 100;
      oreValue = Math.floor(Math.pow((earthLore * valueScale) / 1e12, 0.15) * 800);
    }
    let lastOre = this.itemRepoService.items['copperOre'];
    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'ore' && item.value > lastOre.value && item.value <= oreValue) {
        lastOre = item;
      }
    }

    if (this.autoSellOldOreEnabled && !this.hellService?.inHell() && !skipSnobbery) {
      // sell any ore cheaper than what we just got
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'ore' && itemStack.item.value < lastOre.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastOre;
  }

  getBar(oreValue: number, skipSnobbery: boolean = false): Item {
    // metal bars should always be 10x the value of the associated ore
    const barValue = oreValue * 10;

    let lastMetal = this.itemRepoService.items['copperBar'];
    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'metal' && item.value === barValue) {
        lastMetal = item;
        break;
      }
    }

    if (this.autoSellOldBarsEnabled && !this.hellService?.inHell() && !skipSnobbery) {
      // sell any metal cheaper than what we just got
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'metal' && itemStack.item.value < lastMetal.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastMetal;
  }

  getWood(value: number = -1, skipSnobbery: boolean = false): Item {
    const woodLore = this.characterService.attributes.woodLore.value;
    let woodValue;
    if (value === -1) {
      woodValue = Math.floor(Math.pow(woodLore / 1e12, 0.15) * 800);
    } else {
      const valueScale = value / 100;
      woodValue = Math.floor(Math.pow((woodLore * valueScale) / 1e12, 0.15) * 800);
    }
    let lastWood = this.itemRepoService.items['balsaLog'];

    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'wood' && item.value > lastWood.value && item.value <= woodValue) {
        lastWood = item;
      }
    }

    if (this.autoSellOldWoodEnabled && !this.hellService?.inHell() && !skipSnobbery) {
      // sell any wood cheaper than what we just got
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'wood' && itemStack.item.value < lastWood.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastWood;
  }

  getHide(value: number = -1, skipSnobbery: boolean = false): Item {
    let hideValue;
    const animalHandling = this.characterService.attributes.animalHandling.value;
    if (hideValue === -1) {
      hideValue = Math.floor(Math.pow(animalHandling / 1e12, 0.15) * 800);
    } else {
      const valueScale = value / 100;
      hideValue = Math.floor(Math.pow((animalHandling * valueScale) / 1e12, 0.15) * 800);
    }

    let lastHide = this.itemRepoService.items['hide'];

    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'hide' && item.value > lastHide.value && item.value <= hideValue) {
        lastHide = item;
      }
    }
    if (this.autoSellOldHidesEnabled && !this.hellService?.inHell() && !skipSnobbery) {
      // sell any hides cheaper than what we just got
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (
          itemStack.item &&
          itemStack.item.id !== lastHide.id &&
          itemStack.item.type === 'hide' &&
          itemStack.item.value < lastHide.value
        ) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }

    return lastHide;
  }

  getWildMeat(grade: number): Item {
    return {
      id: 'wildMeat' + grade,
      imageFile: 'meat',
      name: 'wild meat',
      type: 'food',
      subtype: 'wildMeat',
      value: 100 * grade,
      description: 'Meat from a wild beast',
      shopable: false,
    };
  }

  getCoinPurse(value: number): Item {
    return {
      id: 'coinPurse',
      imageFile: 'coinPurse',
      name: 'coin purse',
      type: 'sellable',
      value: value,
      description: 'A purse with strange coins. You could probably sell this.',
      shopable: false,
    };
  }

  generateFormationKit(value: number): Item {
    const formationTypes = ['power', 'defense', 'survival', 'greed', 'repulsion', 'stealth'];
    const formationDescriptions = [
      'When used, this formation increases your attack power.',
      'When used, this formation increases your defense when attacked.',
      'When used, this formation allows you to survive a single killing blow.',
      'When used, this formation increases the amount of loot you get from killing your enemies.',
      'When used, this formation prevents random monsters from attacking you.<br>If you go looking, you can still find trouble.',
      'When used, this formation allows you to strike your enemy once before they prepare to strike you.',
    ];
    const index = Math.floor(Math.random() * formationTypes.length);
    const formationType = formationTypes[index];
    const descriptionSuffix = formationDescriptions[index];
    return {
      id: formationType + 'FormationKit',
      imageFile: formationType + 'FormationKit', // TODO: make icons for these
      name: formationType + ' formation kit',
      type: 'formationKit',
      subtype: formationType,
      effect: formationType,
      value: value,
      useConsumes: true,
      pouchable: true,
      useDescription: 'Activate this formation',
      useLabel: 'Use',
      description:
        'A kit containing formation flags and other essentials for creating a formation.<br>' + descriptionSuffix,
      shopable: false,
    };
  }

  reset(): void {
    this.selectedItem = this.getEmptyItemStack();
    this.lifetimeUsedItems = 0;
    this.lifetimeUsedFood = 0;
    this.lifetimeSoldItems = 0;
    this.lifetimePotionsUsed = 0;
    this.lifetimePillsUsed = 0;
    this.lifetimeGemsSold = 0;
    const newItemStacks: ItemStack[] = [];
    for (let i = 0; i < this.heirloomSlots(); i++) {
      newItemStacks.push(this.itemStacks[i]);
    }
    this.itemStacks = newItemStacks;
    this.stashedItemStacks = [];
    if (!this.characterService.keepPouchItems) {
      for (let i = 0; i < this.characterService.itemPouches.length; i++) {
        this.characterService.itemPouches[i] = this.getEmptyItemStack();
      }
    }

    this.changeMaxItems(this.homeService!.home.maxInventory);

    if (this.grandmotherGift) {
      const stick: Equipment = {
        id: 'weapon',
        imageFile: 'stick',
        name: "Grandmother's Walking Stick",
        type: 'equipment',
        slot: 'leftHand',
        value: 10,
        weaponStats: {
          baseDamage: 10,
          material: 'wood',
          baseName: "Grandmother's Walking Stick",
        },
        description:
          "Your grandmother's walking stick.<br>Drag and drop onto similar weapons to merge them into something better.<br>Base Damage: 10",
        shopable: false,
      };
      this.addItem(stick);
    }

    if (this.characterService.bloodlineRank >= 6 && this.motherGift) {
      this.logService.log(
        LogTopic.EVENT,
        'Your mother throws you an elaborate feast as you prepare to make your way in the world. You pack a few of the leftovers to take with you.'
      );
      const totalValue = this.characterService.bloodlineRank * 100;
      this.addItem(
        {
          id: 'Soul Food Special #' + totalValue,
          imageFile: 'soulfood',
          name: 'Soul Food Special #' + totalValue,
          type: 'food',
          subtype: 'meal',
          value: totalValue,
          description: 'A home-made meal that can nourish you much more than raw ingredients.',
          useLabel: 'Eat',
          useDescription: 'Fills your belly.',
          useConsumes: true,
          pouchable: true,
          effect: 'meal' + totalValue,
          shopable: false,
        },
        300
      );
    } else if (this.motherGift) {
      this.logService.log(
        LogTopic.EVENT,
        'Your mother gives you three big bags of rice as you prepare to make your way in the world.'
      );
      this.addItem(this.itemRepoService.items['rice'], 300);
    }

    if (this.characterService.totalLives > 5) {
      this.unlockFurniture('purple ancestor portrait');
    }
    if (this.characterService.totalLives > 10) {
      this.unlockFurniture('green ancestor portrait');
    }
    if (this.characterService.totalLives > 15) {
      this.unlockFurniture('red ancestor portrait');
    }
    if (this.characterService.totalLives > 20) {
      this.unlockFurniture('orange ancestor portrait');
    }
    if (this.characterService.totalLives > 25) {
      this.unlockFurniture('pink ancestor portrait');
    }
    if (this.characterService.totalLives > 30) {
      this.unlockFurniture('blue ancestor portrait');
    }
    if (this.characterService.totalLives > 35) {
      this.unlockFurniture('yellow ancestor portrait');
    }
    if (this.characterService.totalLives > 40) {
      this.unlockFurniture('brown ancestor portrait');
    }
    if (this.characterService.totalLives > 45) {
      this.unlockFurniture('white ancestor portrait');
    }
    if (this.characterService.totalLives > 50) {
      this.unlockFurniture('pastel ancestor portrait');
    }
    if (this.characterService.totalLives > 55) {
      this.unlockFurniture('black ancestor portrait');
    }
    if (this.characterService.totalLives > 60) {
      this.unlockFurniture('gray ancestor portrait');
    }
  }

  eatDailyMeal(): void {
    if (
      this.autoEatUnlocked() &&
      (this.autoEatNutrition || this.autoEatHealth || this.autoEatStamina || this.autoEatQi || this.autoEatAll)
    ) {
      let foodStack = null;
      let fed = false;
      let highestValue = -1;
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemIterator = this.itemStacks[i];
        if (itemIterator.item === null) {
          continue;
        }
        if (
          itemIterator.item!.type === 'food' &&
          this.autoUseEntries.find(item => item.name === itemIterator.item!.name)
        ) {
          if (itemIterator.item!.value > highestValue) {
            highestValue = itemIterator.item!.value;
            foodStack = itemIterator;
          }
        }
      }
      while (foodStack && foodStack.quantity > 0 && !this.bellyFull()) {
        this.useItemStack(foodStack);
        fed = true;
      }

      if (!fed) {
        // no food found, buy scraps automatically
        if (
          !this.hellService?.inHell() &&
          this.characterService.money > 0 &&
          this.autoBuyFood &&
          this.characterService.status.nutrition.value <= this.characterService.status.nutrition.max * 0.2
        ) {
          this.characterService.updateMoney(-1);
          this.characterService.status.nutrition.value++;
        }
      }

      return;
    }
    if (this.characterService.status.nutrition.value > this.characterService.status.nutrition.max * 0.2) {
      // not hungry enough, don't automatically eat
      return;
    }

    let foodStack = null;
    let foodValue = 0;
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (itemIterator.item === null) {
        continue;
      }
      if (itemIterator.item!.type === 'food' && itemIterator.item!.value > foodValue) {
        foodStack = itemIterator;
        foodValue = foodStack.item?.value || 0;
      }
    }
    if (foodStack) {
      this.useItemStack(foodStack);
    } else {
      // no food found, buy scraps automatically
      if (!this.hellService?.inHell() && this.characterService.money > 0 && this.autoBuyFood) {
        this.characterService.updateMoney(-1);
        this.characterService.status.nutrition.value++;
      }
    }
  }

  bellyFull() {
    if (this.foodEatenToday >= this.maxFoodPerDay) {
      return true;
    }
    if (this.autoEatAll) {
      return false;
    }
    if (
      this.autoEatNutrition &&
      this.characterService.status.nutrition.value < this.characterService.status.nutrition.max
    ) {
      return false;
    }
    if (this.autoEatHealth && this.characterService.status.health.value < this.characterService.status.health.max - 1) {
      return false;
    }
    if (
      this.autoEatStamina &&
      this.characterService.status.stamina.value < this.characterService.status.stamina.max - 1
    ) {
      return false;
    }
    if (this.autoEatQi && this.characterService.status.qi.value < this.characterService.status.qi.max - 1) {
      return false;
    }
    return true;
  }

  public eatFood(foodItem: Item, quantity = 1) {
    if (this.foodEatenToday >= this.maxFoodPerDay) {
      this.logService.log(LogTopic.EVENT, 'Your stomach is too full to handle any more food today');
      return 0;
    }
    if (quantity > this.maxFoodPerDay - this.foodEatenToday) {
      quantity = this.maxFoodPerDay - this.foodEatenToday;
    }
    const value = foodItem.value;
    this.characterService.status.nutrition.value += quantity + quantity * value;
    this.characterService.healthBonusFood += quantity * value * 0.01;
    this.characterService.status.health.value += quantity * value * 0.01;
    this.characterService.status.stamina.value += quantity * value * 0.01;
    this.characterService.status.qi.value += quantity * value * 0.01;
    const maxLifespanIncrease = Math.min(value * 365, 7300);
    if (this.characterService.foodLifespan + quantity <= maxLifespanIncrease) {
      this.characterService.foodLifespan += quantity;
    } else if (this.characterService.foodLifespan < maxLifespanIncrease) {
      this.characterService.foodLifespan = maxLifespanIncrease;
    }
    if (foodItem.subtype === 'meal') {
      this.characterService.status.stamina.max += (quantity * value) / 100;
      if (this.characterService.status.nutrition.max < 200) {
        this.characterService.status.nutrition.max += 0.1;
      }
      if (foodItem.name.startsWith('Soul')) {
        this.characterService.increaseAttribute('spirituality', 0.001);
      }
    }
    this.foodEatenToday += quantity;
    this.characterService.checkOverage();
    return quantity;
  }

  /**
   *
   * @param item the Item to add
   * @param quantity the quantity the Item to stack. Ignores for unstackables. Default 1
   * @param inventoryIndex the first inventory slot to try to put the item in
   * @returns first itemStack position, -1 if not applicable
   */
  addItem(
    item: Item,
    quantity = 1,
    inventoryIndex = 0,
    ignoreAutoReload: boolean = false,
    skipStacking = false
  ): number {
    let firstStack = -1;

    if (!skipStacking) {
      quantity = Math.floor(quantity); // whole numbers of items only
      if (quantity === 0) {
        return -1;
      }
      this.totalItemsReceived += quantity;
      if (item.type === LOOT_TYPE_GEM) {
        this.gemsAcquired++;
      }

      if (this.autoReloadCraftInputs && !ignoreAutoReload) {
        const workstations = this.homeService?.workstations;
        if (workstations) {
          for (let workstationIndex = 0; workstationIndex < workstations.length; workstationIndex++) {
            const workstation = workstations[workstationIndex];
            for (let inputSlotIndex = 0; inputSlotIndex < workstation.inputs.length; inputSlotIndex++) {
              const inputItemStack = workstation.inputs[inputSlotIndex];
              if (
                inputItemStack.quantity < this.maxStackSize &&
                inputItemStack.item?.type === item.type &&
                inputItemStack.item?.subtype === item.subtype
              ) {
                if (item.id === inputItemStack.item.id) {
                  // same thing
                  inputItemStack.quantity += quantity;
                  inputItemStack.item.description = item.description;
                  return -1;
                } else if (
                  (item.type !== 'food' || item.name === inputItemStack.item.name) &&
                  item.type !== LOOT_TYPE_GEM &&
                  (item.value > inputItemStack.item?.value || inputItemStack.quantity < 10)
                ) {
                  // add it to the inventory then swap it in
                  const newItemIndex = this.addItem(item, quantity, 0, true);
                  if (newItemIndex !== -1) {
                    this.homeService?.moveItemToWorkstation(newItemIndex, workstationIndex, inputSlotIndex);
                  }
                  return -1;
                }
              }
            }
          }
        }
      }

      if (item.pouchable && !ignoreAutoReload) {
        // check for same type of potion in item pouches
        let existingStack = this.characterService.itemPouches.find(
          itemStack => itemStack.item?.type === item.type && itemStack.item.effect === item.effect
        );
        if (!existingStack) {
          // not there, check the inventory slots
          existingStack = this.itemStacks.find(
            (itemStack, index) =>
              index < this.heirloomSlots() &&
              itemStack.item?.type === item.type &&
              itemStack.item.effect === item.effect
          );
        }
        if (existingStack) {
          if (item.type === 'potion') {
            const totalPower =
              (item.increaseAmount || 0) * quantity +
              (existingStack.item!.increaseAmount || 0) * existingStack.quantity;
            existingStack.quantity += quantity;
            const restoreAmount = Math.floor(totalPower / existingStack.quantity);
            existingStack.item!.increaseAmount = restoreAmount;
            existingStack.item!.name = this.titleCasePipe.transform(item.effect) + ' Potion + ' + restoreAmount;
          } else if (item.type === 'formationKit') {
            const totalValue =
              (item.increaseAmount || 0) * quantity +
              (existingStack.item!.increaseAmount || 0) * existingStack.quantity;
            existingStack.quantity += quantity;
            const newValue = Math.floor(totalValue / existingStack.quantity);
            existingStack.item!.value = newValue;
          } else {
            existingStack.quantity += quantity;
          }
          return -1;
        }
        // couldn't stack it, let it fall through and get treated like a normal item
      }

      if (this.autoPillEnabled && item.type === 'pill') {
        this.useItem(item, quantity);
        return -1;
      } else if (item.type === 'pill') {
        // see if we can merge it into another stack of the same kind of pill
        const existingStack = this.itemStacks.find(
          (itemStack, index) =>
            index < this.heirloomSlots() && itemStack.item?.type === item.type && itemStack.item.name === item.name
        );
        if (existingStack) {
          const totalPower =
            (item.increaseAmount || 0) * quantity + (existingStack.item!.increaseAmount || 0) * existingStack.quantity;
          existingStack.quantity += quantity;
          existingStack.item!.increaseAmount = Math.floor(totalPower / existingStack.quantity);
          return -1;
        }
      }

      for (const balanceItem of this.autoBalanceItems) {
        if (balanceItem.name === item.name) {
          // can't sell in hell, use it all
          if (this.hellService?.inHell()) {
            this.useItem(item, quantity * balanceItem.useNumber);
            return -1;
          }

          if (balanceItem.useNumber < 1) {
            if (balanceItem.sellNumber < 1) {
              break; // dump to inventory if user enters balance numbers under 1
            } else {
              this.characterService.updateMoney(item.value * quantity); // Sell it all
              return -1;
            }
          } else if (balanceItem.sellNumber < 1) {
            this.useItem(item, quantity * balanceItem.useNumber); // Use it all
            return -1;
          }
          let modulo = quantity % (balanceItem.useNumber + balanceItem.sellNumber);
          quantity -= modulo;
          while (modulo > 0) {
            // Use the modulo first
            if (balanceItem.index < balanceItem.useNumber) {
              if (modulo + balanceItem.index <= balanceItem.useNumber) {
                this.useItem(item, modulo);
                balanceItem.index += modulo;
                break;
              } else {
                this.useItem(item, balanceItem.useNumber - balanceItem.index);
                modulo -= balanceItem.useNumber - balanceItem.index;
                balanceItem.index = balanceItem.useNumber;
              }
            }
            if (balanceItem.index < balanceItem.useNumber + balanceItem.sellNumber) {
              // sell the item
              if (modulo + balanceItem.index < balanceItem.useNumber + balanceItem.sellNumber) {
                this.characterService.updateMoney(item.value * modulo);
                balanceItem.index += modulo;
                break;
              } else {
                this.characterService.updateMoney(
                  item.value * (balanceItem.useNumber + balanceItem.sellNumber - balanceItem.index)
                );
                modulo -= balanceItem.useNumber + balanceItem.sellNumber - balanceItem.index;
                balanceItem.index = 0;
              }
            }
            if (balanceItem.index >= balanceItem.useNumber + balanceItem.sellNumber) {
              balanceItem.index -= balanceItem.useNumber + balanceItem.sellNumber;
            }
          }
          if (quantity) {
            quantity /= balanceItem.useNumber + balanceItem.sellNumber;
            this.useItem(item, quantity * balanceItem.useNumber);
            this.characterService.updateMoney(item.value * quantity);
            quantity = 0;
          }
          if (quantity < 1) {
            // Sanity check, spill out what should be impossible excess to inventory as though balance were disabled.
            return -1;
          }
          break;
        }
      }

      if (item.type !== 'food') {
        // food has its own autouse handling in eatDailyMeal()
        for (const entry of this.autoUseEntries) {
          if (entry.name === item.name) {
            let numberToUse = this.getQuantityByName(item.name) + quantity - entry.reserve;
            if (numberToUse > quantity) {
              // don't worry about using more than the incoming quantity here
              numberToUse = quantity;
            }
            if (numberToUse > 0) {
              const numberUsed = this.useItem(item, quantity);
              quantity -= numberUsed;
              if (quantity === 0) {
                return -1;
              }
            }
          }
        }
      }

      if (this.autoSellOldGemsEnabled && item.type === LOOT_TYPE_GEM && !this.hellService?.inHell()) {
        //clear out any old gems of lesser value
        for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
          const itemStack = this.itemStacks[i];
          if (itemStack.item && itemStack.item.type === LOOT_TYPE_GEM && itemStack.item.value < item.value) {
            this.characterService.updateMoney(itemStack.item.value * itemStack.quantity);
            this.setItemEmptyStack(i);
          }
        }
      }
      for (const entry of this.autoSellEntries) {
        if (entry.name === item.name && !this.hellService?.inHell()) {
          let numberToSell = this.getQuantityByName(item.name) + quantity - entry.reserve;
          if (numberToSell > quantity) {
            // don't worry about selling more than the incoming quantity here
            numberToSell = quantity;
          }
          if (numberToSell > 0) {
            this.characterService.updateMoney(item.value * numberToSell);
            quantity -= numberToSell;
            if (quantity === 0) {
              return -1;
            }
          }
        }
      }

      if (item.type !== 'equipment') {
        // try to stack the new item with existing items
        for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
          const itemIterator = this.itemStacks[i];
          if (!itemIterator.item) {
            continue;
          }
          if (itemIterator.item.name === item.name) {
            if (itemIterator.quantity + quantity <= this.maxStackSize) {
              // it matches an existing item and there's room in the stack for everything, add it to the stack and bail out
              itemIterator.quantity += quantity;
              itemIterator.item.description = item.description;
              // adjust values if different
              if (itemIterator.item.value !== item.value) {
                const totalValue = itemIterator.item.value * itemIterator.quantity + item.value * quantity;
                const totalQuantity = quantity + itemIterator.quantity;
                itemIterator.item.value = Math.round(totalValue / totalQuantity);
              }
              if (firstStack === -1) {
                firstStack = i;
              }
              this.fixId(i);
              return firstStack;
            } else {
              if (firstStack === -1) {
                firstStack = i;
              }
              quantity -= this.maxStackSize - itemIterator.quantity;
              itemIterator.quantity = this.maxStackSize;
              this.fixId(i);
            }
          }
        }
      }
    }

    // couldn't stack it all, make a new stack
    let startIndex = inventoryIndex;
    if (startIndex < this.heirloomSlots()) {
      startIndex = this.heirloomSlots();
    }
    for (let i = startIndex; i < this.itemStacks.length; i++) {
      if (!this.itemStacks[i].item) {
        if (firstStack === -1) {
          firstStack = i;
        }
        if (quantity <= this.maxStackSize) {
          this.itemStacks[i] = { item: item, quantity: quantity, id: i + item.name + quantity };
          return firstStack;
        } else {
          this.itemStacks[i] = { item: item, quantity: this.maxStackSize, id: i + item.name + quantity };
          quantity -= this.maxStackSize;
        }
      }
    }

    // if we're here we didn't find a slot for anything/everything.
    if (this.autoSellUnlocked() && !this.hellService?.inHell()) {
      this.logService.log(
        LogTopic.EVENT,
        "You don't have enough room for the " + this.titleCasePipe.transform(item.name) + ' so you sell it.'
      );
      this.characterService.updateMoney(item.value * quantity);
    } else {
      this.logService.log(
        LogTopic.EVENT,
        "You don't have enough room for the " + this.titleCasePipe.transform(item.name) + ' so you throw it away.'
      );
    }
    this.thrownAwayItems += quantity;
    return firstStack;
  }

  sell(itemStack: ItemStack, quantity: number): void {
    if (!itemStack.item) {
      return;
    }
    if (itemStack.item.value === Infinity) {
      // don't sell infinitely valuable things.
      return;
    }
    // can't sell in hell
    if (this.hellService?.inHell()) {
      return;
    }
    this.lifetimeSoldItems += quantity;
    if (itemStack.item.type === LOOT_TYPE_GEM) {
      this.lifetimeGemsSold += quantity;
    }
    const index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.setItemEmptyStack(index);
      this.characterService.updateMoney(itemStack.quantity * itemStack.item.value);
    } else {
      itemStack.quantity -= quantity;
      this.fixIdByStack(itemStack);
      this.characterService.updateMoney(quantity * itemStack.item.value);
    }
    if (itemStack.item.shopable) {
      this.soldGoods[itemStack.item.id] = (this.soldGoods[itemStack.item.id] || 0) + quantity;
    }
  }

  sellAll(item: Item) {
    // can't sell in hell
    if (this.hellService?.inHell()) {
      return;
    }

    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.name === item.name) {
        this.sell(itemIterator, itemIterator.quantity);
      }
    }
  }

  autoSell(item: Item) {
    if (item.value === Infinity) {
      // don't sell infinitely valuable things.
      return;
    }
    if (!this.autoSellUnlocked()) {
      return;
    }
    if (instanceOfEquipment(item)) {
      // don't autosell equipment
      return;
    }
    if (!this.autoSellEntries.some(e => e.name === item.name)) {
      this.autoSellEntries.push({ name: item.name, type: item.type, reserve: 0 });
    }
    //sell all that you currently have
    this.sellAll(item);
  }

  unAutoSell(itemName: string) {
    const index = this.autoSellEntries.findIndex(item => item.name === itemName);
    this.autoSellEntries.splice(index, 1);
  }

  useItemStack(itemStack: ItemStack, quantity = 1): void {
    if (!itemStack.item) {
      return;
    }
    if (quantity < 1) {
      return;
    }
    if (quantity > itemStack.quantity) {
      quantity = itemStack.quantity;
    }
    const numberUsed = this.useItem(itemStack.item, quantity);
    if (itemStack.item.useConsumes) {
      itemStack.quantity -= numberUsed;
      if (itemStack.quantity <= 0) {
        const index = this.itemStacks.indexOf(itemStack);
        this.setItemEmptyStack(index);
      } else {
        this.fixIdByStack(itemStack);
      }
    }
  }

  // use the items, return the number of items actually used
  useItem(item: Item, quantity = 1): number {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    if (item.type === 'food') {
      const eaten = this.eatFood(item, quantity);
      this.lifetimeUsedFood += eaten;
      if (eaten < quantity && quantity > 1) {
        this.logService.log(
          LogTopic.EVENT,
          "You try to stuff all that food in your face, but you've eaten too much and can't."
        );
      }
      return eaten;
    } else {
      this.lifetimeUsedItems++;
    }
    if (item.type === 'potion') {
      this.usePotion(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.type === 'pill') {
      this.usePill(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.type === 'formationKit') {
      quantity = this.useFormationKit(item);
    } else if (item.use) {
      item.use(quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
      if (item.type === 'food') {
        if (this.hellService) {
          this.hellService.daysFasted = 0;
        }
      }
    }
    return quantity;
  }

  autoUse(item: Item) {
    if ((!this.autoUseUnlocked() && item.type !== 'food') || (!this.autoEatUnlocked() && item.type === 'food')) {
      return;
    }
    if (item.type !== 'potion' && item.type !== 'pill' && item.type !== 'food' && !item.use) {
      // it's not usable, bail out.
      return;
    }
    if (!this.autoUseEntries.some(e => e.name === item.name)) {
      this.autoUseEntries.push({ name: item.name, type: item.type, reserve: 0 });
    }
    if (item.useConsumes && item.type !== 'food') {
      // use all the ones you have now
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (!itemStack.item) {
          continue;
        }
        if (itemStack.item.name === item.name) {
          this.useItemStack(itemStack, itemStack.quantity);
        }
      }
    }
  }

  unAutoUse(itemName: string) {
    const index = this.autoUseEntries.findIndex(item => item.name === itemName);
    this.autoUseEntries.splice(index, 1);
  }

  autoBalance(item: Item) {
    for (const balanceItem of this.autoBalanceItems) {
      if (balanceItem.name === item.name) {
        // it's already in the list, bail out
        return;
      }
    }
    this.autoBalanceItems.push({
      name: item.name,
      index: 0,
      useNumber: 1,
      sellNumber: 1,
    });
    // sell current stock, incoming items will be balanced
    this.sellAll(item);
  }

  unAutoBalance(itemName: string) {
    for (let index = 0; index < this.autoBalanceItems.length; index++) {
      if (this.autoBalanceItems[index].name === itemName) {
        this.autoBalanceItems.splice(index, 1);
        return;
      }
    }
  }

  equip(itemStack: ItemStack): void {
    // return the item already in the slot to the inventory, if any
    const item = itemStack.item;

    if (!item || !instanceOfEquipment(item)) {
      if (item?.pouchable) {
        const index = this.itemStacks.indexOf(itemStack);
        for (let i = 0; i < this.characterService.itemPouches.length; i++) {
          if (this.characterService.itemPouches[i].item?.name === item.name) {
            this.characterService.itemPouches[i].quantity += itemStack.quantity;
            this.setItemEmptyStack(index);
            return;
          }
        }
        // didn't find a stack of the same name, add it if we can
        for (let i = 0; i < this.characterService.itemPouches.length; i++) {
          if (!this.characterService.itemPouches[i].item) {
            this.moveToPouch(index, i);
            return;
          }
        }
      }

      return;
    }

    const itemToEquip = this.characterService.equipment[item.slot];
    if (itemToEquip) {
      this.addItem(itemToEquip);
    }
    this.characterService.equipment[item.slot] = item;
    const index = this.itemStacks.indexOf(itemStack);
    this.setItemEmptyStack(index);
  }

  equipBest(slot: EquipmentPosition) {
    let equippedPower = 0;
    let weapon = true;
    if (slot === 'leftHand' || slot === 'rightHand') {
      equippedPower = this.characterService.equipment[slot]?.weaponStats?.baseDamage || 0;
    } else {
      weapon = false;
      equippedPower = this.characterService.equipment[slot]?.armorStats?.defense || 0;
    }
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (itemIterator.item) {
        const item = itemIterator.item;
        if (instanceOfEquipment(item) && item.slot === slot) {
          let itemPower = 0;
          if (weapon && item.weaponStats) {
            itemPower = item.weaponStats?.baseDamage;
          } else if (!weapon && item.armorStats) {
            itemPower = item.armorStats?.defense;
          }
          if (itemPower > equippedPower) {
            this.equip(itemIterator);
          }
        }
      }
    }
  }

  consume(consumedThing: string, quantity = 1, cheapest = false, checkOnly = false, subtype = ''): number {
    const filteredItemStacks = this.itemStacks
      .slice(this.heirloomSlots())
      .filter(
        itemStack => itemStack.item?.type === consumedThing && (subtype === '' || itemStack.item.subtype === subtype)
      )
      .sort((a, b) => {
        if (cheapest) {
          return a.item!.value - b.item!.value;
        } else {
          return b.item!.value - a.item!.value;
        }
      });
    if (filteredItemStacks.length === 0) {
      return -1;
    }
    let totalQuantity = 0;
    filteredItemStacks.forEach(itemStack => (totalQuantity += itemStack.quantity));
    if (totalQuantity < quantity) {
      // not enough of the item, bail out
      return -1;
    } else if (checkOnly) {
      return filteredItemStacks[0].item!.value;
    }
    let returnValue = -1;
    for (const itemStack of filteredItemStacks) {
      if (itemStack.quantity >= quantity) {
        itemStack.quantity -= quantity;
        returnValue = itemStack.item!.value;
        quantity = 0;
      } else {
        quantity -= itemStack.quantity;
        itemStack.quantity = 0;
      }
      if (itemStack.quantity === 0) {
        const index = this.itemStacks.indexOf(itemStack);
        this.setItemEmptyStack(index);
      }
      if (quantity === 0) {
        break;
      }
    }
    return returnValue;
  }

  checkFor(itemType: string, quantity = 1, subtype = ''): number {
    return this.consume(itemType, quantity, false, true, subtype);
  }

  // consume items of the consumedThing type until the value is met, returning the actual value consumed or -1 if there's not enough
  consumeByValue(consumedThing: string, value: number, checkOnly = false, subtype = ''): number {
    const filteredItemStacks = this.itemStacks
      .slice(this.heirloomSlots())
      .filter(
        itemStack =>
          itemStack.item?.type === consumedThing &&
          itemStack.quantity > 0 &&
          (subtype === '' || itemStack.item.subtype === subtype)
      )
      .sort((a, b) => {
        return a.item!.value - b.item!.value;
      });
    if (filteredItemStacks.length === 0) {
      return -1;
    }
    let totalValue = 0;
    filteredItemStacks.forEach(itemStack => (totalValue += itemStack.item!.value * itemStack.quantity));
    if (totalValue < value) {
      // not enough value available of the item, bail out
      return -1;
    } else if (checkOnly) {
      return totalValue;
    }
    totalValue = 0;
    for (const itemStack of filteredItemStacks) {
      if (totalValue + itemStack.item!.value * itemStack.quantity >= value) {
        // there's enough in  this stack to cover the required value, figure out how many of them to consume
        while (totalValue < value) {
          totalValue += itemStack.item!.value;
          itemStack.quantity--;
        }
        if (itemStack.quantity === 0) {
          const index = this.itemStacks.indexOf(itemStack);
          this.setItemEmptyStack(index);
        }
      } else {
        totalValue += itemStack.item!.value * itemStack.quantity;
        const index = this.itemStacks.indexOf(itemStack);
        this.setItemEmptyStack(index);
      }
    }
    return totalValue;
  }

  checkForByValue(itemType: string, value: number, subtype = ''): number {
    return this.consumeByValue(itemType, value, true, subtype);
  }

  getQuantityByName(itemName: string): number {
    let itemCount = 0;
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.name === itemName) {
        itemCount += itemIterator.quantity;
      }
    }
    return itemCount;
  }

  getQuantityByType(itemType: string): number {
    let itemCount = 0;
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.type === itemType) {
        itemCount += itemIterator.quantity;
      }
    }
    return itemCount;
  }

  /** A special use function for generated potions. */
  usePotion(potion: Item, quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePotionsUsed += quantity;
    let effect = 'health';
    if (potion.effect) {
      effect = potion.effect;
    }
    const statusKey = effect as StatusType;
    this.characterService.status[statusKey].value += (potion.increaseAmount || 1) * quantity;
    this.characterService.checkOverage();
  }

  /** A special use function for generated pills*/
  usePill(pill: Item, quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePillsUsed += quantity;
    if (pill.effect === 'longevity') {
      this.characterService.alchemyLifespan += (pill.increaseAmount || 1) * quantity;
      if (this.characterService.alchemyLifespan > 36500) {
        this.characterService.alchemyLifespan = 36500;
      }
    } else if (pill.effect === 'empowerment') {
      this.characterService.empowermentFactor += 0.01 * quantity;
    } else {
      // effect should be an attribute
      let effect = 'strength';
      if (pill.effect) {
        effect = pill.effect;
      }
      if (effect.includes(',')) {
        const effectArray = effect.split(',');
        for (const attr of effectArray) {
          const attributeKey = attr as AttributeType;
          this.characterService.increaseAttribute(attributeKey, (pill.increaseAmount || 1) * quantity);
        }
      } else {
        const attributeKey = effect as AttributeType;
        this.characterService.increaseAttribute(attributeKey, (pill.increaseAmount || 1) * quantity);
      }
    }
    this.characterService.checkOverage();
  }

  useFormationKit(item: Item): number {
    if (item.type !== 'formationKit' || !item.effect) {
      // wrong item, bail out
      return 0;
    }
    if (this.battleService!.formationCooldown > 0) {
      // on cooldown, bail out
      return 0;
    }
    this.battleService!.activeFormation = item.effect;
    this.battleService!.formationDuration = item.value;
    this.battleService!.formationCooldown = item.value * 2;
    this.battleService!.formationPower = item.value;

    return 1;
  }

  /** Returns the number of open inventory slots. */
  openInventorySlots() {
    let openSlots = 0;
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        openSlots++;
      }
    }
    return openSlots;
  }

  /** Create a new piece of equipment based on the two provided. Caller needs to do the destroying of the old items. */
  mergeEquipment(item1: Equipment, item2: Equipment, destinationInventoryIndex: number) {
    if (item1.slot !== item2.slot) {
      // not the same slot, bail out
      return;
    }
    let inventoryIndex = 0;
    if (item1.slot === 'rightHand' || item1.slot === 'leftHand') {
      inventoryIndex = this.addItem(
        this.generateWeapon(
          item1.value + item2.value,
          item1.weaponStats?.material + '',
          item1.weaponStats?.baseName,
          item1.effect
        )
      );
    } else {
      inventoryIndex = this.addItem(
        this.generateArmor(item1.value + item2.value, item1.slot, item1.armorStats?.baseName, item1.effect)
      );
    }
    // if we can, move the new item to the desired destination index
    if (inventoryIndex !== destinationInventoryIndex && !this.itemStacks[destinationInventoryIndex].item) {
      this.itemStacks[destinationInventoryIndex] = this.itemStacks[inventoryIndex];
      this.setItemEmptyStack(inventoryIndex);
    }
  }

  mergeItemStacks(
    sourceStack: ItemStack,
    destStack: ItemStack,
    sourceInventoryIndex: number,
    destInventoryIndex: number
  ) {
    if (
      sourceStack.item &&
      destStack.item &&
      sourceStack.item.name === destStack.item.name &&
      sourceStack.quantity + destStack.quantity < this.maxStackSize
    ) {
      destStack.quantity += sourceStack.quantity;
      this.fixId(destInventoryIndex);
      this.setItemEmptyStack(sourceInventoryIndex);
    }
  }

  autoWeaponMerge() {
    this.autoMerge('leftHand');
    this.autoMerge('rightHand');
  }

  autoArmorMerge() {
    this.autoMerge('head');
    this.autoMerge('body');
    this.autoMerge('legs');
    this.autoMerge('feet');
  }

  autoequipWeapons() {
    this.equipBest('leftHand');
    this.equipBest('rightHand');
  }

  autoequipArmor() {
    this.equipBest('head');
    this.equipBest('body');
    this.equipBest('legs');
    this.equipBest('feet');
  }

  autoMerge(slot: EquipmentPosition) {
    let mergeDestinationIndex = -1;
    let destinationItem: Equipment | null = null;
    let sourceItem: Equipment | null = null;
    let lastdestinationIndex = -1;
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      let item = this.itemStacks[i]?.item;
      if (item) {
        if (instanceOfEquipment(item)) {
          if (item.slot === slot) {
            if (mergeDestinationIndex === -1) {
              mergeDestinationIndex = i;
              lastdestinationIndex = i;
              destinationItem = item;
            } else {
              sourceItem = item;
              if (destinationItem) {
                this.setItemEmptyStack(mergeDestinationIndex);
                this.setItemEmptyStack(i);
                this.mergeEquipment(destinationItem, sourceItem, mergeDestinationIndex);
                item = this.itemStacks[mergeDestinationIndex]?.item;
                if (item) {
                  if (instanceOfEquipment(item)) {
                    if (item.slot === slot) {
                      destinationItem = item;
                    }
                  }
                } else {
                  mergeDestinationIndex = -1;
                }
              }
            }
          }
        }
      }
    }
    if (this.automergeEquipped) {
      // finally, merge the last item with that slot into the equipped item if present and autoEquipBest is enabled(and corresponding autoequip is unlocked)
      if (destinationItem && this.autoequipBestEnabled && (this.autoequipBestWeapon || this.autoequipBestArmor)) {
        if (
          ((slot === 'rightHand' || slot === 'leftHand') && this.autoequipBestWeapon) ||
          (slot !== 'rightHand' && slot !== 'leftHand' && this.autoequipBestArmor)
        ) {
          this.mergeEquippedSlot(slot, destinationItem, lastdestinationIndex);
        }
      }
    }
  }

  mergeEquippedSlot(slot: EquipmentPosition, itemToMerge: Item, sourceItemIndex: number) {
    const equippedItem = this.characterService.equipment[slot];
    if (!equippedItem) {
      return;
    }
    if (!instanceOfEquipment(itemToMerge)) {
      return;
    }
    let newItem;
    if (!equippedItem) {
      this.characterService.equipment[slot] = itemToMerge;
      this.setItemEmptyStack(sourceItemIndex);
      return;
    }
    if (slot === 'rightHand' || slot === 'leftHand') {
      newItem = this.generateWeapon(
        equippedItem.value + itemToMerge.value,
        itemToMerge.weaponStats?.material + '',
        equippedItem.weaponStats?.baseName,
        equippedItem.effect
      );
    } else {
      newItem = this.generateArmor(
        equippedItem.value + itemToMerge.value,
        slot,
        equippedItem.armorStats?.baseName,
        equippedItem.effect
      );
    }
    this.characterService.equipment[slot] = newItem;
    this.setItemEmptyStack(sourceItemIndex);
  }

  mergeSpiritGem(stack: ItemStack) {
    if (!stack.item) {
      return;
    }
    if (stack.quantity < 10) {
      return;
    }
    stack.quantity -= 10;
    this.addItem(this.generateSpiritGem(stack.item.value / 10 + 1, stack.item.subtype));
    // go find the stack and remove it or update the id
    for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
      if (this.itemStacks[i] === stack) {
        if (stack.quantity === 0) {
          this.setItemEmptyStack(i);
          return;
        } else {
          this.fixId(i);
        }
      }
    }
  }

  mergeAnySpiritGem(power: number) {
    for (let j = 0; j < power; j++) {
      for (let i = this.heirloomSlots(); i < this.itemStacks.length; i++) {
        const itemIterator = this.itemStacks[i];
        if (itemIterator.item?.type === LOOT_TYPE_GEM && itemIterator.quantity >= 10) {
          this.mergeSpiritGem(itemIterator);
          break;
        }
      }
    }
  }

  stashWeapons() {
    this.characterService.stashWeapons();
    for (let i = 0; i < this.itemStacks.length; i++) {
      const item = this.itemStacks[i]?.item;
      if (item && instanceOfEquipment(item) && item.weaponStats) {
        this.stashedItemStacks.push(this.itemStacks[i]);
        this.setItemEmptyStack(i);
      }
    }
  }

  restoreWeapons() {
    this.characterService.restoreWeapons();
    for (let i = this.stashedItemStacks.length - 1; i >= 0; i--) {
      const itemStack = this.stashedItemStacks[i];
      if (itemStack && itemStack.item && instanceOfEquipment(itemStack.item) && itemStack.item.weaponStats) {
        this.addItem(itemStack.item, itemStack.quantity);
        this.stashedItemStacks.splice(i, 1);
      }
    }
  }

  stashArmor() {
    this.characterService.stashArmor();
    for (let i = 0; i < this.itemStacks.length; i++) {
      const item = this.itemStacks[i]?.item;
      if (item && instanceOfEquipment(item) && item.armorStats) {
        this.stashedItemStacks.push(this.itemStacks[i]);
        this.setItemEmptyStack(i);
      }
    }
  }

  restoreArmor() {
    this.characterService.restoreArmor();
    for (let i = this.stashedItemStacks.length - 1; i >= 0; i--) {
      const itemStack = this.stashedItemStacks[i];
      if (itemStack && itemStack.item && instanceOfEquipment(itemStack.item) && itemStack.item.armorStats) {
        this.addItem(itemStack.item, itemStack.quantity);
        this.stashedItemStacks.splice(i, 1);
      }
    }
  }

  stashInventory() {
    for (let i = 0; i < this.itemStacks.length; i++) {
      const item = this.itemStacks[i]?.item;
      if (item && item.type !== 'food' && item.type !== LOOT_TYPE_GEM) {
        this.stashedItemStacks.push(this.itemStacks[i]);
        this.setItemEmptyStack(i);
      }
    }
  }

  restoreInventory() {
    for (let i = this.stashedItemStacks.length - 1; i >= 0; i--) {
      const itemStack = this.stashedItemStacks[i];
      if (itemStack && itemStack.item) {
        this.addItem(itemStack.item, itemStack.quantity);
      }
    }
    this.stashedItemStacks = [];
  }

  removeItemStack(itemStack: ItemStack) {
    const index = this.itemStacks.indexOf(itemStack);
    this.thrownAwayItems += itemStack.quantity;
    this.setItemEmptyStack(index);
  }

  setItemEmptyStack(index: number) {
    if (this.selectedItem === this.itemStacks[index]) {
      this.selectedItem = this.getEmptyItemStack();
    }
    this.itemStacks[index] = this.getEmptyItemStack();
  }

  getEmptyItemStack(): ItemStack {
    return {
      item: null,
      quantity: 0,
      id: this.emptyIdPrefix + this.emptyIdCounter++,
    };
  }

  fixId(index: number) {
    if (this.itemStacks[index].item) {
      this.itemStacks[index].id = index + this.itemStacks[index].item!.name + this.itemStacks[index].quantity;
    } else {
      this.itemStacks[index].id = this.emptyIdPrefix + this.emptyIdCounter++;
    }
  }

  fixIdByStack(itemStack: ItemStack) {
    for (let i = 0; i < this.itemStacks.length; i++) {
      if (itemStack === this.itemStacks[i]) {
        this.fixId(i);
        return;
      }
    }
    for (let i = 0; i < this.characterService.itemPouches.length; i++) {
      if (itemStack === this.characterService.itemPouches[i]) {
        itemStack.id =
          i + this.characterService.itemPouches[i].item!.name + this.characterService.itemPouches[i].quantity;
        return;
      }
    }
  }

  moveToPouch(itemIndex: number, pouchIndex: number) {
    if (!this.itemStacks[itemIndex].item) {
      // no item to move, bail out
      return;
    }
    if (!this.itemStacks[itemIndex].item?.pouchable) {
      // item can't be put in a pouch, bail out
      return;
    }
    if (this.characterService.itemPouches[pouchIndex].item) {
      if (this.characterService.itemPouches[pouchIndex].item?.name === this.itemStacks[itemIndex].item?.name) {
        // same item type, dump the quantity into the pouch
        this.characterService.itemPouches[pouchIndex].quantity += this.itemStacks[itemIndex].quantity;
        this.itemStacks[itemIndex] = this.getEmptyItemStack();
        return;
      }
      // swap the pouch item with the inventory item
      const temp = this.itemStacks[itemIndex];
      this.itemStacks[itemIndex] = this.characterService.itemPouches[pouchIndex];
      this.characterService.itemPouches[pouchIndex] = temp;
      this.characterService.itemPouches[pouchIndex].id =
        pouchIndex +
        this.characterService.itemPouches[pouchIndex].item!.name +
        this.characterService.itemPouches[pouchIndex].quantity;
      this.fixId(itemIndex);
    } else {
      // nothing there now, just put the inventory item in the pouch
      this.characterService.itemPouches[pouchIndex] = this.itemStacks[itemIndex];
      this.characterService.itemPouches[pouchIndex].id =
        pouchIndex +
        this.characterService.itemPouches[pouchIndex].item!.name +
        this.characterService.itemPouches[pouchIndex].quantity;
      this.itemStacks[itemIndex] = this.getEmptyItemStack();
    }
  }

  unlockFurniture(furnitureToUnlock: string) {
    if (this.unlockedFurniture.includes(furnitureToUnlock)) {
      return;
    }
    const furnitureItem = this.itemRepoService.furniture.find(item => item.name === furnitureToUnlock);
    if (furnitureItem) {
      furnitureItem.locked = false;
      this.characterService.toast('New furniture is available: ' + this.titleCasePipe.transform(furnitureToUnlock));
    }
    this.unlockedFurniture.push(furnitureToUnlock);
  }

  splitItemStack(stackToSplit: ItemStack) {
    if (!stackToSplit.item) {
      return;
    }
    if (stackToSplit.quantity < 2) {
      return;
    }
    const half = Math.floor(stackToSplit.quantity / 2);
    this.addItem(stackToSplit.item, half, 0, false, true);
    stackToSplit.quantity -= half;
  }
}

export function instanceOfEquipment(object: Item): object is Equipment {
  return 'slot' in object;
}
