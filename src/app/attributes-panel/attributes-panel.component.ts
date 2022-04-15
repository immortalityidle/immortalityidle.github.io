import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less']
})
export class AttributesPanelComponent implements OnInit {

  constructor(public gameStateService: GameStateService) { }

  ngOnInit(): void {
  }

}
