import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../game-state/store.service';
import { FurnitureStoreModalComponent } from '../furniture-store-modal/furniture-store-modal.component';
import { FarmPanelComponent } from '../farm-panel/farm-panel.component';


@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less', '../app.component.less']
})

export class HomePanelComponent {

  character: Character;

  constructor(public characterService: CharacterService,
    public homeService: HomeService,
    public dialog: MatDialog,
    private storeService: StoreService) {
    this.character = characterService.characterState;
  }

  storeClicked(): void {
    this.storeService.setStoreInventory();
    const dialogRef = this.dialog.open(FurnitureStoreModalComponent, {
      width: '510px',
      data: {someField: 'foo'}
    });
  }

  farmClicked(): void {
    this.storeService.setStoreInventory();
    const dialogRef = this.dialog.open(FarmPanelComponent, {
      width: '800px',
      data: {someField: 'foo'}
    });
  }

  buyClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey){
      this.homeService.buyLand(10);
    } else if (event.ctrlKey){
      this.homeService.buyLand(-1);
    } else {
      this.homeService.buyLand(1);
    }
  }

  plowClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey){
      this.homeService.addField(10);
    } else if (event.ctrlKey){
      this.homeService.addField(-1);
    } else {
      this.homeService.addField();
    }
  }

}
