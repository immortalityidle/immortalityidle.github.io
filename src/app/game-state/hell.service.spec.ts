import { TestBed } from '@angular/core/testing';

import { HellService } from './hell.service';

describe('HellService', () => {
  let service: HellService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HellService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
