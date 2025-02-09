import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-add-flight-modal',
  templateUrl: './add-flight-modal.component.html',
  styleUrls: ['./add-flight-modal.component.scss'],
  imports: [IonicModule, FormsModule],
})
export class AddFlightModalComponent {
  flightNumber = '';
  flightDate = '';

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  addFlight() {
    if (!this.flightNumber || !this.flightDate) {
      alert('Please fill in all details.');
      return;
    }

    const newFlight = {
      id: Date.now(),
      flightNumber: this.flightNumber,
      originAirport: 'Sample Origin',
      destinationAirport: 'Sample Destination',
      date: this.flightDate,
    };

    this.modalController.dismiss(newFlight);
  }
}
