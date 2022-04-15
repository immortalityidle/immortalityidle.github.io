import { Injectable } from '@angular/core';
import { GameState } from './game-state';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  gameState = new GameState();

  constructor() { }
}
