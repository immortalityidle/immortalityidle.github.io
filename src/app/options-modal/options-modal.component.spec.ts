import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsModalComponent } from './options-modal.component';

describe('OptionsModalComponent', () => {
  let component: OptionsModalComponent;
  let fixture: ComponentFixture<OptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptionsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
