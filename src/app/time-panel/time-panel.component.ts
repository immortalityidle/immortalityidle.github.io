import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../activity-panel/activity.service';
import { AchievementService } from '../game-state/achievement.service';
import { ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { LogService } from '../log-panel/log.service';
import { MainLoopService } from '../main-loop.service';


@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less']
})
export class TimePanelComponent implements OnInit {
  character: Character;

  currentLoopEntry?: ActivityLoopEntry = undefined;
  currentIndex = 0;
  currentTickCount = 0;
  exhaustionDays = 0;

  unlockFastSpeed: boolean = false;
  unlockFasterSpeed: boolean = false;
  unlockFastestSpeed: boolean = false;

  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    private logService: LogService,
    private achievmentService: AchievementService
  ) {
    this.character = characterService.characterState;
  }

  ngOnInit(): void {
    this.mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
      if (this.exhaustionDays > 0){
        this.exhaustionDays--;
        return;
      }

      if (
        this.activityService.activityLoop.length > 0 &&
        this.currentIndex < this.activityService.activityLoop.length
      ) {
        this.currentLoopEntry = this.activityService.activityLoop[this.currentIndex];
        let activity = this.activityService.getActivityByType(this.currentLoopEntry.activity);
        activity.consequence[activity.level]();

        // check for exhaustion
        if (this.character.status.stamina.value < 0) {
          // take 5 days to recover, regain stamina, restart loop
          this.logService.addLogMessage(
            'You collapse to the ground, completely exhausted. It takes you 5 days to recover enough to work again.',
            'INJURY', 'EVENT'
          );
          this.exhaustionDays = 5;
          this.character.status.stamina.value = this.character.status.stamina.max;
        }
        if (this.currentTickCount <= this.currentLoopEntry.repeatTimes) {
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
      if (this.activityService.spiritActivity && this.characterService.characterState.status.mana.value >= 5){
        let activity = this.activityService.getActivityByType(this.activityService.spiritActivity);
        activity.consequence[activity.level]();
        this.characterService.characterState.status.mana.value -= 5;
      }
    });
  }

  pauseClick(){
    this.mainLoopService.pause = true;
  }

  standardClick(){
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 10;
  }

  fastClick(){
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 5;
  }

  fasterClick(){
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 2;
  }

  fastestClick(){
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 1;
  }

  onPlusClick(entry: ActivityLoopEntry): void{
    entry.repeatTimes++;
  }

  onMinusClick(entry: ActivityLoopEntry): void{
    if (entry.repeatTimes > 0) {
      entry.repeatTimes--;
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

  removeSpiritActivity(){
    this.activityService.spiritActivity = null;
  }

  pauseOnDeath(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.activityService.pauseOnDeath = event.target.checked;
  }

  allowDrop(event: DragEvent){
    if (event.dataTransfer?.types[0] == "activityloop" || event.dataTransfer?.types[0] == "activity"){
      event.preventDefault();
    }
  }

  drag(sourceIndex: number, event: DragEvent){
    event.dataTransfer?.setData("activityloop", "" + sourceIndex);
  }

  drop(destIndex: number, event: DragEvent){
    event.preventDefault();
    event.stopPropagation();
    let sourceIndexString: string = event.dataTransfer?.getData("activityloop") + "";
    if (sourceIndexString == ""){
      sourceIndexString = event.dataTransfer?.getData("activity") + "";
      if (sourceIndexString == ""){
        // could find a source from either of the acceptable locations
        return;
      }
      let sourceType = parseInt(sourceIndexString);
      let newEntry = {
        activity: sourceType,
        repeatTimes: 1
      };
      if (destIndex >= this.activityService.activityLoop.length){
        this.activityService.activityLoop.push(newEntry);
      } else {
        this.activityService.activityLoop.splice(destIndex, 0, newEntry);
      }
    } else {
      let sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length){
        let activity = this.activityService.activityLoop.splice(sourceIndex, 1);
        if (destIndex >= this.activityService.activityLoop.length){
          this.activityService.activityLoop.push(activity[0]);
        } else {
          this.activityService.activityLoop.splice(destIndex, 0, activity[0]);
        }
      }  
    }
  }

  spiritActivityDrop(event: DragEvent){
    event.preventDefault();
    let sourceIndexString: string = event.dataTransfer?.getData("activityloop") + "";
    if (sourceIndexString == ""){
      sourceIndexString = event.dataTransfer?.getData("activity") + "";
      if (sourceIndexString == ""){
        // could find a source from either of the acceptable locations
        return;
      }
      let sourceType = parseInt(sourceIndexString);
      this.activityService.spiritActivity = sourceType;
    } else {    
      let sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length){
        let activity = this.activityService.activityLoop[sourceIndex].activity;
        this.activityService.spiritActivity = activity;
      }
    }
  }  

}
