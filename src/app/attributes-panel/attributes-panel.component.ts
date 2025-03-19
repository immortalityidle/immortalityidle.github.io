import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { trigger, state, style, transition, animate, keyframes, AnimationEvent } from '@angular/animations';
import { Character, AttributeType } from '../game-state/character';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { GameStateService } from '../game-state/game-state.service';
import { TooltipDirective } from '@webed/angular-tooltip';
import { MatIcon } from '@angular/material/icon';
import { KeyValuePipe } from '@angular/common';
import { CamelToTitlePipe, BigNumberPipe } from '../app.component';

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
  imports: [TooltipDirective, MatIcon, KeyValuePipe, CamelToTitlePipe, BigNumberPipe],
})
export class AttributesPanelComponent {
  character: Character;
  popupCounter = 0;

  constructor(
    public characterService: CharacterService,
    public dialog: MatDialog,
    public gameStateService: GameStateService,
    public mainLoopService: MainLoopService
  ) {
    this.character = characterService.characterState;
    this.attributeUpdates = {
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

  attributeUpdates: AttributeUpdatesArrays;

  // Preserve original property order
  originalOrder = (): number => {
    return 0;
  };

  animationDoneEvent(event: AnimationEvent, key: string) {
    const attributeType = key as AttributeType;
    while (this.attributeUpdates[attributeType].length > 0) {
      this.attributeUpdates[attributeType].pop();
    }
  }

  getAttributeUpdates(key: string): number[] {
    const attributeType = key as AttributeType;
    return this.attributeUpdates[attributeType];
  }
}
