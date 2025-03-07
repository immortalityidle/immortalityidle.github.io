import { Injectable, Injector } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { CharacterService } from './character.service';
import { InventoryService } from './inventory.service';
import { ItemRepoService } from './item-repo.service';
import { HellService } from './hell.service';
import { HomeService } from './home.service';

export interface Field {
  cropName: string;
  plots: number;
  yield: number;
  maxPlotYield: number;
  daysToHarvest: number;
  originalDaysToHarvest: number;
  averageYield: number;
  imageFile?: string;
}

export interface FarmProperties {
  fields: Field[];
  autoFieldUnlocked: boolean;
  autoFieldLimit: number;
  mostFields: number;
  hellFood: boolean;
  fallowPlots: number;
  unlockedCrops: string[];
}

@Injectable({
  providedIn: 'root',
})
export class FarmService {
  hellService?: HellService;
  autoFieldUnlocked = false;
  autoFieldLimit = 0;
  fields: Field[] = [];
  extraFields = 0;
  hellFood = false;
  smoothFarming = false;
  farmedPlots = 0;

  mostFields = 0;
  consecutiveHarvests = 0;
  fallowPlots = 0;
  unlockedCrops = ['rice'];

  constructor(
    private injector: Injector,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    mainLoopService: MainLoopService,
    private homeService: HomeService,
    reincarnationService: ReincarnationService,
    private itemRepoService: ItemRepoService
  ) {
    setTimeout(() => (this.hellService = this.injector.get(HellService)));

    mainLoopService.homeTickSubject.subscribe(() => {
      this.tick();
    });

    mainLoopService.longTickSubject.subscribe(() => {
      let totalPlots = this.fallowPlots;
      for (const field of this.fields) {
        totalPlots += field.plots;
      }
      if (totalPlots > this.mostFields) {
        this.mostFields = totalPlots;
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  tick() {
    if (this.characterService.characterState.dead) {
      return;
    }
    if (!this.hellService?.inHell || this.hellFood) {
      this.ageFields();
    }
  }

  getProperties(): FarmProperties {
    return {
      fields: this.fields,
      autoFieldLimit: this.autoFieldLimit,
      mostFields: this.mostFields,
      hellFood: this.hellFood,
      autoFieldUnlocked: this.autoFieldUnlocked,
      fallowPlots: this.fallowPlots,
      unlockedCrops: this.unlockedCrops,
    };
  }

  setProperties(properties: FarmProperties) {
    this.fields = properties.fields;
    this.autoFieldUnlocked = properties.autoFieldUnlocked || false;
    this.autoFieldLimit = properties.autoFieldLimit || 0;
    this.mostFields = properties.mostFields || 0;
    this.hellFood = properties.hellFood || false;
    this.fallowPlots = properties.fallowPlots;
    this.unlockedCrops = properties.unlockedCrops;
    this.farmedPlots = 0;
    for (const field of this.fields) {
      this.farmedPlots += field.plots;
    }
  }

  reset() {
    if (this.homeService.keepHome) {
      for (const field of this.fields) {
        field.averageYield = 0;
        field.yield = 0;
        field.daysToHarvest = field.originalDaysToHarvest;
      }
    } else {
      this.fields = [];
      this.extraFields = 0;
      this.farmedPlots = 0;
    }
  }

  changeCrop(fieldIndex: number) {
    let cropIndex = this.unlockedCrops.indexOf(this.fields[fieldIndex].cropName);
    cropIndex++;
    if (cropIndex >= this.unlockedCrops.length) {
      cropIndex = 0;
    }
    const cropItem = this.inventoryService.farmFoodList.find(entry => entry.id === this.unlockedCrops[cropIndex]);
    if (!cropItem) {
      // couldn't find the crop, bail out
      return;
    }
    this.fields[fieldIndex].cropName = this.unlockedCrops[cropIndex];
    this.fields[fieldIndex].yield = 0;
    this.fields[fieldIndex].maxPlotYield = Math.floor(200 / cropItem.value);
    this.fields[fieldIndex].daysToHarvest = 180 + cropItem.value;
    this.fields[fieldIndex].originalDaysToHarvest = 180 + cropItem.value;
    this.fields[fieldIndex].averageYield = 0;
    this.fields[fieldIndex].imageFile = cropItem.imageFile;
  }

  /**
   *
   * @param quantity -1 for all
   */
  plowPlot(quantity = 1) {
    if (quantity < 0) {
      quantity = this.homeService.land;
    }
    if (quantity > this.homeService.land) {
      quantity = this.homeService.land;
    }
    this.fallowPlots += quantity;
    this.homeService.land -= quantity;
  }

  /**
   *
   * @param quantity -1 for all
   */
  clearPlot(quantity = 1) {
    if (quantity < 0) {
      quantity = this.fallowPlots;
    }
    if (quantity > this.fallowPlots) {
      quantity = this.fallowPlots;
    }
    this.fallowPlots -= quantity;
    this.homeService.land += quantity;
  }

  addField() {
    const cropItem = this.inventoryService.farmFoodList[0];
    this.fields.push({
      cropName: cropItem.id,
      plots: 0,
      yield: 0,
      maxPlotYield: Math.floor(200 / cropItem.value),
      daysToHarvest: 180 + cropItem.value,
      originalDaysToHarvest: 180 + cropItem.value,
      averageYield: 0,
      imageFile: cropItem.imageFile,
    });
  }

  removeField(fieldIndex: number) {
    this.unassignPlots(-1, fieldIndex);
    this.fields.splice(fieldIndex, 1);
  }

  workFields(workValue: number) {
    for (const field of this.fields) {
      field.yield += workValue * field.plots;
      if (field.yield > field.maxPlotYield * field.plots) {
        field.yield = field.maxPlotYield * field.plots;
      }
    }
  }

  assignFallowPlots(fieldIndex: number, quantity: number = 1) {
    if (quantity > this.fallowPlots) {
      quantity = this.fallowPlots;
    }
    this.fields[fieldIndex].plots += quantity;
    this.farmedPlots += quantity;
    this.fallowPlots -= quantity;
  }

  /**
   *
   * @param quantity -1 for all
   */
  unassignPlots(fieldIndex: number, quantity: number) {
    if (quantity < 0 || quantity > this.fields[fieldIndex].plots) {
      quantity = this.fields[fieldIndex].plots;
    }
    this.fields[fieldIndex].plots -= quantity;
    this.farmedPlots -= quantity;
    this.fallowPlots += quantity;
  }

  ageFields() {
    let totalDailyYield = 0;
    let harvested = false;
    for (const field of this.fields) {
      let fieldYield = 0;
      if (!this.hellService?.inHell && field.plots > 0) {
        if (field.daysToHarvest <= 0) {
          fieldYield = field.yield;
          totalDailyYield += fieldYield;
          this.inventoryService.addItem(this.itemRepoService.items[field.cropName], fieldYield);
          harvested = true;
          field.daysToHarvest = field.originalDaysToHarvest;
          field.yield = 0;
        } else {
          field.daysToHarvest--;
        }
      }
      field.averageYield = (field.averageYield * 364 + fieldYield) / 365;
      if (this.smoothFarming && !harvested && this.fields.length > 0 && field.averageYield > 0.5) {
        // smooth farming bonus crops on a day when no crops are harvested
        this.inventoryService.addItem(this.itemRepoService.items[field.cropName], Math.round(field.averageYield));
      }
    }
    if (totalDailyYield > 0 || this.smoothFarming) {
      this.consecutiveHarvests++;
    } else {
      this.consecutiveHarvests = 0;
    }
  }

  unlockCrop(cropName: string) {
    if (!this.unlockedCrops.includes(cropName)) {
      this.unlockedCrops.push(cropName);
    }
  }
}
