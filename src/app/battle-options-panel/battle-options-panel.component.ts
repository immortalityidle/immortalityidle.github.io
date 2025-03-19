import { Component } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { CharacterService } from '../game-state/character.service';

@Component({
  selector: 'app-battle-options-panel',
  templateUrl: './battle-options-panel.component.html',
  styleUrls: ['./battle-options-panel.component.less', '../app.component.less'],
  standalone: false,
})
export class BattleOptionsPanelComponent {
  constructor(public battleService: BattleService, public characterService: CharacterService) {}

  noAttackToggle() {
    this.battleService.enableQiAttack = false;
    this.battleService.enablePyroclasm = false;
    this.battleService.enableMetalFist = false;
  }

  qiAttackToggle() {
    this.battleService.enablePyroclasm = false;
    this.battleService.enableMetalFist = false;
    if (this.battleService.qiAttackUnlocked) {
      this.battleService.enableQiAttack = true;
    }
  }

  pyroclasmToggle() {
    this.battleService.enableQiAttack = false;
    this.battleService.enableMetalFist = false;
    if (this.battleService.pyroclasmUnlocked) {
      this.battleService.enablePyroclasm = true;
    }
  }

  metalFistToggle() {
    this.battleService.enableQiAttack = false;
    this.battleService.enablePyroclasm = false;
    if (this.battleService.metalFistUnlocked) {
      this.battleService.enableMetalFist = true;
    }
  }

  noShieldToggle() {
    this.battleService.enableQiShield = false;
    this.battleService.enableFireShield = false;
    this.battleService.enableIceShield = false;
  }

  qiShieldToggle() {
    this.battleService.enableFireShield = false;
    this.battleService.enableIceShield = false;
    if (this.battleService.qiShieldUnlocked) {
      this.battleService.enableQiShield = true;
    }
  }

  fireShieldToggle() {
    this.battleService.enableQiAttack = false;
    this.battleService.enableIceShield = false;
    if (this.battleService.fireShieldUnlocked) {
      this.battleService.enableFireShield = true;
    }
  }

  iceShieldToggle() {
    this.battleService.enableQiAttack = false;
    this.battleService.enableFireShield = false;
    if (this.battleService.iceShieldUnlocked) {
      this.battleService.enableIceShield = true;
    }
  }
}
