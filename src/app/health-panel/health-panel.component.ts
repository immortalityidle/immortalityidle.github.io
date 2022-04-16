import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less']
})
export class HealthPanelComponent implements OnInit {

  constructor(public gameStateService: GameStateService) { }

  ngOnInit(): void {
  }

}
