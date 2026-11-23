import { ComponentRef, Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipComponent } from './tooltip.component';
import { GameStateService } from '../game-state/game-state.service';

// We want this at the module level, so that it's a shared property with all tooltips, then we
// can make it so only the first tooltip in the stack is shown.
let tooltipShown = false;

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[tooltip]',
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('tooltip') text = '';
  delay = 300;
  // @ts-expect-error defined in ngOnInit instead of constructor
  overlayRef: OverlayRef;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private elementRef: ElementRef,
    private gameStateService: GameStateService
  ) {}

  ngOnDestroy(): void {
    if (this.gameStateService.tooltipTimeoutId) {
      clearTimeout(this.gameStateService.tooltipTimeoutId);
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  show(event) {
    if (tooltipShown || (event.buttons && event.buttons > 0)) {
      return;
    }
    tooltipShown = true;

    window.clearTimeout(this.gameStateService.tooltipTimeoutId);
    this.gameStateService.tooltipTimeoutId = window.setTimeout(() => {
      if (this.text.trim().length !== 0) {
        if (!this.overlayRef.hasAttached()) {
          const tooltipRef: ComponentRef<TooltipComponent> = this.overlayRef.attach(
            new ComponentPortal(TooltipComponent)
          );
          tooltipRef.instance.text = this.text;
          for (let i = this.gameStateService.overlayRefs.length - 1; i >= 0; i--) {
            const ref = this.gameStateService.overlayRefs[i];
            if (ref !== this.overlayRef) {
              ref.detach();
              this.gameStateService.overlayRefs.splice(i, 1);
            }
          }
          this.gameStateService.overlayRefs.push(this.overlayRef);
        }
      }
    }, this.delay);
  }

  @HostListener('mouseout')
  @HostListener('mouseleave')
  @HostListener('change')
  @HostListener('click')
  @HostListener('drag')
  @HostListener('invalid')
  @HostListener('touchmove')
  hide() {
    tooltipShown = false;
    if (this.gameStateService.tooltipTimeoutId) {
      window.clearTimeout(this.gameStateService.tooltipTimeoutId);
    }
    this.gameStateService.tooltipTimeoutId = 0;
    this.overlayRef.detach();
  }

  @HostListener('mousemove', ['$event'])
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  maybeHide(event) {
    if (event.buttons && event.buttons > 0) {
      this.hide();
    }
  }
}
