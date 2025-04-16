import { Component, forwardRef } from '@angular/core';
import { StoreService } from '../game-state/store.service';
import { Item } from '../game-state/inventory.service';
import { CharacterService } from '../game-state/character.service';
import { Character } from '../game-state/character';
import { HomeService } from '../game-state/home.service';
import { InventoryService } from '../game-state/inventory.service';
import { ItemRepoService } from '../game-state/item-repo.service';
import { GameStateService } from '../game-state/game-state.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-store-modal',
  templateUrl: './manual-store-modal.component.html',
  styleUrls: ['./manual-store-modal.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class ManualStoreModalComponent {
  protected buyDisabled = true;

  constructor(protected storeService: StoreService) {
    storeService.storeOpened = true;
  }

  protected slotClicked(item: Item) {
    if (this.storeService.selectedItem === item) {
      this.storeService.selectedItem = null;
      this.buyDisabled = true;
    } else {
      this.storeService.selectedItem = item;
      if (item.owned && item.owned()) {
        this.buyDisabled = true;
      } else {
        this.buyDisabled = false;
      }
    }
  }
}
