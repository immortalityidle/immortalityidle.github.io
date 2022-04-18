import { Component, OnInit } from '@angular/core';
import { Home } from '../game-state/home';
import { Character } from '../game-state/character';
import { GameStateService } from '../game-state/game-state.service';
import { CharacterService } from '../game-state/character.service';
import { HomeService } from '../game-state/home.service';

@Component({
  selector: 'app-home-panel',
  templateUrl: './home-panel.component.html',
  styleUrls: ['./home-panel.component.less']
})

export class HomePanelComponent implements OnInit {

  home: Home;
  character: Character;

  constructor(
    public characterService: CharacterService,
    homeService: HomeService) {
    this.home = homeService.home;
    this.character = characterService.characterState;
  }

  ngOnInit(): void {
  }

  buyClick(){
    this.character.money -= 100;
    this.character.land += 1;
  }
}
