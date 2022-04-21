import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, Item } from '../game-state/inventory.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent implements OnInit {
  selectedItem: Item | null = null;
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
  }

  ngOnInit(): void {
  }

  slotClicked(item: Item){
    if (this.selectedItem == item){
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
  }

  sellAll(){
    if (this.selectedItem){
      this.sell(this.selectedItem.quantity);
    }
  }

  sell(quantity: number){
    if (this.selectedItem){
      this.inventoryService.sell(this.selectedItem, quantity);
      if (this.selectedItem.quantity == quantity){
        this.selectedItem = null;
      }
    }
  }
}
