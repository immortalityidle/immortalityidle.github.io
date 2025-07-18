import { Injectable, Injector } from '@angular/core';
import { MainLoopService } from './main-loop.service';
import { ActivityService } from './activity.service';
import { BattleService } from './battle.service';
import { LocationService } from './location.service';
import { LocationType } from './activity';
import { LogService, LogTopic } from './log.service';
import { CamelToTitlePipe } from '../pipes';

export enum ImpossibleTaskType {
  Swim,
  RaiseIsland,
  BuildTower,
  TameWinds,
  LearnToFly,
  BefriendDragon,
  ConquerTheNation,
  RearrangeTheStars,
  OvercomeDeath,
}

export interface ImpossibleTask {
  name: string;
  description: string;
  taskType: ImpossibleTaskType;
  progressRequired: number;
  location?: LocationType;
}

export interface ImpossibleTaskProgress {
  progress: number;
  complete: boolean;
}

export interface ImpossibleTaskProperties {
  taskProgress: ImpossibleTaskProgress[];
  impossibleTasksUnlocked: boolean;
  activeTaskIndex: number;
}

@Injectable({
  providedIn: 'root',
})
export class ImpossibleTaskService {
  private camelToTitle = new CamelToTitlePipe();

  activityService?: ActivityService;
  locationService?: LocationService;
  impossibleTasksUnlocked = false;
  activeTaskIndex = -1;
  nextTask = 0;

  tasks: ImpossibleTask[] = [
    {
      name: 'Swim to the bottom of the ocean',
      description:
        "You find a scrap in an ancient text that leads you to believe that the secret of immortality lies buried deep beneath the ocean's currents.",
      taskType: ImpossibleTaskType.Swim,
      progressRequired: 400000,
      location: LocationType.DeepSea,
    },
    {
      name: 'Raise an island from the sea',
      description:
        "At the bottom of the ocean you find a sunken island full of mystical wonders. Some of them will certainly help you in your quest for immortality, but they look too fragile to move by themselves. You'll need to pull the entire island to the surface.",
      taskType: ImpossibleTaskType.RaiseIsland,
      progressRequired: 777,
      location: LocationType.Beach,
    },
    {
      name: 'Build a tower past the heavens',
      description:
        "The undersea wonders point you to a secret shrine high above the clouds. You'll need to build an impossibly tall tower to reach it.",
      taskType: ImpossibleTaskType.BuildTower,
      progressRequired: 1000,
    },
    {
      name: 'Tame the winds',
      description:
        "The entrance to the shrine is sealed by a fierce hurricane that never stops blowing. You'll need to defeat the power of the storm to get in.",
      taskType: ImpossibleTaskType.TameWinds,
      progressRequired: 1000,
    },
    {
      name: 'Learn to fly',
      description:
        'A carving in the sky shrine shows you that the ancient dragons have the secret of immortality. The dragons never fly where mortals can reach them, but fortunately the shrine contains an inscription that teaches you the fundamentals of flight.',
      taskType: ImpossibleTaskType.LearnToFly,
      progressRequired: 8888,
    },
    {
      name: 'Befriend a dragon',
      description:
        "You fly far and wide across the world and finally find an ancient dragon. You'll need to convince it to speak with you to get any secrets from it.",
      taskType: ImpossibleTaskType.BefriendDragon,
      progressRequired: 5000,
      location: LocationType.MountainTops,
    },
    {
      name: 'Conquer the nation',
      description:
        "The dragon finally accepts you as a friend, but it isn't ready to help you achieve immortality yet. It shows you the fighting and suffering in the mortal realm and says the situation is most displeasing. Before it will help you, it wants you to solve the problem. Guess it's time to conquer the nation and set all things right.",
      taskType: ImpossibleTaskType.ConquerTheNation,
      progressRequired: 300,
    },
    {
      name: 'Rearrange the stars',
      description:
        "The dragon smiles approvingly and teaches you the secrets of drawing power from the heavens. You could perform the ritual to achieve immortality now if the stars were properly aligned, but that won't happen again for billions of years. Maybe you could help it along.",
      taskType: ImpossibleTaskType.RearrangeTheStars,
      progressRequired: 10000,
      location: LocationType.MountainTops,
    },
    {
      name: 'Overcome death itself',
      description:
        'The stars are aligned, the power to achieve immortality is finally within your grasp. The only thing you need to do now is use it to defeat death.',
      taskType: ImpossibleTaskType.OvercomeDeath,
      progressRequired: 1,
    },
  ];

