import { Component, forwardRef } from '@angular/core';
import {
  BattleService,
  EFFECT_CORRUPTION,
  EFFECT_DOOM,
  EFFECT_EXPLOSIVE,
  EFFECT_HASTE,
  EFFECT_LIFE,
  EFFECT_PIERCING,
  EFFECT_POISON,
  EFFECT_SHIELDING,
  EFFECT_SLOW,
  ELEMENT_EFFECT_EARTH,
  ELEMENT_EFFECT_FIRE,
  ELEMENT_EFFECT_METAL,
  ELEMENT_EFFECT_WATER,
  ELEMENT_EFFECT_WOOD,
} from '../game-state/battle.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../pipes';
import { MatIcon } from '@angular/material/icon';
import { TechniqueOptionsModalComponent } from '../technique-options-modal/technique-options-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ContemplationService } from '../game-state/contemplation.service';

@Component({
  selector: 'app-technique-panel',
  imports: [forwardRef(() => TooltipDirective), forwardRef(() => CamelToTitlePipe), forwardRef(() => MatIcon)],
  templateUrl: './technique-panel.component.html',
  styleUrl: './technique-panel.component.less',
})
export class TechniquePanelComponent {
  effectDescriptions: { [key: string]: string } = {};
  conceptDescriptions: { [key: string]: string } = {};

  constructor(
    public battleService: BattleService,
    public contemplationService: ContemplationService,
    public dialog: MatDialog
  ) {
    this.effectDescriptions[ELEMENT_EFFECT_FIRE] =
      'This technique inflicts fire damage, doing additional damage to wood and metal aspected enemies and less to water and earth aspected enemies.';
    this.effectDescriptions[ELEMENT_EFFECT_EARTH] =
      'This technique inflicts earth damage, doing additional damage to water and fire aspected enemies and less to metal and wood aspected enemies.';
    this.effectDescriptions[ELEMENT_EFFECT_METAL] =
      'This technique inflicts metal damage, doing additional damage to wood and earth aspected enemies and less to water and fire aspected enemies.';
    this.effectDescriptions[ELEMENT_EFFECT_WOOD] =
      'This technique inflicts wood damage, doing additional damage to water and earth aspected enemies and less to metal and fire aspected enemies.';
    this.effectDescriptions[ELEMENT_EFFECT_WATER] =
      'This technique inflicts water damage, doing additional damage to fire and metal aspected enemies and less to wood and earth aspected enemies.';
    this.effectDescriptions[EFFECT_CORRUPTION] =
      'This technique inflicts corruption, increasing damage but leaving you vulnerable.';
    this.effectDescriptions[EFFECT_LIFE] = 'This technique restores your life with each strike.';
    this.effectDescriptions[EFFECT_POISON] = "This technique inflicts poison, sapping your enemy's health over time.";
    this.effectDescriptions[EFFECT_DOOM] = 'This technique inflicts doom, increasing the damage of subsequent strikes.';
    this.effectDescriptions[EFFECT_EXPLOSIVE] = 'This technique does explosive damage to both you and your enemy.';
    this.effectDescriptions[EFFECT_SHIELDING] = 'This technique grants you additional protection each time it strikes.';
    this.effectDescriptions[EFFECT_PIERCING] =
      'This technique punches through enemy armor, making their defenses less effective.';
    this.effectDescriptions[EFFECT_HASTE] =
      'This technique allows all your techniques to strike faster for a short time.';
    this.effectDescriptions[EFFECT_SLOW] = "This technique slows all your enemy's attacks for a short time.";

    for (const techniqueConcept of this.contemplationService.techniqueConcepts) {
      this.conceptDescriptions[techniqueConcept] = 'Strengthened by contemplation of: ';
      const relevantConcepts = this.contemplationService.concepts.filter(c => c.effect.includes(techniqueConcept));
      for (const concept of relevantConcepts) {
        this.conceptDescriptions[techniqueConcept] += '<br>' + concept.name;
      }
    }
  }

  optionsClicked() {
    this.dialog.open(TechniqueOptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}
