import { Component } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-options-panel',
  templateUrl: './battle-options-panel.component.html',
  styleUrls: ['./battle-options-panel.component.less', '../app.component.less'],
  imports: [],
})
export class BattleOptionsPanelComponent {
  constructor(public battleService: BattleService, public characterService: CharacterService) {}
}
