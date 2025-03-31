import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { EquipmentPosition, AttributeType, StatusType } from './character';
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
import { BigNumberPipe } from '../app.component';
import { HellService } from './hell.service';
import { HomeService } from './home.service';
import { LocationType } from './activity';
import { LocationService } from './location.service';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  baseName?: string;
  effect?: string;
}

export interface ArmorStats {
  defense: number;
  baseName?: string;
  effect?: string;
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
  autoPotionUnlocked: boolean;
  autoPillUnlocked: boolean;
  autoPotionEnabled: boolean;
  autoPillEnabled: boolean;
  autoWeaponMergeUnlocked: boolean;
  autoArmorMergeUnlocked: boolean;
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
  pillCounter: number;
  potionCounter: number;
  herbCounter: number;
  gemsAcquired: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  hellService?: HellService;
  homeService?: HomeService;
  locationService?: LocationService;
  bigNumberPipe: BigNumberPipe;
  itemStacks: ItemStack[] = [];
  stashedItemStacks: ItemStack[] = [];
  maxItems = 10;
  maxStackSize = 100;
  selectedItem: ItemStack = this.getEmptyItemStack();
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
  autoPotionUnlocked: boolean;
  autoPillUnlocked: boolean;
  autoPotionEnabled: boolean;
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
  autoSort = false;
  descendingSort = false;
  divinePeachesUnlocked = false;
  equipmentUnlocked = false;
  equipmentCreated = 0;
  emptyIdCounter = 0;
  emptyIdPrefix = Date.now() + '';
  totalItemsReceived = 0;
  autoReloadCraftInputs = false;
  pillCounter = 0;
  potionCounter = 0;
  herbCounter = 0;
  gemsAcquired = 0;

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
    setTimeout(() => (this.locationService = this.injector.get(LocationService)));
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.autoSellUnlocked = false;
    this.autoSellEntries = [];
    this.autoUseUnlocked = false;
    this.autoEatUnlocked = false;
    this.autoEatNutrition = true;
    this.autoEatHealth = false;
    this.autoEatStamina = false;
    this.autoEatQi = false;
    this.autoEatAll = false;
    this.autoBalanceUnlocked = false;
    this.autoBalanceItems = [];
    this.autoPotionUnlocked = false;
    this.autoPillUnlocked = false;
    this.autoPotionEnabled = false;
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
        const item = this.characterService.characterState.equipment[key];
        if (item) {
          this.updateArmorDescription(item);
        }
      }
      for (const key of ['leftHand', 'rightHand'] as EquipmentPosition[]) {
        const item = this.characterService.characterState.equipment[key];
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

      if (this.autoSort) {
        this.sortInventory();
      }
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  tick() {
    if (this.characterService.characterState.dead) {
      return;
    }
    this.characterService.characterState.status.nutrition.value--; // tick the day's hunger
    this.eatDailyMeal();
    this.usePouchItem();

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
  }

  getProperties(): InventoryProperties {
    return {
      itemStacks: this.itemStacks,
      stashedItemStacks: this.stashedItemStacks,
      autoSellUnlocked: this.autoSellUnlocked,
      autoSellEntries: this.autoSellEntries,
      autoUseUnlocked: this.autoUseUnlocked,
      autoEatUnlocked: this.autoEatUnlocked,
      autoEatNutrition: this.autoEatNutrition,
      autoEatHealth: this.autoEatHealth,
      autoEatStamina: this.autoEatStamina,
      autoEatQi: this.autoEatQi,
      autoEatAll: this.autoEatAll,
      autoUseEntries: this.autoUseEntries,
      autoBalanceUnlocked: this.autoBalanceUnlocked,
      autoBalanceItems: this.autoBalanceItems,
      autoPotionUnlocked: this.autoPotionUnlocked,
      autoPillUnlocked: this.autoPillUnlocked,
      autoPotionEnabled: this.autoPotionEnabled,
      autoPillEnabled: this.autoPillEnabled,
      autoWeaponMergeUnlocked: this.autoWeaponMergeUnlocked,
      autoArmorMergeUnlocked: this.autoArmorMergeUnlocked,
      useSpiritGemUnlocked: this.useSpiritGemUnlocked,
      useSpiritGemWeapons: this.useSpiritGemWeapons,
      useSpiritGemPotions: this.useSpiritGemPotions,
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
      autoSort: this.autoSort,
      descendingSort: this.descendingSort,
      divinePeachesUnlocked: this.divinePeachesUnlocked,
      equipmentUnlocked: this.equipmentUnlocked,
      equipmentCreated: this.equipmentCreated,
      totalItemsReceived: this.totalItemsReceived,
      autoReloadCraftInputs: this.autoReloadCraftInputs,
      pillCounter: this.pillCounter,
      potionCounter: this.potionCounter,
      herbCounter: this.herbCounter,
      gemsAcquired: this.gemsAcquired,
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
    this.stashedItemStacks = properties.stashedItemStacks || [];
    this.autoSellUnlocked = properties.autoSellUnlocked || false;
    this.autoSellEntries = properties.autoSellEntries || [];
    this.autoUseUnlocked = properties.autoUseUnlocked || false;
    this.autoEatUnlocked = properties.autoEatUnlocked || false;
    this.autoEatNutrition = properties.autoEatNutrition ?? true;
    this.autoEatHealth = properties.autoEatHealth || false;
    this.autoEatStamina = properties.autoEatStamina || false;
    this.autoEatQi = properties.autoEatQi || false;
    this.autoEatAll = properties.autoEatAll || false;
    this.autoUseEntries = properties.autoUseEntries || [];
    this.autoBalanceUnlocked = properties.autoBalanceUnlocked || false;
    this.autoBalanceItems = properties.autoBalanceItems;
    this.autoPotionUnlocked = properties.autoPotionUnlocked || false;
    this.autoPillUnlocked = properties.autoPillUnlocked || false;
    this.autoPotionEnabled = properties.autoPotionUnlocked || this.autoPotionUnlocked;
    this.autoPillEnabled = properties.autoPillUnlocked || this.autoPillUnlocked;
    this.autoWeaponMergeUnlocked = properties.autoWeaponMergeUnlocked || false;
    this.autoArmorMergeUnlocked = properties.autoArmorMergeUnlocked || false;
    this.useSpiritGemUnlocked = properties.useSpiritGemUnlocked || false;
    this.useSpiritGemWeapons = properties.useSpiritGemWeapons;
    this.useSpiritGemPotions = properties.useSpiritGemPotions;
    this.useCheapestSpiritGem = properties.useCheapestSpiritGem || false;
    this.autoSellOldHerbs = properties.autoSellOldHerbs || false;
    this.autoSellOldWood = properties.autoSellOldWood || false;
    this.autoSellOldOre = properties.autoSellOldOre || false;
    this.autoSellOldHides = properties.autoSellOldHides || false;
    this.autoSellOldHerbsEnabled = properties.autoSellOldHerbsEnabled || false;
    this.autoSellOldWoodEnabled = properties.autoSellOldWoodEnabled || false;
    this.autoSellOldOreEnabled = properties.autoSellOldOreEnabled || false;
    this.autoSellOldBarsEnabled = properties.autoSellOldBarsEnabled || false;
    this.autoSellOldHidesEnabled = properties.autoSellOldHidesEnabled || false;
    this.autoequipBestWeapon = properties.autoequipBestWeapon || false;
    this.autoequipBestArmor = properties.autoequipBestArmor || false;
    if (properties.autoequipBestEnabled === undefined) {
      this.autoequipBestEnabled = true;
    } else {
      this.autoequipBestEnabled = properties.autoequipBestEnabled;
    }
    this.maxStackSize = properties.maxStackSize || 100;
    this.thrownAwayItems = properties.thrownAwayItems || 0;
    this.autoSellOldGemsUnlocked = properties.autoSellOldGemsUnlocked || false;
    this.autoSellOldGemsEnabled = properties.autoSellOldGemsEnabled || false;
    this.autoBuyFood = properties.autoBuyFood ?? true;
    this.automergeEquipped = properties.automergeEquipped || false;
    this.autoSort = properties.autoSort || false;
    this.descendingSort = properties.descendingSort || false;
    this.divinePeachesUnlocked = properties.divinePeachesUnlocked || false;
    this.updateFarmFoodList();
    this.equipmentUnlocked = properties.equipmentUnlocked || false;
    this.equipmentCreated = properties.equipmentCreated || 0;
    this.totalItemsReceived = properties.totalItemsReceived || 0;
    this.autoReloadCraftInputs = properties.autoReloadCraftInputs || false;
    this.pillCounter = properties.pillCounter || 0;
    this.potionCounter = properties.potionCounter || 0;
    this.herbCounter = properties.herbCounter || 0;
    this.gemsAcquired = properties.gemsAcquired || 0;
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
    for (let key = 0; key < this.itemStacks.length; key++) {
      const itemStack = this.itemStacks[key];
      if (itemStack.item) {
        if (itemStack.item.type === 'gem') {
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
    const emptySlots = this.itemStacks.length - tempStacks.length - gemStacks.length - equipStacks.length;
    this.itemStacks = tempStacks;
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
      weaponStats: {
        baseDamage: damage,
        material: material,
        baseName: baseName,
        effect: effect,
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
    if (weapon.weaponStats.effect) {
      effectString = ' and imbued with the power of ' + weapon.weaponStats.effect;
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
    if (armor.armorStats.effect) {
      effectString = ' and imbued with the power of ' + armor.armorStats.effect;
    }
    armor.description =
      'A unique piece of armor ' +
      effectString +
      '.<br>Drag and drop onto similar armor to merge them into something better.<br>Defense: ' +
      this.bigNumberPipe.transform(armor.armorStats.defense);
  }

  upgradeEquppedEquipment(value: number) {
    const upgradables = [];
    if (this.characterService.characterState.equipment.leftHand) {
      upgradables.push(this.characterService.characterState.equipment.leftHand);
    }
    if (this.characterService.characterState.equipment.rightHand) {
      upgradables.push(this.characterService.characterState.equipment.rightHand);
    }
    if (this.characterService.characterState.equipment.head) {
      upgradables.push(this.characterService.characterState.equipment.head);
    }
    if (this.characterService.characterState.equipment.body) {
      upgradables.push(this.characterService.characterState.equipment.body);
    }
    if (this.characterService.characterState.equipment.legs) {
      upgradables.push(this.characterService.characterState.equipment.legs);
    }
    if (this.characterService.characterState.equipment.feet) {
      upgradables.push(this.characterService.characterState.equipment.feet);
    }
    if (upgradables.length > 0) {
      const equipment = upgradables[Math.floor(Math.random() * upgradables.length)];
      this.upgradeEquipment(equipment, value);
    }
  }

  upgradeEquipment(equipment: Equipment, value: number, newEffect = 'spirit') {
    if (equipment.armorStats) {
      equipment.armorStats.defense += Math.max(Math.sqrt(value), 1000) * value;
      if (newEffect !== 'spirit') {
        equipment.armorStats.effect = newEffect;
      }
    } else if (equipment.weaponStats) {
      equipment.weaponStats.baseDamage += Math.max(Math.sqrt(value), 1000) * value;
      if (newEffect !== 'spirit') {
        equipment.weaponStats.effect = newEffect;
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
    let restoreAmount = grade;
    if (this.characterService.characterState.qiUnlocked) {
      const potionType = this.potionCounter % 3;
      if (potionType === 0) {
        effect = 'stamina';
      } else if (potionType === 1) {
        effect = 'qi';
        restoreAmount = Math.floor(grade / 10);
      }
    } else {
      const potionType = this.potionCounter % 2;
      if (potionType === 0) {
        effect = 'stamina';
      }
    }

    const name = 'Potion of ' + this.titleCasePipe.transform(effect) + ' +' + restoreAmount;
    this.logService.log(
      LogTopic.CRAFTING,
      'Alchemy Success! Created a ' + this.titleCasePipe.transform(name) + '. Keep up the good work.'
    );

    this.addItem({
      name: name,
      imageFile: 'potion',
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
    });
  }

  generatePill(grade: number, attribute: AttributeType): void {
    this.pillCounter++;
    let effect: string = attribute;
    if (this.pillCounter > 10) {
      this.pillCounter = 0;
      effect = 'longevity';
    }

    const description = 'A powerful pill that increases your ' + effect + '.';
    const useDescription = 'Use to increase your ' + effect;
    const value = grade * 10;
    const name = this.titleCasePipe.transform(effect) + ' Pill ' + ' +' + grade;
    const imageFileName = 'pill';
    this.logService.log(
      LogTopic.CRAFTING,
      'Alchemy Success! Created a ' + this.titleCasePipe.transform(name) + '. Keep up the good work.'
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
      increaseAmount: grade,
    });
  }

  generateHerb(): void {
    if (!this.locationService?.troubleTarget) {
      // location isn't set, bail out
      return;
    }
    const targetLocation = this.locationService.troubleTarget;
    const filteredHerbs = Herbs.filter(herb => herb.locations.includes(targetLocation));
    if (filteredHerbs.length === 0) {
      // no herbs at this location, bail out
      return;
    }
    const woodLore = this.characterService.characterState.attributes.woodLore.value;
    let grade = Math.floor(Math.pow(woodLore / 1e9, 0.26) * herbQuality.length); // 1e9 woodlore is maximum grade, adjust if necessary
    if (grade >= herbQuality.length) {
      grade = herbQuality.length - 1;
    }
    const herb = filteredHerbs[this.herbCounter % filteredHerbs.length];
    this.herbCounter++;

    this.addItem({
      id: 'herb_' + herb.name + grade,
      imageFile: 'herb_' + herb.name,
      imageColor: this.itemRepoService.colorByRank[grade],
      name: herbQuality[grade] + ' ' + herb.name,
      type: 'herb',
      subtype: herb.name,
      attribute: herb.attribute,
      value: grade + 1,
      description: 'Useful herbs. Can be used in creating pills or potions.',
    });
    if (this.autoSellOldHerbsEnabled) {
      // sell any herb of the same type cheaper than what we just picked
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'herb' && itemStack.item.subtype === herb.name) {
          if (itemStack.item.value < grade + 1 && itemStack.item.subtype === herb.name) {
            this.sell(itemStack, itemStack.quantity);
          }
        }
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
      imageFile: 'spiritGem',
      name: flavor + ' gem grade ' + grade,
      type: 'gem',
      subtype: flavor,
      value: grade * 10,
      description: description,
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
      armorStats: {
        defense: defense,
        baseName: baseName,
        effect: effect,
      },
      description:
        'A unique piece of armor that you made.<br>Drag and drop onto similar armor to merge them into something better.<br>nDefense: ' +
        this.bigNumberPipe.transform(defense),
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

  getOre(value: number = -1): Item {
    let oreValue = value;
    if (value === -1) {
      const earthLore = this.characterService.characterState.attributes.earthLore.value;
      oreValue = Math.floor(Math.pow(earthLore / 1e9, 0.15) * 16); // 1e9 earthlore is maximum value (16), adjust if necessary
    }
    let lastOre = this.itemRepoService.items['copperOre'];
    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'ore' && item.value > lastOre.value && item.value <= oreValue) {
        lastOre = item;
      }
    }

    if (this.autoSellOldOreEnabled && !this.hellService?.inHell) {
      // sell any ore cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'ore' && itemStack.item.value < lastOre.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastOre;
  }

  getBar(oreValue: number): Item {
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

    if (this.autoSellOldBarsEnabled && !this.hellService?.inHell) {
      // sell any metal cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'metal' && itemStack.item.value < lastMetal.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastMetal;
  }

  getWood(): Item {
    const woodLore = this.characterService.characterState.attributes.woodLore.value;
    const woodvalue = Math.floor(Math.pow(woodLore / 1e9, 0.15) * 16); // 1e9 woodlore is maximum value (16), adjust if necessary;
    let lastWood = this.itemRepoService.items['balsaLog'];

    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'wood' && item.value > lastWood.value && item.value <= woodvalue) {
        lastWood = item;
      }
    }

    if (this.autoSellOldWoodEnabled && !this.hellService?.inHell) {
      // sell any wood cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'wood' && itemStack.item.value < lastWood.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastWood;
  }

  getHide(value: number = -1): Item {
    let hideValue = value;
    if (hideValue === -1) {
      const animalHandling = this.characterService.characterState.attributes.animalHandling.value;
      hideValue = Math.floor(Math.pow(animalHandling / 1e9, 0.15) * 16);
    }

    let lastHide = this.itemRepoService.items['hide'];

    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'hide' && item.value > lastHide.value && item.value <= hideValue) {
        lastHide = item;
      }
    }

    if (this.autoSellOldHidesEnabled && !this.hellService?.inHell) {
      // sell any hides cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'hide' && itemStack.item.value < lastHide.value) {
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
    };
  }

  getCoinPurse(value: number): Item {
    return {
      id: 'coinPurse',
      imageFile: 'pillPouch', // TODO: make a different icon for this
      name: 'coin purse',
      type: 'sellable',
      value: value,
      description: 'A purse with strange coins. You could probably sell this.',
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
    this.itemStacks = [];
    this.stashedItemStacks = [];
    this.changeMaxItems(10);

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
      };
      this.addItem(stick);
    }

    if (this.characterService.characterState.bloodlineRank >= 6) {
      return; // Skip the rice gift, thematically inappropriate
    }
    if (this.motherGift) {
      this.logService.log(
        LogTopic.EVENT,
        'Your mother gives you three big bags of rice as you prepare to make your way in the world.'
      );
      this.addItem(this.itemRepoService.items['rice'], 300);
    }
  }

  eatDailyMeal(): void {
    if (
      this.autoEatUnlocked &&
      (this.autoEatNutrition || this.autoEatHealth || this.autoEatStamina || this.autoEatQi || this.autoEatAll)
    ) {
      let foodStack = null;
      let fed = false;
      let highestValue = -1;
      for (const itemIterator of this.itemStacks) {
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
          !this.hellService?.inHell &&
          this.characterService.characterState.money > 0 &&
          this.autoBuyFood &&
          this.characterService.characterState.status.nutrition.value <=
            this.characterService.characterState.status.nutrition.max * 0.2
        ) {
          this.characterService.characterState.updateMoney(-1);
          this.characterService.characterState.status.nutrition.value++;
        }
      }

      return;
    }
    if (
      this.characterService.characterState.status.nutrition.value >
      this.characterService.characterState.status.nutrition.max * 0.2
    ) {
      // not hungry enough, don't automatically eat
      return;
    }

    let foodStack = null;
    let foodValue = 0;
    for (const itemIterator of this.itemStacks) {
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
      if (!this.hellService?.inHell && this.characterService.characterState.money > 0 && this.autoBuyFood) {
        this.characterService.characterState.updateMoney(-1);
        this.characterService.characterState.status.nutrition.value++;
      }
    }
  }

  bellyFull() {
    if (this.autoEatAll) {
      return false;
    }
    if (
      this.autoEatNutrition &&
      this.characterService.characterState.status.nutrition.value <
        this.characterService.characterState.status.nutrition.max
    ) {
      return false;
    }
    if (
      this.autoEatHealth &&
      this.characterService.characterState.status.health.value <
        this.characterService.characterState.status.health.max - 1
    ) {
      return false;
    }
    if (
      this.autoEatStamina &&
      this.characterService.characterState.status.stamina.value <
        this.characterService.characterState.status.stamina.max - 1
    ) {
      return false;
    }
    if (
      this.autoEatQi &&
      this.characterService.characterState.status.qi.value < this.characterService.characterState.status.qi.max - 1
    ) {
      return false;
    }
    return true;
  }

  private eatFood(foodItem: Item, quantity = 1) {
    const value = foodItem.value;
    this.characterService.characterState.status.nutrition.value += quantity + quantity * value;
    this.characterService.characterState.healthBonusFood += quantity * value * 0.01;
    this.characterService.characterState.status.health.value += quantity * value * 0.01;
    this.characterService.characterState.status.stamina.value += quantity * value * 0.01;
    this.characterService.characterState.status.qi.value += quantity * value * 0.01;
    const maxLifespanIncrease = Math.min(value * 365, 7300);
    if (this.characterService.characterState.foodLifespan + quantity <= maxLifespanIncrease) {
      this.characterService.characterState.foodLifespan += quantity;
    } else if (this.characterService.characterState.foodLifespan < maxLifespanIncrease) {
      this.characterService.characterState.foodLifespan = maxLifespanIncrease;
    }
    if (foodItem.subtype === 'meal') {
      this.characterService.characterState.status.stamina.max += (quantity * value) / 100;
      if (this.characterService.characterState.status.nutrition.max < 200) {
        this.characterService.characterState.status.nutrition.max += 0.1;
      }
      if (foodItem.name.startsWith('Soul')) {
        this.characterService.characterState.increaseAttribute('spirituality', 0.001);
      }
    }

    this.characterService.characterState.checkOverage();
  }

  /**
   *
   * @param item the Item to add
   * @param quantity the quantity the Item to stack. Ignores for unstackables. Default 1
   * @param inventoryIndex the first inventory slot to try to put the item in
   * @returns first itemStack position, -1 if not applicable
   */
  addItem(item: Item, quantity = 1, inventoryIndex = 0, ignoreAutoReload: boolean = false): number {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.totalItemsReceived += quantity;
    if (item.type === 'gem') {
      this.gemsAcquired++;
    }
    //TODO: pouch items need to go straight there when acquired (maybe a manual for that?)

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
                return -1;
              } else if (
                (item.type !== 'food' || item.name === inputItemStack.item.name) &&
                item.value > inputItemStack.item?.value
              ) {
                // it's an upgrade, add it to the inventory then swap it in
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

    for (const balanceItem of this.autoBalanceItems) {
      if (balanceItem.name === item.name) {
        // can't sell in hell, use it all
        if (this.hellService?.inHell) {
          this.useItem(item, quantity * balanceItem.useNumber);
          return -1;
        }

        if (balanceItem.useNumber < 1) {
          if (balanceItem.sellNumber < 1) {
            break; // dump to inventory if user enters balance numbers under 1
          } else {
            this.characterService.characterState.updateMoney(item.value * quantity); // Sell it all
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
              this.characterService.characterState.updateMoney(item.value * modulo);
              balanceItem.index += modulo;
              break;
            } else {
              this.characterService.characterState.updateMoney(
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
          this.characterService.characterState.updateMoney(item.value * quantity);
          quantity = 0;
        }
        if (quantity < 1) {
          // Sanity check, spill out what should be impossible excess to inventory as though balance were disabled.
          return -1;
        }
        break;
      }
    }

    if (this.autoPotionEnabled && item.type === 'potion') {
      this.useItem(item, quantity);
      return -1;
    }
    if (this.autoPillEnabled && item.type === 'pill') {
      this.useItem(item, quantity);
      return -1;
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
            this.useItem(item, quantity);
            quantity -= numberToUse;
            if (quantity === 0) {
              return -1;
            }
          }
        }
      }
    }

    if (this.autoSellOldGemsEnabled && item.type === 'gem' && !this.hellService?.inHell) {
      //clear out any old gems of lesser value
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack.item && itemStack.item.type === 'gem' && itemStack.item.value < item.value) {
          this.characterService.characterState.updateMoney(itemStack.item.value * itemStack.quantity);
          this.setItemEmptyStack(i);
        }
      }
    }
    for (const entry of this.autoSellEntries) {
      if (entry.name === item.name && !this.hellService?.inHell) {
        let numberToSell = this.getQuantityByName(item.name) + quantity - entry.reserve;
        if (numberToSell > quantity) {
          // don't worry about selling more than the incoming quantity here
          numberToSell = quantity;
        }
        if (numberToSell > 0) {
          this.characterService.characterState.updateMoney(item.value * numberToSell);
          quantity -= numberToSell;
          if (quantity === 0) {
            return -1;
          }
        }
      }
    }

    let firstStack = -1;
    if (item.type !== 'equipment') {
      // try to stack the new item with existing items
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemIterator = this.itemStacks[i];
        if (!itemIterator.item) {
          continue;
        }
        if (itemIterator.item.name === item.name) {
          if (itemIterator.quantity + quantity <= this.maxStackSize) {
            // it matches an existing item and there's room in the stack for everything, add it to the stack and bail out
            itemIterator.quantity += quantity;
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

    // couldn't stack it all, make a new stack
    for (let i = inventoryIndex; i < this.itemStacks.length; i++) {
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
    if (this.autoSellUnlocked && !this.hellService?.inHell) {
      this.logService.log(
        LogTopic.EVENT,
        "You don't have enough room for the " + this.titleCasePipe.transform(item.name) + ' so you sell it.'
      );
      this.characterService.characterState.updateMoney(item.value * quantity);
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
    if (this.hellService?.inHell) {
      return;
    }
    this.lifetimeSoldItems += quantity;
    if (itemStack.item.type === 'gem') {
      this.lifetimeGemsSold += quantity;
    }
    const index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.setItemEmptyStack(index);
      this.characterService.characterState.updateMoney(itemStack.quantity * itemStack.item.value);
    } else {
      itemStack.quantity -= quantity;
      this.fixIdByStack(itemStack);
      this.characterService.characterState.updateMoney(quantity * itemStack.item.value);
    }
  }

  sellAll(item: Item) {
    // can't sell in hell
    if (this.hellService?.inHell) {
      return;
    }

    for (const itemIterator of this.itemStacks) {
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
    if (!this.autoSellUnlocked) {
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

  usePouchItem(limit: number = -1) {
    // use pouch items if needed
    for (let i = 0; i < this.characterService.characterState.itemPouches.length; i++) {
      const itemStack = this.characterService.characterState.itemPouches[i];
      if (itemStack.item?.type === 'potion') {
        // @ts-ignore
        const effect: StatusType = itemStack.item.effect;
        if (
          this.characterService.characterState.status[effect].value <
          this.characterService.characterState.status[effect].max
        ) {
          const amountToHeal =
            this.characterService.characterState.status[effect].max -
            this.characterService.characterState.status[effect].value;
          const restoreAmount = itemStack.item.increaseAmount || 1;
          let numberToUse = Math.ceil(amountToHeal / restoreAmount);
          if (limit > 0 && numberToUse > limit) {
            numberToUse = limit;
          }
          if (itemStack.quantity > numberToUse) {
            this.characterService.characterState.status[effect].value =
              this.characterService.characterState.status[effect].max;
            itemStack.quantity -= numberToUse;
          } else {
            this.characterService.characterState.status[effect].value += restoreAmount * itemStack.quantity;
            this.characterService.characterState.itemPouches[i] = this.getEmptyItemStack();
          }
        }
      }
    }
  }

  useItemStack(itemStack: ItemStack, quantity = 1): void {
    if (!itemStack.item) {
      return;
    }
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    if (quantity > itemStack.quantity) {
      quantity = itemStack.quantity;
    }
    this.useItem(itemStack.item, quantity);
    if (itemStack.item.useConsumes) {
      itemStack.quantity -= quantity;
      if (itemStack.quantity <= 0) {
        const index = this.itemStacks.indexOf(itemStack);
        this.setItemEmptyStack(index);
      } else {
        this.fixIdByStack(itemStack);
      }
    }
  }

  useItem(item: Item, quantity = 1): void {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    if (item.type === 'food') {
      this.lifetimeUsedFood++;
      this.eatFood(item, quantity);
      return;
    } else {
      this.lifetimeUsedItems++;
    }
    if (item.type === 'potion') {
      this.usePotion(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.type === 'pill') {
      this.usePill(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.use) {
      item.use(quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
      if (item.type === 'food') {
        if (this.hellService) {
          this.hellService.daysFasted = 0;
        }
      }
    }
  }

  autoUse(item: Item) {
    if ((!this.autoUseUnlocked && item.type !== 'food') || (!this.autoEatUnlocked && item.type === 'food')) {
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
      for (let i = 0; i < this.itemStacks.length; i++) {
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
        for (let i = 0; i < this.characterService.characterState.itemPouches.length; i++) {
          if (this.characterService.characterState.itemPouches[i].item?.name === item.name) {
            this.characterService.characterState.itemPouches[i].quantity += itemStack.quantity;
            this.setItemEmptyStack(index);
            return;
          }
        }
        // didn't find a stack of the same name, add it if we can
        for (let i = 0; i < this.characterService.characterState.itemPouches.length; i++) {
          if (!this.characterService.characterState.itemPouches[i].item) {
            this.moveToPouch(index, i);
            return;
          }
        }
      }

      return;
    }

    const itemToEquip = this.characterService.characterState.equipment[item.slot];
    if (itemToEquip) {
      this.addItem(itemToEquip);
    }
    this.characterService.characterState.equipment[item.slot] = item;
    const index = this.itemStacks.indexOf(itemStack);
    this.setItemEmptyStack(index);
  }

  equipBest(slot: EquipmentPosition) {
    let equippedPower = 0;
    let weapon = true;
    if (slot === 'leftHand' || slot === 'rightHand') {
      equippedPower = this.characterService.characterState.equipment[slot]?.weaponStats?.baseDamage || 0;
    } else {
      weapon = false;
      equippedPower = this.characterService.characterState.equipment[slot]?.armorStats?.defense || 0;
    }
    for (let i = 0; i < this.itemStacks.length; i++) {
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

  consume(consumeType: string, quantity = 1, cheapest = false): number {
    if (quantity < 0) {
      quantity = 0; //handle potential negatives just in case. 0 is okay to do an item check without consuming.
    }
    let itemValue = -1;
    if (cheapest) {
      itemValue = Infinity;
    }

    let itemIndex = -1;
    for (let i = 0; i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.type === consumeType) {
        if (cheapest) {
          if (itemValue > itemIterator.item.value) {
            itemValue = itemIterator.item.value;
            itemIndex = i;
          }
        } else {
          if (itemValue < itemIterator.item.value) {
            itemValue = itemIterator.item.value;
            itemIndex = i;
          }
        }
      }
    }
    if (itemIndex >= 0) {
      const itemIterator = this.itemStacks[itemIndex];
      if (itemIterator.item) {
        const minQuantity = Math.min(itemIterator.quantity, quantity);
        itemIterator.quantity -= minQuantity;
        quantity -= minQuantity;
        if (itemIterator.quantity <= 0) {
          //remove the stack if empty
          this.setItemEmptyStack(itemIndex);
        } else {
          this.fixId(itemIndex);
        }
      }
    }
    if (quantity > 0 && itemIndex >= 0) {
      // we didn't have enough in the stack we consumed to meet the quantity, consume another
      itemValue = this.consume(consumeType, quantity);
    }
    if (cheapest && itemValue === Infinity) {
      // return -1 for not found
      itemValue = -1;
    }

    return itemValue;
  }

  consumeById(consumeId: string, quantity = 1) {
    if (quantity < 0) {
      quantity = 0; //handle potential negatives just in case. 0 is okay to do an item check without consuming.
    }
    let itemIndex = -1;
    let numberConsumed = 0;
    for (let i = 0; i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.id === consumeId) {
        itemIndex = i;
      }
    }
    if (itemIndex < 0) {
      return 0;
    }
    const itemIterator = this.itemStacks[itemIndex];
    if (itemIterator.item) {
      const minQuantity = Math.min(itemIterator.quantity, quantity);
      itemIterator.quantity -= minQuantity;
      quantity -= minQuantity;
      numberConsumed += minQuantity;
      if (itemIterator.quantity <= 0) {
        //remove the stack if empty
        this.setItemEmptyStack(itemIndex);
      } else {
        this.fixId(itemIndex);
      }
    }
    if (quantity > 0 && itemIndex >= 0) {
      // we didn't have enough in the stack we consumed to meet the quantity, consume another
      numberConsumed += this.consumeById(consumeId, quantity);
    }
    return numberConsumed;
  }

  checkFor(itemType: string): number {
    let itemValue = -1;
    for (let i = 0; i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.type === itemType) {
        if (itemValue < itemIterator.item.value) {
          itemValue = itemIterator.item.value;
        }
      }
    }
    return itemValue;
  }

  getQuantityByName(itemName: string): number {
    let itemCount = 0;
    for (let i = 0; i < this.itemStacks.length; i++) {
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
    for (let i = 0; i < this.itemStacks.length; i++) {
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
    // TODO: make the type checking on the string conversion right
    // @ts-ignore
    this.characterService.characterState.status[effect].value += (potion.increaseAmount || 1) * quantity;
    this.characterService.characterState.checkOverage();
  }

  /** A special use function for generated pills*/
  usePill(pill: Item, quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePillsUsed += quantity;
    if (pill.effect === 'longevity') {
      this.characterService.characterState.alchemyLifespan += (pill.increaseAmount || 1) * quantity;
      if (this.characterService.characterState.alchemyLifespan > 36500) {
        this.characterService.characterState.alchemyLifespan = 36500;
      }
    } else if (pill.effect === 'empowerment') {
      this.characterService.characterState.empowermentFactor += 0.01;
    } else {
      // effect should be an attribute
      let effect = 'strength';
      if (pill.effect) {
        effect = pill.effect;
      }
      // TODO: make the type checking on the string conversion right
      // @ts-ignore
      this.characterService.characterState.attributes[effect].value += (pill.increaseAmount || 1) * quantity;
    }
    this.characterService.characterState.checkOverage();
  }

  /** Returns the number of open inventory slots. */
  openInventorySlots() {
    let openSlots = 0;
    for (const itemIterator of this.itemStacks) {
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
          item1.weaponStats?.effect
        )
      );
    } else {
      inventoryIndex = this.addItem(
        this.generateArmor(item1.value + item2.value, item1.slot, item1.armorStats?.baseName, item1.armorStats?.effect)
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
    for (let i = 0; i < this.itemStacks.length; i++) {
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
    const equippedItem = this.characterService.characterState.equipment[slot];
    if (!equippedItem) {
      return;
    }
    if (itemToMerge.type === 'gem' && equippedItem) {
      this.gemifyEquipment(sourceItemIndex, equippedItem);
      return;
    }
    if (!instanceOfEquipment(itemToMerge)) {
      return;
    }
    let newItem;
    if (!equippedItem) {
      this.characterService.characterState.equipment[slot] = itemToMerge;
      this.setItemEmptyStack(sourceItemIndex);
      return;
    }
    if (slot === 'rightHand' || slot === 'leftHand') {
      newItem = this.generateWeapon(
        equippedItem.value + itemToMerge.value,
        itemToMerge.weaponStats?.material + '',
        equippedItem.weaponStats?.baseName,
        equippedItem.weaponStats?.effect
      );
    } else {
      newItem = this.generateArmor(
        equippedItem.value + itemToMerge.value,
        slot,
        equippedItem.armorStats?.baseName,
        equippedItem.armorStats?.effect
      );
    }
    this.characterService.characterState.equipment[slot] = newItem;
    this.setItemEmptyStack(sourceItemIndex);
  }

  mergeSpiritGem(stack: ItemStack, power = 0) {
    if (!stack.item) {
      return;
    }
    if (stack.quantity < 10 - power) {
      return;
    }
    stack.quantity -= 10 - power;
    this.addItem(this.generateSpiritGem(stack.item.value / 10 + 1));
    // go find the stack and remove it or update the id
    for (let i = 0; i < this.itemStacks.length; i++) {
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

  mergeAnySpiritGem(power = 0) {
    const meridianRank = this.characterService.meridianRank();
    if (power > meridianRank - 5) {
      power = meridianRank - 5;
    }
    if (power < 0) {
      power = 0;
    }
    for (let i = 0; i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator.item) {
        continue;
      }
      if (itemIterator.item.type === 'gem' && itemIterator.quantity >= 10 - power) {
        this.mergeSpiritGem(itemIterator, power);
        return;
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
      if (item && item.type !== 'food' && item.type !== 'gem') {
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

  gemifyEquipment(gemIndex: number, equipment: Equipment) {
    const gemStack = this.itemStacks[gemIndex];
    const gem = this.itemStacks[gemIndex]?.item;
    if (gemStack && gem && gem.type === 'gem') {
      const gemFlavor = gem.type.substring(0, gem.type.length - 3);
      // TODO: add gemFlavor effects
      this.upgradeEquipment(equipment, Math.floor(Math.pow(gem.value / 10, 2.4)), gemFlavor);
      this.updateArmorDescription(equipment);
      if (gemStack.quantity > 1) {
        gemStack.quantity--;
        this.fixId(gemIndex);
      } else {
        this.setItemEmptyStack(gemIndex);
      }
      this.characterService.characterState.yang++;
      this.characterService.characterState.yin++;
    }
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
    for (let i = 0; i < this.characterService.characterState.itemPouches.length; i++) {
      if (itemStack === this.characterService.characterState.itemPouches[i]) {
        itemStack.id =
          i +
          this.characterService.characterState.itemPouches[i].item!.name +
          this.characterService.characterState.itemPouches[i].quantity;
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
    if (this.characterService.characterState.itemPouches[pouchIndex].item) {
      if (
        this.characterService.characterState.itemPouches[pouchIndex].item?.name ===
        this.itemStacks[itemIndex].item?.name
      ) {
        // same item type, dump the quantity into the pouch
        this.characterService.characterState.itemPouches[pouchIndex].quantity += this.itemStacks[itemIndex].quantity;
        this.itemStacks[itemIndex] = this.getEmptyItemStack();
        return;
      }
      // swap the pouch item with the inventory item
      const temp = this.itemStacks[itemIndex];
      this.itemStacks[itemIndex] = this.characterService.characterState.itemPouches[pouchIndex];
      this.characterService.characterState.itemPouches[pouchIndex] = temp;
      this.characterService.characterState.itemPouches[pouchIndex].id =
        pouchIndex +
        this.characterService.characterState.itemPouches[pouchIndex].item!.name +
        this.characterService.characterState.itemPouches[pouchIndex].quantity;
      this.fixId(itemIndex);
    } else {
      // nothing there now, just put the inventory item in the pouch
      this.characterService.characterState.itemPouches[pouchIndex] = this.itemStacks[itemIndex];
      this.characterService.characterState.itemPouches[pouchIndex].id =
        pouchIndex +
        this.characterService.characterState.itemPouches[pouchIndex].item!.name +
        this.characterService.characterState.itemPouches[pouchIndex].quantity;
      this.itemStacks[itemIndex] = this.getEmptyItemStack();
    }
  }
}

export function instanceOfEquipment(object: Item): object is Equipment {
  return 'slot' in object;
}
