import { Component, Input } from '@angular/core';
import { PanelSliderComponent } from '../panel-slider.component';
import { ResizableDirective, Size } from '../resizable.directive';

@Component({
  selector: 'app-vertical-panel-slider',
  templateUrl: './vertical-panel-slider.component.html',
  styleUrls: ['./vertical-panel-slider.component.less'],
})
export class VerticalPanelSliderComponent extends PanelSliderComponent {
  @Input() top?: ResizableDirective;
  @Input() bottom?: ResizableDirective;

  topInitialSize?: Size;
  bottomInitialSize?: Size;
  dragBeginY = 0;

  override handleMouseDown(event: MouseEvent): void {
    super.handleMouseDown(event);
    this.dragBeginY = event.y;
    this.topInitialSize = this.top?.getSize();
    this.bottomInitialSize = this.bottom?.getSize();
  }

  override handleMouseMove(event: MouseEvent): void {
    if (this.topInitialSize === undefined || this.bottomInitialSize === undefined) {
      throw new Error('initial size was not defined');
    }
    const newTopMaxHeight = this.topInitialSize.height - this.dragBeginY + event.y;
    const newBottomMaxHeight = this.bottomInitialSize.height + this.dragBeginY - event.y;
    if (newTopMaxHeight > 0 && newBottomMaxHeight > 0) {
      this.top?.setMaxHeight(newTopMaxHeight);
      this.bottom?.setMaxHeight(newBottomMaxHeight);
    }
  }
}
