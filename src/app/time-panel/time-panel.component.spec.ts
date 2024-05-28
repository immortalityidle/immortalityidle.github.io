import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimePanelComponent } from './time-panel.component';

describe('TimePanelComponent', () => {
  let component: TimePanelComponent;
  let fixture: ComponentFixture<TimePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimePanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
