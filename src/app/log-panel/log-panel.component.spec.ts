import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogPanelComponent } from './log-panel.component';

describe('LogPanelComponent', () => {
  let component: LogPanelComponent;
  let fixture: ComponentFixture<LogPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
