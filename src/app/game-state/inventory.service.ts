import { Injectable, Injector } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { EquipmentPosition, AttributeType } from './character';
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
  herbNames,
  herbQuality,
  ChestArmorNames,
  LegArmorNames,
  ShoeNames,
  HelmetNames,
} from './itemResources';
import { FurniturePosition } from './home.service';
import { BigNumberPipe } from '../app.component';
import { HellService } from './hell.service';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  durability: number;
  baseName?: string;
  effect?: string;
}

export interface ArmorStats {
  defense: number;
  material: string;
  durability: number;
  baseName?: string;
  effect?: string;
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
  use?: (quantity?: number) => void;
  /** Used for single-use permanent upgrades so we can see if they need to be bought again */
  owned?: () => boolean;
  imageFile?: string;
  imageColor?: string;
}

export interface Equipment extends Item {
  slot: EquipmentPosition;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
}

export interface Potion extends Item {
  attribute: AttributeType;
  increase: number;
}

export interface Pill extends Item {
  effect: string;
  power: number;
}

export interface Furniture extends Item {
  slot: FurniturePosition;
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

export interface AutoItemEntry {
  name: string;
  reserve: number;
}

export interface InventoryProperties {
  itemStacks: (ItemStack | null)[];
  stashedItemStacks: (ItemStack | null)[];
  autoSellUnlocked: boolean;
  autoSellEntries: AutoItemEntry[];
  autoUseUnlocked: boolean;
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
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  hellService?: HellService;
  bigNumberPipe: BigNumberPipe;
  itemStacks: (ItemStack | null)[] = [];
  stashedItemStacks: (ItemStack | null)[] = [];
  maxItems = 10;
  maxStackSize = 100;
  noFood: boolean;
  selectedItem: ItemStack | null = null;
  autoSellUnlocked: boolean;
  autoSellEntries: AutoItemEntry[];
  autoUseUnlocked: boolean;
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
  fed = false;
  lifetimeUsedItems = 0;
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
  durabilityDisclaimer =
    "\nThe durability and value of equipment degrades with use. Be careful when merging powerful items that have seen a lot of wear, the product may be even lower quality than the original if the item's value is low.";

  constructor(
    private injector: Injector,
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService,
    private titleCasePipe: TitleCasePipe
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));
    this.bigNumberPipe = this.injector.get(BigNumberPipe);
    this.noFood = false;
    this.autoSellUnlocked = false;
    this.autoSellEntries = [];
    this.autoUseUnlocked = false;
    this.autoUseEntries = [];
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

