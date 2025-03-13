import { Component } from '@angular/core';
import { HomeService, Workstation } from '../game-state/home.service';
import { GameStateService } from '../game-state/game-state.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-workstation-selection-modal',
  templateUrl: './workstation-selection-modal.component.html',
  styleUrls: ['./workstation-selection-modal.component.less', '../app.component.less'],
})
export class WorkstationSelectionModalComponent {
  constructor(
    public dialogRef: MatDialogRef<WorkstationSelectionModalComponent>,
    public homeService: HomeService,
    public gameStateService: GameStateService
  ) {}

  slotClicked(workstation: Workstation) {
    this.homeService.addWorkstation(workstation.id);
    this.dialogRef.close();
  }
}
