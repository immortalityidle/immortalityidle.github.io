import { Component } from '@angular/core';
import { StoreService } from './store.service';
import { Item } from '../game-state/inventory.service';
import { CharacterService } from '../game-state/character.service';
import { Character } from '../game-state/character';

@Component({
  selector: 'app-store-modal',
  templateUrl: './store-modal.component.html',
  styleUrls: ['./store-modal.component.less']
})
export class StoreModalComponent {
  character: Character;

  constructor(
    public storeService: StoreService,
    public characterService: CharacterService
  ) {
    this.character = characterService.characterState;
  }

  slotClicked(item: Item){
    if (this.storeService.selectedItem == item){
      this.storeService.selectedItem = null;
    } else {
      this.storeService.selectedItem = item;
    }

  }
  buy(){
    this.storeService.buy();
  }
}
