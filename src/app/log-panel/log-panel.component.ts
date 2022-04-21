import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LogService } from './log.service';

@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.component.html',
  styleUrls: ['./log-panel.component.less']
})
export class LogPanelComponent implements OnInit {
  log: string[] = ["Once in a very long while, a soul emerges from the chaos that is destined for immortality. You are such a soul. Your journey to immortality begins as a humble youth leaves home to experience the world. Be careful, the world can be a dangerous place."];

  constructor(logService: LogService) {
    logService.logAdded.subscribe(
      (next) => {
        if (this.log.length == 0){
          this.log.unshift(next);
        } else if (this.log[0].includes(next)){
          // the line is a repeat, increment the repeat count at the end of the line instead of adding a new line
          let repeatCountString = this.log[0].split(" ").pop()?.replace("(", "")?.replace(")", "");
          let repeatCount: number = 0;
          if (repeatCountString){
            repeatCount = parseInt(repeatCountString);
          }
          if (repeatCount != 0 && !isNaN(repeatCount)){
            repeatCount++;
            this.log[0] = next + " (" + repeatCount + ")";
          } else {
            // it's the first repeat, give it a repeat count
            this.log[0] = next + " (2)";
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

  ngOnInit(): void {
  }

}
