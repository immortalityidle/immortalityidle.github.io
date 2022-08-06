import { Component, OnInit } from '@angular/core';
import { BattleService, Enemy } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-panel',
  templateUrl: './battle-panel.component.html',
  styleUrls: ['./battle-panel.component.less', '../app.component.less']
})
export class BattlePanelComponent implements OnInit {

  Math: Math;
  constructor(
    public battleService: BattleService,
    public characterService: CharacterService
  ){ 
    this.Math = Math;
  }

  ngOnInit(): void {
    // so that eslint stops whining
    let a;
  }

  autoTroubleChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.battleService.autoTroubleEnabled = event.target.checked;
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

}
