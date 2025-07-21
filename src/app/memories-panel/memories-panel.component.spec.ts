import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoriesPanelComponent } from './memories-panel.component';

describe('MemoriesPanelComponent', () => {
  let component: MemoriesPanelComponent;
  let fixture: ComponentFixture<MemoriesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoriesPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoriesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
