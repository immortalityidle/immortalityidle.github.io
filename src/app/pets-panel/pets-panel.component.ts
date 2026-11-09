import { Component, forwardRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { FollowersService, Follower } from '../game-state/followers.service';
import { NgClass, TitleCasePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe, BigNumberPipe } from '../pipes';
import { AppService } from '../app.service';

@Component({
  selector: 'app-pets-panel',
  templateUrl: './pets-panel.component.html',
  styleUrls: ['./pets-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => NgClass),
    forwardRef(() => MatIcon),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class PetsPanelComponent {
  private readonly appService = inject(AppService);
  constructor(private dialog: MatDialog, protected followerService: FollowersService) {}

  protected followerOptionsClicked(): void {
    this.dialog.open(FollowerManagementPanelComponent, {
      width: this.appService.isMobile() ? '100vw' : '700px',
      maxWidth: this.appService.isMobile() ? '100vw' : '700px',
      maxHeight: '100vh',
      data: { pets: true },
      autoFocus: false,
    });
  }

  protected dismissFollower(event: MouseEvent, follower: Follower) {
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
