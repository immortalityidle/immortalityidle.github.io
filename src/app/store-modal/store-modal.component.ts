import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService, Item } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterService } from '../game-state/character.service';
import { NgClass, NgOptimizedImage, TitleCasePipe } from '@angular/common';
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
    forwardRef(() => NgOptimizedImage),
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
    shopable: false,
  };
  purchaseQuantity = 1;

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
    this.buyDisabled = this.storeService.selectedItem === null;

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

  buyItem() {
    const item = this.storeService.selectedItem;
    if (!item) {
      return;
    }
    if (item === this.landItem) {
      this.homeService.buyLand(this.purchaseQuantity);
      this.landItem.value = this.homeService.landPrice;
    } else {
      const price = this.purchaseQuantity * item.value * 10;
      if (this.characterService.money > price) {
        this.inventoryService.addItem(item, this.purchaseQuantity);
        this.characterService.updateMoney(0 - price);
      }
    }
  }

  purchaseQuantityChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.purchaseQuantity = Math.floor(parseFloat(event.target.value));
    if (this.purchaseQuantity < 1) {
      this.purchaseQuantity = 1;
    }
  }
}
