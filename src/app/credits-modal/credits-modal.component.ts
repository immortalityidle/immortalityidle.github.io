import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-credits-modal',
  imports: [MatIcon, MatDialogClose],
  templateUrl: './credits-modal.component.html',
  styleUrls: ['./credits-modal.component.less', '../app.component.less'],
})
export class CreditsModalComponent {
  constructor(protected gameStateService: GameStateService) {}
}
