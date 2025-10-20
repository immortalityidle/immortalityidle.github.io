import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechniqueOptionsModalComponent } from './technique-options-modal.component';

describe('TechniqueOptionsModalComponent', () => {
  let component: TechniqueOptionsModalComponent;
  let fixture: ComponentFixture<TechniqueOptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechniqueOptionsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechniqueOptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
