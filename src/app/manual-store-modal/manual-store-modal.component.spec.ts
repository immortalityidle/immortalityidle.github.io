import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualStoreModalComponent } from './manual-store-modal.component';

describe('ManualStoreModalComponent', () => {
  let component: ManualStoreModalComponent;
  let fixture: ComponentFixture<ManualStoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManualStoreModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManualStoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
