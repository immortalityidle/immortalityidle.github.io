import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FarmOptionsModalComponent } from './farm-options-modal.component';

describe('FarmOptionsModalComponent', () => {
  let component: FarmOptionsModalComponent;
  let fixture: ComponentFixture<FarmOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmOptionsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmOptionsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
