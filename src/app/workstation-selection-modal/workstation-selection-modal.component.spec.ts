import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkstationSelectionModalComponent } from './workstation-selection-modal.component';

describe('WorkstationSelectionModalComponent', () => {
  let component: WorkstationSelectionModalComponent;
  let fixture: ComponentFixture<WorkstationSelectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkstationSelectionModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkstationSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
