// Certificate Generation Service
import jsPDF from 'jspdf';

export interface CertificateData {
  recipientName: string;
  organizationName: string;
  courseName: string;
  issueDate: string;
  certificateType: string;
  certificateId?: string;
}

export class CertificateService {
  generatePDF(data: CertificateData): Blob {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210], // A4 landscape
    });

    // Background fill
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 297, 210, 'F');

    // Title
    doc.setFontSize(36);
    doc.setTextColor(255, 255, 255);
    doc.text('CERTIFICATE OF COMPLETION', 148.5, 40, { align: 'center' });

    // Decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(50, 50, 247, 50);

    // This is to certify
    doc.setFontSize(14);
    doc.text('This is to certify that', 148.5, 70, { align: 'center' });

    // Recipient name
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.recipientName.toUpperCase(), 148.5, 90, { align: 'center' });

    // Has successfully completed
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed', 148.5, 110, { align: 'center' });

    // Course name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(data.courseName, 148.5, 130, { align: 'center' });

    // Organization
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Issued by ${data.organizationName}`, 148.5, 150, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.text(`Date: ${data.issueDate}`, 148.5, 170, { align: 'center' });

    // Certificate ID
    if (data.certificateId) {
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Certificate ID: ${data.certificateId}`, 148.5, 190, { align: 'center' });
    }

    // Decorative border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.rect(10, 10, 277, 190);

    // Generate blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  downloadPDF(data: CertificateData, filename?: string): void {
    const blob = this.generatePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `certificate_${data.recipientName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const certificateService = new CertificateService();


