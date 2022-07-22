import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { EquipmentPosition, AttributeType } from './character';
import { CharacterService } from './character.service';
import { ItemRepoService } from './item-repo.service';
import { WeaponNames, ItemPrefixes, WeaponSuffixes, WeaponSuffixModifiers, ArmorSuffixes, ArmorSuffixModifiers, herbNames, herbQuality, ChestArmorNames, LegArmorNames, ShoeNames, HelmetNames } from './itemResources';
import { FurniturePosition } from './home.service';

export interface WeaponStats {
  baseDamage: number;
  material: string;
  durability: number;
  baseName?: string;
}

export interface ArmorStats {
  defense: number;
  material: string;
  durability: number;
  baseName?: string;
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
  owned?: () => boolean; // used for single-use permanent upgrades so we can see if they need to be bought again
}

export interface Equipment extends Item {
  slot: EquipmentPosition;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
}

export interface Potion extends Item {
  attribute: AttributeType,
  increase: number
}

export interface Pill extends Item {
  effect: string,
  power: number
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

export interface AutoItemEntry {
  name: string;
  reserve: number;
}

export interface InventoryProperties {
  itemStacks: (ItemStack | null)[],
  autoSellUnlocked: boolean,
  autoSellEntries: AutoItemEntry[],
  autoUseUnlocked: boolean,
  autoUseEntries: AutoItemEntry[],
  autoBalanceUnlocked: boolean,
  autoBalanceItems: BalanceItem[],
  autoPotionUnlocked: boolean,
  autoPillUnlocked: boolean,
  autoWeaponMergeUnlocked: boolean,
  autoArmorMergeUnlocked: boolean,
  useSpiritGemUnlocked: boolean,
  useSpiritGemWeapons: boolean,
  useSpiritGemPotions: boolean,
  autoSellOldHerbs: boolean,
  autoSellOldWood: boolean,
  autoSellOldOre: boolean,
  autoequipBestWeapon: boolean,
  autoequipBestArmor: boolean,
  autoequipBestEnabled: boolean,
  maxStackSize: number,
  thrownAwayItems: number,
  autoSellOldGemsUnlocked: boolean,
  autoSellOldGemsEnabled: boolean,
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  itemStacks: (ItemStack | null)[] = [];
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
  autoWeaponMergeUnlocked: boolean;
  autoArmorMergeUnlocked: boolean;
  autoequipBestWeapon: boolean;
  autoequipBestArmor: boolean;
  autoequipBestEnabled = true;
  useSpiritGemUnlocked: boolean;
  useSpiritGemWeapons: boolean;
  useSpiritGemPotions: boolean;
  autoSellOldHerbs: boolean;
  autoSellOldWood: boolean;
  autoSellOldOre: boolean;
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

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
    this.noFood = false;
    this.autoSellUnlocked = false;
    this.autoSellEntries = [];
    this.autoUseUnlocked = false;
    this.autoUseEntries = [];
    this.autoBalanceUnlocked = false;
    this.autoBalanceItems = [];
    this.autoPotionUnlocked = false;
    this.autoPillUnlocked = false;
    this.autoWeaponMergeUnlocked = false;
    this.autoArmorMergeUnlocked = false;
    this.autoequipBestWeapon = false;
    this.autoequipBestArmor = false;

    this.useSpiritGemUnlocked = false;
    this.useSpiritGemWeapons = false;
    this.useSpiritGemPotions = false;
    this.autoSellOldHerbs = false;
    this.autoSellOldWood = false;
    this.autoSellOldOre = false;
    this.autoSellOldGemsUnlocked = false;
    this.autoSellOldGemsEnabled = false;

