import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutOptionsModalComponent } from './layout-options-modal.component';

describe('LayoutOptionsModalComponent', () => {
  let component: LayoutOptionsModalComponent;
  let fixture: ComponentFixture<LayoutOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutOptionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutOptionsModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
