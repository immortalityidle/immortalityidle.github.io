import { Component } from '@angular/core';
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
    public followerService: FollowersService) {
    this.character = characterService.characterState;
   }
  
   // Preserve original property order
  originalOrder = (): number => {
    return 0;
  }
}
