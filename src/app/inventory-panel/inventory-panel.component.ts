import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';
import { InventoryService } from '../game-state/inventory.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent implements OnInit {
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
  }

  ngOnInit(): void {
  }

}
