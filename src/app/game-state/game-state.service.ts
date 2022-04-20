import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { GameState } from './game-state';
import { HomeService } from './home.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  gameState = new GameState();

  constructor(
    private characterService: CharacterService,
    private homeService: HomeService
  ) { }

  reincarnate() {
    this.characterService.characterState.reincarnate();
    this.homeService.reset();
  }
}
