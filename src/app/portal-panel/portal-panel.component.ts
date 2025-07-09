import { Component, forwardRef } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../pipes';

@Component({
  selector: 'app-portal-panel',
  templateUrl: './portal-panel.component.html',
  styleUrls: ['./portal-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TooltipDirective),
    forwardRef(() => CamelToTitlePipe),
  ],
})
export class PortalPanelComponent {
  Math: Math;
  dragPositionX = 0;
  dragPositionY = 0;

  constructor(
    public gameStateService: GameStateService,
    public activityService: ActivityService,
    public characterService: CharacterService,
    public hellService: HellService,
    public impossibleTaskService: ImpossibleTaskService,
    public dialog: MatDialog,
    public mainLoopService: MainLoopService
  ) {
    this.Math = Math;
  }

  doActivity(activity: Activity) {
    activity.consequence[activity.level]();
  }

  showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    const bodyString = activity.description[activity.level] + '\n\n' + activity.consequenceDescription[activity.level];

    const dialogProperties = {
      titleText: activity.name[activity.level],
      bodyTextArray: [bodyString],
      imageFiles: [''],
    };
    if (activity.imageBaseName) {
      dialogProperties.imageFiles = ['assets/images/activities/' + activity.imageBaseName + activity.level + '.png'];
    }
    this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: dialogProperties,
      autoFocus: false,
    });
  }
}
