import { Component, OnInit } from '@angular/core';
import { Log, LogService, LogTopic } from './log.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less']
})
export class LogPanelComponent implements OnInit {
  log: Log[] = [
    {message: "Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul.", type: 'STANDARD', topic: 'EVENT'},
    {message: "Your journey to immortality begins as a humble youth leaves home to experience the world.", type: 'STANDARD', topic: 'EVENT'},
    {message: "Be careful, the world can be a dangerous place.", type: 'STANDARD', topic: 'EVENT'},
  ];


  constructor(public logService: LogService) {
  }

  ngOnInit(): void {
    this.logService.logAdded.subscribe(
      (next) => {
        if (this.log.length == 0){
          this.log.unshift(next);
        } else if (this.log[0].message.includes(next.message)){
          // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
          let repeatCountString = this.log[0].message.split(" ").pop()?.replace("(", "")?.replace(")", "");
          let repeatCount: number = 0;
          if (repeatCountString){
            repeatCount = parseInt(repeatCountString);
          }
          if (repeatCount != 0 && !isNaN(repeatCount)){
            repeatCount++;
            this.log[0].message = next.message + " (" + repeatCount + ")";
          } else {
            // it's the first repeat, give it a repeat count
            this.log[0].message = next.message + " (2)";
          }
        } else {
          this.log.unshift(next);
        }
        // check if we need to age off the oldest logs
        if (this.log.length > 100){
          this.log.splice(100, 1);
        }
      }
    );
  }

  topicFilterSystem(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.systemTopicEnabled = event.target.checked;
    this.logService.updateEnabledTopics();
  }
  topicFilterCombat(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.combatTopicEnabled = event.target.checked;
    this.logService.updateEnabledTopics();
  }
  topicFilterRebirth(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.rebirthTopicEnabled = event.target.checked;
    this.logService.updateEnabledTopics();
  }
  topicFilterEvent(event: Event ){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.logService.eventTopicEnabled = event.target.checked;
    this.logService.updateEnabledTopics();
  }
}
