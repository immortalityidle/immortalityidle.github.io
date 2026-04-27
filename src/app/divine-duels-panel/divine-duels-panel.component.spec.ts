import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DivineDuelsPanelComponent } from './divine-duels-panel.component';

describe('DivineDuelsPanelComponent', () => {
  let component: DivineDuelsPanelComponent;
  let fixture: ComponentFixture<DivineDuelsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DivineDuelsPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DivineDuelsPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
