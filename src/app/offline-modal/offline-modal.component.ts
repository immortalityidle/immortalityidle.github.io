import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BigNumberPipe } from '../app.component';

@Component({
  selector: 'app-offline-modal',
  templateUrl: './offline-modal.component.html',
  styleUrls: ['./offline-modal.component.less'],
  imports: [BigNumberPipe],
})
export class OfflineModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { earnedTicks: number }) {}
}
