import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AscensionStoreModalComponent } from './ascension-store-modal.component';

describe('AscensionStoreModalComponent', () => {
  let component: AscensionStoreModalComponent;
  let fixture: ComponentFixture<AscensionStoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AscensionStoreModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AscensionStoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
