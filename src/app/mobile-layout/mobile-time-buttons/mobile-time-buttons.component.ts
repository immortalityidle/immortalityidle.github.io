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

  protected timeOptions() {
    this.dialog.open(TimeOptionsPanelComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}
