export abstract class PanelSliderComponent {
  mouseMoveListener = this.handleMouseMove.bind(this);
  mouseUpListener = this.handleMouseUp.bind(this);

  constructor() {}

  handleMouseDown(event: MouseEvent) {
    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseup', this.mouseUpListener);
  }

  handleMouseUp(): void {
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
  }

  abstract handleMouseMove(event: MouseEvent): void;
}
