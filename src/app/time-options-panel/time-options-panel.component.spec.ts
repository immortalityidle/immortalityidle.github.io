import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeOptionsPanelComponent } from './time-options-panel.component';

describe('TimeOptionsPanelComponent', () => {
  let component: TimeOptionsPanelComponent;
  let fixture: ComponentFixture<TimeOptionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeOptionsPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeOptionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
