import { TestBed } from '@angular/core/testing';

import { FollowersService } from './followers.service';

describe('FollowersService', () => {
  let service: FollowersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FollowersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
