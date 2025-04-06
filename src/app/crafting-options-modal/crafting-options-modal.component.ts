import { Component } from '@angular/core';
import { HomeService } from '../game-state/home.service';
import { FarmService } from '../game-state/farm.service';
import { CharacterService } from '../game-state/character.service';
import { InventoryService } from '../game-state/inventory.service';
import { GameStateService } from '../game-state/game-state.service';
import { FollowersService } from '../game-state/followers.service';
import { AutoBuyerService } from '../game-state/autoBuyer.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-crafting-options-modal',
  imports: [],
  templateUrl: './crafting-options-modal.component.html',
  styleUrl: './crafting-options-modal.component.less',
})
export class CraftingOptionsModalComponent {
  constructor(
    public homeService: HomeService,
    public farmService: FarmService,
    public characterService: CharacterService,
    public inventoryService: InventoryService,
    public gameStateService: GameStateService,
    public followerService: FollowersService,
    public autoBuyerService: AutoBuyerService,
    public mainLoopService: MainLoopService,
    public dialog: MatDialog
  ) {}

  autoPotionChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoPotionEnabled = event.target.checked;
  }

  autoPillChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoPillEnabled = event.target.checked;
  }

  autoequipEnableChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.autoequipBestEnabled = event.target.checked;
  }

  automergeEquippedChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inventoryService.automergeEquipped = event.target.checked;
  }

  //TODO: add better options for autoloading workstation inputs
}
