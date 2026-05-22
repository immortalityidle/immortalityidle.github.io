import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarModalComponent } from './avatar-modal.component';

describe('AvatarModalComponent', () => {
  let component: AvatarModalComponent;
  let fixture: ComponentFixture<AvatarModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
