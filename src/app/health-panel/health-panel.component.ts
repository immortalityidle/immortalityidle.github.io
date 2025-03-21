import { Component, forwardRef } from '@angular/core';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { HomeService } from '../game-state/home.service';
import { MatIcon } from '@angular/material/icon';
import { NgClass, DecimalPipe } from '@angular/common';
import { FloorPipe, BigNumberPipe } from '../app.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-health-panel',
  templateUrl: './health-panel.component.html',
  styleUrls: ['./health-panel.component.less', '../app.component.less'],
  animations: [
    trigger('popupText', [
      state('in', style({ position: 'fixed' })),
      transition(':leave', [
        animate(
          1000,
          keyframes([style({ transform: 'translate(0%, 0%)' }), style({ transform: 'translate(0%, -150%)' })])
        ),
      ]),
    ]),
  ],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => NgClass),
    forwardRef(() => DecimalPipe),
    forwardRef(() => FloorPipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class HealthPanelComponent {
  yinColor = '#000000';
  yangColor = '#ffffff';
  balanceString = 'perfect';
  flashHealth = false;
  flashStamina = false;
  flashQi = false;
  flashNutrition = false;
  moneyUpdates: number[];
  popupCounter = 0;

  Math: Math;
  constructor(
    public characterService: CharacterService,
    public gameStateService: GameStateService,
    public homeService: HomeService,
    private mainLoopService: MainLoopService
  ) {
    this.Math = Math;
    this.moneyUpdates = [];
    mainLoopService.longTickSubject.subscribe(() => {
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

  updateYinYang() {
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

  animationDoneEvent() {
    while (this.moneyUpdates.length > 0) {
      this.moneyUpdates.pop();
    }
  }

  getMoneyUpdates(): number[] {
    return this.moneyUpdates;
  }
}
