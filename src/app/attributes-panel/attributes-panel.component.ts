import { Component, forwardRef } from '@angular/core';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { AttributeObject, AttributeType } from '../game-state/character.service';
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
    trigger('popupText', [state('in', style({})), transition(':leave', [animate('800ms', style({ opacity: 0 }))])]),
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
    performance: [],
    smithing: [],
    alchemy: [],
    woodwork: [],
    leatherwork: [],
    formationMastery: [],
  };

  private popupCounter = 0;
  protected groups = ['baseAttributes', 'lores', 'skills'];

  protected attributesByGroup: { [key: string]: { [key: string]: AttributeObject } };

  constructor(public characterService: CharacterService, private mainLoopService: MainLoopService) {
    this.mainLoopService.longTickSubject.subscribe(() => {
      if (this.popupCounter < 1) {
        this.popupCounter++;
        return;
      }
      this.popupCounter = 0;
      for (const key in this.characterService.attributeUpdates) {
        const attributeType = key as AttributeType;
        if (this.characterService.attributeUpdates[attributeType] !== 0) {
          this.attributeUpdates[attributeType].push(this.characterService.attributeUpdates[attributeType]);
          this.characterService.attributeUpdates[attributeType] = 0;
        }
      }
    });
    this.attributesByGroup = {
      baseAttributes: {
        strength: this.characterService.attributes.strength,
        speed: this.characterService.attributes.speed,
        toughness: this.characterService.attributes.toughness,
        charisma: this.characterService.attributes.charisma,
        intelligence: this.characterService.attributes.intelligence,
        spirituality: this.characterService.attributes.spirituality,
      },
      lores: {
        fireLore: this.characterService.attributes.fireLore,
        woodLore: this.characterService.attributes.woodLore,
        earthLore: this.characterService.attributes.earthLore,
        metalLore: this.characterService.attributes.metalLore,
        waterLore: this.characterService.attributes.waterLore,
      },
      skills: {
        performance: this.characterService.attributes.performance,
        smithing: this.characterService.attributes.smithing,
        woodwork: this.characterService.attributes.woodwork,
        leatherwork: this.characterService.attributes.leatherwork,
        alchemy: this.characterService.attributes.alchemy,
        animalHandling: this.characterService.attributes.animalHandling,
        combatMastery: this.characterService.attributes.combatMastery,
        magicMastery: this.characterService.attributes.magicMastery,
      },
    };
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
