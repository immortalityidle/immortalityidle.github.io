import { TestBed } from '@angular/core/testing';

import { MobileWidgetCarouselService } from './mobile-widget-carousel.service';

describe('MobileWidgetCarouselService', () => {
  let service: MobileWidgetCarouselService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MobileWidgetCarouselService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
