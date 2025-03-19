import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextPanelComponent } from './text-panel.component';

describe('TextPanelComponent', () => {
  let component: TextPanelComponent;
  let fixture: ComponentFixture<TextPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextPanelComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
