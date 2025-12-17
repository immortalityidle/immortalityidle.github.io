import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContemplationPanelComponent } from './contemplation-panel.component';

describe('ContemplationPanelComponent', () => {
  let component: ContemplationPanelComponent;
  let fixture: ComponentFixture<ContemplationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContemplationPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContemplationPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
