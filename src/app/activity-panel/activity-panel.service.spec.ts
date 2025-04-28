import { TestBed } from '@angular/core/testing';

import { ActivityPanelService } from './activity-panel.service';

describe('ActivityPanelService', () => {
  let service: ActivityPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityPanelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
