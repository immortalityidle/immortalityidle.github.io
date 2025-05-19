import { Injectable, signal, WritableSignal } from '@angular/core';
import { CarouselName, WidgetName } from './mobile-widget-carousel.component';

@Injectable({
  providedIn: 'root',
})
export class MobileWidgetCarouselService {
  public carousel1Selection = signal<WidgetName | undefined>(undefined);
  public carousel2Selection = signal<WidgetName | undefined>(undefined);

  public setCarouselSelection(carouselName: CarouselName, selection: WidgetName): void {
    this.getCarouselFromName(carouselName).set(selection);
  }

  public getCarouselSelection(carouselName: CarouselName): WidgetName | undefined {
    return this.getCarouselFromName(carouselName)();
  }

  private getCarouselFromName(carouselName: CarouselName): WritableSignal<WidgetName | undefined> {
    if (carouselName === 'carousel1') {
      return this.carousel1Selection;
    } else if (carouselName === 'carousel2') {
      return this.carousel2Selection;
    } else {
      throw new Error(`Unknown carousel specified: ${carouselName}`);
    }
  }
}
