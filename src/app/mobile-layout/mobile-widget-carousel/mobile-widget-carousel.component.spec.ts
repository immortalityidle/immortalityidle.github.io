import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileWidgetCarouselComponent } from './mobile-widget-carousel.component';

describe('MobileWidgetCarouselComponent', () => {
  let component: MobileWidgetCarouselComponent;
  let fixture: ComponentFixture<MobileWidgetCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileWidgetCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileWidgetCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
