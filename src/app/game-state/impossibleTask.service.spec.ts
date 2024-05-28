import { TestBed } from '@angular/core/testing';

import { ImpossibleTaskService } from './impossibleTask.service';

describe('ImpossibleTaskService', () => {
  let service: ImpossibleTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImpossibleTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
