import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';
import { MatDialog } from '@angular/material/dialog';
import { StoreService } from '../store-modal/store.service';
import { StoreModalComponent } from '../store-modal/store-modal.component';

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

  buyClick(): void {
    this.homeService.buyLand();
  }

  fieldClick(): void {
    this.homeService.addField();
  }

  storeClicked(): void {
    this.storeService.setStoreInventory("furniture");
    const dialogRef = this.dialog.open(StoreModalComponent, {
      width: '500px',
      data: {someField: 'foo'}
    });
  }

}
