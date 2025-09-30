export class Chart {
  constructor(ctx, config) {
    this.ctx = ctx.getContext('2d');
    this.config = config;
    this.draw();
  }

  clear() {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = '#101322';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  draw() {
    const { type, data } = this.config;
    this.clear();
    if (type === 'bar') {
      this.drawBarChart(data);
    } else {
      this.drawLineChart(data);
    }
  }

  drawBarChart(data) {
    const canvas = this.ctx.canvas;
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    const max = Math.max(...data.datasets[0].data, 1);
    const barWidth = width / data.labels.length - 12;
    data.labels.forEach((label, index) => {
      const value = data.datasets[0].data[index];
      const barHeight = (value / max) * height;
      const x = padding + index * (barWidth + 12);
      const y = canvas.height - padding - barHeight;
      this.ctx.fillStyle = data.datasets[0].backgroundColor[index] || '#38f9d7';
      this.ctx.fillRect(x, y, barWidth, barHeight);
      this.ctx.fillStyle = '#e4e9ff';
      this.ctx.fillText(label, x, canvas.height - padding + 16);
      this.ctx.fillText(String(value), x, y - 6);
    });
  }

  drawLineChart(data) {
    const canvas = this.ctx.canvas;
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    const dataset = data.datasets[0];
    const max = Math.max(...dataset.data, 1);
    const stepX = width / Math.max(dataset.data.length - 1, 1);
    this.ctx.strokeStyle = dataset.borderColor || '#38f9d7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    dataset.data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = canvas.height - padding - (value / max) * height;
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      this.ctx.fillStyle = '#e4e9ff';
      this.ctx.fillText(data.labels[index], x - 10, canvas.height - padding + 16);
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.strokeStyle = dataset.borderColor || '#38f9d7';
    });
    this.ctx.stroke();
  }

  update(config) {
    this.config = { ...this.config, ...config };
    this.draw();
  }
}

globalThis.Chart = Chart;
