import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialPanelComponent } from './tutorial-panel.component';

describe('TutorialPanelComponent', () => {
  let component: TutorialPanelComponent;
  let fixture: ComponentFixture<TutorialPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
