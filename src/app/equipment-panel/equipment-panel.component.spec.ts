import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentPanelComponent } from './equipment-panel.component';

describe('EquipmentPanelComponent', () => {
  let component: EquipmentPanelComponent;
  let fixture: ComponentFixture<EquipmentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EquipmentPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EquipmentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
