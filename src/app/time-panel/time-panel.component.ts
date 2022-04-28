import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { ActivityLoopEntry } from '../game-state/activity';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';


@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less']
})
export class TimePanelComponent implements OnInit {
  character: Character;

  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentIndex = 0;
  currentTickCount = 0;


  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    characterService: CharacterService,
    private logService: LogService,
  ) {
    this.character = characterService.characterState;
  }

  ngOnInit(): void {
    this.mainLoopService.tickSubject.subscribe(() => {
      if (
        this.activityService.activityLoop.length > 0 &&
        this.currentIndex < this.activityService.activityLoop.length
      ) {
        this.currentLoopEntry = this.activityService.activityLoop[this.currentIndex];
        let activity = this.activityService.getActivityByType(this.currentLoopEntry.activity);
        activity.consequence[activity.level]();
        //this.logService.addLogMessage("You spend the day doing " + this.currentLoopEntry.activity.name);

        // check for exhaustion
        if (this.character.status.stamina.value < 0) {
          // take 5 days to recover, regain stamina, restart loop
          this.logService.addLogMessage(
            'You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.',
            'INJURY'
          );
          this.character.age += 5;
          this.character.status.stamina.value =
            this.character.status.stamina.max;
          this.currentTickCount = 0;
          this.currentIndex = 0;
        }
        if (this.currentTickCount < this.currentLoopEntry.repeatTimes - 1) {
          this.currentTickCount++;
        } else {
          this.currentIndex++;
          this.currentTickCount = 0;
          if (this.currentIndex == this.activityService.activityLoop.length) {
            this.currentIndex = 0;
          }
        }
      } else if (this.activityService.activityLoop.length == 0){
        //automatically pause if there are no activities so you don't accidentally just die doing nothing
        this.mainLoopService.pause = true;
      } else {
        // make sure that we reset the current index if activities get removed below the currentIndex
        this.currentIndex = 0;
      }
    });
  }

  pauseClick(){
    this.mainLoopService.pause = !this.mainLoopService.pause;
  }

  onPlusClick(entry: ActivityLoopEntry): void{
    entry.repeatTimes++;
  }

  onMinusClick(entry: ActivityLoopEntry): void{
    entry.repeatTimes--;
  }

  onUpClick(entry: ActivityLoopEntry): void{
    let index = this.activityService.activityLoop.indexOf(entry);
    if (index != 0 && this.activityService.activityLoop.length > 1){
      let swapper = this.activityService.activityLoop[index - 1];
      this.activityService.activityLoop[index - 1] = entry;
      this.activityService.activityLoop[index] = swapper;
    }
  }

  onDownClick(entry: ActivityLoopEntry): void{
    let index = this.activityService.activityLoop.indexOf(entry);
    if (index != this.activityService.activityLoop.length - 1 && this.activityService.activityLoop.length > 1){
      let swapper = this.activityService.activityLoop[index + 1];
      this.activityService.activityLoop[index + 1] = entry;
      this.activityService.activityLoop[index] = swapper;
    }
  }

  onRemoveClick(entry: ActivityLoopEntry): void{
    let index = this.activityService.activityLoop.indexOf(entry);
    // make sure we're not running past the end of the entries array
    if (this.currentIndex >= this.activityService.activityLoop.length - 1){
      this.currentIndex = 0;
    }
    this.activityService.activityLoop.splice(index,1);
  }

}
