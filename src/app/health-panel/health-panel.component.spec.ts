import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthPanelComponent } from './health-panel.component';

describe('HealthPanelComponent', () => {
  let component: HealthPanelComponent;
  let fixture: ComponentFixture<HealthPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HealthPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
