import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-gauge',
  template: `
    <div class="gauge-container">
      <svg class="gauge-svg" viewBox="0 0 36 36">
        <path
          class="gauge-background"
          d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
        ></path>
        <path
          class="gauge-fill"
          [attr.stroke-dasharray]="getGaugeStroke()"
          d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
        ></path>
      </svg>
      <div class="gauge-label">
        <h2>{{ value }}</h2>
        <p>{{ label }}</p>
      </div>
    </div>
  `,
  styleUrls: ['./gauge.component.scss'],
  standalone: true,
})
export class GaugeComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() label: string = '';

  getGaugeStroke(): string {
    const percentage = (this.value / this.max) * 100;
    return `${percentage}, 100`;
  }
}
