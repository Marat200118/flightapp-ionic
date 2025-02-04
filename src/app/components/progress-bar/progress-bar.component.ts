import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="progress-container">
      <div class="progress-bar" [style.width.%]="getProgressPercentage()"></div>
    </div>
    <div class="progress-label">
      <span>{{ label }}</span>
      <span>{{ value | number:'1.0-0' }} / {{ goal | number:'1.0-0' }} km</span>
    </div>
  `,
  styleUrls: ['./progress-bar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() goal: number = 100;
  @Input() label: string = '';

  getProgressPercentage(): number {
    return (this.value / this.goal) * 100;
  }
}
