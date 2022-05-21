import { Component, OnInit } from '@angular/core';
import { Log, LogService, LogTopic } from './log.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less', '../app.component.less']
})
export class LogPanelComponent implements OnInit {

  constructor(public logService: LogService) {
  }

  ngOnInit(): void {
    this.logService.logAdded.subscribe(
      (next) => {
        let log  = this.logService.eventLog;
        if (next.topic == 'COMBAT'){
          log = this.logService.combatLog;
        } else if (next.topic == 'REBIRTH'){
          log = this.logService.rebirthLog;
        }

        if (log.length == 0){
          log.unshift(next);
        } else if (log[0].message.includes(next.message)){
          // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
          let repeatCountString = log[0].message.split(" ").pop()?.replace("(", "")?.replace(")", "");
          let repeatCount: number = 0;
          if (repeatCountString){
            repeatCount = parseInt(repeatCountString);
          }
          if (repeatCount != 0 && !isNaN(repeatCount)){
            repeatCount++;
            log[0].message = next.message + " (" + repeatCount + ")";
          } else {
            // it's the first repeat, give it a repeat count
            log[0].message = next.message + " (2)";
          }
        } else {
          log.unshift(next);
        }
        // check if we need to age off the oldest logs
        if (log.length > 100){
          log.splice(100, 1);
        }
      }
    );
  }

  topicFilterCombat(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('COMBAT');
  }
  topicFilterRebirth(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('REBIRTH');
  }
  topicFilterEvent(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.updateLogTopic('EVENT');
  }
}
