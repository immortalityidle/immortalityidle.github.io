import { Injectable, Injector } from '@angular/core';
import { LogService } from './log.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../main-loop.service';
import { ReincarnationService } from './reincarnation.service';
import { ActivityService } from './activity.service';

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
  description: string,
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

  activityService?: ActivityService;
  impossibleTasksUnlocked: boolean = false;
  activeTaskIndex: number = -1;
  nextTask: number = 0;

  tasks: ImpossibleTask[] = [
    {
      name: "Swim to the bottom of the ocean",
      description: "You find a scrap in an ancient text that leads you to believe that the secret of immortality lies buried deep beneath the ocean's currents.",
      taskType: ImpossibleTaskType.Swim,
      progress: 0,
      progressRequired: 100000,
      complete: false,
    },
    {
      name: "Raise an island from the sea",
      description: "At the bottom of the ocean you find a sunken island full of mystical wonders. Some of them will certainly help you in your quest for immortality, but they look too fragile to move by themselves. You'll need to pull the entire island to the surface.",
      taskType: ImpossibleTaskType.RaiseIsland,
      progress: 0,
      progressRequired: 10000,
      complete: false,
    },
    {
      name: "Build a tower past the heavens",
      description: "The undersea wonders point you to a secret shrine high above the clouds. You'll need to build an impossibly tall tower to reach it.",
      taskType: ImpossibleTaskType.BuildTower,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Tame the winds",
      description: "The entrance to the shrine is sealed by a fierce hurricane that never stops blowing. You'll need to defeat the power of the storm to get in.",
      taskType: ImpossibleTaskType.Tamewinds,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Learn to fly",
      description: "A carving in the sky shrine shows you that the ancient dragons have the secret of immortality. The dragons never fly where mortals can reach them, but fortunately the shrine contains an inscription that teaches you the fundamentals of flight.",
      taskType: ImpossibleTaskType.LearnToFly,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Befriend a dragon",
      description: "You fly far and wide across the world and finally find an ancient dragon.",
      taskType: ImpossibleTaskType.BefriendDragon,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Conquer the world",
      description: "The dragon finally relents and allows you to speak with it. It shows you the fighting and suffering in the mortal realm and says the situation is most displeasing. Before he will help you, he wants you to solve the proble. Guess it's time to conquer the world and set all things right.",
      taskType: ImpossibleTaskType.ConquerTheWorld,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Rearrange the stars",
      description: "The dragon smiles approvingly and teaches you the secrets of drawing power from the heavens. You could perform the ritual to achieve immortality now if the stars were properly aligned, but that won't happen again for billions of years. Maybe you could help it along.",
      taskType: ImpossibleTaskType.RearrangeTheStars,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
    {
      name: "Overcome death itself",
      description: "The stars are aligned, the power to achieve immortality is finally within your grasp. The only thing you need to do now is use it to defeat death.",
      taskType: ImpossibleTaskType.OvercomeDeath,
      progress: 0,
      progressRequired: 1000,
      complete: false,
    },
  ];

  constructor(
    private injector: Injector,
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

    mainLoopService.longTickSubject.subscribe(() => {
      if (this.nextTask >= this.tasks.length){
        // all tasks done
        return;
      }
      for (let i = 0; i < this.tasks.length; i++){
        if (this.tasks[i].complete && this.tasks[i].taskType == this.nextTask){
          this.nextTask++;
          return;
        }
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
      this.stopTask();
    }
  }

  startTask(){
    this.activeTaskIndex = this.nextTask;
    if (!this.activityService){
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
  }

  stopTask(){
    this.activeTaskIndex = -1;
    if (!this.activityService){
      this.activityService = this.injector.get(ActivityService);
    }
    this.activityService.reloadActivities();
  }

}
