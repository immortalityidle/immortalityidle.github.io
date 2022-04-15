import { TestBed } from '@angular/core/testing';

import { MainLoopService } from './main-loop.service';

describe('MainLoopService', () => {
  let service: MainLoopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainLoopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
