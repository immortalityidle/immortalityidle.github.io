import { Component, forwardRef } from '@angular/core';
import { FarmService } from '../game-state/farm.service';
import { MatIcon } from '@angular/material/icon';
import { NgOptimizedImage, PercentPipe, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { BigNumberPipe } from '../pipes';
import { HomeService } from '../game-state/home.service';
import { HellService } from '../game-state/hell.service';

@Component({
  selector: 'app-farm-panel',
  templateUrl: './farm-panel.component.html',
  styleUrls: ['./farm-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatIcon),
    forwardRef(() => PercentPipe),
    forwardRef(() => TitleCasePipe),
    forwardRef(() => BigNumberPipe),
    forwardRef(() => TooltipDirective),
    forwardRef(() => NgOptimizedImage),
  ],
})
export class FarmPanelComponent {
  constructor(
    protected farmService: FarmService,
    protected homeService: HomeService,
    protected hellService: HellService
  ) {}

  protected addFieldClicked(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.farmService.addField();
  }

  protected removeFieldClicked(event: MouseEvent, fieldIndex: number) {
    this.farmService.removeField(fieldIndex);
  }

  protected addPlotToFieldClicked(event: MouseEvent, fieldIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    let quantity = 1;
    if (event) {
      if (event.shiftKey) {
        quantity *= 10;
      }
      if (event.ctrlKey) {
        quantity *= 100;
      }
    }
    this.farmService.assignFallowPlots(fieldIndex, quantity);
  }

  protected removePlotFromFieldClicked(event: MouseEvent, fieldIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    let quantity = 1;
    if (event) {
      if (event.shiftKey) {
        quantity *= 10;
      }
      if (event.ctrlKey) {
        quantity *= 100;
      }
    }
    this.farmService.unassignPlots(fieldIndex, quantity);
  }

  protected changeCropClicked(event: MouseEvent, fieldIndex: number) {
    this.farmService.changeCrop(fieldIndex);
  }
}
