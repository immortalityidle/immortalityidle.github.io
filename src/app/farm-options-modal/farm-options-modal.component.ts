import { Component, forwardRef } from '@angular/core';
import { FarmService } from '../game-state/farm.service';
import { MatIcon } from '@angular/material/icon';
import { CamelToTitlePipe } from '../pipes';
import { TooltipDirective } from '../tooltip/tooltip.directive';

@Component({
  selector: 'app-farm-options-modal',
  imports: [forwardRef(() => MatIcon), forwardRef(() => CamelToTitlePipe), forwardRef(() => TooltipDirective)],
  templateUrl: './farm-options-modal.component.html',
  styleUrl: './farm-options-modal.component.less',
})
export class FarmOptionsModalComponent {
  setAllQuantity = 0;

  constructor(protected farmService: FarmService) {}

  autoStaggerChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.farmService.autoStaggerEnabled = event.target.checked;
  }

  protected setAllQuantityChanged(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;

    this.setAllQuantity = Math.floor(parseFloat(event.target.value));
  }

  changeAutoStaggerLimit(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.farmService.autoStaggerLimit = Math.floor(parseFloat(event.target.value));
  }

  changeAutoStaggerInterval(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.farmService.autoStaggerInterval = Math.floor(parseFloat(event.target.value));
  }

  protected setAllFields() {
    this.farmService.setAllFieldsSize(this.setAllQuantity);
  }
}
