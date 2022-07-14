import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalPanelSliderComponent } from './horizontal-panel-slider.component';

describe('HorizontalPanelSliderComponent', () => {
  let component: HorizontalPanelSliderComponent;
  let fixture: ComponentFixture<HorizontalPanelSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HorizontalPanelSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizontalPanelSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
