import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YinYangComponent } from './yin-yang.component';

describe('YinYangComponent', () => {
  let component: YinYangComponent;
  let fixture: ComponentFixture<YinYangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YinYangComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(YinYangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
