import { Component } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { KeyValue } from '@angular/common';


@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less']
})
export class AttributesPanelComponent {
  character: Character;

  constructor(characterService: CharacterService) {
    this.character = characterService.characterState;
   }
  
   // Preserve original property order
  originalOrder = (): number => {
    return 0;
  }
}
