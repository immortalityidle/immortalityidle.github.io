import { ComponentRef, Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[tooltip]',
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('tooltip') text = '';
  // @ts-expect-error defined in ngOnInit instead of constructor
  private overlayRef: OverlayRef;
  timeoutId = 0;
  delay = 300;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private elementRef: ElementRef
  ) {}

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.overlayRef.detach();
    this.overlayRef.dispose();
  }

  ngOnInit(): void {
    const positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
    ]);

    this.overlayRef = this.overlay.create({ positionStrategy });
  }

  @HostListener('mouseover', ['$event'])
  @HostListener('touchstart', ['$event'])
  // @ts-ignore
  show(event) {
    event.stopPropagation();
    // @ts-ignore
    this.timeoutId = setTimeout(() => {
      if (this.text.trim().length !== 0) {
        const tooltipRef: ComponentRef<TooltipComponent> = this.overlayRef.attach(
          new ComponentPortal(TooltipComponent)
        );
        tooltipRef.instance.text = this.text;
      }
    }, this.delay);
  }

  @HostListener('mouseout')
  @HostListener('mouseleave')
  @HostListener('touchend')
  @HostListener('touchcancel')
  @HostListener('change')
  @HostListener('click')
  @HostListener('drag')
  @HostListener('invalid')
  @HostListener('unload')
  hide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.overlayRef.detach();
  }
}
