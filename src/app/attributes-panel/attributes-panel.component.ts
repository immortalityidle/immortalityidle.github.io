import { Component } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { trigger, state, style, transition, animate, keyframes, AnimationEvent } from '@angular/animations';
import { FollowerManagementPanelComponent } from '../follower-management-panel/follower-management-panel.component';
import { Character, AttributeType, AttributeUpdates } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { FollowersService, Follower } from '../game-state/followers.service';
import { MainLoopService } from '../game-state/main-loop.service';

export type AttributeUpdatesArrays = {
  [key in AttributeType]: number[]
};

@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less', '../app.component.less'],
  animations: [ 
    trigger('popupText', [
      state('in', style({ position:"fixed"  })),
      transition(":leave", [
        animate(
          1000,
          keyframes([
            style({ transform: 'translate(0%, 0%)' }),
            style({ transform: 'translate(100%, -150%)' }),
          ])
        )
      ]),
    ])
  ]
})

export class AttributesPanelComponent {
  character: Character;
  popupCounter = 0;

  constructor(
    public characterService: CharacterService,
    public dialog: MatDialog,
    public followerService: FollowersService,
    public mainLoopService: MainLoopService
  ) {
    this.character = characterService.characterState;
    this.attributeUpdates = {
      strength: [],
      toughness: [],
      speed: [],
      intelligence: [],
      charisma: [],
      spirituality: [],
      earthLore: [],
      metalLore: [],
      woodLore: [],
      waterLore: [],
      fireLore: [],
      animalHandling: [],
      combatMastery: [],
      magicMastery: []
    };

    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.popupCounter < 1){
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      for (let key in this.character.attributeUpdates) {
        let attributeType = key as AttributeType;        
        if (this.character.attributeUpdates[attributeType] != 0){
          this.attributeUpdates[attributeType].push(this.character.attributeUpdates[attributeType]);
          this.character.attributeUpdates[attributeType] = 0;
        }
      }
    });
  }

  attributeUpdates: AttributeUpdatesArrays;

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  followerOptionsClicked(): void {
    this.dialog.open(FollowerManagementPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
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

  animationDoneEvent(event: AnimationEvent, key: string){
    let attributeType = key as AttributeType; 
    while (this.attributeUpdates[attributeType].length > 0){
      this.attributeUpdates[attributeType].pop();
    }
  }

  getAttributeUpdates(key: string): number[] {
    let attributeType = key as AttributeType;
    return this.attributeUpdates[attributeType];
  }

}
