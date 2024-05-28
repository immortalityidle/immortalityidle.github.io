import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchievementPanelComponent } from './achievement-panel.component';

describe('AchievementPanelComponent', () => {
  let component: AchievementPanelComponent;
  let fixture: ComponentFixture<AchievementPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AchievementPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AchievementPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
