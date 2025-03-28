import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechniquePanelComponent } from './technique-panel.component';

describe('TechniquePanelComponent', () => {
  let component: TechniquePanelComponent;
  let fixture: ComponentFixture<TechniquePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechniquePanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechniquePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
