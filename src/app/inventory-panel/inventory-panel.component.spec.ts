import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryPanelComponent } from './inventory-panel.component';

describe('InventoryPanelComponent', () => {
  let component: InventoryPanelComponent;
  let fixture: ComponentFixture<InventoryPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
