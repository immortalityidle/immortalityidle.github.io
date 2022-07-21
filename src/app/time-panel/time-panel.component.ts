import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../game-state/activity.service';
import { AchievementService } from '../game-state/achievement.service';
import { ActivityLoopEntry, ActivityType } from '../game-state/activity';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { AutoPauserService } from '../game-state/autoPauser.service';
import { LogService } from '../game-state/log.service';
import { MainLoopService } from '../game-state/main-loop.service';


@Component({
  selector: 'app-time-panel',
  templateUrl: './time-panel.component.html',
  styleUrls: ['./time-panel.component.less', '../app.component.less']
})
export class TimePanelComponent implements OnInit {

  unlockFastSpeed = false;
  unlockFasterSpeed = false;
  unlockFastestSpeed = false;

  constructor(
    public mainLoopService: MainLoopService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public autoPauserService: AutoPauserService,
  ) {
  }

  ngOnInit(): void {
    let a;
  }

  pauseClick(){
    if (this.mainLoopService.pause){
      this.mainLoopService.tick();
    } else {
      this.mainLoopService.pause = true;
    }
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

  onPlusClick(entry: ActivityLoopEntry, event: MouseEvent): void{
    event.preventDefault();
    event.stopPropagation();
    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1
    repeat *= event.shiftKey ? 10 : 1
    repeat *= event.ctrlKey ? 10 : 1

    entry.repeatTimes += repeat
  }

  onMinusClick(entry: ActivityLoopEntry, event: MouseEvent): void{
    event.preventDefault();
    event.stopPropagation();
    // Shift and Ctrl both multiply by 10x, combined does 100
    let repeat = 1
    repeat *= event.shiftKey ? 10 : 1
    repeat *= event.ctrlKey ? 10 : 1

    entry.repeatTimes -= repeat

    if (entry.repeatTimes < 0) {
      entry.repeatTimes = 0;
    }
  }

  onRemoveClick(entry: ActivityLoopEntry): void{
    const index = this.activityService.activityLoop.indexOf(entry);
    // make sure we're not running past the end of the entries array
    if (this.activityService.currentIndex >= this.activityService.activityLoop.length - 1){
      this.activityService.currentIndex = 0;
    }
    this.activityService.activityLoop.splice(index,1);
  }

  removeSpiritActivity(){
    this.activityService.spiritActivity = null;
  }

  pauseOnDeath(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    //this.activityService.pauseOnDeath = event.target.checked;
    this.autoPauserService.autoPauserSettings.find('death').enabled = event.target.checked;
    //TODO: Consider if we want to leave the option in the time modal, or move or duplicate it in the options modal
  }

  useSavedTicks(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    this.mainLoopService.useBankedTicks = event.target.checked;
  }

  allowDrop(event: DragEvent){
    if (event.dataTransfer?.types[0] === "activityloop" || event.dataTransfer?.types[0] === "activity"){
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
    if (sourceIndexString === ""){
      sourceIndexString = event.dataTransfer?.getData("activity") + "";
      if (sourceIndexString === ""){
        // could find a source from either of the acceptable locations
        return;
      }
      const sourceType = parseInt(sourceIndexString);
      const newEntry = {
        activity: sourceType,
        repeatTimes: 1
      };
      if (destIndex >= this.activityService.activityLoop.length){
        this.activityService.activityLoop.push(newEntry);
      } else {
        this.activityService.activityLoop.splice(destIndex, 0, newEntry);
      }
    } else {
      const sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length){
        const activity = this.activityService.activityLoop.splice(sourceIndex, 1);
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
    event.stopPropagation();
    let sourceIndexString: string = event.dataTransfer?.getData("activityloop") + "";
    if (sourceIndexString === ""){
      sourceIndexString = event.dataTransfer?.getData("activity") + "";
      if (sourceIndexString === ""){
        // could find a source from either of the acceptable locations
        return;
      }
      const sourceType = parseInt(sourceIndexString);
      this.activityService.spiritActivity = sourceType;
    } else {
      const sourceIndex = parseInt(sourceIndexString);
      if (sourceIndex >= 0 && sourceIndex < this.activityService.activityLoop.length){
        const activity = this.activityService.activityLoop[sourceIndex].activity;
        this.activityService.spiritActivity = activity;
      }
    }
  }

}
