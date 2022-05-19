import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { Furniture, InventoryService, Item, instanceOfFurniture } from '../game-state/inventory.service';
import { HomeService } from '../game-state/home.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  manuals: Item[];
  furniture: Furniture[];
  selectedItem: Item | null;
  soulCoreRank: number = 0;
  meridianRank: number = 0;

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
    for (let key in itemRepoService.items){
      let item = itemRepoService.items[key];
      if (item.type == 'manual'){
        this.manuals.push(itemRepoService.items[key]);
      }
    }
    this.furniture = [];

  }

  setStoreInventory(){
    this.furniture = [];
    for (let key in this.itemRepoService.furniture){
      let furniture = this.itemRepoService.furniture[key];
      if (this.homeService.home.furnitureSlots.includes(furniture.slot)){
        this.furniture.push(furniture);
      }
    }
    this.selectedItem = null;
  }

  buyManual(){
    if (this.selectedItem){
      if (this.selectedItem.value < this.characterService.characterState.money){
        this.characterService.characterState.money -= this.selectedItem.value;
        if (this.selectedItem.type == 'manual' && this.selectedItem.use){
          // use manuals immediately
          this.selectedItem.use();
        } else {
          this.inventoryService.addItem(this.selectedItem);
        }
      }
    }
  }

  buyFurniture(){
    if (this.selectedItem){
      if (!instanceOfFurniture(this.selectedItem)) {
        return;
      }
      let slot = this.selectedItem.slot;
      if (this.selectedItem.value < this.characterService.characterState.money){
        this.characterService.characterState.money -= this.selectedItem.value;
        this.homeService.furniture[slot] = this.selectedItem;
        this.homeService.autoBuyFurniture[slot] = this.selectedItem;
      }
    }
  }

  updateAscensions(){
    this.soulCoreRank = this.characterService.sourCoreRank();
    this.meridianRank = this.characterService.meridianRank();
  }

  condenseSoulCore(){
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.condenseSoulCoreCost){
      this.logService.addLogMessage("You don't have the spirituality required for to ascend.","INJURY","EVENT");
      return;
    }
    this.characterService.condenseSoulCore();
    this.dialog.closeAll();
  }

  reinforceMeridians(){
    if (this.characterService.characterState.attributes.spirituality.value < this.characterService.characterState.reinforceMeridiansCost){
      this.logService.addLogMessage("You don't have the spirituality required for to ascend.","INJURY","EVENT");
      return;
    }
    this.characterService.reinforceMeridians();
    this.dialog.closeAll();
  }

}
