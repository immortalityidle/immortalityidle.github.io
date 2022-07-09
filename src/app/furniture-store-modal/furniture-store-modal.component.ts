import { Component } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { Item } from '../game-state/inventory.service';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service'
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-furniture-store-modal',
  templateUrl: './furniture-store-modal.component.html',
  styleUrls: ['./furniture-store-modal.component.less']
})
export class FurnitureStoreModalComponent {

  buyDisabled: boolean = true;

  constructor(
    public storeService: StoreService,
    public characterService: CharacterService,
    public homeService: HomeService,
    public inventoryService: InventoryService,
    public itemRepoService: ItemRepoService,
    public gameStateService: GameStateService
  ) { }

  slotClicked(item: Item){
    if (this.storeService.selectedItem == item){
      this.storeService.selectedItem = null;
      this.buyDisabled = true;
    } else {
      this.storeService.selectedItem = item;
      if (item.owned && item.owned()){
        this.buyDisabled = true;
      } else {
        this.buyDisabled = false;
      }
    }
  }

}
