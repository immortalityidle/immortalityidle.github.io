import { TestBed } from '@angular/core/testing';

import { CommonButtonsService } from './common-buttons.service';

describe('CommonButtonsService', () => {
  let service: CommonButtonsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonButtonsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
