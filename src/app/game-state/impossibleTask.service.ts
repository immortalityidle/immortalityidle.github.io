import { Injectable } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from './reincarnation.service';

export enum ImpossibleTaskType {
  Swim,
  RaiseIsland,
  BuildTower,
  Tamewinds,
  LearnToFly,
  BefriendDragon,
  ConquerTheWorld,
  RearrangeTheStars,
  OvercomeDeath
}

export interface ImpossibleTask {
  name: string,
  taskType: ImpossibleTaskType,
  progress: number, 
  progressRequired: number,
  complete: boolean
}

export interface ImpossibleTaskProperties {
  tasks: ImpossibleTask[],
  impossibleTasksUnlocked: boolean
}

@Injectable({
  providedIn: 'root'
})
export class ImpossibleTaskService {

  impossibleTasksUnlocked: boolean = false;
  activeTaskIndex: number = -1;

  tasks: ImpossibleTask[] = [
    {
      name: "Swim to the bottom of the ocean",
      taskType: ImpossibleTaskType.Swim,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Raise an island from the sea",
      taskType: ImpossibleTaskType.RaiseIsland,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Build a tower past the heavens",
      taskType: ImpossibleTaskType.BuildTower,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Tame the winds",
      taskType: ImpossibleTaskType.Tamewinds,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Learn to fly",
      taskType: ImpossibleTaskType.LearnToFly,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Befriend a dragon",
      taskType: ImpossibleTaskType.BefriendDragon,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Conquer the world",
      taskType: ImpossibleTaskType.ConquerTheWorld,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Rearrange the stars",
      taskType: ImpossibleTaskType.RearrangeTheStars,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Overcome death itself",
      taskType: ImpossibleTaskType.OvercomeDeath,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
  ];

  constructor(
    private logService: LogService,
    private characterService: CharacterService,
    mainLoopService: MainLoopService,
    reincarnationService: ReincarnationService
  ) {

    mainLoopService.tickSubject.subscribe(() => {
      if (this.characterService.characterState.dead){
        return;
      }
    });

    reincarnationService.reincarnateSubject.subscribe(() => {
      this.reset();
    });

  }

  reset(){
    for (let task of this.tasks){
      task.progress = 0;
    }
    this.activeTaskIndex = -1;
  }

  getProperties(): ImpossibleTaskProperties {
    return {
      tasks: this.tasks,
      impossibleTasksUnlocked: this.impossibleTasksUnlocked
    }
  }

  setProperties(properties: ImpossibleTaskProperties) {
    this.tasks = properties.tasks;
    this.impossibleTasksUnlocked = properties.impossibleTasksUnlocked;
  }

  checkCompletion(){
    if (this.activeTaskIndex < 0){
      return;
    }
    let task = this.tasks[this.activeTaskIndex];
    if (task.progress >= task.progressRequired){
      task.complete = true;
      this.activeTaskIndex = -1;
    }
  }

}
