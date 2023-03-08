import { Component } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-options-panel',
  templateUrl: './battle-options-panel.component.html',
  styleUrls: ['./battle-options-panel.component.less', '../app.component.less'],
})
export class BattleOptionsPanelComponent {
  constructor(public battleService: BattleService, public characterService: CharacterService) {}

  noAttackToggle() {
    this.battleService.enableManaAttack = false;
    this.battleService.enablePyroclasm = false;
    this.battleService.enableMetalFist = false;
  }

  manaAttackToggle() {
    this.battleService.enablePyroclasm = false;
    this.battleService.enableMetalFist = false;
    if (this.battleService.manaAttackUnlocked) {
      this.battleService.enableManaAttack = true;
    }
  }

  pyroclasmToggle() {
    this.battleService.enableManaAttack = false;
    this.battleService.enableMetalFist = false;
    if (this.battleService.pyroclasmUnlocked) {
      this.battleService.enablePyroclasm = true;
    }
  }

  metalFistToggle() {
    this.battleService.enableManaAttack = false;
    this.battleService.enablePyroclasm = false;
    if (this.battleService.metalFistUnlocked) {
      this.battleService.enableMetalFist = true;
    }
  }

  noShieldToggle() {
    this.battleService.enableManaShield = false;
    this.battleService.enableFireShield = false;
    this.battleService.enableIceShield = false;
  }

  manaShieldToggle() {
    this.battleService.enableFireShield = false;
    this.battleService.enableIceShield = false;
    if (this.battleService.manaShieldUnlocked) {
      this.battleService.enableManaShield = true;
    }
  }

  fireShieldToggle() {
    this.battleService.enableManaAttack = false;
    this.battleService.enableIceShield = false;
    if (this.battleService.fireShieldUnlocked) {
      this.battleService.enableFireShield = true;
    }
  }

  iceShieldToggle() {
    this.battleService.enableManaAttack = false;
    this.battleService.enableFireShield = false;
    if (this.battleService.iceShieldUnlocked) {
      this.battleService.enableIceShield = true;
    }
  }
}
