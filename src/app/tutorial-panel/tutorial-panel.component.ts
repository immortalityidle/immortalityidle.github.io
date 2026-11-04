import { Component, forwardRef } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';

@Component({
  selector: 'app-tutorial-panel',
  templateUrl: './tutorial-panel.component.html',
  styleUrls: ['./tutorial-panel.component.less', '../app.component.less'],
  imports: [
    forwardRef(() => MatTabGroup),
    forwardRef(() => MatTab),
    forwardRef(() => MatTabLabel),
    MatIcon,
    MatDialogClose,
  ],
})
export class TutorialPanelComponent {}