    for (let i = 0; i < this.maxItems; i++){
      this.itemStacks.push(null);
    }

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      this.eatFood();
      if (this.mergeCounter >= 20){
        if (this.autoWeaponMergeUnlocked){
          this.autoWeaponMerge();
        }
        if (this.autoArmorMergeUnlocked){
          this.autoArmorMerge();
        }
        this.mergeCounter = 0;
      } else {
        this.mergeCounter++;
      }
    });
    mainLoopService.longTickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.autoequipBestWeapon && this.autoequipBestEnabled){
        this.autoequipWeapons();
      }
      if (this.autoequipBestArmor && this.autoequipBestEnabled){
        this.autoequipArmor();
      }
    });
    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  getProperties(): InventoryProperties {
    return {
      itemStacks: this.itemStacks,
      autoSellUnlocked: this.autoSellUnlocked,
      autoSellEntries: this.autoSellEntries,
      autoUseUnlocked: this.autoUseUnlocked,
      autoUseEntries: this.autoUseEntries,
      autoBalanceUnlocked: this.autoBalanceUnlocked,
      autoBalanceItems: this.autoBalanceItems,
      autoPotionUnlocked: this.autoPotionUnlocked,
      autoPillUnlocked: this.autoPillUnlocked,
      autoWeaponMergeUnlocked: this.autoWeaponMergeUnlocked,
      autoArmorMergeUnlocked: this.autoArmorMergeUnlocked,
      useSpiritGemUnlocked: this.useSpiritGemUnlocked,
      useSpiritGemWeapons: this.useSpiritGemWeapons,
      useSpiritGemPotions: this.useSpiritGemPotions,
      autoSellOldHerbs: this.autoSellOldHerbs,
      autoSellOldWood: this.autoSellOldWood,
      autoSellOldOre: this.autoSellOldOre,
      autoequipBestWeapon: this.autoequipBestWeapon,
      autoequipBestArmor: this.autoequipBestArmor,
      autoequipBestEnabled: this.autoequipBestEnabled,
      maxStackSize: this.maxStackSize,
      thrownAwayItems: this.thrownAwayItems,
      autoSellOldGemsUnlocked: this.autoSellOldGemsUnlocked,
      autoSellOldGemsEnabled: this.autoSellOldGemsEnabled,
    
    }
  }

  setProperties(properties: InventoryProperties) {
    this.itemStacks = properties.itemStacks;
    this.autoSellUnlocked = properties.autoSellUnlocked || false;
    this.autoSellEntries = properties.autoSellEntries || [];
    this.autoUseUnlocked = properties.autoUseUnlocked || false;
    this.autoUseEntries = properties.autoUseEntries || [];
    this.autoBalanceUnlocked = properties.autoBalanceUnlocked || false;
    this.autoBalanceItems = properties.autoBalanceItems;
    this.autoPotionUnlocked = properties.autoPotionUnlocked || false;
    this.autoPillUnlocked = properties.autoPillUnlocked || false;
    this.autoWeaponMergeUnlocked = properties.autoWeaponMergeUnlocked || false;
    this.autoArmorMergeUnlocked = properties.autoArmorMergeUnlocked || false;
    this.useSpiritGemUnlocked = properties.useSpiritGemUnlocked || false;
    this.useSpiritGemWeapons = properties.useSpiritGemWeapons;
    this.useSpiritGemPotions = properties.useSpiritGemPotions;
    this.autoSellOldHerbs = properties.autoSellOldHerbs || false;
    this.autoSellOldWood = properties.autoSellOldWood || false;
    this.autoSellOldOre = properties.autoSellOldOre || false;
    this.autoequipBestWeapon = properties.autoequipBestWeapon || false;
    this.autoequipBestArmor = properties.autoequipBestArmor || false;
    this.autoequipBestEnabled = properties.autoequipBestEnabled || true;
    this.maxStackSize = properties.maxStackSize || 100;
    this.thrownAwayItems = properties.thrownAwayItems || 0;
    this.autoSellOldGemsUnlocked =  properties.autoSellOldGemsUnlocked || false;
    this.autoSellOldGemsEnabled = properties.autoSellOldGemsEnabled || false;

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
    this.itemRepoService.items['peach']
  ]

  changeMaxItems(newValue: number){
    this.maxItems = newValue;
    while (this.itemStacks.length < newValue){
      this.itemStacks.push(null);
    }
  }

  // materials are wood or metal
  generateWeapon(grade: number, material: string, defaultName: string | undefined = undefined): Equipment {

    if (this.useSpiritGemUnlocked && this.useSpiritGemWeapons){
      // consume a spirit gem and increase the grade
      const value = this.consume("spiritGem");
      if (value > 0){
        grade += value;
      }
    }

    const highestGrade = ItemPrefixes.length * WeaponSuffixes.length * WeaponSuffixModifiers.length;
    let prefixIndex = grade % ItemPrefixes.length;
    if (grade >= highestGrade){
      prefixIndex = ItemPrefixes.length - 1;
    }
    let suffixIndex = Math.floor(grade / ItemPrefixes.length);
    const prefix = ItemPrefixes[prefixIndex];
    let suffix = "";
    if (suffixIndex > 0){
      let suffixModifierIndex = Math.floor(suffixIndex / WeaponSuffixes.length);
      if (suffixModifierIndex > 0){
        if (suffixModifierIndex > WeaponSuffixModifiers.length){
          suffixModifierIndex = WeaponSuffixModifiers.length;
          suffixIndex = WeaponSuffixes.length - 1;
        } else {
          suffixIndex = suffixIndex % WeaponSuffixes.length;
        }
        const suffixModifier = WeaponSuffixModifiers[suffixModifierIndex - 1];
        suffix = " of " + suffixModifier + " " + WeaponSuffixes[suffixIndex];
      } else {
        suffix = " of " + WeaponSuffixes[suffixIndex - 1];
      }
    }
    let materialPrefix = material;
    let slot: EquipmentPosition = 'rightHand';
    if (material === "wood") {
      slot = 'leftHand';
      materialPrefix = "wooden";
    }
    let baseName = defaultName;
    if (baseName == undefined){
      baseName = WeaponNames[Math.floor(Math.random() * WeaponNames.length)]
    }
    const name = prefix + ' ' + materialPrefix + ' ' + baseName + suffix;
    this.logService.addLogMessage('Your hard work paid off! You created a new weapon: ' + name + '!','STANDARD', 'CRAFTING');
    const durability = grade * 10 + Math.floor(Math.random() * grade * 5);
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
        baseName: baseName
      },
      description: 'A unique weapon made of ' + material + ". Drag and drop onto similar weapons to merge them into something better.<br/>Base Damage: " + grade + "<br/>Durability: " + durability
    };
  }

  updateWeaponDescription(weapon: Equipment){
    weapon.description = 'A unique weapon made of ' +
      weapon.weaponStats?.material + ".<br/>Base Damage: " +
      weapon.weaponStats?.baseDamage + "<br/>Durability: " + weapon.weaponStats?.durability;
  }

  updateArmorDescription(armor: Equipment){
    armor.description = 'A unique piece of armor made of ' + armor.armorStats?.material +
      "<br/>Defense: " + armor.armorStats?.defense + "<br/>Durability: " + armor.armorStats?.durability
  }

  generatePotion(grade: number, masterLevel: boolean): void {

    if (this.useSpiritGemUnlocked && this.useSpiritGemPotions){
      // consume a spirit gem and increase the grade
      const value = this.consume("spiritGem");
      if (value > 0){
        grade += value;
      }
      if (Math.random() < 0.1){
        this.generatePill(grade);
        return;
      }
    } else if (masterLevel){
      // master level can make pills even without gems
      if (Math.random() < 0.1){
        this.generatePill(grade);
        return;
      }
    }

    const keys = Object.keys(
      this.characterService.characterState.attributes
    ) as AttributeType[];
    // randomly choose any of the first five stats
    const key = keys[Math.floor(Math.random() * 5)];
    const name = "Potion of " + key + " +" + grade;
    this.logService.addLogMessage("Alchemy Success! Created a " + name + ". Keep up the good work.", "STANDARD","CRAFTING");

    this.addItem( {
      name: name,
      id: "potion",
      type: "potion",
      value: grade,
      description: "A potion that increases " + key,
      useLabel: 'Drink',
      useDescription: 'Drink to increase your ' + key + '.',
      useConsumes: true,
      attribute: key,
      increase: grade
    } as Potion);
  }

  generatePill(grade: number): void {
    let effect = "Longevity"; // add more later
    let description = "A pill that increases your lifespan.";
    let useDescription = "Use to increase your lifespan.";
    let value = grade * 10;
    let name = effect + " Pill " + " +" + grade;
    if (this.checkFor("pillBox") > 0 && this.checkFor("pillMold") > 0 && this.checkFor("pillPouch") > 0){
      this.consume("pillBox");
      this.consume("pillMold");
      this.consume("pillPouch");
      effect = "Empowerment"
      description = "A pill that permanently empowers the increase of your attributes based on your aptitudes.";
      useDescription = "Use to permanently empower the increase of your attributes based on your aptitudes.";
      value = 1;
      name = "Empowerment Pill";
      this.logService.addLogMessage("Alchemy Success! Created a " + name + ". Its effect gets worse the more you take.", "STANDARD","CRAFTING");
    } else {
      this.logService.addLogMessage("Alchemy Success! Created a " + name + ". Keep up the good work.", "STANDARD","CRAFTING");
    }
    this.addItem( {
      name: name,
      id: "pill",
      type: "pill",
      value: value,
      description: description,
      useLabel: 'Swallow',
      useDescription: useDescription,
      useConsumes: true,
      effect: effect,
      power: grade
    } as Pill);
  }

  generateHerb(): void {
    let grade = 0;
    const woodLore = this.characterService.characterState.attributes.woodLore.value;
    if (woodLore < 10000){
      grade = Math.floor(Math.sqrt(woodLore));
    } else {
      grade = 100 + Math.floor(Math.log2(this.characterService.characterState.attributes.woodLore.value - 10000));
    }
    let name: string;
    let quality: string;
    if (grade >= herbNames.length * herbQuality.length){
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
    this.addItem({
      id: 'herb',
      name: quality + " " + name,
      type: 'ingredient',
      value: value,
      description: 'Useful herbs. Can be used in creating pills or potions.'
    });
    if (this.autoSellOldHerbs){
      // sell any herb cheaper than what we just picked
      for (let i = 0; i < this.itemStacks.length; i++){
        const itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.id === "herb" ){
          if (itemStack.item.value < value ){
            this.sell(itemStack, itemStack.quantity);
          }
        }
      }
    }
  }

  generateSpiritGem(grade: number): Item {
    return {
      id: 'spiritGemGrade' + grade,
      name: 'monster gem grade ' + grade,
      type: 'spiritGem',
      value: grade * 10,
      description: 'A spirit gem dropped by a monster.'
    };
  }

  generateArmor(grade: number, material: string, slot: EquipmentPosition, defaultName: string | undefined = undefined): Equipment{
    const highestGrade = ItemPrefixes.length * ArmorSuffixes.length * ArmorSuffixModifiers.length;
    let prefixIndex = grade % ItemPrefixes.length;
    if (grade >= highestGrade){
      prefixIndex = ItemPrefixes.length - 1;
    }
    let suffixIndex = Math.floor(grade / ItemPrefixes.length);
    const prefix = ItemPrefixes[prefixIndex];
    let suffix = "";
    if (suffixIndex > 0){
      let suffixModifierIndex = Math.floor(suffixIndex / ArmorSuffixes.length);
      if (suffixModifierIndex > 0){
        if (suffixModifierIndex > ArmorSuffixModifiers.length){
          suffixModifierIndex = ArmorSuffixModifiers.length;
          suffixIndex = ArmorSuffixes.length - 1;
        } else {
          suffixIndex = suffixIndex % ArmorSuffixes.length;
        }
        const suffixModifier = ArmorSuffixModifiers[suffixModifierIndex - 1];
        suffix = " of " + suffixModifier + " " + ArmorSuffixes[suffixIndex];
      } else {
        suffix = " of " + ArmorSuffixes[suffixIndex - 1];
      }
    }
    const materialPrefix = material;
    let namePicker = ChestArmorNames;
    if (slot === 'legs'){
      namePicker = LegArmorNames;
    } else if (slot === 'head'){
      namePicker = HelmetNames;
    } else if (slot === 'feet'){
      namePicker = ShoeNames;
    }
    let baseName = defaultName;
    if (baseName == undefined){
      baseName = namePicker[Math.floor(Math.random() * namePicker.length)];
    }
    const name = prefix + ' ' + materialPrefix + ' ' + baseName + suffix;
    this.logService.addLogMessage('Your hard work paid off! You created some armor: ' + name + '!','STANDARD', 'CRAFTING');
    const durability = grade * 5 + Math.floor(Math.random() * grade * 5);
    return {
      id: 'armor',
      name: name,
      type: "equipment",
      slot: slot,
      value: grade,
      armorStats: {
        defense: grade,
        material: material,
        durability: durability,
        baseName: baseName
      },
      description: 'A unique piece of armor made of ' + material + ". Drag and drop onto similar armor to merge them into something better.<br/>Defense: " + grade + "<br/>Durability: " + durability
    };

  }

  randomArmorSlot(): EquipmentPosition{
    const randomNumber = Math.random();
    if (randomNumber < 0.25){
      return 'body';
    } else if (randomNumber < 0.5){
      return 'head';
    } else if (randomNumber < 0.75){
      return 'feet';
    } else {
      return 'legs';
    }
  }

  getOre(): Item {
    let oreValue;
    if (this.characterService.characterState.attributes.earthLore.value < 20){
      oreValue = 1 + Math.floor(this.characterService.characterState.attributes.earthLore.value / 5);
    } else if (this.characterService.characterState.attributes.earthLore.value < 70){
      oreValue = 5 + Math.floor((this.characterService.characterState.attributes.earthLore.value - 20) / 10);
    } else {
      oreValue = 9 + Math.floor(Math.log10(this.characterService.characterState.attributes.earthLore.value - 60));
    }
    let lastOre =  this.itemRepoService.items['copperOre'];
    for (const key in this.itemRepoService.items){
      const item = this.itemRepoService.items[key];
      if (item.type === 'ore' && item.value > lastOre.value && item.value <= oreValue){
        lastOre = item;
      }
    }
    if (this.autoSellOldOre){
      // sell any ore cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.type === "ore" ){
          if (itemStack.item.value < lastOre.value ){
            this.sell(itemStack, itemStack.quantity);
          }
        }
      }
    }
    return lastOre;
  }

  getBar(oreValue: number): Item{
    // metal bars should always be 10x the value of the associated ore
    const barValue = oreValue * 10;
    
    let lastMetal =  this.itemRepoService.items['copperBar'];
    for (const key in this.itemRepoService.items) {
      const item = this.itemRepoService.items[key];
      if (item.type === 'metal'){
        if (item.value === barValue){
          lastMetal = item;
          break;
        }
      }
    }

    if (this.autoSellOldOre){
      // sell any metal cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack){
          if (itemStack.item.type === 'metal' && itemStack.item.value < lastMetal.value ){
            this.sell(itemStack, itemStack.quantity);
          }
        }
      }
    }
    
    return lastMetal;
  }

  getWood(): Item{
    let wood: Item;
    if (this.characterService.characterState.attributes.woodLore.value > 500000000 &&
      this.characterService.characterState.attributes.spirituality.value > 50000000){
        wood = this.itemRepoService.items['divinewoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 10000000 &&
      this.characterService.characterState.attributes.spirituality.value > 1000000){
        wood = this.itemRepoService.items['devilwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 200000 &&
      this.characterService.characterState.attributes.spirituality.value > 20000){
        wood = this.itemRepoService.items['dragonwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 10000 &&
      this.characterService.characterState.attributes.spirituality.value > 1000){
        wood = this.itemRepoService.items['titanwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 1000 &&
      this.characterService.characterState.attributes.spirituality.value > 100){
        wood = this.itemRepoService.items['diamondwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 300 &&
      this.characterService.characterState.attributes.spirituality.value > 10){
        wood = this.itemRepoService.items['peachwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 200 &&
      this.characterService.characterState.attributes.spirituality.value > 1){
        wood =   this.itemRepoService.items['blackwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 100){
      wood = this.itemRepoService.items['zitanLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 50){
      wood = this.itemRepoService.items['rosewoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 40){
      wood = this.itemRepoService.items['pearwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 30){
      wood = this.itemRepoService.items['laurelwoodLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 20){
      wood = this.itemRepoService.items['walnutLog'];
    } else if (this.characterService.characterState.attributes.woodLore.value > 10){
      wood = this.itemRepoService.items['cypressLog'];
    } else {
      wood = this.itemRepoService.items['elmLog'];
    }
    if (this.autoSellOldWood){
      // sell any wood cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++){
        const itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.type === "wood" ){
          if (itemStack.item.value < wood.value ){
            this.sell(itemStack, itemStack.quantity);
          }
        }
      }
    }
    return wood;
  }

  reset(): void {
    this.selectedItem = null;
    this.lifetimeUsedItems = 0;
    this.lifetimeSoldItems = 0;
    this.lifetimePotionsUsed = 0;
    this.lifetimePillsUsed = 0;
    this.lifetimeGemsSold = 0;
    this.itemStacks = [];
    this.maxItems = 10;
    for (let i = 0; i < this.maxItems; i++){
      this.itemStacks.push(null);
    }

    if (this.motherGift) {
      this.logService.addLogMessage(
        'Your mother gives you three big bags of rice as she sends you out to make your way in the world.',
        'STANDARD', 'EVENT');
      this.itemStacks[0] = { item: this.itemRepoService.items['rice'], quantity: 300 };
    }
    if (this.grandmotherGift) {
      const stick: Equipment = {
        id: 'weapon',
        name: "Grandmother's Walking Stick",
        type: "equipment",
        slot: "leftHand",
        value: 10,
        weaponStats: {
          baseDamage: 10,
          material: "wood",
          durability: 100
        },
        description: "Your grandmother's walking stick. Drag and drop onto similar weapons to merge them into something better.<br/>Base Damage: 10<br/>Durability: 100"
      };
      this.addItem(stick);
    }
  }

  /** Finds the best food in the inventory and uses it. */ 
  eatFood(): void {
    if (this.fed){
      // we already ate something this tick
      this.noFood = false;
      this.fed = false;
      return;
    }
    let foodStack = null;
    const foodValue = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator === null){
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
      if (this.characterService.characterState.money > 0) {
        this.characterService.characterState.money--;
        this.characterService.characterState.status.nourishment.value++;
      }
    }
    this.fed = false;
  }

/**
 * 
 * @param item the Item to add
 * @param quantity the quantity the Item to stack. Ignores for unstackables. Default 1
 * @returns first itemStack position, -1 if not applicable
 */
  addItem(item: Item, quantity = 1): number {
    if (quantity < 1){
      quantity = 1; //handle potential 0 and negatives just in case
    }

    for (const balanceItem of this.autoBalanceItems){
      if (balanceItem.name === item.name){
        if (balanceItem.useNumber < 1){
          if (balanceItem.sellNumber < 1){
            break; // dump to inventory if user enters balance numbers under 1
          } else {
            this.characterService.characterState.money += item.value * quantity; // Sell it all
            return -1;
          }
        } else if (balanceItem.sellNumber < 1){
          this.useItem(item, quantity * balanceItem.useNumber) // Use it all
          return -1;
        }
        let modulo = quantity % (balanceItem.useNumber + balanceItem.sellNumber);
        quantity -= modulo; 
        while (modulo > 0){ // Use the modulo first 
          if (balanceItem.index < balanceItem.useNumber){
            if (modulo + balanceItem.index <= balanceItem.useNumber){
              this.useItem(item, modulo);
              balanceItem.index += modulo;
              break;
            } else {
              this.useItem(item, balanceItem.useNumber - balanceItem.index);
              modulo -= balanceItem.useNumber - balanceItem.index;
              balanceItem.index = balanceItem.useNumber;
            }
          } 
          if (balanceItem.index < balanceItem.useNumber + balanceItem.sellNumber){
            if (modulo + balanceItem.index < balanceItem.useNumber + balanceItem.sellNumber){
              this.characterService.characterState.money += item.value * modulo;
              balanceItem.index += modulo;
              break;
            } else {
              this.characterService.characterState.money += item.value * (balanceItem.useNumber + balanceItem.sellNumber - balanceItem.index);
              modulo -= balanceItem.useNumber + balanceItem.sellNumber - balanceItem.index;
              balanceItem.index = 0;
            }
          }
          if (balanceItem.index >= balanceItem.useNumber + balanceItem.sellNumber){
            balanceItem.index -= balanceItem.useNumber + balanceItem.sellNumber;
          }
        }
        if (quantity){ 
          quantity /= (balanceItem.useNumber + balanceItem.sellNumber);
          this.useItem(item, quantity * balanceItem.useNumber)
          this.characterService.characterState.money += item.value * quantity;
          quantity = 0;
        } 
        if(quantity < 1){ // Sanity check, spill out what should be impossible excess to inventory as though balance were disabled.
          return -1;
        }
        break;
      }
    }

    if (this.autoPotionUnlocked && item.type === "potion"){
      this.useItem(item, quantity);
      return -1;
    }
    if (this.autoPillUnlocked && item.type === "pill"){
      this.useItem(item, quantity);
      return -1;
    }
    for (const entry of this.autoUseEntries){
      if (entry.name === item.name){
        let numberToUse = this.getQuantityByName(item.name) + quantity - entry.reserve;
        if (numberToUse > quantity){
          // don't worry about using more than the incoming quantity here
          numberToUse = quantity;
        }
        if (numberToUse > 0){
          this.useItem(item, quantity);
          quantity -= numberToUse;
          if (quantity == 0){
            return -1;
          }
        }
      }
    }
    if (this.autoSellOldGemsEnabled && item.type === "spiritGem"){
      //clear out any old gems of lesser value
      for (let i = 0; i < this.itemStacks.length; i++){
        const itemStack = this.itemStacks[i];
        if (itemStack !== null && itemStack.item.type === "spiritGem" && itemStack.item.value < item.value){
          this.characterService.characterState.money += itemStack.item.value * itemStack.quantity;
          this.itemStacks[i] = null;
        }
      }
    }
    for (const entry of this.autoSellEntries){
      if (entry.name === item.name){
        let numberToSell = this.getQuantityByName(item.name) + quantity - entry.reserve;
        if (numberToSell > quantity){
          // don't worry about selling more than the incoming quantity here
          numberToSell = quantity;
        }
        if (numberToSell > 0){
          this.characterService.characterState.money += item.value * numberToSell;
          quantity -= numberToSell;
          if (quantity == 0){
            return -1;
          }
        }
      }
    }

    let firstStack = -1;
    if (item.type !== "equipment"){
      // try to stack the new item with existing items
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemIterator = this.itemStacks[i];
        if (itemIterator === null) {
          continue;
        }
        if (itemIterator.item.name === item.name) {
          if (itemIterator.quantity + quantity <= this.maxStackSize) {
            // it matches an existing item and there's room in the stack for everything, add it to the stack and bail out
            itemIterator.quantity += quantity;
            if (firstStack === -1){
              firstStack = i;
            }
            return firstStack;
          } else {
            if (firstStack === -1){
              firstStack = i;
            }
            quantity -= this.maxStackSize - itemIterator.quantity
            itemIterator.quantity = this.maxStackSize;
          }
        }
      }
    }

    // couldn't stack it all, make a new stack
    for (let i = 0; i < this.itemStacks.length; i++) {
      if (this.itemStacks[i] === null){
        if (firstStack === -1){
          firstStack = i;
        }
        if (quantity <= this.maxStackSize){
          this.itemStacks[i] = { item: item, quantity: quantity };
          return firstStack;
        } else {
          this.itemStacks[i] = { item: item, quantity: this.maxStackSize };
          quantity -= this.maxStackSize;
        }
      }
    }

    // if we're here we didn't find a slot for anything/everything.
    if (this.autoSellUnlocked){
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you sold it.`, 'STANDARD', 'EVENT');
      this.characterService.characterState.money += item.value;
    } else {
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you threw it away.`, 'STANDARD', 'EVENT');
    }
    this.thrownAwayItems += quantity;
    return firstStack;
  }

  sell(itemStack: ItemStack, quantity: number): void {
    this.lifetimeSoldItems += quantity;
    if (itemStack.item.type === "spiritGem"){
      this.lifetimeGemsSold += quantity;
    }
    const index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks[index] = null;
      this.characterService.characterState.money += itemStack.quantity * itemStack.item.value;
      if (itemStack === this.selectedItem){
        this.selectedItem = null;
      }
    } else {
      itemStack.quantity -= quantity;
      this.characterService.characterState.money += quantity * itemStack.item.value;
    }
  }

  sellAll(item: Item){
    for (const itemIterator of this.itemStacks) {
      if (itemIterator ===  null){
        continue;
      }
      if (itemIterator.item.name === item.name){
        this.sell(itemIterator, itemIterator.quantity);
      }
    }
  }

  autoSell(item: Item){
    if (!this.autoSellUnlocked){
      return;
    }
    if (!this.autoSellEntries.some(e => e.name === item.name)) {
      this.autoSellEntries.push({name: item.name, reserve: 0});
    }
    //sell all that you currently have
    this.sellAll(item);
  }

  unAutoSell(itemName: string){
    const index = this.autoSellEntries.findIndex(item => item.name === itemName);
    this.autoSellEntries.splice(index, 1);
  }

  useItemStack(itemStack: ItemStack, quantity = 1): void {
    if (quantity < 1){
      quantity = 1; //handle potential 0 and negatives just in case
    }
    if (quantity > itemStack.quantity) {
      quantity = itemStack.quantity
    }
    this.useItem(itemStack.item, quantity);
    if (itemStack.item.useConsumes) {
      itemStack.quantity -= quantity;
      if (itemStack.quantity <= 0) {
        const index = this.itemStacks.indexOf(itemStack);
        this.itemStacks[index] = null;
        if (itemStack === this.selectedItem){
          this.selectedItem = null;
        }
      }
    }
  }

  useItem(item: Item, quantity = 1): void {
    if (quantity < 1){
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimeUsedItems++;
    if (item.type === "potion" && instanceOfPotion(item)){
      this.usePotion(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.type === "pill" && instanceOfPill(item)){

      this.usePill(item, quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
    } else if (item.use) {
      item.use(quantity); // Multiplies the effect by the stack quantity removed if quantity is > 1
      if (item.type === "food"){
        this.fed = true;
      }
    }
  }

  autoUse(item: Item){
    if (!this.autoUseUnlocked){
      return;
    }
    if (item.type !== "potion" && item.type !== "pill" && !item.use){
      // it's not usable, bail out.
      return;
    }
    if (!this.autoUseEntries.some(e => e.name === item.name)) {
      this.autoUseEntries.push({name: item.name, reserve: 0});
    }
    if (item.useConsumes){
      // use all the ones you have now
      for (let i = 0; i < this.itemStacks.length; i++) {
        const itemStack = this.itemStacks[i];
        if (itemStack == null){
          continue;
        }
        if (itemStack.item.name == item.name){
            this.useItemStack(itemStack, itemStack.quantity);
        }
      }
    }    
  }

  unAutoUse(itemName: string){
    const index = this.autoUseEntries.findIndex(item => item.name === itemName);
    this.autoUseEntries.splice(index, 1);
  }

  autoBalance(item: Item){
    for (const balanceItem of this.autoBalanceItems){
      if (balanceItem.name === item.name){
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

      if (this.autoBalanceItems[index].name === itemName){
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
    if (item.armorStats?.durability === 0 || item.weaponStats?.durability === 0){
      //it's broken, bail out
      this.logService.addLogMessage("You tried to equip some broken equipment, but it was broken.","STANDARD","EVENT")
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

  equipBest(slot: EquipmentPosition){
    let equippedPower = 0;
    let weapon = true;
    if (slot === 'leftHand' || slot === 'rightHand'){
      equippedPower = this.characterService.characterState.equipment[slot]?.weaponStats?.baseDamage || 0;
    } else {
      weapon = false;
      equippedPower = this.characterService.characterState.equipment[slot]?.armorStats?.defense || 0;
    }
    for (let i = 0; i < this.itemStacks.length; i++){
      const itemIterator = this.itemStacks[i];
      if (itemIterator !== null){
        const item = itemIterator.item;
        if (instanceOfEquipment(item) && item.slot === slot) {
          let itemPower = 0
          if (weapon && item.weaponStats && item.weaponStats?.durability > 0){
            itemPower = item.weaponStats?.baseDamage;
          } else if (!weapon && item.armorStats && item.armorStats?.durability > 0){
            itemPower = item.armorStats?.defense;
          }
          if (itemPower > equippedPower){
            this.equip(itemIterator);
          }
        }
      }
    }
  }

  consume(consumeType: string): number{
    let itemValue = -1;
    let itemIndex = -1;
    for (let i = 0; i < this.itemStacks.length; i++){
      const itemIterator = this.itemStacks[i];
      if (itemIterator === null){
        continue;
      }
      if (itemIterator.item.type === consumeType) {
        if (itemValue < itemIterator.item.value){
          itemValue = itemIterator.item.value;
          itemIndex = i;
        }
      }
    }
    if (itemIndex >= 0){
      const itemIterator = this.itemStacks[itemIndex];
      if (itemIterator !== null){
        itemIterator.quantity --;
        if (itemIterator.quantity <= 0){
          //remove the stack if empty
          this.itemStacks[itemIndex] = null;
        }
      }
    }
    return itemValue;
  }

  checkFor(itemType: string): number{
    let itemValue = -1;
    for (let i = 0; i < this.itemStacks.length; i++){
      const itemIterator = this.itemStacks[i];
      if (itemIterator === null){
        continue;
      }
      if (itemIterator.item.type === itemType) {
        if (itemValue < itemIterator.item.value){
          itemValue = itemIterator.item.value;
        }
      }
    }
    return itemValue;
  }

  getQuantityByName(itemName: string): number{
    let itemCount = 0;
    for (let i = 0; i < this.itemStacks.length; i++){
      const itemIterator = this.itemStacks[i];
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.name == itemName) {
        itemCount += itemIterator.quantity;
      }
    }
    return itemCount;
  }

  
  /** Checks for equipment durability. Returns false if equipment has 0 durability. */
  hasDurability(itemStack: ItemStack): boolean {
    const item = itemStack.item;

    if (!instanceOfEquipment(item)) return true;

    return (item.armorStats?.durability !== 0 && item.weaponStats?.durability !== 0);
  }

  /** A special use function for generated potions. */
  usePotion(potion: Potion, quantity = 1){
    if (quantity < 1){
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePotionsUsed += quantity;
    this.characterService.characterState.attributes[potion.attribute].value += potion.increase * quantity;
  }

  /** A special use function for generated pills*/
  usePill(pill: Pill, quantity = 1){
    if (quantity < 1){
      quantity = 1; //handle potential 0 and negatives just in case
    }
    this.lifetimePillsUsed += quantity;
    if (pill.effect === "Longevity"){
      this.characterService.characterState.alchemyLifespan += pill.power * quantity;
      if (this.characterService.characterState.alchemyLifespan > 36500){
        this.characterService.characterState.alchemyLifespan = 36500;
      }
    } else if (pill.effect === "Empowerment"){
      this.characterService.characterState.empowermentFactor += 0.01;
    }
    this.characterService.characterState.checkOverage();
  }

  /** Returns the number of open inventory slots. */
  openInventorySlots(){
    let openSlots = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator === null){
        openSlots++;
      }
    }
    return openSlots;
  }

  /** Create a new piece of equipment based on the two provided. Caller needs to do the destroying of the old items. */
  mergeEquipment(item1: Equipment, item2: Equipment, destinationInventoryIndex: number){
    if (item1.slot !== item2.slot){
      // not the same slot, bail out
      return;
    }
    let inventoryIndex = 0;
    if (item1.slot === 'rightHand' || item1.slot === 'leftHand'){
      inventoryIndex = this.addItem(this.generateWeapon(item1.value + item2.value, item1.weaponStats?.material + "", item1.weaponStats?.baseName));
    } else {
      inventoryIndex = this.addItem(this.generateArmor(item1.value + item2.value, item1.armorStats?.material + "", item1.slot, item1.armorStats?.baseName));
    }
    // if we can, move the new item to the desired destination index
    if (inventoryIndex !== destinationInventoryIndex && this.itemStacks[destinationInventoryIndex] === null){
      this.itemStacks[destinationInventoryIndex] = this.itemStacks[inventoryIndex];
      this.itemStacks[inventoryIndex] = null;
    }
  }

  autoWeaponMerge(){
    this.autoMerge('leftHand');
    this.autoMerge('rightHand');
  }

  autoArmorMerge(){
    this.autoMerge('head');
    this.autoMerge('body');
    this.autoMerge('legs');
    this.autoMerge('feet');
  }

  autoequipWeapons(){
    this.equipBest('leftHand');
    this.equipBest('rightHand');
  }

  autoequipArmor(){
    this.equipBest('head');
    this.equipBest('body');
    this.equipBest('legs');
    this.equipBest('feet');
  }

  autoMerge(slot: EquipmentPosition){
    let mergeDestinationIndex = -1;
    let destinationItem: Equipment | null = null;
    let sourceItem: Equipment  | null = null;
    let lastdestinationIndex = -1;
    for (let i = 0; i < this.itemStacks.length; i++){
      let item = this.itemStacks[i]?.item;
      if (item){
        if (instanceOfEquipment(item)){
          if (item.slot === slot){
            if (mergeDestinationIndex === -1){
              mergeDestinationIndex = i;
              lastdestinationIndex = i;
              destinationItem = item;
            } else {
              sourceItem = item;
              if (destinationItem){
                if (this.selectedItem === this.itemStacks[mergeDestinationIndex] || this.selectedItem === this.itemStacks[i]){
                  this.selectedItem = null;
                }
                this.itemStacks[mergeDestinationIndex] = null;
                this.itemStacks[i] = null;
                this.mergeEquipment(destinationItem, sourceItem, mergeDestinationIndex);
                item = this.itemStacks[mergeDestinationIndex]?.item;
                if (item){
                  if (instanceOfEquipment(item)){
                    if (item.slot === slot){
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
    // finally, merge the last item with that slot into the equipped item (if present and both weapon and armor autoequips are unlocked)
    if (destinationItem !== null && this.autoequipBestWeapon && this.autoequipBestArmor){
      sourceItem = this.characterService.characterState.equipment[slot];
      if (sourceItem === null){
        return;
      }
      if (slot === 'rightHand' || slot === 'leftHand'){
        destinationItem = this.generateWeapon(sourceItem.value + destinationItem.value, sourceItem.weaponStats?.material + "", sourceItem.weaponStats?.baseName);
      } else {
        destinationItem = this.generateArmor(sourceItem.value + destinationItem.value, sourceItem.armorStats?.material + "", slot, sourceItem.armorStats?.baseName);
      }
      this.characterService.characterState.equipment[slot] = destinationItem;
      this.itemStacks[lastdestinationIndex] = null;
    }
  }

  mergeSpiritGem(stack: ItemStack, power = 0){
    if (stack.quantity < 10 - power){
      return;
    }
    stack.quantity -= 10 - power;
    this.addItem(this.generateSpiritGem((stack.item.value / 10) + 1));
    if (stack.quantity === 0){
      // go find the stack and remove it
      for (let i = 0; i < this.itemStacks.length; i++){
        if (this.itemStacks[i] === stack){
          this.itemStacks[i] = null;
          return;
        }
      }
    }
  }

  mergeAnySpiritGem(power = 0){
    const meridianRank = this.characterService.meridianRank();
    if (power > meridianRank - 5){
      power = meridianRank - 5
    }
    if (power < 0){
      power = 0;
    }
    for (let i = 0; i < this.itemStacks.length; i++){
      const itemIterator = this.itemStacks[i];
      if (itemIterator === null){
        continue;
      }
      if (itemIterator.item.type === 'spiritGem' && itemIterator.quantity >= 10 - power){
        this.mergeSpiritGem(itemIterator, power);
        return;
      }
    }
  }

}

export function instanceOfEquipment(object: any): object is Equipment {
  return 'slot' in object;
}

export function instanceOfPotion(object: any): object is Potion {
  return 'attribute' in object;
}

export function instanceOfPill(object: any): object is Pill {
  return 'effect' in object;
}

export function instanceOfFurniture(object: any): object is Furniture {
  return 'slot' in object;
}
