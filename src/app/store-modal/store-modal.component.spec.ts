import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModalComponent } from './store-modal.component';

describe('StoreModalComponent', () => {
  let component: StoreModalComponent;
  let fixture: ComponentFixture<StoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoreModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
