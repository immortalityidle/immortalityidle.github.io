import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { InventoryService, ItemStack } from '../game-state/inventory.service';

@Component({
  selector: 'app-inventory-panel',
  templateUrl: './inventory-panel.component.html',
  styleUrls: ['./inventory-panel.component.less']
})
export class InventoryPanelComponent implements OnInit {
  selectedItem: ItemStack | null = null;
  constructor(public inventoryService: InventoryService,
    public characterService: CharacterService) {
  }

  ngOnInit(): void {
  }

  slotClicked(item: ItemStack){
    if (this.selectedItem == item){
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    console.log(this.selectedItem);
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

  use(){
    if (this.selectedItem){
      this.inventoryService.useItem(this.selectedItem);
    }
  }
}
