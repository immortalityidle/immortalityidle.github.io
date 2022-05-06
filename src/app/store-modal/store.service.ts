import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { Furniture, InventoryService, Item, instanceOfFurniture } from '../game-state/inventory.service';
import { HomeService } from '../game-state/home.service';
import { ItemRepoService } from '../game-state/item-repo.service';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  manuals: Item[];
  furniture: Furniture[];
  selectedItem: Item | null;
  selling: string = "manuals";

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    private itemRepoService: ItemRepoService,
    public homeService: HomeService
  ) {
    this.selectedItem = null;

    this.manuals = [
      itemRepoService.items['perpetualFarmingManual'],
      itemRepoService.items['autoSellManual'],
      itemRepoService.items['autoUseManual'],
      itemRepoService.items['restartActivityManual'],
      itemRepoService.items['autoBuyLandManual'],
      itemRepoService.items['autoBuyHomeManual'],
      itemRepoService.items['autoFieldManual'],
    ];

    this.furniture = [
      itemRepoService.furniture['blanket'],
      itemRepoService.furniture['mat'],
      itemRepoService.furniture['canopyBed'],
      itemRepoService.furniture['heatedBed'],
      itemRepoService.furniture['bedOfNails'],
    ];

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
      }
    }
  }

}
