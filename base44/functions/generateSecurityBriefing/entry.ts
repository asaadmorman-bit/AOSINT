// v2
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { template, warRoomId, investigationId, reportId, customTitle, classification, audience } = await req.json();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ---- Colors ----
    const C = {
      dark: [10, 14, 26],
      accent: [0, 212, 255],
      accentDark: [0, 153, 204],
      danger: [255, 71, 87],
      warn: [255, 165, 2],
      success: [46, 213, 115],
      textPrimary: [255, 255, 255],
      textSecondary: [156, 163, 175],
      surface: [17, 24, 39],
      surfaceAlt: [13, 18, 32],
      border: [255, 255, 255, 0.06],
    };

    const SEV_COLOR = {
      critical: [255, 71, 87], high: [255, 107, 53], medium: [255, 165, 2],
      low: [46, 213, 115], informational: [107, 114, 128],
    };

    const addPage = () => {
      doc.addPage();
      // dark bg
      doc.setFillColor(...C.dark);
      doc.rect(0, 0, pageW, pageH, 'F');
      y = margin;
    };

    const checkPage = (needed = 15) => { if (y + needed > pageH - 15) addPage(); };

    const hline = (color = [255,255,255,0.08]) => {
      doc.setDrawColor(...color.slice(0,3));
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const text = (str, x, size = 9, color = C.textPrimary, style = 'normal', maxW = null) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.setFont('helvetica', style);
      if (maxW) {
        const lines = doc.splitTextToSize(str, maxW);
        doc.text(lines, x, y);
        return lines.length;
      }
      doc.text(str, x, y);
      return 1;
    };

    const tag = (label, x, tagY, bgColor, textColor) => {
      const w = doc.getTextWidth(label) + 4;
      doc.setFillColor(...bgColor);
      doc.roundedRect(x, tagY - 3.5, w, 5, 1, 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), x + 2, tagY);
      return w + 2;
    };

    // ================================================================
    // COVER PAGE
    // ================================================================
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Top accent bar
    doc.setFillColor(...C.accent);
    doc.rect(0, 0, pageW, 2, 'F');

    // Classification banner
    const classColors = {
      unclassified: [[107,114,128],[255,255,255]],
      sensitive: [[255,165,2],[0,0,0]],
      confidential: [[255,71,87],[255,255,255]],
      restricted: [[168,85,247],[255,255,255]],
    };
    const [clsBg, clsTxt] = classColors[classification || 'sensitive'] || classColors.sensitive;
    doc.setFillColor(...clsBg);
    doc.rect(0, 5, pageW, 8, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...clsTxt);
    doc.setFont('helvetica', 'bold');
    doc.text(`// ${(classification || 'SENSITIVE').toUpperCase()} //`, pageW / 2, 10.5, { align: 'center' });

    y = 40;

    // Logo / branding block
    doc.setFontSize(7);
    doc.setTextColor(...C.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('ASOSINT · ASAAD & SHAUNTZE\'S OSINT', margin, y);
    doc.setTextColor(...C.textSecondary);
    doc.text('Powered by Emerging Defense Solutions', margin, y + 5);
    y += 20;

    // Title
    const title = customTitle || 'Security Intelligence Briefing';
    doc.setFontSize(22);
    doc.setTextColor(...C.textPrimary);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, contentW);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 4;

    // Template / type label
    doc.setFontSize(10);
    doc.setTextColor(...C.accent);
    doc.setFont('helvetica', 'normal');
    doc.text((template || 'full_briefing').replace(/_/g, ' ').toUpperCase(), margin, y);
    y += 10;

    hline([0, 212, 255]);

    // Meta grid
    const meta = [
      ['Date', new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
      ['Prepared By', user.full_name || user.email],
      ['Audience', audience || 'Executive / Senior Leadership'],
      ['Reference', `ASOSINT-${Date.now().toString(36).toUpperCase()}`],
    ];
    meta.forEach(([label, val]) => {
      doc.setFontSize(8);
      doc.setTextColor(...C.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(label + ':', margin, y);
      doc.setTextColor(...C.textPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text(val, margin + 32, y);
      y += 7;
    });

    y += 10;

    // Bottom disclaimer
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textSecondary);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'This document contains sensitive intelligence information. Distribution is restricted to authorized personnel only.',
      margin, pageH - 20, { maxWidth: contentW }
    );
    doc.setFillColor(...C.accent);
    doc.rect(0, pageH - 2, pageW, 2, 'F');

    // ================================================================
    // DATA FETCHING
    // ================================================================
    let warRoom = null, findings = [], messages = [], investigation = null, report = null, indicators = [];

    if (warRoomId) {
      const rooms = await base44.entities.WarRoom.filter({ id: warRoomId }, '-created_date', 1);
      warRoom = rooms[0] || null;
      if (warRoom) {
        findings = await base44.entities.WarRoomFinding.filter({ war_room_id: warRoomId }, '-created_date', 50);
        messages = await base44.entities.WarRoomMessage.filter({ war_room_id: warRoomId }, 'created_date', 100);
      }
    }
    if (investigationId) {
      const invs = await base44.entities.OsintInvestigation.filter({ id: investigationId }, '-created_date', 1);
      investigation = invs[0] || null;
    }
    if (reportId) {
      const reps = await base44.entities.IntelligenceReport.filter({ id: reportId }, '-created_date', 1);
      report = reps[0] || null;
    }
    indicators = await base44.asServiceRole.entities.ThreatIndicator.list('-created_date', 30);

    // ================================================================
    // SECTION HELPERS
    // ================================================================
    const sectionHeader = (label, icon = '■') => {
      checkPage(20);
      y += 4;
      doc.setFillColor(...C.surface);
      doc.roundedRect(margin, y - 4, contentW, 11, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...C.accent);
      doc.setFont('helvetica', 'bold');
      doc.text(`${icon}  ${label.toUpperCase()}`, margin + 4, y + 3);
      y += 12;
    };

    const bullet = (str, indent = 0) => {
      checkPage(8);
      doc.setFontSize(8);
      doc.setTextColor(...C.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text('▸', margin + indent, y);
      doc.setTextColor(...C.textPrimary);
      const lines = doc.splitTextToSize(str, contentW - indent - 6);
      doc.text(lines, margin + indent + 5, y);
      y += lines.length * 5 + 1;
    };

    const bodyText = (str) => {
      checkPage(10);
      doc.setFontSize(8.5);
      doc.setTextColor(...C.textSecondary);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(str, contentW);
      doc.text(lines, margin, y);
      y += lines.length * 5.5 + 2;
    };

    // ================================================================
    // PAGE 2: EXECUTIVE SUMMARY / RISK OVERVIEW
    // ================================================================
    addPage();

    // Page header
    doc.setFontSize(7);
    doc.setTextColor(...C.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('ASOSINT', margin, 10);
    doc.setTextColor(...C.textSecondary);
    doc.text(title.slice(0, 60), margin + 16, 10);
    doc.setFontSize(6);
    doc.text(new Date().toLocaleDateString(), pageW - margin, 10, { align: 'right' });
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.3);
    doc.line(margin, 13, pageW - margin, 13);
    y = 20;

    sectionHeader('Executive Summary', '01');

    if (warRoom) {
      bodyText(`War Room: ${warRoom.name}`);
      if (warRoom.pinned_summary) bodyText(warRoom.pinned_summary);
    }
    if (investigation) {
      bodyText(`Investigation: ${investigation.title} (${investigation.investigation_type})`);
      if (investigation.findings_summary) bodyText(investigation.findings_summary);
    }
    if (report) {
      bodyText(`Intel Report: ${report.title}`);
    }

    // Risk score boxes
    y += 4;
    const scores = [
      { label: 'Risk Score', val: investigation?.risk_score ? `${investigation.risk_score}/100` : 'N/A', color: C.danger },
      { label: 'Confidence', val: report?.confidence ? `${report.confidence}%` : 'N/A', color: C.accent },
      { label: 'Findings', val: String(findings.length), color: C.warn },
      { label: 'Indicators', val: String(indicators.length), color: C.success },
    ];

    checkPage(25);
    const boxW = (contentW - 6) / 4;
    scores.forEach((s, i) => {
      const bx = margin + i * (boxW + 2);
      doc.setFillColor(...C.surface);
      doc.roundedRect(bx, y, boxW, 18, 2, 2, 'F');
      doc.setFillColor(...s.color);
      doc.roundedRect(bx, y, boxW, 2, 1, 1, 'F');
      doc.setFontSize(14);
      doc.setTextColor(...s.color);
      doc.setFont('helvetica', 'bold');
      doc.text(s.val, bx + boxW / 2, y + 12, { align: 'center' });
      doc.setFontSize(6);
      doc.setTextColor(...C.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label.toUpperCase(), bx + boxW / 2, y + 16.5, { align: 'center' });
    });
    y += 24;

    // ================================================================
    // WAR ROOM FINDINGS
    // ================================================================
    if (findings.length > 0) {
      sectionHeader('War Room Findings', '02');
      const sevOrder = ['critical','high','medium','low','informational'];
      const sorted = [...findings].sort((a,b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity));

      sorted.forEach(f => {
        checkPage(22);
        const sevColor = SEV_COLOR[f.severity] || [107,114,128];
        doc.setFillColor(...C.surfaceAlt);
        doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');
        doc.setFillColor(...sevColor);
        doc.roundedRect(margin, y, 3, 18, 1, 1, 'F');

        doc.setFontSize(8.5);
        doc.setTextColor(...C.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.text(f.title, margin + 7, y + 6);

        const statusStr = `${(f.severity || '').toUpperCase()}  ·  ${(f.status || '').toUpperCase()}  ·  ${(f.finding_type || '').toUpperCase()}`;
        doc.setFontSize(6.5);
        doc.setTextColor(...C.textSecondary);
        doc.setFont('helvetica', 'normal');
        doc.text(statusStr, margin + 7, y + 11);

        if (f.content) {
          const lines = doc.splitTextToSize(f.content, contentW - 12);
          doc.setFontSize(7.5);
          doc.setTextColor(...C.textSecondary);
          doc.text(lines.slice(0,2), margin + 7, y + 16);
        }

        y += 22;
      });
    }

    // ================================================================
    // INTELLIGENCE LAYERS (if IntelligenceReport)
    // ================================================================
    if (report?.intel_layers) {
      sectionHeader('Intelligence Layers (OSINT · SIGINT · HUMINT)', '03');
      const layers = [
        { key: 'osint', label: 'OSINT Layer — Foundation', color: C.accent },
        { key: 'sigint', label: 'SIGINT Layer', color: C.warn },
        { key: 'humint', label: 'HUMINT Layer — Apex', color: C.danger },
      ];
      layers.forEach(l => {
        const content = report.intel_layers[l.key];
        if (!content) return;
        checkPage(20);
        doc.setFontSize(7.5);
        doc.setTextColor(...l.color);
        doc.setFont('helvetica', 'bold');
        doc.text(l.label.toUpperCase(), margin, y);
        y += 5;
        bodyText(content.slice(0, 600) + (content.length > 600 ? '...' : ''));
        y += 2;
      });
    }

    // ================================================================
    // KEY FINDINGS & RECOMMENDATIONS
    // ================================================================
    if (report?.key_findings?.length > 0 || report?.recommended_actions?.length > 0) {
      sectionHeader('Key Findings & Recommended Actions', '04');
      if (report.key_findings?.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...C.accent);
        doc.setFont('helvetica', 'bold');
        doc.text('KEY FINDINGS', margin, y); y += 6;
        report.key_findings.forEach(f => bullet(f));
      }
      if (report.recommended_actions?.length > 0) {
        y += 3;
        doc.setFontSize(8);
        doc.setTextColor(...C.success);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMMENDED ACTIONS', margin, y); y += 6;
        report.recommended_actions.forEach(a => bullet(a));
      }
    }

    // ================================================================
    // INVESTIGATION TIMELINE
    // ================================================================
    if (investigation?.timeline_events) {
      let events = [];
      try { events = JSON.parse(investigation.timeline_events); } catch {}
      if (events.length > 0) {
        sectionHeader('Investigation Timeline', '05');
        events.slice(0, 15).forEach(ev => {
          checkPage(10);
          const dateStr = ev.date ? new Date(ev.date).toLocaleDateString() : '';
          doc.setFontSize(7);
          doc.setTextColor(...C.accent);
          doc.setFont('helvetica', 'bold');
          doc.text(dateStr, margin, y);
          doc.setTextColor(...C.textPrimary);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(ev.description || ev.event || '', contentW - 30);
          doc.text(lines, margin + 25, y);
          y += lines.length * 4.5 + 2;
          doc.setDrawColor(255,255,255,0.04);
          doc.setLineWidth(0.1);
          doc.line(margin, y, pageW - margin, y);
          y += 2;
        });
      }
    }

    // ================================================================
    // LIVE THREAT INDICATORS SNAPSHOT
    // ================================================================
    if (indicators.length > 0) {
      sectionHeader('Threat Indicator Snapshot', '06');
      checkPage(15);

      // Table header
      doc.setFillColor(...C.surface);
      doc.rect(margin, y, contentW, 8, 'F');
      const cols = ['Value', 'Type', 'Severity', 'Status'];
      const colW = [80, 30, 28, 28];
      let cx = margin + 2;
      cols.forEach((c, i) => {
        doc.setFontSize(6.5);
        doc.setTextColor(...C.accent);
        doc.setFont('helvetica', 'bold');
        doc.text(c, cx, y + 5.5);
        cx += colW[i];
      });
      y += 9;

      indicators.slice(0, 20).forEach((ind, idx) => {
        checkPage(8);
        if (idx % 2 === 0) {
          doc.setFillColor(17, 24, 39);
          doc.rect(margin, y - 1, contentW, 7, 'F');
        }
        const sevColor = SEV_COLOR[ind.severity] || [107,114,128];
        cx = margin + 2;
        doc.setFontSize(6.5);
        doc.setTextColor(...C.textPrimary);
        doc.setFont('helvetica', 'normal');
        const valStr = (ind.value || '').slice(0, 35);
        doc.text(valStr, cx, y + 4); cx += colW[0];
        doc.setTextColor(...C.textSecondary);
        doc.text(ind.indicator_type || '', cx, y + 4); cx += colW[1];
        doc.setTextColor(...sevColor);
        doc.setFont('helvetica', 'bold');
        doc.text((ind.severity || '').toUpperCase(), cx, y + 4); cx += colW[2];
        doc.setTextColor(...C.textSecondary);
        doc.setFont('helvetica', 'normal');
        doc.text(ind.status || '', cx, y + 4);
        y += 7;
      });
      y += 3;
    }

    // ================================================================
    // WAR ROOM CHAT LOG EXCERPT
    // ================================================================
    if (messages.length > 0 && (template === 'war_room_debrief' || template === 'full_briefing')) {
      sectionHeader('War Room Activity Log (Excerpt)', '07');
      const notable = messages.filter(m => ['indicator','finding','annotation'].includes(m.message_type)).slice(0, 10);
      notable.forEach(m => {
        checkPage(12);
        doc.setFontSize(7);
        doc.setTextColor(...C.accent);
        doc.setFont('helvetica', 'bold');
        doc.text(`[${m.message_type?.toUpperCase()}]`, margin, y);
        doc.setTextColor(...C.textSecondary);
        doc.setFont('helvetica', 'normal');
        doc.text(m.author_name || m.author_email, margin + 22, y);
        doc.setTextColor(...C.textPrimary);
        const lines = doc.splitTextToSize(m.content || '', contentW - 5);
        doc.text(lines.slice(0,2), margin, y + 5);
        y += lines.slice(0,2).length * 5 + 4;
      });
    }

    // ================================================================
    // FOOTER ON ALL PAGES
    // ================================================================
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(...C.dark);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setFillColor(...C.accent);
      doc.rect(0, pageH - 2, pageW, 2, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...C.textSecondary);
      doc.setFont('helvetica', 'normal');
      doc.text(`ASOSINT // ${(classification || 'SENSITIVE').toUpperCase()} // Page ${p} of ${totalPages}`, margin, pageH - 5);
      doc.text(`Generated: ${new Date().toLocaleString()} | ${user.email}`, pageW - margin, pageH - 5, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    const safeName = (customTitle || 'ASOSINT_Briefing').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_${new Date().toISOString().slice(0,10)}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Briefing PDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});