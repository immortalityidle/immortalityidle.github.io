import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CraftingPanelComponent } from './crafting-panel.component';

describe('CraftingPanelComponent', () => {
  let component: CraftingPanelComponent;
  let fixture: ComponentFixture<CraftingPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftingPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CraftingPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
