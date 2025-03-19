import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleOptionsPanelComponent } from './battle-options-panel.component';

describe('BattleOptionsPanelComponent', () => {
  let component: BattleOptionsPanelComponent;
  let fixture: ComponentFixture<BattleOptionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleOptionsPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BattleOptionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
