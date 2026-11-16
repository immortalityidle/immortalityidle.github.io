import { Component, forwardRef, inject } from '@angular/core';
import { GameStateService } from '../game-state/game-state.service';
import { MatIcon } from '@angular/material/icon';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-layout-options-modal',
  templateUrl: './layout-options-modal.component.html',
  styleUrl: './layout-options-modal.component.less',
  imports: [forwardRef(() => MatIcon), forwardRef(() => TooltipDirective), MatDialogClose],
})
export class LayoutOptionsModalComponent {
  protected readonly gameStateService = inject(GameStateService);
  inputSave = 'Layout #1';

  inputSaveChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.inputSave = event.target.value;
  }

  saveLayout() {
    this.gameStateService.saveLayout(this.inputSave);
  }

  protected lockPanelsToggle() {
    this.gameStateService.lockPanels = !this.gameStateService.lockPanels;
  }
}
