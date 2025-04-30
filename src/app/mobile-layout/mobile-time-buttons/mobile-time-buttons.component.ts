import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonButtonsService } from 'src/app/common-buttons.service';
import { ActivityService } from 'src/app/game-state/activity.service';
import { MainLoopService } from 'src/app/game-state/main-loop.service';
import { TimeOptionsPanelComponent } from 'src/app/time-options-panel/time-options-panel.component';
import { TooltipDirective } from 'src/app/tooltip/tooltip.directive';

@Component({
  selector: 'app-mobile-time-buttons',
  imports: [CommonModule, MatIconModule, TooltipDirective],
  templateUrl: './mobile-time-buttons.component.html',
  styleUrl: './mobile-time-buttons.component.less',
})
export class MobileTimeButtonsComponent {
  protected readonly commonButtonsService = inject(CommonButtonsService);
  protected readonly activityService = inject(ActivityService);
  private readonly dialog = inject(MatDialog);
  protected readonly mainLoopService = inject(MainLoopService);

  // TODO: Probably need a common service for these and the standard layout
  protected pauseClick() {
    if (this.mainLoopService.pause) {
      this.mainLoopService.tick();
    } else {
      this.mainLoopService.pause = true;
    }
  }

  protected slowClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 40;
  }

  protected standardClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 10;
  }

  protected fastClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 5;
  }

  protected fasterClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 2;
  }

  protected fastestClick() {
    this.mainLoopService.pause = false;
    this.mainLoopService.tickDivider = 1;
  }

  protected timeOptions() {
    this.dialog.open(TimeOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}
