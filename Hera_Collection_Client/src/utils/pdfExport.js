import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Hera Brand Colors (from index.css)
const COLORS = {
  primary: '#7C3AED',        // Primary purple
  primaryLight: '#A855F7',   // Light purple
  primaryDark: '#6D28D9',    // Dark purple
  success: '#22C55E',        // Green
  warning: '#F59E0B',        // Amber
  danger: '#EF4444',         // Red
  text: '#1F2937',           // Dark gray
  textLight: '#6B7280',      // Medium gray
  background: '#FFFFFF',     // White
  border: '#E5E7EB',         // Light gray
};

/**
 * Generate a professional PDF report for a completed stock take
 * @param {Object} stockTake - The stock take data
 * @param {Array} items - Array of stock take items
 */
export const generateStockTakePDF = (stockTake, items = []) => {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Add purple gradient background for header
  doc.setFillColor(124, 58, 237); // Primary purple
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Company Logo/Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('HERA COLLECTION', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Inventory Audit Report', pageWidth / 2, 28, { align: 'center' });

  // Report metadata in header
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, 35, { align: 'center' });
  doc.text(`Report ID: ST-${stockTake.id}`, pageWidth / 2, 40, { align: 'center' });

  yPosition = 60;

  // ============================================
  // AUDIT INFORMATION SECTION
  // ============================================
  
  doc.setTextColor(31, 41, 55); // Dark text
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Information', 15, yPosition);
  
  yPosition += 10;

  // Info box with border
  doc.setDrawColor(124, 58, 237);
  doc.setLineWidth(0.5);
  doc.rect(15, yPosition - 5, pageWidth - 30, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Left column
  doc.text('Audit Title:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(stockTake.title || 'N/A', 20, yPosition + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  const description = stockTake.description || 'No description provided';
  const splitDescription = doc.splitTextToSize(description, 80);
  doc.text(splitDescription, 20, yPosition + 17);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', pageWidth / 2 + 10, yPosition);
  doc.setFont('helvetica', 'normal');
  
  // Status badge with color
  const statusColors = {
    COMPLETED: COLORS.success,
    IN_PROGRESS: COLORS.warning,
    PENDING: COLORS.textLight,
  };
  doc.setTextColor(statusColors[stockTake.status] || COLORS.textLight);
  doc.text(stockTake.status, pageWidth / 2 + 10, yPosition + 5);
  doc.setTextColor(31, 41, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('Created By:', pageWidth / 2 + 10, yPosition + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(stockTake.createdBy?.name || 'System', pageWidth / 2 + 10, yPosition + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Completed:', pageWidth / 2 + 10, yPosition + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(
    stockTake.completedAt ? format(new Date(stockTake.completedAt), 'MMM dd, yyyy HH:mm') : 'N/A',
    pageWidth / 2 + 10,
    yPosition + 29
  );

  yPosition += 50;

  // ============================================
  // SUMMARY STATISTICS
  // ============================================
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 15, yPosition);
  
  yPosition += 10;

  // Stats cards
  const stats = [
    { label: 'Total Items', value: stockTake.totalItems || 0, color: COLORS.primary },
    { label: 'Items Counted', value: stockTake.itemsCounted || 0, color: COLORS.success },
    { label: 'Discrepancies', value: stockTake.itemsAdjusted || 0, color: COLORS.warning },
    { label: 'Value Impact', value: `KES ${stockTake.discrepancyValue || '0.00'}`, color: COLORS.danger },
  ];

  const cardWidth = (pageWidth - 40) / 4;
  stats.forEach((stat, index) => {
    const xPos = 15 + (index * cardWidth) + (index * 2);
    
    // Card background
    doc.setFillColor(245, 243, 255); // Light purple
    doc.roundedRect(xPos, yPosition, cardWidth, 20, 2, 2, 'F');
    
    // Colored top border
    const rgb = hexToRgb(stat.color);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(xPos, yPosition, cardWidth, 3, 2, 2, 'F');
    
    // Text
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos + cardWidth / 2, yPosition + 10, { align: 'center' });
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stat.value), xPos + cardWidth / 2, yPosition + 17, { align: 'center' });
  });

  yPosition += 30;

  // ============================================
  // DETAILED ITEMS TABLE
  // ============================================
  
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Audit Details', 15, yPosition);
  
  yPosition += 5;

  // Prepare table data
  const tableData = items.map((item, index) => {
    const variance = (item.countedQuantity || 0) - (item.systemQuantity || 0);
    const varianceText = variance > 0 ? `+${variance}` : String(variance);
    const status = variance === 0 ? '✓ Match' : '⚠ Variance';
    
    return [
      index + 1,
      item.variant?.product?.title || 'Unknown Product',
      item.variant?.sku || 'N/A',
      item.systemQuantity || 0,
      item.countedQuantity || 0,
      varianceText,
      status,
    ];
  });

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Product', 'SKU', 'System', 'Counted', 'Variance', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237], // Primary purple
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Very light gray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 25 },
    },
    didParseCell: function(data) {
      // Color code variance column
      if (data.column.index === 5 && data.section === 'body') {
        const variance = parseInt(data.cell.text[0]);
        if (variance > 0) {
          data.cell.styles.textColor = [34, 197, 94]; // Green
        } else if (variance < 0) {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      }
      
      // Color code status column
      if (data.column.index === 6 && data.section === 'body') {
        if (data.cell.text[0].includes('Match')) {
          data.cell.styles.textColor = [34, 197, 94]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [245, 158, 11]; // Amber
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 15, right: 15 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ============================================
  // FOOTER SECTION
  // ============================================
  
  // Check if we need a new page
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  // Signature section
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Approved By:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(stockTake.approvedBy?.name || '____________________', 20, yPosition + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth / 2 + 10, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(
    stockTake.completedAt ? format(new Date(stockTake.completedAt), 'MMM dd, yyyy') : '____________________',
    pageWidth / 2 + 10,
    yPosition + 5
  );

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Purple footer bar
    doc.setFillColor(124, 58, 237);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Hera Collection - Inventory Management System',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 20,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // ============================================
  // SAVE PDF
  // ============================================
  
  const fileName = `Stock_Take_${stockTake.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export default generateStockTakePDF;
