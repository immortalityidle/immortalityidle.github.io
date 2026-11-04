import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobilePanelWrapperComponent } from './mobile-panel-wrapper.component';

describe('MobilePanelWrapperComponent', () => {
  let component: MobilePanelWrapperComponent;
  let fixture: ComponentFixture<MobilePanelWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobilePanelWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MobilePanelWrapperComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
