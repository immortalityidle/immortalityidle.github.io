import { inject, Injectable } from '@angular/core';
import { MainLoopService } from '../game-state/main-loop.service';
import { CharacterService } from '../game-state/character.service';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  private mainLoopService = inject(MainLoopService);
  private characterService = inject(CharacterService);

  yinColor = '#000000';
  yangColor = '#ffffff';
  balanceString = 'perfect';
  flashHealth = false;
  flashStamina = false;
  flashQi = false;
  flashNutrition = false;
  moneyUpdates: number[] = [];
  popupCounter = 0;

  constructor() {
    this.mainLoopService.longTickSubject.subscribe(() => {
      this.flashHealth = this.characterService.characterState.statusToFlash.includes('health');
      this.flashStamina = this.characterService.characterState.statusToFlash.includes('stamina');
      this.flashQi = this.characterService.characterState.statusToFlash.includes('qi');
      this.flashNutrition = this.characterService.characterState.statusToFlash.includes('nutrition');
      this.characterService.characterState.statusToFlash = [];
      if (this.popupCounter < 1) {
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      if (this.characterService.characterState.moneyUpdates !== 0) {
        this.moneyUpdates.push(this.characterService.characterState.moneyUpdates);
        this.characterService.characterState.moneyUpdates = 0;
      }
      this.updateYinYang();
    });
  }

  private updateYinYang() {
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
