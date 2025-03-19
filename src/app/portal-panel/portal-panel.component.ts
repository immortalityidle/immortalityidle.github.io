import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { ActivityService } from '../game-state/activity.service';
import { CharacterService } from '../game-state/character.service';
import { Activity } from '../game-state/activity';
import { Character } from '../game-state/character';
import { HellService } from '../game-state/hell.service';
import { TextPanelComponent } from '../text-panel/text-panel.component';
import { MatDialog } from '@angular/material/dialog';
import { ImpossibleTaskService } from '../game-state/impossibleTask.service';
import { MainLoopService } from '../game-state/main-loop.service';

@Component({
  selector: 'app-portal-panel',
  templateUrl: './portal-panel.component.html',
  styleUrls: ['./portal-panel.component.less', '../app.component.less'],
  standalone: false,
})
export class PortalPanelComponent {
  character: Character;
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
    this.character = characterService.characterState;
  }

  doActivity(activity: Activity) {
    activity.consequence[activity.level]();
  }

  showActivity(event: MouseEvent, activity: Activity) {
    event.stopPropagation();
    const bodyString = activity.description[activity.level] + '\n\n' + activity.consequenceDescription[activity.level];

    const dialogProperties = { titleText: activity.name[activity.level], bodyText: bodyString, imageFile: '' };
    if (activity.imageBaseName) {
      dialogProperties.imageFile = 'assets/images/activities/' + activity.imageBaseName + activity.level + '.png';
    }
    this.dialog.open(TextPanelComponent, {
      width: '400px',
      data: dialogProperties,
      autoFocus: false,
    });
  }
}
