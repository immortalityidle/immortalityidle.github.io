import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { GameStateService } from '../game-state/game-state.service';
import { DecimalPipe } from '@angular/common';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-ascension-store-modal',
  templateUrl: './ascension-store-modal.component.html',
  styleUrls: ['./ascension-store-modal.component.less'],
  imports: [forwardRef(() => DecimalPipe), forwardRef(() => BigNumberPipe)],
})
export class AscensionStoreModalComponent {
  constructor(
    public storeService: StoreService,
    public characterService: CharacterService,
    public homeService: HomeService,
    public inventoryService: InventoryService,
    public itemRepoService: ItemRepoService,
    public gameStateService: GameStateService
  ) {}
}
