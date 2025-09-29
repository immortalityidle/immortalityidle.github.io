import { NgOptimizedImage } from '@angular/common';
import { Component, forwardRef, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-text-panel',
  template: 'passed in {{ data.name }}',
  templateUrl: './text-panel.component.html',
  styleUrls: ['./text-panel.component.less', '../app.component.less'],
  imports: [forwardRef(() => NgOptimizedImage)],
})
export class TextPanelComponent {
  titleText = '';
  bodyTextArray: string[] = [];
  imageFiles: string[] = [];
  pageIndex = 0;
  currentImageFile = '';

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { titleText: string; bodyTextArray: string[]; imageFiles: string[] }
  ) {
    this.titleText = data.titleText;
    this.bodyTextArray = data.bodyTextArray;
    this.imageFiles = data.imageFiles || [];
    if (this.imageFiles.length > 0) {
      this.currentImageFile = this.imageFiles[0];
    } else {
      this.currentImageFile = '';
    }
  }

  nextClick() {
    if (this.pageIndex < this.bodyTextArray.length - 1) {
      this.pageIndex++;
      if (this.imageFiles.length > this.pageIndex) {
        this.currentImageFile = this.imageFiles[this.pageIndex];
      } else {
        this.currentImageFile = '';
      }
    }
  }

  previousClick() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      if (this.imageFiles.length > this.pageIndex) {
        this.currentImageFile = this.imageFiles[this.pageIndex];
      } else {
        this.currentImageFile = '';
      }
    }
  }
}
