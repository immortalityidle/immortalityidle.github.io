import { Component, ElementRef, inject, input, OnInit } from '@angular/core';
import EmblaCarousel from 'embla-carousel';
import { MobileActivitiesComponent } from '../mobile-activities/mobile-activities.component';
import { MobileTimeComponent } from '../mobile-time/mobile-time.component';
import { AttributesPanelComponent } from '../../attributes-panel/attributes-panel.component';
import { HomePanelComponent } from '../../home-panel/home-panel.component';
import { LogPanelComponent } from '../../log-panel/log-panel.component';
import { BattlePanelComponent } from '../../battle-panel/battle-panel.component';
import { InventoryPanelComponent } from '../../inventory-panel/inventory-panel.component';

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

  readonly startIndex = input<number>();

  ngOnInit(): void {
    const emblaNode = this.elementRef.nativeElement;
    const options = { loop: true, startIndex: this.startIndex() ?? 0 };
    // Initialize the carousel
    EmblaCarousel(emblaNode, options);
  }
}
