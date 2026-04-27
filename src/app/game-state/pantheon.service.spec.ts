import { TestBed } from '@angular/core/testing';

import { PantheonService } from './pantheon.service';

describe('PantheonService', () => {
  let service: PantheonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PantheonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
