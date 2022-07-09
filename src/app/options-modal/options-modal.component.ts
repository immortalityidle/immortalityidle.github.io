import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService, BalanceItem } from '../game-state/inventory.service';

@Component({
  selector: 'app-options-modal',
  templateUrl: './options-modal.component.html',
  styleUrls: ['./options-modal.component.less']
})
export class OptionsModalComponent {

  constructor(
    public homeService: HomeService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService
  ) { }

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

  autoBalanceUseChanged(event: Event, balanceItem: BalanceItem){
    if (!(event.target instanceof HTMLInputElement)) return;
    balanceItem.useNumber = parseInt(event.target.value);
  }

  autoBalanceSellChanged(event: Event, balanceItem: BalanceItem){
    if (!(event.target instanceof HTMLInputElement)) return;
    balanceItem.sellNumber = parseInt(event.target.value);
  }

  useSpiritGemWeaponsChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.useSpiritGemWeapons = event.target.checked;
  }

  useSpiritGemPotionsChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.useSpiritGemPotions = event.target.checked;
  }

}
