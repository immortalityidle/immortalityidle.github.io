import { Component, forwardRef } from '@angular/core';
import { AttributeObject } from '../game-state/character.service';
import { CharacterService } from '../game-state/character.service';
import { MainLoopService } from '../game-state/main-loop.service';
import { MatIcon } from '@angular/material/icon';
import { KeyValuePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe, BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-attributes-panel',
  templateUrl: './attributes-panel.component.html',
  styleUrls: ['./attributes-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => KeyValuePipe),
    forwardRef(() => CamelToTitlePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
  ],
})
export class AttributesPanelComponent {
  protected groups = ['baseAttributes', 'lores', 'skills'];

  protected attributesByGroup: { [key: string]: { [key: string]: AttributeObject } };

  constructor(public characterService: CharacterService, private mainLoopService: MainLoopService) {
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
        cooking: this.characterService.attributes.cooking,
        smithing: this.characterService.attributes.smithing,
        woodwork: this.characterService.attributes.woodwork,
        leatherwork: this.characterService.attributes.leatherwork,
        alchemy: this.characterService.attributes.alchemy,
        formationMastery: this.characterService.attributes.formationMastery,
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
}
