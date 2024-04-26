import { Component } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less', '../app.component.less'],
})
export class HealthPanelComponent {
  yinColor = '#000000';
  yangColor = '#ffffff';
  balanceString = 'perfect';
  flashHealth = false;
  flashStamina = false;
  flashMana = false;
  flashNutrition = false;

  Math: Math;
  constructor(
    public characterService: CharacterService,
    public gameStateService: GameStateService,
    private mainLoopService: MainLoopService
  ) {
    this.Math = Math;
    mainLoopService.longTickSubject.subscribe(() => {
      this.updateYinYang();
      this.flashHealth = this.characterService.characterState.statusToFlash.includes('health');
      this.flashStamina = this.characterService.characterState.statusToFlash.includes('stamina');
      this.flashMana = this.characterService.characterState.statusToFlash.includes('mana');
      this.flashNutrition = this.characterService.characterState.statusToFlash.includes('nourishment');
      this.characterService.characterState.statusToFlash = [];
    });
  }

  updateYinYang() {
    if (!this.characterService.characterState.yinYangUnlocked) {
      return;
    }
    let yang = this.characterService.characterState.yang;
    let yin = this.characterService.characterState.yin;
    if (yin < 1) {
      yin = 1;
    }
    if (yang < 1) {
      yang = 1;
    }
    if (yang >= yin) {
      this.yangColor = '#ffffff';
      const val = 255 - Math.round((yin / yang) * 255);
      const valstr = val.toString(16);
      this.yinColor = '#' + valstr + valstr + valstr;
    } else {
      this.yinColor = '#000000';
      const val = Math.round((yang / yin) * 255);
      const valstr = val.toString(16);
      this.yangColor = '#' + valstr + valstr + valstr;
    }
    const balanceValues = [
      'perfect',
      'exceptional',
      'excellent',
      'good',
      'fair',
      'poor',
      'terrible',
      'abysmal',
      'non-existent',
    ];
    const difference = Math.max((Math.abs(yang - yin) / ((yang + yin) / 2)) * 10000, 1);
    const differenceIndex = Math.min(Math.floor(Math.log(difference) / Math.log(5)), balanceValues.length - 1);
    this.balanceString = balanceValues[differenceIndex];
  }
}
