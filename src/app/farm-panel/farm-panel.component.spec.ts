import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmPanelComponent } from './farm-panel.component';

describe('FarmPanelComponent', () => {
  let component: FarmPanelComponent;
  let fixture: ComponentFixture<FarmPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FarmPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FarmPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
