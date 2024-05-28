import { TestBed } from '@angular/core/testing';

import { ReincarnationService } from './reincarnation.service';

describe('ReincarnationService', () => {
  let service: ReincarnationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReincarnationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
