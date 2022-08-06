import { Component, OnInit } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-options-panel',
  templateUrl: './battle-options-panel.component.html',
  styleUrls: ['./battle-options-panel.component.less', '../app.component.less']
})
export class BattleOptionsPanelComponent implements OnInit {

  constructor(
    public battleService: BattleService,
    public characterService: CharacterService
  ) { }

  ngOnInit(): void {
  }

  manaShieldToggle(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.battleService.manaShieldUnlocked){
      this.battleService.enableManaShield = event.target.checked;
    }
  }

  manaAttackToggle(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.battleService.manaAttackUnlocked){
      this.battleService.enableManaAttack = event.target.checked;
    }
  }

  pyroclasmToggle(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.battleService.pyroclasmUnlocked){
      this.battleService.enablePyroclasm = event.target.checked;
    }
  }

  fireShieldToggle(event: Event){
    if (!(event.target instanceof HTMLInputElement)) return;
    if (this.battleService.fireShieldUnlocked){
      this.battleService.enableFireShield = event.target.checked;
    }
  }

}
