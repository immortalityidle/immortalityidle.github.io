import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityOptionsModalComponent } from './activity-options-modal.component';

describe('ActivityOptionsModalComponent', () => {
  let component: ActivityOptionsModalComponent;
  let fixture: ComponentFixture<ActivityOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityOptionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityOptionsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
