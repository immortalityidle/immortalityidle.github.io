import { Component, OnInit } from '@angular/core';
import { Character } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { GameStateService } from '../game-state/game-state.service';


@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less']
})
export class AttributesPanelComponent implements OnInit {
  character: Character;

  constructor(characterService: CharacterService) {
    this.character = characterService.characterState;
   }

  ngOnInit(): void {
  }
}
