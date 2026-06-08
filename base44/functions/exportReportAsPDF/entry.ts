import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entityType, entityId } = await req.json();

    if (!entityType || !entityId) {
      return Response.json({ error: 'entityType and entityId required' }, { status: 400 });
    }

    // Validate entity type
    const validTypes = ['IntelligenceReport', 'VulnerabilityFinding'];
    if (!validTypes.includes(entityType)) {
      return Response.json({ error: `Invalid entity type: ${entityType}` }, { status: 400 });
    }

    // Fetch the entity
    const entity = base44.entities[entityType];
    const records = await entity.filter({ id: entityId }, '-created_date', 1);

    if (records.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const record = records[0];

    // RLS check: user can only export their own reports or admins can export any
    if (record.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    // Helper function to add text with word wrap
    const addWrappedText = (text, x, y, maxW, fontSize = 11) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, x, y);
      return y + lines.length * 7;
    };

    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`${entityType.replace(/([A-Z])/g, ' $1').trim()} Report`, margin, yPosition);
    yPosition += 15;

    // Metadata section
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const metadata = [
      `Report ID: ${record.id}`,
      `Created: ${new Date(record.created_date).toLocaleString()}`,
      `Created By: ${record.created_by}`,
      `Severity: ${record.severity?.toUpperCase() || 'N/A'}`,
      `Status: ${record.status?.toUpperCase() || 'N/A'}`
    ];

    metadata.forEach(line => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    yPosition += 5;

    // Title section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Title:', margin, yPosition);
    yPosition = addWrappedText(
      record.title || record.cve_id || 'Untitled',
      margin + 20,
      yPosition,
      maxWidth - 20,
      11
    );
    yPosition += 5;

    // Description/Executive Summary
    if (record.description || record.executive_summary) {
      doc.setFont(undefined, 'bold');
      doc.text('Summary:', margin, yPosition);
      yPosition += 7;
      yPosition = addWrappedText(
        record.description || record.executive_summary || '',
        margin + 5,
        yPosition,
        maxWidth - 10,
        10
      );
      yPosition += 5;
    }

    // Scan context (for IntelligenceReport)
    if (entityType === 'IntelligenceReport' && record.scanned_assets) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Scanned Assets:', margin, yPosition);
      yPosition += 7;
      const assets = Array.isArray(record.scanned_assets) 
        ? record.scanned_assets.join(', ') 
        : record.scanned_assets;
      yPosition = addWrappedText(assets, margin + 5, yPosition, maxWidth - 10, 10);
      yPosition += 5;
    }

    // Findings
    if (record.findings || record.affected_asset) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Findings & Details:', margin, yPosition);
      yPosition += 10;

      const findingsText = record.findings || record.description || '';
      yPosition = addWrappedText(findingsText, margin + 5, yPosition, maxWidth - 10, 10);
      yPosition += 5;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Generate PDF bytes
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${entityType}_${record.id}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});