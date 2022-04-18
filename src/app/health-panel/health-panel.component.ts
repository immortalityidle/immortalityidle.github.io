import { Component, OnInit } from '@angular/core';
import { Character } from '../game-state/character';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less']
})
export class HealthPanelComponent implements OnInit {

  character: Character;

  constructor(public gameStateService: GameStateService) { 
    this.character = gameStateService.gameState.characterState;
  }

  ngOnInit(): void {
  }

}
