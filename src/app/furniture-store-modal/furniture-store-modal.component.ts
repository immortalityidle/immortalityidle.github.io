import { Component } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { GameStateService } from '../game-state/game-state.service';
import { TooltipDirective } from '@webed/angular-tooltip';
import { DecimalPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-furniture-store-modal',
  templateUrl: './furniture-store-modal.component.html',
  styleUrls: ['./furniture-store-modal.component.less'],
  imports: [TooltipDirective, DecimalPipe, TitleCasePipe],
})
export class FurnitureStoreModalComponent {
  buyDisabled = true;

  constructor(
    public storeService: StoreService,
    public characterService: CharacterService,
    public homeService: HomeService,
    public inventoryService: InventoryService,
    public itemRepoService: ItemRepoService,
    public gameStateService: GameStateService
  ) {}
}