    for (let i = 0; i < this.maxItems; i++) {
      this.itemStacks.push(null);
    }

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead) {
        return;
      }
      this.eatFood();
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
        if (itemStack) {
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

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  getProperties(): InventoryProperties {
    return {
      itemStacks: this.itemStacks,
      stashedItemStacks: this.stashedItemStacks,
      autoSellUnlocked: this.autoSellUnlocked,
      autoSellEntries: this.autoSellEntries,
      autoUseUnlocked: this.autoUseUnlocked,
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
    };
  }

  setProperties(properties: InventoryProperties) {
    this.itemStacks = properties.itemStacks;
    this.stashedItemStacks = properties.stashedItemStacks || [];
    this.autoSellUnlocked = properties.autoSellUnlocked || false;
    this.autoSellEntries = properties.autoSellEntries || [];
    this.autoUseUnlocked = properties.autoUseUnlocked || false;
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
    for (const itemStack of this.itemStacks) {
      if (itemStack && itemStack.item.name.includes('monster gem')) {
        itemStack.item.name = itemStack.item.name.replace('monster gem', 'spirit gem');
      }
    }
    this.equipmentUnlocked = properties.equipmentUnlocked || false;
    this.equipmentCreated = properties.equipmentCreated || 0;
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
      this.itemStacks.push(null);
    }
  }

  sortInventory() {
    const tempStacks: ItemStack[] = [];
    const gemStacks: ItemStack[] = [];
    const equipStacks: ItemStack[] = [];
    for (let key = 0; key < this.itemStacks.length; key++) {
      const itemStack = this.itemStacks[key];
      if (!itemStack) {
        continue;
      } else if (this.itemStacks[key]?.item.type === 'spiritGem') {
        gemStacks.push(itemStack);
      } else if (this.itemStacks[key]?.item.type === 'equipment') {
        equipStacks.push(itemStack);
      } else {
        tempStacks.push(itemStack);
      }
    }
    if (!this.descendingSort) {
      tempStacks.sort((a, b) => b.quantity - a.quantity);
      tempStacks.sort((a, b) => b.item.value - a.item.value);
      tempStacks.sort((a, b) => (b.item.type > a.item.type ? -1 : b.item.type === a.item.type ? 0 : 1));
      equipStacks.sort((a, b) => (b.item.name > a.item.name ? -1 : b.item.name === a.item.name ? 0 : 1));
      equipStacks.sort((a, b) => b.item.value - a.item.value);
      gemStacks.sort((a, b) => b.quantity - a.quantity);
      gemStacks.sort((a, b) => b.item.value - a.item.value);
    } else {
      tempStacks.sort((b, a) => b.quantity - a.quantity);
      tempStacks.sort((b, a) => b.item.value - a.item.value);
      tempStacks.sort((b, a) => (b.item.type > a.item.type ? -1 : b.item.type === a.item.type ? 0 : 1));
      equipStacks.sort((b, a) => (b.item.name > a.item.name ? -1 : b.item.name === a.item.name ? 0 : 1));
      equipStacks.sort((b, a) => b.item.value - a.item.value);
      gemStacks.sort((b, a) => b.quantity - a.quantity);
      gemStacks.sort((b, a) => b.item.value - a.item.value);
    }
    const emptySlots = this.itemStacks.length - tempStacks.length - gemStacks.length - equipStacks.length;
    this.itemStacks = tempStacks;
    this.itemStacks.push(...equipStacks);
    this.itemStacks.push(...gemStacks);
    for (let i = 0; i < emptySlots; i++) {
      this.itemStacks.push(null);
    }
  }

  // materials are wood or metal
  generateWeapon(
    grade: number,
    material: string,
    useGemOkay: boolean,
    defaultName: string | undefined = undefined,
    effect: string | undefined = undefined
  ): Equipment {
    this.equipmentCreated++;
    if (this.useSpiritGemUnlocked && this.useSpiritGemWeapons && useGemOkay) {
      // consume a spirit gem and increase the grade
      const value = this.consume('spiritGem', 1, this.useCheapestSpiritGem);
      if (value > 0) {
        grade = Math.floor(Math.pow(grade, 1 + value / 400));
      }
    }
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
    const durability = grade * 15;
    const damage = Math.max(Math.sqrt(grade), 1000) * grade;
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
        durability: durability,
        baseName: baseName,
        effect: effect,
      },
      description:
        'A unique weapon made of ' +
        material +
        '. Drag and drop onto similar weapons to merge them into something better.\nBase Damage: ' +
        this.bigNumberPipe.transform(damage) +
        '\nDurability: ' +
        this.bigNumberPipe.transform(durability) +
        '\nValue: ' +
        this.bigNumberPipe.transform(grade) +
        this.durabilityDisclaimer,
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
      '. Drag and drop onto similar weapons to merge them into something better.\nBase Damage: ' +
      this.bigNumberPipe.transform(weapon.weaponStats.baseDamage) +
      '\nDurability: ' +
      this.bigNumberPipe.transform(weapon.weaponStats.durability) +
      '\nValue: ' +
      this.bigNumberPipe.transform(weapon.value) +
      this.durabilityDisclaimer;
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
      'A unique piece of armor made of ' +
      armor.armorStats.material +
      effectString +
      '. Drag and drop onto similar armor to merge them into something better.\nDefense: ' +
      this.bigNumberPipe.transform(armor.armorStats.defense) +
      '\nDurability: ' +
      this.bigNumberPipe.transform(armor.armorStats.durability) +
      '\nValue: ' +
      this.bigNumberPipe.transform(armor.value) +
      this.durabilityDisclaimer;
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
      equipment.armorStats.durability += value;
      equipment.armorStats.defense += Math.max(Math.sqrt(value), 1000) * value;
      if (newEffect !== 'spirit') {
        equipment.armorStats.effect = newEffect;
      }
    } else if (equipment.weaponStats) {
      equipment.weaponStats.durability += value;
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

  generatePotion(grade: number, masterLevel: boolean): void {
    if (this.useSpiritGemUnlocked && this.useSpiritGemPotions) {
      // consume a spirit gem and increase the grade
      const value = this.consume('spiritGem', 1, this.useCheapestSpiritGem);
      if (value > 0) {
        grade += value;
      }
      if (value > 0 || masterLevel) {
        if (Math.random() < 0.1) {
          //non-master alch can generate pills, if using a spirit gem
          this.generatePill(grade);
          return;
        }
      }
    } else if (masterLevel) {
      if (Math.random() < 0.1) {
        this.generatePill(grade);
        return;
      }
    }

    const keys = Object.keys(this.characterService.characterState.attributes) as AttributeType[];
    // randomly choose any of the first five stats
    const key = keys[Math.floor(Math.random() * 5)];
    const name = 'Potion of ' + key + ' +' + grade;
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
      description: 'A potion that increases ' + key,
      useLabel: 'Drink',
      useDescription: 'Drink to increase your ' + key + '.',
      useConsumes: true,
      attribute: key,
      increase: grade,
    } as Potion);
  }

  generatePill(grade: number): void {
    let effect = 'Longevity'; // add more later
    let description = 'A pill that increases your lifespan.';
    let useDescription = 'Use to increase your lifespan.';
    let value = grade * 10;
    let name = effect + ' Pill ' + ' +' + grade;
    let imageFileName = 'pill';
    if (this.checkFor('pillBox') > 0 && this.checkFor('pillMold') > 0 && this.checkFor('pillPouch') > 0) {
      this.consume('pillBox');
      this.consume('pillMold');
      this.consume('pillPouch');
      effect = 'Empowerment';
      description = 'A pill that permanently empowers the increase of your attributes based on your aptitudes.';
      useDescription = 'Use to permanently empower the increase of your attributes based on your aptitudes.';
      value = 1;
      name = 'Empowerment Pill';
      imageFileName = 'empowermentPill';
      this.logService.log(
        LogTopic.CRAFTING,
        'Alchemy Success! Created a ' +
          this.titleCasePipe.transform(name) +
          '. Its effect gets worse the more you take.'
      );
    } else {
      this.logService.log(
        LogTopic.CRAFTING,
        'Alchemy Success! Created a ' + this.titleCasePipe.transform(name) + '. Keep up the good work.'
      );
    }
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
      power: grade,
    } as Pill);
  }

  generateHerb(): void {
    let grade = 0;
    const maxGrade = herbNames.length * herbQuality.length;
    const woodLore = this.characterService.characterState.attributes.woodLore.value;
    grade = Math.floor(Math.pow(woodLore / 1e9, 0.26) * maxGrade); // 1e9 woodlore is maximum grade, adjust if necessary
    let name: string;
    let quality: string;
    if (grade >= maxGrade) {
      // maxed out
      name = herbNames[herbNames.length - 1];
      quality = herbQuality[herbQuality.length - 1];
    } else {
      const nameIndex = grade % herbNames.length;
      const qualityIndex = Math.floor(grade / herbNames.length);
      name = herbNames[nameIndex];
      quality = herbQuality[qualityIndex];
    }
    const value = grade + 1;
    const herbName = quality + ' ' + name;
    this.addItem({
      id: 'herb',
      imageFile: 'herb',
      name: herbName,
      type: 'ingredient',
      value: value,
      description: 'Useful herbs. Can be used in creating pills or potions.',
    });
    if (this.autoSellOldHerbsEnabled) {
      // sell any herb cheaper than what we just picked
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.id === 'herb') {
          if (itemStack.item.value < value && itemStack.item.name !== herbName) {
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
      type: flavor + 'Gem',
      value: grade * 10,
      description: description,
    };
  }

  generateArmor(
    grade: number,
    material: string,
    slot: EquipmentPosition,
    useGemOkay: boolean,
    defaultName: string | undefined = undefined,
    effect: string | undefined = undefined
  ): Equipment {
    this.equipmentCreated++;
    if (this.useSpiritGemUnlocked && this.useSpiritGemWeapons && useGemOkay) {
      // consume a spirit gem and increase the grade
      const value = this.consume('spiritGem', 1, this.useCheapestSpiritGem);
      if (value > 0) {
        grade = Math.floor(Math.pow(grade, 1 + value / 400));
      }
    }
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
    const durability = grade * 10;
    const defense = Math.max(Math.sqrt(grade), 1000) * grade;
    return {
      id: 'armor',
      imageFile: imageFileName,
      name: name,
      type: 'equipment',
      slot: slot,
      value: grade,
      armorStats: {
        defense: defense,
        material: material,
        durability: durability,
        baseName: baseName,
        effect: effect,
      },
      description:
        'A unique piece of armor made of ' +
        material +
        '. Drag and drop onto similar armor to merge them into something better.\nDefense: ' +
        this.bigNumberPipe.transform(defense) +
        '\nDurability: ' +
        this.bigNumberPipe.transform(durability) +
        '\nValue: ' +
        this.bigNumberPipe.transform(grade) +
        this.durabilityDisclaimer,
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

  getOre(): Item {
    const earthLore = this.characterService.characterState.attributes.earthLore.value;
    const oreValue = Math.floor(Math.pow(earthLore / 1e9, 0.15) * 16); // 1e9 earthlore is maximum value (16), adjust if necessary
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
        if (itemStack && itemStack.item.type === 'ore' && itemStack.item.value < lastOre.value) {
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
        if (itemStack && itemStack.item.type === 'metal' && itemStack.item.value < lastMetal.value) {
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
        if (itemStack && itemStack.item.type === 'wood' && itemStack.item.value < lastWood.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }
    return lastWood;
  }

  getHide(): Item {
    const animalHandling = this.characterService.characterState.attributes.animalHandling.value;
    const hideValue = Math.floor(Math.pow(animalHandling / 1e9, 0.15) * 16);

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
        if (itemStack && itemStack.item.type === 'hide' && itemStack.item.value < lastHide.value) {
          this.sell(itemStack, itemStack.quantity);
        }
      }
    }

    return lastHide;
  }

  reset(): void {
    this.selectedItem = null;
    this.lifetimeUsedItems = 0;
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
          durability: 100,
          baseName: "Grandmother's Walking Stick",
        },
        description:
          "Your grandmother's walking stick. Drag and drop onto similar weapons to merge them into something better.\nBase Damage: 10\nDurability: 100\nValue: 10" +
          this.durabilityDisclaimer,
      };
      this.addItem(stick);
    }

    if (this.characterService.characterState.bloodlineRank >= 6) {
      return; // Skip the rice gift, thematically inappropriate
    }
    if (this.motherGift) {
      this.logService.log(
        LogTopic.EVENT,
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.'
      );
      this.addItem(this.itemRepoService.items['rice'], 300);
    }
  }

  /** Finds the best food in the inventory and uses it. */
  eatFood(): void {
    if (this.fed) {
      // we already ate something this tick
      this.noFood = false;
      this.fed = false;
      return;
    }
    let foodStack = null;
    const foodValue = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator === null) {
        continue;
      }
      if (itemIterator.item.type === 'food' && itemIterator.item.value > foodValue) {
        foodStack = itemIterator;
      }
    }
    if (foodStack) {
      this.useItemStack(foodStack);
      this.noFood = false;
    } else {
      // no food found, buy a bowl of rice automatically
      this.noFood = true;
      if (!this.hellService?.inHell && this.characterService.characterState.money > 0 && this.autoBuyFood) {
        this.characterService.characterState.updateMoney(-1);
        this.characterService.characterState.status.nourishment.value++;
      }
    }
    this.fed = false;
  }

  /**
   *
   * @param item the Item to add
   * @param quantity the quantity the Item to stack. Ignores for unstackables. Default 1
   * @param inventoryIndex the first inventory slot to try to put the item in
   * @returns first itemStack position, -1 if not applicable
   */
  addItem(item: Item, quantity = 1, inventoryIndex = 0): number {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
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
    if (this.autoSellOldGemsEnabled && item.type === 'spiritGem' && !this.hellService?.inHell) {
      //clear out any old gems of lesser value
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.type === 'spiritGem' && itemStack.item.value < item.value) {
          this.characterService.characterState.updateMoney(itemStack.item.value * itemStack.quantity);
          this.itemStacks[i] = null;
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
        if (!itemIterator) {
          continue;
        }
        if (itemIterator.item.name === item.name) {
          if (itemIterator.quantity + quantity <= this.maxStackSize) {
            // it matches an existing item and there's room in the stack for everything, add it to the stack and bail out
            itemIterator.quantity += quantity;
            if (firstStack === -1) {
              firstStack = i;
            }
            return firstStack;
          } else {
            if (firstStack === -1) {
              firstStack = i;
            }
            quantity -= this.maxStackSize - itemIterator.quantity;
            itemIterator.quantity = this.maxStackSize;
          }
        }
      }
    }

    // couldn't stack it all, make a new stack
    for (let i = inventoryIndex; i < this.itemStacks.length; i++) {
      if (this.itemStacks[i] === null) {
        if (firstStack === -1) {
          firstStack = i;
        }
        if (quantity <= this.maxStackSize) {
          this.itemStacks[i] = { item: item, quantity: quantity };
          return firstStack;
        } else {
          this.itemStacks[i] = { item: item, quantity: this.maxStackSize };
          quantity -= this.maxStackSize;
        }
      }
    }

    // if we're here we didn't find a slot for anything/everything.
    if (this.autoSellUnlocked && !this.hellService?.inHell) {
      this.logService.log(
        LogTopic.EVENT,
        "You don't have enough room for the " + this.titleCasePipe.transform(item.name) + ' so you sold it.'
      );
      this.characterService.characterState.updateMoney(item.value * quantity);
    } else {
      this.logService.log(
        LogTopic.EVENT,
        "You don't have enough room for the " + this.titleCasePipe.transform(item.name) + ' so you threw it away.'
      );
    }
    this.thrownAwayItems += quantity;
    return firstStack;
  }

  sell(itemStack: ItemStack, quantity: number): void {
    if (itemStack.item.value === Infinity) {
      // don't sell infinitely valuable things.
      return;
    }
    // can't sell in hell
    if (this.hellService?.inHell) {
      return;
    }
    this.lifetimeSoldItems += quantity;
    if (itemStack.item.type === 'spiritGem') {
      this.lifetimeGemsSold += quantity;
    }
    const index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks[index] = null;
      this.characterService.characterState.updateMoney(itemStack.quantity * itemStack.item.value);
      if (itemStack === this.selectedItem) {
        this.selectedItem = null;
      }
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.updateMoney(quantity * itemStack.item.value);
    }
  }

  sellAll(item: Item) {
    // can't sell in hell
    if (this.hellService?.inHell) {
      return;
    }

    for (const itemIterator of this.itemStacks) {
      if (itemIterator === null) {
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
      this.autoSellEntries.push({ name: item.name, reserve: 0 });
    }
    //sell all that you currently have
    this.sellAll(item);
  }

  unAutoSell(itemName: string) {
    const index = this.autoSellEntries.findIndex(item => item.name === itemName);
    this.autoSellEntries.splice(index, 1);
  }

  useItemStack(itemStack: ItemStack, quantity = 1): void {
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
        this.itemStacks[index] = null;
        if (itemStack === this.selectedItem) {
          this.selectedItem = null;
        }
      }
    }
  }

  useItem(item: Item, quantity = 1): void {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimeUsedItems++;
    if (item.type === 'potion' && instanceOfPotion(item)) {
      this.usePotion(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.type === 'pill' && instanceOfPill(item)) {
      this.usePill(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.use) {
      item.use(quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
      if (item.type === 'food') {
        this.fed = true;
        if (this.hellService) {
          this.hellService.daysFasted = 0;
        }
      }
    }
  }

  autoUse(item: Item) {
    if (!this.autoUseUnlocked) {
      return;
    }
    if (item.type !== 'potion' && item.type !== 'pill' && !item.use) {
      // it's not usable, bail out.
      return;
    }
    if (!this.autoUseEntries.some(e => e.name === item.name)) {
      this.autoUseEntries.push({ name: item.name, reserve: 0 });
    }
    if (item.useConsumes) {
      // use all the ones you have now
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (!itemStack) {
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

    if (!instanceOfEquipment(item)) {
      // it's not equipable, bail out
      return;
    }

    if ((item.armorStats?.durability || 0) <= 0 && (item.weaponStats?.durability || 0) <= 0) {
      //it's broken, bail out
      this.logService.log(LogTopic.EVENT, 'You tried to equip some broken equipment, but it was broken.');
      return;
    }

    const itemToEquip = this.characterService.characterState.equipment[item.slot];
    if (itemToEquip) {
      this.addItem(itemToEquip);
    }
    this.characterService.characterState.equipment[item.slot] = item;
    const index = this.itemStacks.indexOf(itemStack);
    this.itemStacks[index] = null;
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
      if (itemIterator) {
        const item = itemIterator.item;
        if (instanceOfEquipment(item) && item.slot === slot) {
          let itemPower = 0;
          if (weapon && item.weaponStats && item.weaponStats?.durability > 0) {
            itemPower = item.weaponStats?.baseDamage;
          } else if (!weapon && item.armorStats && item.armorStats?.durability > 0) {
            itemPower = item.armorStats?.defense;
          } else {
            // the weapon is broken, skip it
            continue;
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
      if (!itemIterator) {
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
      if (itemIterator !== null) {
        const minQuantity = Math.min(itemIterator.quantity, quantity);
        itemIterator.quantity -= minQuantity;
        quantity -= minQuantity;
        if (itemIterator.quantity <= 0) {
          //remove the stack if empty
          this.itemStacks[itemIndex] = null;
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

  checkFor(itemType: string): number {
    let itemValue = -1;
    for (let i = 0; i < this.itemStacks.length; i++) {
      const itemIterator = this.itemStacks[i];
      if (!itemIterator) {
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
      if (!itemIterator) {
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
      if (!itemIterator) {
        continue;
      }
      if (itemIterator.item.type === itemType) {
        itemCount += itemIterator.quantity;
      }
    }
    return itemCount;
  }

  /** Checks for equipment durability. Returns false if equipment has 0 durability. */
  hasDurability(itemStack: ItemStack): boolean {
    const item = itemStack.item;

    if (!instanceOfEquipment(item)) return true;

    return (item.armorStats?.durability || 0) > 0 || (item.weaponStats?.durability || 0) > 0;
  }

  /** A special use function for generated potions. */
  usePotion(potion: Potion, quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePotionsUsed += quantity;
    this.characterService.characterState.attributes[potion.attribute].value += potion.increase * quantity;
  }

  /** A special use function for generated pills*/
  usePill(pill: Pill, quantity = 1) {
    if (quantity < 1) {
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePillsUsed += quantity;
    if (pill.effect === 'Longevity') {
      this.characterService.characterState.alchemyLifespan += pill.power * quantity;
      if (this.characterService.characterState.alchemyLifespan > 36500) {
        this.characterService.characterState.alchemyLifespan = 36500;
      }
    } else if (pill.effect === 'Empowerment') {
      this.characterService.characterState.empowermentFactor += 0.01;
    }
    this.characterService.characterState.checkOverage();
  }

  /** Returns the number of open inventory slots. */
  openInventorySlots() {
    let openSlots = 0;
    for (const itemIterator of this.itemStacks) {
      if (!itemIterator) {
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
          false,
          item1.weaponStats?.baseName,
          item1.weaponStats?.effect
        )
      );
    } else {
      inventoryIndex = this.addItem(
        this.generateArmor(
          item1.value + item2.value,
          item1.armorStats?.material + '',
          item1.slot,
          false,
          item1.armorStats?.baseName,
          item1.armorStats?.effect
        )
      );
    }
    // if we can, move the new item to the desired destination index
    if (inventoryIndex !== destinationInventoryIndex && !this.itemStacks[destinationInventoryIndex]) {
      this.itemStacks[destinationInventoryIndex] = this.itemStacks[inventoryIndex];
      this.itemStacks[inventoryIndex] = null;
    }
  }

  mergeItemStacks(sourceStack: ItemStack, destStack: ItemStack, sourceInventoryIndex: number) {
    if (
      sourceStack &&
      destStack &&
      sourceStack.item.name === destStack.item.name &&
      sourceStack.quantity + destStack.quantity < this.maxStackSize
    ) {
      destStack.quantity += sourceStack.quantity;
      this.itemStacks[sourceInventoryIndex] = null;
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
                if (
                  this.selectedItem === this.itemStacks[mergeDestinationIndex] ||
                  this.selectedItem === this.itemStacks[i]
                ) {
                  this.selectedItem = null;
                }
                this.itemStacks[mergeDestinationIndex] = null;
                this.itemStacks[i] = null;
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
    if (itemToMerge.type.includes('Gem') && equippedItem) {
      this.gemifyEquipment(sourceItemIndex, equippedItem);
      return;
    }
    if (!instanceOfEquipment(itemToMerge)) {
      return;
    }
    let newItem;
    if (!equippedItem) {
      this.characterService.characterState.equipment[slot] = itemToMerge;
      this.itemStacks[sourceItemIndex] = null;
      return;
    }
    if (slot === 'rightHand' || slot === 'leftHand') {
      newItem = this.generateWeapon(
        equippedItem.value + itemToMerge.value,
        itemToMerge.weaponStats?.material + '',
        false,
        equippedItem.weaponStats?.baseName,
        equippedItem.weaponStats?.effect
      );
    } else {
      newItem = this.generateArmor(
        equippedItem.value + itemToMerge.value,
        itemToMerge.armorStats?.material + '',
        slot,
        false,
        equippedItem.armorStats?.baseName,
        equippedItem.armorStats?.effect
      );
    }
    this.characterService.characterState.equipment[slot] = newItem;
    this.itemStacks[sourceItemIndex] = null;
  }

  mergeSpiritGem(stack: ItemStack, power = 0) {
    if (stack.quantity < 10 - power) {
      return;
    }
    stack.quantity -= 10 - power;
    this.addItem(this.generateSpiritGem(stack.item.value / 10 + 1));
    if (stack.quantity === 0) {
      // go find the stack and remove it
      for (let i = 0; i < this.itemStacks.length; i++) {
        if (this.itemStacks[i] === stack) {
          this.itemStacks[i] = null;
          return;
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
      if (!itemIterator) {
        continue;
      }
      if (itemIterator.item.type === 'spiritGem' && itemIterator.quantity >= 10 - power) {
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
        this.itemStacks[i] = null;
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
        this.itemStacks[i] = null;
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
      if (item && item.type !== 'food' && !item.type.includes('Gem')) {
        this.stashedItemStacks.push(this.itemStacks[i]);
        this.itemStacks[i] = null;
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
    if (gemStack && gem && gem.type.includes('Gem')) {
      const gemFlavor = gem.type.substring(0, gem.type.length - 3);
      // TODO: add gemFlavor effects
      this.upgradeEquipment(equipment, Math.floor(Math.pow(gem.value / 10, 2.4)), gemFlavor);
      this.updateArmorDescription(equipment);
      if (gemStack.quantity > 1) {
        gemStack.quantity--;
      } else {
        this.itemStacks[gemIndex] = null;
      }
      if (this.characterService.characterState.yinYangUnlocked) {
        this.characterService.characterState.yang++;
        this.characterService.characterState.yin++;
      }
    }
  }

  removeItemStack(itemStack: ItemStack) {
    const index = this.itemStacks.indexOf(itemStack);
    this.thrownAwayItems += itemStack.quantity;
    this.itemStacks[index] = null;
  }
}

export function instanceOfEquipment(object: Item): object is Equipment {
  return 'slot' in object;
}

export function instanceOfPotion(object: Item): object is Potion {
  return 'attribute' in object;
}

export function instanceOfPill(object: Item): object is Pill {
  return 'effect' in object;
}

export function instanceOfFurniture(object: Item): object is Furniture {
  return 'slot' in object;
}
