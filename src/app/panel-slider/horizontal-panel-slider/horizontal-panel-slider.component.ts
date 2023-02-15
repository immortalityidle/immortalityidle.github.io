import { Component, Input } from '@angular/core';
import { PanelSliderComponent } from '../panel-slider.component';
import { ResizableDirective, Size } from '../resizable.directive';

@Component({
  selector: 'app-horizontal-panel-slider',
  templateUrl: './horizontal-panel-slider.component.html',
  styleUrls: ['./horizontal-panel-slider.component.less'],
})
export class HorizontalPanelSliderComponent extends PanelSliderComponent {
  @Input() left?: ResizableDirective;
  @Input() right?: ResizableDirective;

  leftInitialSize?: Size;
  dragBeginX = 0;

  override handleMouseDown(event: MouseEvent): void {
    super.handleMouseDown(event);
    this.dragBeginX = event.x;
    this.leftInitialSize = this.left?.getSize();
  }

  override handleMouseMove(event: MouseEvent): void {
    if (this.leftInitialSize === undefined) {
      throw new Error('leftInitialSize was not defined');
    }
    this.left?.setMaxHeight(this.leftInitialSize.width - this.dragBeginX + event.x);
  }
}
