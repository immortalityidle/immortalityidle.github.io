import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { FollowersService, Follower } from '../game-state/followers.service';
import { GameStateService } from '../game-state/game-state.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '@webed/angular-tooltip';
import { CamelToTitlePipe, BigNumberPipe } from '../app.component';

@Component({
  selector: 'app-followers-panel',
  templateUrl: './followers-panel.component.html',
  styleUrls: ['./followers-panel.component.less', '../app.component.less'],
  imports: [NgClass, MatIcon, TooltipDirective, TitleCasePipe, CamelToTitlePipe, BigNumberPipe],
})
export class FollowersPanelComponent {
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
      data: { pets: false },
      autoFocus: false,
    });
  }

  dismissFollower(event: MouseEvent, follower: Follower) {
    event.preventDefault();
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && this.followerService.autoDismissUnlocked) {
      this.followerService.limitFollower(follower);
    } else if (event.shiftKey && this.followerService.autoDismissUnlocked) {
      this.followerService.dismissAllFollowers(follower);
    } else {
      this.followerService.dismissFollower(follower);
    }
  }
}
