import { Component } from '@angular/core';
import { HellService } from '../game-state/hell.service';

@Component({
  selector: 'app-hell-status-panel',
  imports: [],
  templateUrl: './hell-status-panel.component.html',
  styleUrl: './hell-status-panel.component.less',
})
export class HellStatusPanelComponent {
  protected Math = Math;

  constructor(protected hellService: HellService) {}

  protected hellBoss() {
    this.hellService.fightHellBoss();
  }
}
