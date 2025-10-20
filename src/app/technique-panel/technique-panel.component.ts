import { Component, forwardRef } from '@angular/core';
import { BattleService } from '../game-state/battle.service';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { CamelToTitlePipe } from '../pipes';
import { MatIcon } from '@angular/material/icon';
import { TechniqueOptionsModalComponent } from '../technique-options-modal/technique-options-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-technique-panel',
  imports: [forwardRef(() => TooltipDirective), forwardRef(() => CamelToTitlePipe), forwardRef(() => MatIcon)],
  templateUrl: './technique-panel.component.html',
  styleUrl: './technique-panel.component.less',
})
export class TechniquePanelComponent {
  constructor(public battleService: BattleService, public dialog: MatDialog) {}

  optionsClicked() {
    this.dialog.open(TechniqueOptionsModalComponent, {
      width: '700px',
      data: { someField: 'foo' },
      autoFocus: false,
    });
  }
}
