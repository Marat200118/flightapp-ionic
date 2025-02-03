//onboarding.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, HeaderComponent, RouterModule, IonTitle, IonToolbar, IonImg, IonButton, CommonModule, FormsModule]
})
export class OnboardingPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
