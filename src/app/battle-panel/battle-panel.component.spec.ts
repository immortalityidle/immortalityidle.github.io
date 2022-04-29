import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattlePanelComponent } from './battle-panel.component';

describe('BattlePanelComponent', () => {
  let component: BattlePanelComponent;
  let fixture: ComponentFixture<BattlePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BattlePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BattlePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
