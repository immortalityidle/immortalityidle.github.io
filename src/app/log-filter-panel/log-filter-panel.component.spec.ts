import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogFilterPanelComponent } from './log-filter-panel.component';

describe('LogFilterPanelComponent', () => {
  let component: LogFilterPanelComponent;
  let fixture: ComponentFixture<LogFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogFilterPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
