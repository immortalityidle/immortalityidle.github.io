import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-activity-panel',
  templateUrl: './activity-panel.component.html',
  styleUrls: ['./activity-panel.component.less']
})
export class ActivityPanelComponent implements OnInit {

  constructor(gameStateService: GameStateService) {
  }

  ngOnInit(): void {
  }

}
