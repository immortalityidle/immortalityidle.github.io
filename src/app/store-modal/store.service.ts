import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  storeItems: Item[];
  selectedItem: Item | null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService,
    itemRepoService: ItemRepoService
  ) {
    this.selectedItem = null;

    this.storeItems = [
      itemRepoService.perpetualFarmingManual,
      itemRepoService.autoSellManual,
      itemRepoService.autoUseManual,
      itemRepoService.restartActivityManual,
    ];
  }

  buy(){
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

}
