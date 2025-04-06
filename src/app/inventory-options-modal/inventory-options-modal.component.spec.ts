import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryOptionsModalComponent } from './inventory-options-modal.component';

describe('InventoryOptionsModalComponent', () => {
  let component: InventoryOptionsModalComponent;
  let fixture: ComponentFixture<InventoryOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryOptionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryOptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
