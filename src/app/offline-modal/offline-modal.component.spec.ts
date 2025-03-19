import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineModalComponent } from './offline-modal.component';

describe('OfflineModalComponent', () => {
  let component: OfflineModalComponent;
  let fixture: ComponentFixture<OfflineModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfflineModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
