import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { ActivityLoopEntry } from '../game-state/activity';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { LogService } from '../log-panel/log.service';
import { MainLoopService, TICKS_PER_DAY } from '../main-loop.service';


@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less']
})
export class TimePanelComponent implements OnInit {
  TICKS_PER_DAY = TICKS_PER_DAY; // So we can use in template
  character: Character;

  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentIndex = 0;
  currentTickCount = 0;
  exhaustionDays = 0;


  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    private characterService: CharacterService,
    private logService: LogService,
  ) {
    this.character = characterService.characterState;
  }

  ngOnInit(): void {
    this.mainLoopService.tickSubject.subscribe((newDay) => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (newDay && this.exhaustionDays > 0){
        this.exhaustionDays--;
        return;
      }

      if (
        this.activityService.activityLoop.length > 0 &&
        this.currentIndex < this.activityService.activityLoop.length
      ) {
        this.currentLoopEntry = this.activityService.activityLoop[this.currentIndex];
        let activity = this.activityService.getActivityByType(this.currentLoopEntry.activity);
        if (newDay) {
          activity.consequence[activity.level]();
        }

        // check for exhaustion
        if (newDay && this.character.status.stamina.value < 0) {
          // take 5 days to recover, regain stamina, restart loop
          this.logService.addLogMessage(
            'You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.',
            'INJURY', 'EVENT'
          );
          this.exhaustionDays = 5;
          this.character.status.stamina.value = this.character.status.stamina.max;
        }
        if ((this.currentTickCount / TICKS_PER_DAY) <= this.currentLoopEntry.repeatTimes) {
          this.currentTickCount++;
        } else {
          this.currentIndex++;
          this.currentTickCount = 2;
          if (this.currentIndex == this.activityService.activityLoop.length) {
            this.currentIndex = 0;
          }
          this.currentLoopEntry = this.activityService.activityLoop[this.currentIndex];
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
