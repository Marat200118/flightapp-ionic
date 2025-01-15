import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightDetailsPage } from './flight-details.page';

describe('FlightDetailsPage', () => {
  let component: FlightDetailsPage;
  let fixture: ComponentFixture<FlightDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FlightDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
