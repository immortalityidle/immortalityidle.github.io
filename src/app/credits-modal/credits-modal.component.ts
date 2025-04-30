import { Component } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';

@Component({
  selector: 'app-credits-modal',
  imports: [],
  templateUrl: './credits-modal.component.html',
  styleUrls: ['./credits-modal.component.less', '../app.component.less'],
})
export class CreditsModalComponent {
  constructor(protected gameStateService: GameStateService) {}
}
