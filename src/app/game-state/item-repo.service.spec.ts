import { TestBed } from '@angular/core/testing';

import { ItemRepoService } from './item-repo.service';

describe('ItemRepoService', () => {
  let service: ItemRepoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemRepoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
