import { Component, forwardRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes, AnimationEvent } from '@angular/animations';
import { AttributeType } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { MatIcon } from '@angular/material/icon';
import { KeyValuePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe, BigNumberPipe } from '../pipes';

export type AttributeUpdatesArrays = {
  [key in AttributeType]: number[];
};

@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less', '../app.component.less'],
  animations: [
    trigger('popupText', [
      state('in', style({ position: 'fixed' })),
      transition(':leave', [
        animate(
          1000,
          keyframes([style({ transform: 'translate(0%, 0%)' }), style({ transform: 'translate(100%, -150%)' })])
        ),
      ]),
    ]),
  ],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => KeyValuePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class AttributesPanelComponent {
  protected character = this.characterService.characterState;
  private attributeUpdates: AttributeUpdatesArrays = {
    strength: [],
    toughness: [],
    speed: [],
    intelligence: [],
    charisma: [],
    spirituality: [],
    earthLore: [],
    metalLore: [],
    woodLore: [],
    waterLore: [],
    fireLore: [],
    animalHandling: [],
    combatMastery: [],
    magicMastery: [],
  };

  private popupCounter = 0;

  constructor(private characterService: CharacterService, private mainLoopService: MainLoopService) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.popupCounter < 1) {
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      for (const key in this.character.attributeUpdates) {
        const attributeType = key as AttributeType;
        if (this.character.attributeUpdates[attributeType] !== 0) {
          this.attributeUpdates[attributeType].push(this.character.attributeUpdates[attributeType]);
          this.character.attributeUpdates[attributeType] = 0;
        }
      }
    });
  }

  // Preserve original property order
  protected originalOrder = (): number => {
    return 0;
  };

  protected animationDoneEvent(event: AnimationEvent, key: string) {
    const attributeType = key as AttributeType;
    while (this.attributeUpdates[attributeType].length > 0) {
      this.attributeUpdates[attributeType].pop();
    }
  }

  protected getAttributeUpdates(key: string): number[] {
    const attributeType = key as AttributeType;
    return this.attributeUpdates[attributeType];
  }
}
