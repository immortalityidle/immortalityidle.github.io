import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-offline-modal',
  templateUrl: './offline-modal.component.html',
  styleUrls: ['./offline-modal.component.less'],
})
export class OfflineModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { earnedTicks: number }) {}
}
