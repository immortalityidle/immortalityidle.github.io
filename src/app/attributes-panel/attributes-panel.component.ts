import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { FollowersService, Follower } from '../game-state/followers.service';


@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less', '../app.component.less']
})
export class AttributesPanelComponent {
  character: Character;

  constructor(public characterService: CharacterService,
    public dialog: MatDialog,
    public followerService: FollowersService) {
    this.character = characterService.characterState;
   }
  
   // Preserve original property order
  originalOrder = (): number => {
    return 0;
  }

  followerOptionsClicked(): void {
    const dialogRef = this.dialog.open(FollowerManagementPanelComponent, {
      width: '700px',
      data: {someField: 'foo'}
    });
  }

  dismissFollower(event: MouseEvent, follower: Follower){
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey && this.followerService.autoDismissUnlocked){
      this.followerService.dismissFollower(follower, -1);
    } else if (event.shiftKey && this.followerService.autoDismissUnlocked){
      this.followerService.dismissFollower(follower, 0);
    } else {
      this.followerService.dismissFollower(follower, 1);
    }
  }
}
