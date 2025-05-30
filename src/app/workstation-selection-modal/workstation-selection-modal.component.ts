import { Component, forwardRef } from '@angular/core';
import { HomeService, Workstation } from '../game-state/home.service';
import { GameStateService } from '../game-state/game-state.service';
import { MatDialogRef } from '@angular/material/dialog';
import { CharacterService } from '../game-state/character.service';
import { TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';

@Component({
  selector: 'app-workstation-selection-modal',
  templateUrl: './workstation-selection-modal.component.html',
  styleUrls: ['./workstation-selection-modal.component.less', '../app.component.less'],
  imports: [forwardRef(() => TitleCasePipe), forwardRef(() => BigNumberPipe), forwardRef(() => TooltipDirective)],
})
export class WorkstationSelectionModalComponent {
  constructor(
    public dialogRef: MatDialogRef<WorkstationSelectionModalComponent>,
    public homeService: HomeService,
    private characterService: CharacterService,
    public gameStateService: GameStateService
  ) {}

  slotClicked(workstation: Workstation) {
    if (this.characterService.money > workstation.setupCost) {
      this.characterService.updateMoney(0 - workstation.setupCost);
      this.homeService.addWorkstation(workstation.id);
      this.dialogRef.close();
    }
  }
}
