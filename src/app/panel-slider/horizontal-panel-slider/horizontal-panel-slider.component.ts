import { Component, Input, OnInit } from '@angular/core';
import { PanelSliderComponent } from '../panel-slider.component';
import { ResizableDirective, Size } from '../resizable.directive';

@Component({
  selector: 'app-horizontal-panel-slider',
  templateUrl: './horizontal-panel-slider.component.html',
  styleUrls: ['./horizontal-panel-slider.component.less']
})
export class HorizontalPanelSliderComponent extends PanelSliderComponent implements OnInit {
  @Input() left?: ResizableDirective;
  @Input() right?: ResizableDirective;

  leftInitialSize?: Size;
  dragBeginX = 0;

  constructor() { 
    super();
  }

  ngOnInit(): void {
  }

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
