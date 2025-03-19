import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { FollowersService, Follower } from '../game-state/followers.service';
import { GameStateService } from '../game-state/game-state.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { CamelToTitlePipe, BigNumberPipe } from '../app.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-pets-panel',
  templateUrl: './pets-panel.component.html',
  styleUrls: ['./pets-panel.component.less', '../app.component.less'],
  imports: [NgClass, MatIcon, TitleCasePipe, CamelToTitlePipe, BigNumberPipe, TooltipDirective],
})
export class PetsPanelComponent {
  character: Character;
  popupCounter = 0;

  constructor(
    public characterService: CharacterService,
    public dialog: MatDialog,
    public gameStateService: GameStateService,
    public followerService: FollowersService
  ) {
    this.character = characterService.characterState;
  }

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  followerOptionsClicked(): void {
    this.dialog.open(FollowerManagementPanelComponent, {
      width: '700px',
      data: { pets: true },
      autoFocus: false,
    });
  }

  dismissFollower(event: MouseEvent, follower: Follower) {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && this.followerService.autoDismissUnlocked) {
      this.followerService.limitFollower(follower);
    } else if (event.shiftKey && this.followerService.autoDismissUnlocked) {
      this.followerService.dismissAllFollowers(follower, true);
    } else {
      this.followerService.dismissFollower(follower);
    }
  }
}
