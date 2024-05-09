import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetsPanelComponent } from './pets-panel.component';

describe('PetsPanelComponent', () => {
  let component: PetsPanelComponent;
  let fixture: ComponentFixture<PetsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PetsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
