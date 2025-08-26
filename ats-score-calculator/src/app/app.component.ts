import { Component, OnInit } from '@angular/core';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{
  jobDesc: string = '';
  resume: string = '';
  score: number | null = null;
  loading = false;
  calculating = false; 
  confettiPieces: any[] = [];

  constructor() {
    // Set the worker path manually
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  ngOnInit() {
    this.generateConfetti();
  }

  generateConfetti() {
    // Create 30 confetti pieces with random positions & animation delays
    this.confettiPieces = Array.from({ length: 30 }).map(() => ({
      left: Math.random() * 100 + '%',
      animationDuration: 2 + Math.random() * 1.5 + 's',
      animationDelay: Math.random() * 1.5 + 's',
      backgroundColor: this.randomColor(),
      rotateDirection: Math.random() > 0.5 ? 'normal' : 'reverse',
    }));
  }

  randomColor() {
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']; // red, green, blue, amber, violet
    return colors[Math.floor(Math.random() * colors.length)];
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.loading = true;
    const reader = new FileReader();

    reader.onload = () => {
      if (file.type === 'application/pdf') {
        this.extractTextFromPDF(new Uint8Array(reader.result as ArrayBuffer));
      } else {
        this.resume = reader.result as string;
        this.loading = false;
      }
    };

    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  async extractTextFromPDF(pdfData: Uint8Array) {
    this.loading = true;
    try {
      const pdf = await getDocument({ data: pdfData }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      this.resume = text;
    } finally {
      this.loading = false;
    }
  }

  calculateScore(jobText: string, resumeText: string): number {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    const jobWords = new Set(normalize(jobText));
    const resumeWords = new Set(normalize(resumeText));

    if (jobWords.size === 0) return 0;

    let matched = 0;
    jobWords.forEach((word) => {
      if (resumeWords.has(word)) matched++;
    });

    return Math.round((matched / jobWords.size) * 100);
  }

  onCalculate(): void {
    this.calculating = true;

    setTimeout(() => {
      this.score = this.calculateScore(this.jobDesc, this.resume);
      this.calculating = false;
    }, 500); // simulate delay so loader is visible (adjust as needed)
  }
}