  taskProgress: ImpossibleTaskProgress[] = [
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
    {
      progress: 0,
      complete: false,
    },
  ];

  constructor(
    private injector: Injector,
    mainLoopService: MainLoopService,
    private battleService: BattleService,
    private logService: LogService
  ) {
    setTimeout(() => (this.activityService = this.injector.get(ActivityService)));
    setTimeout(() => (this.locationService = this.injector.get(LocationService)));

    mainLoopService.longTickSubject.subscribe(() => {
      if (this.nextTask >= this.tasks.length) {
        // all tasks done
        return;
      }
      for (let i = 0; i < this.tasks.length; i++) {
        if (this.taskProgress[i].complete && this.tasks[i].taskType === this.nextTask) {
          this.nextTask++;
          return;
        }
      }
    });

    mainLoopService.reincarnateSubject.subscribe(() => {
      this.reset();
    });
  }

  markPriorCompletions() {
    let taskComplete = false;
    this.nextTask = -1;
    for (let taskIndex = this.tasks.length - 1; taskIndex >= 0; taskIndex--) {
      if (this.taskProgress[taskIndex].complete || taskComplete) {
        // Sanity check for the latest complete task
        taskComplete = true;
        this.taskProgress[taskIndex].progress = this.tasks[taskIndex].progressRequired;
        this.taskProgress[taskIndex].complete = true;
      }
      if (taskComplete && this.nextTask < 0) {
        this.nextTask = taskIndex;
      } else if (taskIndex === 0) {
        this.nextTask = 0;
      }
    }
  }

  reset() {
    this.markPriorCompletions();
    for (let taskIndex = this.tasks.length - 1; taskIndex >= 0; taskIndex--) {
      if (this.taskProgress[taskIndex].progress < this.tasks[taskIndex].progressRequired) {
        if (this.taskProgress[taskIndex].complete) {
          this.taskProgress[taskIndex].progress = this.tasks[taskIndex].progressRequired;
        } else if (taskIndex !== ImpossibleTaskType.BuildTower) {
          this.taskProgress[taskIndex].progress = 0;
        }
      }
    }
    this.activeTaskIndex = -1;
    this.activityService!.checkRequirements(true);
    this.locationService!.locationLocked = false;
  }

  getProperties(): ImpossibleTaskProperties {
    return {
      taskProgress: this.taskProgress,
      impossibleTasksUnlocked: this.impossibleTasksUnlocked,
      activeTaskIndex: this.activeTaskIndex,
    };
  }

  setProperties(properties: ImpossibleTaskProperties) {
    this.taskProgress = properties.taskProgress || [
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
      {
        progress: 0,
        complete: false,
      },
    ];
    this.impossibleTasksUnlocked = properties.impossibleTasksUnlocked;
    if (properties.activeTaskIndex === undefined) {
      this.activeTaskIndex = -1;
    } else {
      this.activeTaskIndex = properties.activeTaskIndex;
    }
    this.markPriorCompletions();
  }

  checkCompletion() {
    if (this.activeTaskIndex < 0) {
      return;
    }
    if (this.taskProgress[this.activeTaskIndex].progress >= this.tasks[this.activeTaskIndex].progressRequired) {
      this.taskProgress[this.activeTaskIndex].complete = true;
      this.stopTask();
    }
  }

  startTask() {
    const location = this.tasks[this.nextTask].location;
    if (location) {
      if (!this.locationService!.unlockedLocations.includes(location)) {
        this.logService.log(
          LogTopic.EVENT,
          'You need access to ' + this.camelToTitle.transform(location) + ' to begin this task.'
        );
        return;
      }
      this.locationService!.setTroubleLocation(location);
      this.locationService!.locationLocked = true;
    }

    this.activeTaskIndex = this.nextTask;
    this.activityService!.checkRequirements(true);
    if (this.activeTaskIndex === ImpossibleTaskType.OvercomeDeath) {
      this.battleService.addDeath();
    }
  }

  stopTask() {
    this.locationService!.locationLocked = false;
    if (this.activeTaskIndex === ImpossibleTaskType.Swim) {
      // back to the surface with you!
      this.taskProgress[this.activeTaskIndex].progress = 0;
    }
    this.activeTaskIndex = -1;
    for (let i = this.activityService!.activityLoop.length - 1; i >= 0; i--) {
      const activity = this.activityService?.getActivityByType(this.activityService!.activityLoop[i].activity);
      if (activity?.impossibleTaskIndex !== undefined) {
        this.activityService!.activityLoop.splice(i, 1);
      }
    }
    this.activityService!.checkRequirements(true);
  }
}
