import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import {
  Chart,
  registerables,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

@Component({
  selector: 'app-line-chart',
  template: `<canvas #lineChartCanvas></canvas>`,
  styleUrls: ['./line-chart.component.scss'],
  standalone: true,
})
export class LineChartComponent implements OnChanges {
  @Input() data: { month: string; hours: number }[] = [];
  @Input() label: string = '';

  @ViewChild('lineChartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chartInstance!: Chart;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data.length > 0) {
      this.createChart();
      console.log('Chart Data:', this.data);
    }
  }

  createChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    Chart.register(
      CategoryScale,
      LinearScale,
      LineElement,
      LineController,
      PointElement,
      Title,
      Tooltip,
      Legend
    );

    const canvas = this.chartCanvas.nativeElement;

    if (!canvas) {
      console.error('Canvas element is not available.');
      return;
    }

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.data.map((item) => item.month),
        datasets: [
          {
            label: this.label,
            data: this.data.map((item) => item.hours),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Month',
            },
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Hours',
            },
          },
        },
      },
    });
  }
}
