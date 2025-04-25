import { Component, forwardRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { FollowersService } from '../game-state/followers.service';
import { GameStateService } from '../game-state/game-state.service';
import { HomeService } from '../game-state/home.service';
import { InventoryService, BalanceItem, AutoItemEntry } from '../game-state/inventory.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { FarmService } from '../game-state/farm.service';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-inventory-options-modal',
  imports: [
    forwardRef(() => TitleCasePipe),
    forwardRef(() => MatTabGroup),
    forwardRef(() => MatTab),
    forwardRef(() => MatTabLabel),
  ],
  templateUrl: './inventory-options-modal.component.html',
  styleUrl: './inventory-options-modal.component.less',
})
export class InventoryOptionsModalComponent {
  constructor(
    public homeService: HomeService,
    public farmService: FarmService,
    public characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService,
    public followerService: FollowersService,
    public mainLoopService: MainLoopService,
    private activityService: ActivityService,
    public dialog: MatDialog
  ) {}

  autoSellReserveChange(event: Event, autosellEntry: AutoItemEntry) {
    if (!(event.target instanceof HTMLInputElement)) return;
    autosellEntry.reserve = Math.floor(parseFloat(event.target.value));
    if (!autosellEntry.reserve) {
      autosellEntry.reserve = 0;
    }
  }

  autoUseReserveChange(event: Event, autouseEntry: AutoItemEntry) {
    if (!(event.target instanceof HTMLInputElement)) return;
    autouseEntry.reserve = Math.floor(parseFloat(event.target.value));
    if (!autouseEntry.reserve) {
      autouseEntry.reserve = 0;
    }
  }

  autoBalanceUseChanged(event: Event, balanceItem: BalanceItem) {
    if (!(event.target instanceof HTMLInputElement)) return;
    balanceItem.useNumber = Math.floor(parseFloat(event.target.value));
    if (!balanceItem.useNumber) {
      balanceItem.useNumber = 0;
    }
  }

  autoBalanceSellChanged(event: Event, balanceItem: BalanceItem) {
    if (!(event.target instanceof HTMLInputElement)) return;
    balanceItem.sellNumber = Math.floor(parseFloat(event.target.value));
    if (!balanceItem.sellNumber) {
      balanceItem.sellNumber = 0;
    }
  }

  autoEatNutritionChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoEatNutrition = event.target.checked;
  }

  autoEatHealthChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoEatHealth = event.target.checked;
  }

  autoEatStaminaChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoEatStamina = event.target.checked;
  }

  autoEatQiChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoEatQi = event.target.checked;
  }

  autoEatAllChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoEatAll = event.target.checked;
  }

  useSpiritGemWeaponsChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.useSpiritGemWeapons = event.target.checked;
  }

  useSpiritGemPotionsChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.useSpiritGemPotions = event.target.checked;
  }

  useCheapestSpiritGemChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.useCheapestSpiritGem = event.target.checked;
  }

  autoSellOldHerbs(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldHerbsEnabled = event.target.checked;
  }

  autoSellOldWood(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldWoodEnabled = event.target.checked;
  }

  autoSellOldOre(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldOreEnabled = event.target.checked;
  }

  autoSellOldBars(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldBarsEnabled = event.target.checked;
  }

  autoSellOldHides(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldHidesEnabled = event.target.checked;
  }

  autoSellOldGems(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoSellOldGemsEnabled = event.target.checked;
  }

  autoBuyFoodChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoBuyFood = event.target.checked;
  }
}
