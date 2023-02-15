import { Directive, ElementRef } from '@angular/core';

export interface Size {
  height: number;
  width: number;
}

@Directive({
  selector: '[appResizable]',
  exportAs: 'appResizable',
})
export class ResizableDirective {
  private nativeElement: HTMLElement;

  constructor(elementRef: ElementRef) {
    this.nativeElement = elementRef.nativeElement;
  }

  setMaxHeight(maxHeight: number) {
    this.nativeElement.setAttribute('style', `max-height: ${maxHeight}px;`);
  }

  getSize(): Size {
    return {
      width: this.nativeElement.clientWidth,
      height: this.nativeElement.clientHeight,
    };
  }
}
