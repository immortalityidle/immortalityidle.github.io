import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { Inventory, Item } from "../game-state/inventory";
import { Character } from '../game-state/character';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent implements OnInit {

  inventory: Inventory;
  character: Character;


  constructor(gameStateService: GameStateService) {
    this.character = gameStateService.gameState.characterState;
    this.inventory = this.character.inventory;
  }

  ngOnInit(): void {
  }

}
