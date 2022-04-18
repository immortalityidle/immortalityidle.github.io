import { Component, OnInit } from '@angular/core';
import { LogService } from './log.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less']
})
export class LogPanelComponent implements OnInit {

  constructor(logService: LogService) {
    logService.logAdded.subscribe(
      (next) => {
        // TODO: Add the log
        console.log(next);
      }
    )
  }

  ngOnInit(): void {
  }

}
