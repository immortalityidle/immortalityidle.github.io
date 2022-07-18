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
}

export interface ArmorStats {
  defense: number;
  material: string;
  durability: number;
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

export interface InventoryProperties {
  itemStacks: (ItemStack | null)[],
  autoSellUnlocked: boolean,
  autoSellItems: string[],
  autoUseUnlocked: boolean,
  autoUseItems: string[],
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
  maxItems: number = 10;
  maxStackSize = 100;
  noFood: boolean;
  selectedItem: ItemStack | null = null;
  autoSellUnlocked: boolean;
  autoSellItems: string[];
  autoUseUnlocked: boolean;
  autoUseItems: string[];
  autoBalanceUnlocked: boolean;
  autoBalanceItems: BalanceItem[];
  autoPotionUnlocked: boolean;
  autoPillUnlocked: boolean;
  autoWeaponMergeUnlocked: boolean;
  autoArmorMergeUnlocked: boolean;
  autoequipBestWeapon: boolean;
  autoequipBestArmor: boolean;
  autoequipBestEnabled: boolean = true;
  useSpiritGemUnlocked: boolean;
  useSpiritGemWeapons: boolean;
  useSpiritGemPotions: boolean;
  autoSellOldHerbs: boolean;
  autoSellOldWood: boolean;
  autoSellOldOre: boolean;
  fed: boolean = false;
  lifetimeUsedItems: number = 0;
  lifetimeSoldItems: number = 0;
  lifetimePotionsUsed: number = 0;
  lifetimePillsUsed: number = 0;
  lifetimeGemsSold: number = 0;
  motherGift: boolean = false;
  grandmotherGift: boolean = false;
  thrownAwayItems: number = 0;
  mergeCounter: number = 0;
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
    this.autoSellItems = [];
    this.autoUseUnlocked = false;
    this.autoUseItems = [];
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
      if (this.characterService.characterState.dead || !this.autoequipBestEnabled){
        return;
      }//TODO: check if it'll be getting merged to short circuit
      if (this.autoequipBestWeapon){
        this.autoequipWeapons();
      }
      if (this.autoequipBestArmor){
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
      autoSellItems: this.autoSellItems,
      autoUseUnlocked: this.autoUseUnlocked,
      autoUseItems: this.autoUseItems,
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
    this.autoSellItems = properties.autoSellItems;
    this.autoUseUnlocked = properties.autoUseUnlocked || false;
    this.autoUseItems = properties.autoUseItems;
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
  generateWeapon(grade: number, material: string): Equipment {

    if (this.useSpiritGemUnlocked && this.useSpiritGemWeapons){
      // consume a spirit gem and increase the grade
      let value = this.consume("spiritGem");
      if (value > 0){
        grade += value;
      }
    }

    let prefixIndex = grade % ItemPrefixes.length;
    let suffixIndex = Math.floor(grade / ItemPrefixes.length);
    let prefix = ItemPrefixes[prefixIndex];
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
        let suffixModifier = WeaponSuffixModifiers[suffixModifierIndex - 1];
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
    let name = prefix + ' ' + materialPrefix + ' ' + WeaponNames[Math.floor(Math.random() * WeaponNames.length)] + suffix;
    this.logService.addLogMessage('Your hard work paid off! You created a new weapon: ' + name + '!','STANDARD', 'CRAFTING');
    let durability = grade * 10 + Math.floor(Math.random() * grade * 5);
    return {
      id: 'weapon',
      name: name,
      type: "equipment",
      slot: slot,
      value: grade,
      weaponStats: {
        baseDamage: grade,
        material: material,
        durability: durability
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
      let value = this.consume("spiritGem");
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
    let name = "Potion of " + key + " +" + grade;
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
    let name = effect + " Pill " + " +" + grade;
    this.logService.addLogMessage("Alchemy Success! Created a " + name + ". Keep up the good work.", "STANDARD","CRAFTING");
    this.addItem( {
      name: name,
      id: "pill",
      type: "pill",
      value: grade * 10,
      description: "A pill that increases " + effect,
      useLabel: 'Swallow',
      useDescription: 'Use to increase your ' + effect + '.',
      useConsumes: true,
      effect: effect,
      power: grade
    } as Pill);
  }

  generateHerb(): void {
    let grade = 0;
    let woodLore = this.characterService.characterState.attributes.woodLore.value;
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
      let nameIndex = grade % herbNames.length;
      let qualityIndex = Math.floor(grade / herbNames.length);
      name = herbNames[nameIndex];
      quality = herbQuality[qualityIndex];
    }
    let value = grade + 1;
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
        let itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.id == "herb" ){
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

  generateArmor(grade: number, material: string, slot: EquipmentPosition): Equipment{
    let prefixIndex = grade % ItemPrefixes.length;
    let suffixIndex = Math.floor(grade / ItemPrefixes.length);
    let prefix = ItemPrefixes[prefixIndex];
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
        let suffixModifier = ArmorSuffixModifiers[suffixModifierIndex - 1];
        suffix = " of " + suffixModifier + " " + ArmorSuffixes[suffixIndex];
      } else {
        suffix = " of " + ArmorSuffixes[suffixIndex - 1];
      }
    }
    let materialPrefix = material;
    let namePicker = ChestArmorNames;
    if (slot == 'legs'){
      namePicker = LegArmorNames;
    } else if (slot == 'head'){
      namePicker = HelmetNames;
    } else if (slot == 'feet'){
      namePicker = ShoeNames;
    }
    let name = prefix + ' ' + materialPrefix + ' ' + namePicker[Math.floor(Math.random() * namePicker.length)] + suffix;
    this.logService.addLogMessage('Your hard work paid off! You created some armor: ' + name + '!','STANDARD', 'CRAFTING');
    let durability = grade * 5 + Math.floor(Math.random() * grade * 5);
    return {
      id: 'armor',
      name: name,
      type: "equipment",
      slot: slot,
      value: grade,
      armorStats: {
        defense: grade,
        material: material,
        durability: durability
      },
      description: 'A unique piece of armor made of ' + material + ". Drag and drop onto similar armor to merge them into something better.<br/>Defense: " + grade + "<br/>Durability: " + durability
    };

  }

  randomArmorSlot(): EquipmentPosition{
    let randomNumber = Math.random();
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
    for (let key in this.itemRepoService.items){
      let item = this.itemRepoService.items[key];
      if (item.type == 'ore' && item.value > lastOre.value && item.value <= oreValue){
        lastOre = item;
      }
    }
    if (this.autoSellOldOre){
      // sell any ore cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        let itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.type == "ore" ){
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
    let barValue = oreValue * 10;
    
    let lastMetal =  this.itemRepoService.items['copperBar'];
    for (let key in this.itemRepoService.items) {
      let item = this.itemRepoService.items[key];
      if (item.type == 'metal'){
        if (item.value == barValue){
          lastMetal = item;
          break;
        }
      }
    }

    if (this.autoSellOldOre){
      // sell any metal cheaper than what we just got
      for (let i = 0; i < this.itemStacks.length; i++) {
        let itemStack = this.itemStacks[i];
        if (itemStack){
          if (itemStack.item.type == 'metal' && itemStack.item.value < lastMetal.value ){
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
        let itemStack = this.itemStacks[i];
        if (itemStack && itemStack.item.type == "wood" ){
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
      let stick: Equipment = {
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

  // find the best food in the inventory and use it
  eatFood(): void {
    if (this.fed){
      // we already ate something this tick
      this.noFood = false;
      this.fed = false;
      return;
    }
    let foodStack = null;
    let foodValue = 0;
    for (const itemIterator of this.itemStacks) {
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.type == 'food' && itemIterator.item.value > foodValue) {
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
          this.useItem(item);
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
    if (this.autoPillUnlocked && item.type == "pill"){
      this.useItem(item);
      return -1;
    }
    if (this.autoUseItems.includes(item.name)){
      this.useItem(item);
      return -1;
    }
    if (this.autoSellOldGemsEnabled && item.type == "spiritGem"){
      //clear out any old gems of lesser value
      for (let i = 0; i < this.itemStacks.length; i++){
        let itemStack = this.itemStacks[i];
        if (itemStack != null && itemStack.item.type == "spiritGem" && itemStack.item.value < item.value){
          this.characterService.characterState.money += itemStack.item.value * itemStack.quantity;
          this.itemStacks[i] = null;
        }
      }
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
    if (this.autoSellUnlocked){
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you sold it.`, 'STANDARD', 'EVENT');
      this.characterService.characterState.money += item.value;
    } else {
      this.logService.addLogMessage(`You don't have enough room for the ${item.name} so you threw it away.`, 'STANDARD', 'EVENT');
    }
    this.thrownAwayItems++;
    return -1;
  }

  sell(itemStack: ItemStack, quantity: number): void {
    this.lifetimeSoldItems += quantity;
    if (itemStack.item.type == "spiritGem"){
      this.lifetimeGemsSold += quantity;
    }
    let index = this.itemStacks.indexOf(itemStack);
    if (quantity >= itemStack.quantity) {
      this.itemStacks[index] = null;
      this.characterService.characterState.money += itemStack.quantity * itemStack.item.value;
      if (itemStack == this.selectedItem){
        this.selectedItem = null;
      }
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
    if (!this.autoSellUnlocked){
      return;
    }
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
        if (itemStack == this.selectedItem){
          this.selectedItem = null;
        }
      }
    }
  }

  useItem(item: Item): void {
    this.lifetimeUsedItems++;
    if (item.type == "potion" && instanceOfPotion(item)){
      this.usePotion(item);
    } else if (item.type == "pill" && instanceOfPill(item)){

      this.usePill(item);
    } else if (item.use) {
      item.use();
      if (item.type == "food"){
        this.fed = true;
      }
    }
  }

  autoUse(item: Item){
    if (!this.autoUseUnlocked){
      return;
    }
    if (item.type != "potion" && item.type != "pill" && !item.use){
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
    let index = this.itemStacks.indexOf(itemStack);
    this.itemStacks[index] = null;
  }

  equipBest(slot: EquipmentPosition){
    let equippedPower = 0;
    let weapon = true;
    if (slot == 'leftHand' || slot == 'rightHand'){
      equippedPower = this.characterService.characterState.equipment[slot]?.weaponStats?.baseDamage || 0;
    } else {
      weapon = false;
      equippedPower = this.characterService.characterState.equipment[slot]?.armorStats?.defense || 0;
    }
    for (let i = 0; i < this.itemStacks.length; i++){
      let itemIterator = this.itemStacks[i];
      if (itemIterator != null){
        let item = itemIterator.item;
        if (instanceOfEquipment(item) && item.slot == slot) {
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
      let itemIterator = this.itemStacks[i];
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.type == consumeType) {
        if (itemValue < itemIterator.item.value){
          itemValue = itemIterator.item.value;
          itemIndex = i;
        }
      }
    }
    if (itemIndex >= 0){
      let itemIterator = this.itemStacks[itemIndex];
      if (itemIterator != null){
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
    let itemIndex = -1;
    for (let i = 0; i < this.itemStacks.length; i++){
      let itemIterator = this.itemStacks[i];
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.type == itemType) {
        if (itemValue < itemIterator.item.value){
          itemValue = itemIterator.item.value;
          itemIndex = i;
        }
      }
    }
    return itemValue;
  }

  // a special use function for generated potions
  usePotion(potion: Potion){
    this.lifetimePotionsUsed++;
    this.characterService.characterState.attributes[potion.attribute].value += potion.increase;
  }

  // a special use function for generated pills
  usePill(pill: Pill){
    this.lifetimePillsUsed++
    if (pill.effect == "Longevity"){
      this.characterService.characterState.alchemyLifespan += pill.power;
      if (this.characterService.characterState.alchemyLifespan > 36500){
        this.characterService.characterState.alchemyLifespan = 36500;
      }
    }
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
    let inventoryIndex = 0;
    if (item1.slot == 'rightHand' || item1.slot == 'leftHand'){
      inventoryIndex = this.addItem(this.generateWeapon(item1.value + item2.value, item1.weaponStats?.material + ""));
    } else {
      inventoryIndex = this.addItem(this.generateArmor(item1.value + item2.value, item1.armorStats?.material + "", item1.slot));
    }
    // if we can, move the new item to the desired destination index
    if (inventoryIndex != destinationInventoryIndex && this.itemStacks[destinationInventoryIndex] == null){
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
          if (item.slot == slot){
            if (mergeDestinationIndex == -1){
              mergeDestinationIndex = i;
              lastdestinationIndex = i;
              destinationItem = item;
            } else {
              sourceItem = item;
              if (destinationItem){
                if (this.selectedItem == this.itemStacks[mergeDestinationIndex] || this.selectedItem == this.itemStacks[i]){
                  this.selectedItem = null;
                }
                this.itemStacks[mergeDestinationIndex] = null;
                this.itemStacks[i] = null;
                this.mergeEquipment(destinationItem, sourceItem, mergeDestinationIndex);
                item = this.itemStacks[mergeDestinationIndex]?.item;
                if (item){
                  if (instanceOfEquipment(item)){
                    if (item.slot == slot){
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
    // finally, merge the last item with that slot into the equipped item (if present and corresponding autoequip is unlocked)
    if (destinationItem != null && (this.autoequipBestWeapon || this.autoequipBestArmor)){
      sourceItem = this.characterService.characterState.equipment[slot];
      if (sourceItem == null){
        return;
      }
      if (slot == 'rightHand' || slot == 'leftHand' && this.autoequipBestWeapon) {
          destinationItem = this.generateWeapon(sourceItem.value + destinationItem.value, sourceItem.weaponStats?.material + "");
      } else if (this.autoequipBestArmor) {
        destinationItem = this.generateArmor(sourceItem.value + destinationItem.value, sourceItem.armorStats?.material + "", slot);
      } else {//slot doesn't match the auto-equip owned.
        return;
      }//TODO: We might want to check if auto-equip-best is enabled at this point.
      this.characterService.characterState.equipment[slot] = destinationItem;
      this.itemStacks[lastdestinationIndex] = null;
    }
  }

  mergeSpiritGem(stack: ItemStack){
    if (stack.quantity < 10){
      return;
    }
    stack.quantity -= 10;
    this.addItem(this.generateSpiritGem((stack.item.value / 10) + 1));
    if (stack.quantity == 0){
      // go find the stack and remove it
      for (let i = 0; i < this.itemStacks.length; i++){
        if (this.itemStacks[i] == stack){
          this.itemStacks[i] = null;
          return;
        }
      }
    }
  }

  mergeAnySpiritGem(){
    for (let i = 0; i < this.itemStacks.length; i++){
      let itemIterator = this.itemStacks[i];
      if (itemIterator == null){
        continue;
      }
      if (itemIterator.item.type === 'spiritGem' && itemIterator.quantity >= 10){
        this.mergeSpiritGem(itemIterator);
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
