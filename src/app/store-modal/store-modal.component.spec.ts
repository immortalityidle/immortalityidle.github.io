import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreModalComponent } from './store-modal.component';

describe('StoreModalComponent', () => {
  let component: StoreModalComponent;
  let fixture: ComponentFixture<StoreModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoreModalComponent ]
    })
    .compileComponents();
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
