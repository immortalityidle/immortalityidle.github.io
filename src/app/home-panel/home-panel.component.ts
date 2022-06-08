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

  upgradeClick(): void {
    this.homeService.upgradeToNextHome();
  }

  storeClicked(): void {
    this.storeService.setStoreInventory();
    const dialogRef = this.dialog.open(FurnitureStoreModalComponent, {
      width: '500px',
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
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.buyLand();
      }
    } else if (event.ctrlKey){
      while (this.character.money > this.homeService.landPrice){
        this.homeService.buyLand();
      }
    } else {
      this.homeService.buyLand();
    }
  }

  plowClicked(event: MouseEvent): void {
    if (event.shiftKey){
      for (let i = 0; i < 10; i++){
        this.homeService.addField();
      }
    } else if (event.ctrlKey){
      while (this.homeService.land > 0){
        this.homeService.addField();
      }
    } else {
      this.homeService.addField();
    }
  }

}
