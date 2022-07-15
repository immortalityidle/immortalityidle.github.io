import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalPanelSliderComponent } from './vertical-panel-slider.component';

describe('VerticalPanelSliderComponent', () => {
  let component: VerticalPanelSliderComponent;
  let fixture: ComponentFixture<VerticalPanelSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerticalPanelSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalPanelSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
