import { Component } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { Item } from '../game-state/inventory.service';
import { CharacterService } from '../game-state/character.service';
import { Character } from '../game-state/character';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service'
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-store-modal',
  templateUrl: './manual-store-modal.component.html',
  styleUrls: ['./manual-store-modal.component.less', '../app.component.less']
})
export class ManualStoreModalComponent {
  character: Character;
  buyDisabled = true;

  constructor(
    public storeService: StoreService,
    public characterService: CharacterService,
    public homeService: HomeService,
    public inventoryService: InventoryService,
    public itemRepoService: ItemRepoService,
    public gameStateService: GameStateService

  ) {
    this.character = characterService.characterState;
    storeService.storeOpened = true;
  }

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
