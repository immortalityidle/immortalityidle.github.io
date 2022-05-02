import { Component } from '@angular/core';
import { StoreService } from './store.service';
import { Item } from '../game-state/inventory.service';
import { CharacterService } from '../game-state/character.service';
import { Character } from '../game-state/character';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';

@Component({
  selector: 'app-store-modal',
  templateUrl: './store-modal.component.html',
  styleUrls: ['./store-modal.component.less']
})
export class StoreModalComponent {
  character: Character;
  buyDisabled: boolean = true;

  constructor(
    public storeService: StoreService,
    public characterService: CharacterService,
    public homeService: HomeService,
    public inventoryService: InventoryService
  ) {
    this.character = characterService.characterState;
  }

  slotClicked(item: Item){
    if (this.storeService.selectedItem == item){
      this.storeService.selectedItem = null;
      this.buyDisabled = true;
    } else {
      this.storeService.selectedItem = item;
      if ((item.owned && item.owned()) || this.characterService.characterState.money < item.value){
        this.buyDisabled = true;
      } else {
        this.buyDisabled = false;
      }
    }
  }

  buy(){
    this.storeService.buy();
  }

  autoBuyLandLimitChanged(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.homeService.autoBuyLandLimit = parseInt(event.target.value);
  }
  autoFieldLimitChanged(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.homeService.autoFieldLimit = parseInt(event.target.value);
  }
  autoBuyHomeLimitChanged(event: Event){
    if (!(event.target instanceof HTMLSelectElement)) return;
    this.homeService.autoBuyHomeLimit = parseInt(event.target.value);
  }
}
