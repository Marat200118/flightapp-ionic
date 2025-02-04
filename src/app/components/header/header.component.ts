import { Component, OnInit } from '@angular/core';
import { IonImg } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonImg]
})
export class HeaderComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
