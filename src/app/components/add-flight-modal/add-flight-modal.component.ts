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
      id: Date.now(), // Generate a unique ID
      flightNumber: this.flightNumber,
      originAirport: 'Sample Origin', // Replace with actual API data
      destinationAirport: 'Sample Destination', // Replace with actual API data
      date: this.flightDate,
    };

    this.modalController.dismiss(newFlight); // Pass the new flight data back
  }
}
