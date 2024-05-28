import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FurnitureStoreModalComponent } from './furniture-store-modal.component';

describe('FurnitureStoreModalComponent', () => {
  let component: FurnitureStoreModalComponent;
  let fixture: ComponentFixture<FurnitureStoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FurnitureStoreModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FurnitureStoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
