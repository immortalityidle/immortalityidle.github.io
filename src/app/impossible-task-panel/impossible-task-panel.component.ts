import { Component, OnInit } from '@angular/core';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';

@Component({
  selector: 'app-impossible-task-panel',
  templateUrl: './impossible-task-panel.component.html',
  styleUrls: ['./impossible-task-panel.component.less', '../app.component.less']
})
export class ImpossibleTaskPanelComponent implements OnInit {

  constructor(public impossibleTaskService: ImpossibleTaskService) { 

  }

  ngOnInit(): void {
  }

}
