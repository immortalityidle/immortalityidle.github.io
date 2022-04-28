import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less']
})

export class HomePanelComponent {

  character: Character;

  constructor(public characterService: CharacterService,
    public homeService: HomeService) {
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
}
