import { Injectable } from '@angular/core';
import { LogService, LogTopic } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { Furniture, InventoryService, Item, instanceOfFurniture } from '../game-state/inventory.service';
import { HomeService, HomeType, Home } from '../game-state/home.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  manuals: Item[];
  furniture: Furniture[];
  selectedItem: Item | null;
  soulCoreRank = 0;
  meridianRank = 0;
  bloodlineLabel = "";
  bloodlineDescription = "";
  bloodLineHomeRequirement: Home = this.homeService.homesList[HomeType.Palace];
  storeOpened = false;
  furniturePrices: { [key: string]: number; } = {};

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    public homeService: HomeService,
    public dialog: MatDialog
  ) {
    this.selectedItem = null;

    this.manuals = [];
    this.furniture = [];


  }

  setStoreInventory() {
    this.furniture = [];
    for (const key in this.itemRepoService.furniture) {
      const furniture = this.itemRepoService.furniture[key];
      if (this.homeService.home.furnitureSlots.includes(furniture.slot)) {
        this.furniture.push(furniture);
        if (this.homeService.ownedFurniture.includes(furniture.name)) {
          this.furniturePrices[furniture.name] = 0;
        } else {
          this.furniturePrices[furniture.name] = furniture.value;
        }
      }
    }
    this.selectedItem = null;

  }

  unlockManual(manual: Item) {
    if (!this.manuals.includes(manual)) {
      this.manuals.push(manual);
    }
  }

  buyManual() {
    if (this.selectedItem) {
      if (this.selectedItem.value < this.characterService.characterState.money) {
        this.characterService.characterState.money -= this.selectedItem.value;
        if (this.selectedItem.type === 'manual' && this.selectedItem.use) {
          // use manuals immediately
          this.selectedItem.use();
        } else {
          this.inventoryService.addItem(this.selectedItem);
        }
      }
    }
  }

  isManualAvailable(): boolean {
    for (const manual of this.manuals) {
      if (manual.owned && !manual.owned()) {
        return true;
      }
    }
    return false;
  }

  getFurnitureForSlot(slot: string | null = null) {
    if (slot === null) return this.furniture;

    return this.furniture.filter(item => item.slot === slot);
  }

  buyFurniture(item: Item | null = null) {
    if (item === null) item = this.selectedItem;

    if (item) {
      if (!instanceOfFurniture(item)) {
        return;
      }
      const slot = item.slot;
      if (item.value < this.characterService.characterState.money || this.homeService.ownedFurniture.includes(item.name)) {
        if (!this.homeService.ownedFurniture.includes(item.name)) {
          // only pay for it once per lifetime
          this.characterService.characterState.money -= item.value;
          this.homeService.ownedFurniture.push(item.name);
          this.furniturePrices[item.name] = 0;
        }
        this.homeService.furniture[slot] = item;
        this.homeService.autoBuyFurniture[slot] = item;
      }
    }
  }

  updateAscensions() {
    this.soulCoreRank = this.characterService.soulCoreRank();
    this.meridianRank = this.characterService.meridianRank();
    if (this.characterService.characterState.bloodlineRank === 0) {
      this.bloodlineLabel = "Establish Bloodline";
    } else {
      this.bloodlineLabel = "Enhance Bloodline";
    }
    if (this.characterService.characterState.bloodlineRank === 0) {
      // Weapons
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and establish a bloodline. All of your future reincarnations will be born as your own descendants. Your weapons equipped on death will become family heirlooms and will be inherited by your future self.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Mansion];
    } else if (this.characterService.characterState.bloodlineRank === 1) {
      // Armor
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Palace];
    } else if (this.characterService.characterState.bloodlineRank === 2) {
      // Inherit Money
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit some of your past self's money.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Castle];
    } else if (this.characterService.characterState.bloodlineRank === 3) {
      // Interest
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit your past self's money plus interest.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Fortress];
    } else if (this.characterService.characterState.bloodlineRank === 4) {
      // Basic Stat Lifespan
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit your past self's money plus interest. Your aptitudes extend your lifespan to a much greater degree.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Mountain];
    } else if (this.characterService.characterState.bloodlineRank === 5) {
      // Home
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. You will keep your ancestral Home. You will keep your weapons, armor, and money with interest. ";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.ForbiddenCity];
    } else if (this.characterService.characterState.bloodlineRank === 6) {
      // Entourage
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Your followers will have enhanced bloodlines and will follow you between incarnations. You will keep your weapons, armor, money with interest, your home and your Empire.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Capital];
    } else if (this.characterService.characterState.bloodlineRank === 7) {
      // Limit Break
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline. Break through the limits of humanity. You will keep your weapons, armor, money with interest, your home, and your Empire.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.ImperialSeat];
    } else if (this.characterService.characterState.bloodlineRank === 8) {
      // Daily Aptitude Increase
      this.bloodlineDescription = "End your current life, sacrifice all attributes and aptitudes that are not protected by the power of your previous soul core ascensions, and enhance your bloodline one last time. Finally, you will gain aptitudes every day from your current Attributes, improving constantly. You will keep your weapons, armor, money with interest, your home, and your Empire.";
      this.bloodLineHomeRequirement = this.homeService.homesList[HomeType.Godthrone];
    } else if (this.characterService.characterState.bloodlineRank === 9) {
      this.bloodlineDescription = "You can't enhance your bloodline any further. Your armor and your weapons equipped on death will become family heirlooms and will be inherited by your future self. You will also inherit your past self's money plus interest. Your aptitudes extend your lifespan to a much greater degree. Your followers also have enhanced bloodlines and will follow you between incarnations. You will keep your Home and your Empire, and can break through the limits of humanity. Finally, you will gain aptitudes every day from your current Attributes.";
    }

  }

  condenseSoulCore() {
    if (this.soulCoreRank >= 9) {
      this.logService.injury(LogTopic.EVENT, "You can't condense your soul core any further.");
      return;
    }
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.condenseSoulCoreCost) {
      this.logService.injury(LogTopic.EVENT, "You don't have the spirituality required to ascend.");
      return;
    }
    if (this.inventoryService.checkFor("spiritGem") < (this.soulCoreRank + 12) * 10) {
      this.logService.injury(LogTopic.EVENT, "You don't have the gem required to ascend.");
      return;
    }
    this.characterService.condenseSoulCore();
    this.dialog.closeAll();
  }

  reinforceMeridians() {
    if (this.meridianRank >= 9) {
      this.logService.injury(LogTopic.EVENT, "You can't reinforce your meridians any further.");
      return;
    }
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.reinforceMeridiansCost) {
      this.logService.injury(LogTopic.EVENT, "You don't have the spirituality required to ascend.");
      return;
    }
    if (this.inventoryService.checkFor("spiritGem") < (this.meridianRank + 16) * 10) {
      this.logService.injury(LogTopic.EVENT, "You don't have the gem required to ascend.");
      return;
    }

    this.characterService.reinforceMeridians();
    this.dialog.closeAll();
  }

  upgradeBloodline() {
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.bloodlineCost) {
      this.logService.injury(LogTopic.EVENT, "You don't have the spirituality required to ascend.");
      return;
    }
    if (this.characterService.characterState.bloodlineRank >= 9) {
      this.logService.injury(LogTopic.EVENT, "You can't enhance your bloodline any further.");
      return;
    }
    if (this.homeService.home.type < this.bloodLineHomeRequirement.type) {
      this.logService.injury(LogTopic.EVENT, "You don't have a powerful enough home to ascend.");
      return;
    }
    this.characterService.upgradeBloodline();
    this.dialog.closeAll();
  }

}
