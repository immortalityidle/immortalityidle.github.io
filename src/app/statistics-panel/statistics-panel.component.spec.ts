import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsPanelComponent } from './statistics-panel.component';

describe('StatisticsPanelComponent', () => {
  let component: StatisticsPanelComponent;
  let fixture: ComponentFixture<StatisticsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatisticsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
