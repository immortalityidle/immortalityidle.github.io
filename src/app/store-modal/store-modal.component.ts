import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterService } from '../game-state/character.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { MainLoopService } from '../game-state/main-loop.service';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-store-modal',
  templateUrl: './store-modal.component.html',
  styleUrls: ['./store-modal.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class StoreModalComponent {
  buyDisabled = true;

  landItem = {
    id: 'land',
    name: 'land',
    description:
      'A plot of empty land, suitable for building a home on or plowing into a farm field.<br>Price increases with each plot purchased',
    value: 100,
    type: 'land',
    imageFile: 'land',
  };

  constructor(
    public storeService: StoreService,
    public homeService: HomeService,
    public inventoryService: InventoryService,
    private characterService: CharacterService,
    public itemRepoService: ItemRepoService,
    public gameStateService: GameStateService,
    mainloopService: MainLoopService
  ) {
    this.landItem.value = this.homeService.landPrice;

    mainloopService.reincarnateSubject.subscribe(() => {
      this.landItem.value = this.homeService.landPrice;
    });
  }

  slotClicked(item: Item) {
    if (this.storeService.selectedItem === item) {
      this.storeService.selectedItem = null;
      this.buyDisabled = true;
    } else {
      this.storeService.selectedItem = item;
      this.buyDisabled = false;
    }
  }

  buyItem(quantity: number) {
    const item = this.storeService.selectedItem;
    if (!item) {
      return;
    }
    if (item === this.landItem) {
      this.homeService.buyLand(quantity);
      this.landItem.value = this.homeService.landPrice;
    } else {
      const price = quantity * item.value * 2;
      if (this.characterService.money > price) {
        this.inventoryService.addItem(item, quantity);
        this.characterService.updateMoney(0 - price);
      }
    }
  }
}
