import { Injectable } from '@angular/core';
import { LogService } from '../log-panel/log.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';

@Injectable({
  providedIn: 'root'
})

export class StoreService {
  storeItems: Item[];
  selectedItem: Item | null;

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    private inventoryService: InventoryService
  ) {
    this.selectedItem = null;

    this.storeItems = [
      inventoryService.itemRepo['farmingManual']
    ];
  }

  buy(){
    if (this.selectedItem){
      if (this.selectedItem.value < this.characterService.characterState.money){
        this.characterService.characterState.money -= this.selectedItem.value;
        this.inventoryService.addItem(this.selectedItem);
      }
    }
  }

}
