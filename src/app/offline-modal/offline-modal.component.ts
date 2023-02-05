import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-offline-modal',
  templateUrl: './offline-modal.component.html',
  styleUrls: ['./offline-modal.component.less'],
})
export class OfflineModalComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { earnedTicks: number }) {}

  ngOnInit(): void {}
}
