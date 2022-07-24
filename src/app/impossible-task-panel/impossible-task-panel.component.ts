import { Component, OnInit } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';

@Component({
  selector: 'app-impossible-task-panel',
  templateUrl: './impossible-task-panel.component.html',
  styleUrls: ['./impossible-task-panel.component.less', '../app.component.less']
})
export class ImpossibleTaskPanelComponent implements OnInit {

  Math: Math;
  constructor(
    public impossibleTaskService: ImpossibleTaskService,
    public gameStateService: GameStateService
    ) {
      this.Math = Math;
  }

  ngOnInit(): void {
    let a;
  }

}
