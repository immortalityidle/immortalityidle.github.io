import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { Inventory, Item } from "../game-state/inventory";

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent implements OnInit {

  inventory: Inventory;

  constructor(gameStateService: GameStateService) {
    this.inventory = gameStateService.gameState.characterState.inventory;
  }

  ngOnInit(): void {
  }

}
