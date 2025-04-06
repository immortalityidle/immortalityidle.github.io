import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CraftingOptionsModalComponent } from './crafting-options-modal.component';

describe('CraftingOptionsModalComponent', () => {
  let component: CraftingOptionsModalComponent;
  let fixture: ComponentFixture<CraftingOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CraftingOptionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CraftingOptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
