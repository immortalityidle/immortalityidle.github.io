import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HellStatusPanelComponent } from './hell-status-panel.component';

describe('HellStatusPanelComponent', () => {
  let component: HellStatusPanelComponent;
  let fixture: ComponentFixture<HellStatusPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HellStatusPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HellStatusPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
