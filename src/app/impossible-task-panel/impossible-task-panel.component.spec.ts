import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpossibleTaskPanelComponent } from './impossible-task-panel.component';

describe('ImpossibleTaskPanelComponent', () => {
  let component: ImpossibleTaskPanelComponent;
  let fixture: ComponentFixture<ImpossibleTaskPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImpossibleTaskPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpossibleTaskPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
