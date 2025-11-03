import { Component, forwardRef } from '@angular/core';
import {
  AttributeObject,
  AttributeType,
  BASIC_ATTRIBUTES,
  DIVINE_ATTRIBUTES,
  LORE_ATTRIBUTES,
  SKILL_ATTRIBUTES,
} from '../game-state/character.service';
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
  protected groups = [BASIC_ATTRIBUTES, DIVINE_ATTRIBUTES, LORE_ATTRIBUTES, SKILL_ATTRIBUTES];
  protected attributesByGroup: { [key: string]: { [key: string]: AttributeObject } };

  constructor(public characterService: CharacterService, private mainLoopService: MainLoopService) {
    this.attributesByGroup = {};
    for (const group of this.groups) {
      this.attributesByGroup[group] = {};
    }
    for (const key in this.characterService.attributes) {
      const typedKey = key as AttributeType;
      const attribute = this.characterService.attributes[typedKey];
      this.attributesByGroup[attribute.attributeGroup][key] = attribute;
    }
  }

  // Preserve original property order
  protected originalOrder = (): number => {
    return 0;
  };
}
