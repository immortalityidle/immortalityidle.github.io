import { TestBed } from '@angular/core/testing';

import { ContemplationService } from './contemplation.service';

describe('ContemplationService', () => {
  let service: ContemplationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContemplationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
