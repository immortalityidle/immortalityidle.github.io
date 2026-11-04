import { Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-changelog-panel',
  templateUrl: './changelog-panel.component.html',
  styleUrls: ['./changelog-panel.component.less'],
  imports: [MatIcon, MatDialogClose],
})
export class ChangelogPanelComponent {}
