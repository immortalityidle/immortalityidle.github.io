import { Component, computed, ElementRef, inject, input, OnInit } from '@angular/core';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';
import { MobileActivitiesComponent } from '../mobile-activities/mobile-activities.component';
import { MobileTimeComponent } from '../mobile-time/mobile-time.component';
import { AttributesPanelComponent } from '../../attributes-panel/attributes-panel.component';
import { HomePanelComponent } from '../../home-panel/home-panel.component';
import { LogPanelComponent } from '../../log-panel/log-panel.component';
import { BattlePanelComponent } from '../../battle-panel/battle-panel.component';
import { InventoryPanelComponent } from '../../inventory-panel/inventory-panel.component';
import { MobileWidgetCarouselService } from './mobile-widget-carousel.service';

export type CarouselName = 'carousel1' | 'carousel2';
export type WidgetName = 'activities' | 'time' | 'attributes' | 'home' | 'log' | 'battle' | 'inventory';

@Component({
  selector: 'app-mobile-widget-carousel',
  imports: [
    MobileActivitiesComponent,
    MobileTimeComponent,
    AttributesPanelComponent,
    HomePanelComponent,
    LogPanelComponent,
    BattlePanelComponent,
    InventoryPanelComponent,
  ],
  templateUrl: './mobile-widget-carousel.component.html',
  styleUrl: './mobile-widget-carousel.component.less',
})
export class MobileWidgetCarouselComponent implements OnInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly mobileWidgetCarouselService = inject(MobileWidgetCarouselService);

  readonly carouselName = input.required<CarouselName>();
  readonly startWidget = input.required<WidgetName>();

  protected otherCarouselSelection = computed<WidgetName | undefined>(() => {
    const carouselName = this.carouselName();
    const carousel1Selection = this.mobileWidgetCarouselService.carousel1Selection();
    const carousel2Selection = this.mobileWidgetCarouselService.carousel2Selection();

    if (carouselName === 'carousel1') {
      return carousel2Selection;
    } else if (carouselName === 'carousel2') {
      return carousel1Selection;
    } else {
      throw new Error(`Unknown carousel name: ${carouselName}`);
    }
  });

  private emblaCarousel?: EmblaCarouselType;

  ngOnInit(): void {
    const emblaNode = this.elementRef.nativeElement;

    const options = { loop: true };
    // Initialize the carousel
    this.emblaCarousel = EmblaCarousel(emblaNode, options);
    this.emblaCarousel.on('select', () => {
      const newWidgetName = this.getWidgetAt(this.emblaCarousel?.selectedScrollSnap() ?? -1);
      this.mobileWidgetCarouselService.setCarouselSelection(this.carouselName(), newWidgetName);
    });

    this.emblaCarousel.on('slidesChanged', () => {
      const carouselSelection = this.mobileWidgetCarouselService.getCarouselSelection(this.carouselName());
      for (let i = 0; i < (this.emblaCarousel?.slideNodes().length ?? 0); i++) {
        if (this.getWidgetAt(i) === carouselSelection) {
          this.emblaCarousel?.scrollTo(i, true);
          return;
        }
      }
    });

    window.setTimeout(() => {
      const startIndex = this.getIndexOf(this.startWidget());
      this.mobileWidgetCarouselService.setCarouselSelection(this.carouselName(), this.getWidgetAt(startIndex));
      this.emblaCarousel?.scrollTo(startIndex, true);
    }, 50);
  }

  private getWidgetAt(index: number): WidgetName {
    const tagName = this.emblaCarousel?.slideNodes()[index].tagName;
    switch (tagName) {
      case 'APP-MOBILE-ACTIVITIES':
        return 'activities';
      case 'APP-MOBILE-TIME':
        return 'time';
      case 'APP-ATTRIBUTES-PANEL':
        return 'attributes';
      case 'APP-BATTLE-PANEL':
        return 'battle';
      case 'APP-HOME-PANEL':
        return 'home';
      case 'APP-INVENTORY-PANEL':
        return 'inventory';
      case 'APP-LOG-PANEL':
        return 'log';
      default:
        throw new Error(`Unknown widget: ${tagName}`);
    }
  }

  private getIndexOf(widgetName: WidgetName): number {
    for (let i = 0; i < (this.emblaCarousel?.slideNodes.length ?? 0); i++) {
      if (widgetName === this.getWidgetAt(i)) {
        return i;
      }
    }
    return 0;
  }
}
