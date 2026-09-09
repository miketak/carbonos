package com.carbonos.ghg.internal.export;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;

import com.carbonos.ghg.internal.web.dto.ReportResponse;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

/**
 * The inventory report as a document (spec 07.5), in the order Chapter 9
 * lists its elements: header, company and boundary, operational boundary,
 * period, emissions by scope and the breakdowns, gases, biogenic CO2, base
 * year, methodology and factors, exclusions, lines. Built from the report
 * composite, which reads the run's snapshot only.
 */
public final class ReportPdf {

	private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
	private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
	private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 9);
	private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 7.5f);
	private static final Font SMALL_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f);

	private ReportPdf() {
	}

	public static byte[] render(ReportResponse report) {
		var out = new ByteArrayOutputStream();
		var document = new Document(PageSize.A4, 40, 40, 50, 50);
		try {
			var writer = PdfWriter.getInstance(document, out);
			var banner = report.run().voided() ? "VOIDED: this run must not be relied on" : null;
			writer.setPageEvent(new Footer(report.header().organizationName() + ", " + report.header().periodLabel()
					+ ", run " + report.run().runNo(), banner));
			document.open();
			var h = report.header();
			document.add(new Paragraph("GHG inventory report: " + h.organizationName() + ", " + h.periodLabel(), TITLE));
			document.add(new Paragraph("Run " + report.run().runNo() + " (" + report.run().label() + ")", BODY));
			if (banner != null) {
				document.add(new Paragraph(banner + ". " + nvl(report.run().voidReason(), ""), H2));
			}
			document.add(new Paragraph(" "));

			heading(document, "Report");
			var header = table(2, 30, 70);
			row(header, "Reporting entity", join(h.organizationName(), h.address()));
			row(header, "Contact", nvl(h.contact(), "not recorded"));
			row(header, "Reporting period", h.periodLabel() + " (" + h.periodStart() + " to " + h.periodEnd() + ")");
			row(header, "Prepared by", nvl(h.preparedBy(), "not recorded") + ", " + h.preparedAt());
			row(header, "Approved by", nvl(h.approvedBy(), "not yet approved"));
			row(header, "Published", h.publishedAt() == null ? "not published"
					: h.publishedAt() + " by " + nvl(h.publishedBy(), "unknown"));
			row(header, "Version", h.version() + (h.supersedes().isEmpty() ? "" : ", supersedes " + String.join(", ", h.supersedes()))
					+ (h.supersededBy() == null ? "" : "; superseded by " + h.supersededBy()));
			row(header, "Assurance", h.assuranceLevel() + (h.assuranceProvider() == null ? "" : " by " + h.assuranceProvider())
					+ (h.assuranceStatement() == null ? "" : " (" + h.assuranceStatement() + ")"));
			document.add(header);

			heading(document, "1. Company and organizational boundary");
			document.add(new Paragraph(report.company().organizationName() + ", " + report.company().consolidationApproach()
					+ " approach (Corporate Standard, chapter 3)." + (report.company().boundaryVersion() == null ? ""
							: " Boundary version " + report.company().boundaryVersion().version().versionNo() + "."), BODY));
			if (report.company().boundaryVersion() != null) {
				var boundary = table(4, 34, 22, 22, 22);
				head(boundary, "Legal entity", "Table 1 row", "Share", "Window");
				for (var entry : report.company().boundaryVersion().entries()) {
					row(boundary, entry.entityName() + (entry.excluded() ? " (excluded: " + entry.exclusionReason() + ")" : ""),
							entry.table1Row(), percent(entry.accountingShare()),
							window(entry.effectiveFrom(), entry.effectiveTo()));
				}
				document.add(boundary);
			}

			heading(document, "2. Operational boundary");
			var ob = report.operationalBoundary();
			document.add(new Paragraph("Scopes covered: " + ob.scopesCovered() + ". Scope 3 categories declared: "
					+ (ob.scope3Categories().isEmpty() ? "none" : ob.scope3Categories()) + "."
					+ (ob.exclusionsRationale() == null ? "" : " " + ob.exclusionsRationale()), BODY));

			heading(document, "3. Reporting period");
			document.add(new Paragraph(report.period().periodStart() + " to " + report.period().periodEnd() + " ("
					+ report.period().inventoryName() + ", " + report.period().status() + ").", BODY));

			heading(document, "4. Emissions by scope (tonnes CO2e)");
			var e = report.emissions();
			var scopes = table(2, 60, 40);
			row(scopes, "Scope 1", tonnes(e.scope1TCo2e()));
			row(scopes, "Scope 2, location-based", tonnes(e.scope2LocationBasedTCo2e()));
			row(scopes, "Scope 2, market-based (" + e.scope2MarketBasis() + ")", tonnes(e.scope2MarketBasedTCo2e()));
			row(scopes, "Scope 3", tonnes(e.scope3TCo2e()));
			row(scopes, "Total (location-based scope 2)", tonnes(e.totalTCo2e()));
			document.add(scopes);
			document.add(new Paragraph(nvl(e.residualMixDisclosure(), ""), SMALL));
			if (!report.byScope3Category().isEmpty()) {
				subheading(document, "Scope 3 by category");
				var cats = table(3, 60, 15, 25);
				head(cats, "Category", "Lines", "t CO2e");
				for (var c : report.byScope3Category()) {
					row(cats, c.category().name(), String.valueOf(c.lineCount()), tonnes(c.tCo2e()));
				}
				document.add(cats);
			}
			breakdown(document, "By facility", report.byFacility());
			breakdown(document, "By legal entity", report.byEntity());
			breakdown(document, "By country", report.byCountry());
			if (!report.intensity().isEmpty()) {
				subheading(document, "Intensity");
				for (var i : report.intensity()) {
					document.add(new Paragraph(i.tCo2ePerUnit().stripTrailingZeros().toPlainString() + " t CO2e per " + i.unit()
							+ " of " + i.name() + " (" + i.value().stripTrailingZeros().toPlainString() + " " + i.unit() + ")", BODY));
				}
			}

			heading(document, "5. Emissions by gas");
			var gases = table(3, 40, 30, 30);
			head(gases, "Gas", "Mass (t)", "t CO2e");
			for (var g : report.byGas()) {
				row(gases, g.gas(), tonnes(g.tonnes()), tonnes(g.tCo2e()));
			}
			document.add(gases);

			heading(document, "6. Biogenic CO2");
			document.add(new Paragraph(tonnes(report.biogenicCo2T()) + " t of biogenic CO2, reported outside the scopes.", BODY));

			heading(document, "7. Base year");
			if (report.baseYear() == null) {
				document.add(new Paragraph("No base year designated.", BODY));
			}
			else {
				var b = report.baseYear();
				document.add(new Paragraph(b.periodLabel() + " (" + b.inventoryName() + "), significance threshold "
						+ b.thresholdPercent() + "%, " + b.structuralChangeConvention() + ". " + b.reason()
						+ (b.originalBase() == null ? "" : " Base-year emissions: " + tonnes(b.originalBase().totalKgCo2e().movePointLeft(3)) + " t CO2e."), BODY));
				if (!b.profile().isEmpty()) {
					var profile = table(3, 20, 50, 30);
					head(profile, "Period", "Inventory", "Final run (t CO2e)");
					for (var p : b.profile()) {
						row(profile, p.periodLabel(), p.name(), p.totalKgCo2e() == null ? "not yet final" : tonnes(p.totalKgCo2e().movePointLeft(3)));
					}
					document.add(profile);
				}
			}

			heading(document, "8. Methodology and emission factors");
			document.add(new Paragraph(report.methodology().statement(), BODY));
			var factors = table(5, 26, 14, 30, 8, 22);
			head(factors, "Factor", "kg CO2e / unit", "Gases (kg per unit)", "GWP", "Source");
			for (var f : report.factors()) {
				row(factors, f.name(), plain(f.kgCo2ePerUnit()) + " / " + f.unit(), gasSplit(f), f.gwpSet().name(), f.source());
			}
			document.add(factors);

			heading(document, "8a. Data quality and uncertainty");
			var dq = report.dataQuality();
			document.add(new Paragraph(dq.statement(), BODY));
			if (dq.uncertaintyStatement() != null) {
				document.add(new Paragraph(dq.uncertaintyStatement(), BODY));
			}
			if (!dq.byTier().isEmpty()) {
				var tiers = table(6, 8, 36, 14, 14, 14, 14);
				head(tiers, "Tier", "Quality", "Scope 1 (t)", "Scope 2 (t)", "Scope 3 (t)", "Share");
				for (var t : dq.byTier()) {
					row(tiers, String.valueOf(t.tier()), t.label(), tonnes(t.scope1KgCo2e().movePointLeft(3)),
							tonnes(t.scope2KgCo2e().movePointLeft(3)), tonnes(t.scope3KgCo2e().movePointLeft(3)),
							t.sharePercent().stripTrailingZeros().toPlainString() + "%");
				}
				document.add(tiers);
			}

			heading(document, "9. Exclusions");
			if (report.boundaryExclusions().isEmpty() && report.exclusions().isEmpty()) {
				document.add(new Paragraph("No exclusions.", BODY));
			}
			if (!report.exclusionSummary().isEmpty()) {
				var summary = table(3, 40, 20, 40);
				head(summary, "Reason", "Records", "Estimated t CO2e left out");
				for (var x : report.exclusionSummary()) {
					row(summary, x.reason().name(), String.valueOf(x.recordCount()), tonnes(x.estimatedTCo2e())
							+ (x.unestimatedCount() == 0 ? "" : " (" + x.unestimatedCount() + " not estimated)"));
				}
				document.add(summary);
			}
			if (!report.boundaryExclusions().isEmpty()) {
				var ops = table(3, 40, 20, 40);
				head(ops, "Operation", "Reason", "Detail");
				for (var x : report.boundaryExclusions()) {
					row(ops, x.facilityName() == null ? x.entityName() + " (whole entity)" : x.facilityName() + " (" + x.entityName() + ")",
							x.reason().name(), nvl(x.detail(), ""));
				}
				document.add(ops);
			}
			if (!report.exclusions().isEmpty()) {
				var recs = table(6, 22, 16, 12, 12, 26, 12);
				head(recs, "Record", "Facility", "Quantity", "Period", "Reason and justification", "Est. kg CO2e");
				for (var x : report.exclusions()) {
					row(recs, x.activityType(), x.facilityName(), plain(x.quantity()) + " " + x.unit(),
							x.periodStart() + (x.periodStart().equals(x.periodEnd()) ? "" : " to " + x.periodEnd()),
							x.exclusionReason().name() + (x.exclusionDetail() == null ? "" : ": " + x.exclusionDetail())
									+ (x.exclusionJustification() == null ? "" : ". " + x.exclusionJustification()),
							x.estimatedKgCo2e() == null ? "" : plain(x.estimatedKgCo2e()));
				}
				document.add(recs);
			}

			heading(document, "10. Snapshot lines (kg CO2e)");
			var lines = table(7, 18, 22, 9, 15, 12, 8, 16);
			head(lines, "Facility", "Record / factor", "Scope", "Quantity", "kg CO2e / unit", "Share", "kg CO2e");
			for (var l : report.lines()) {
				row(lines, l.facilityName(), nvl(l.activityType(), "") + "\n" + l.factorName(), l.scope().name().replace("SCOPE_", ""),
						plain(l.quantity()) + " " + l.unit() + (l.convertedQuantity().compareTo(l.quantity()) == 0 ? ""
								: " = " + plain(l.convertedQuantity()) + " " + l.factorUnit()),
						plain(l.kgCo2ePerUnit()), percent(l.weight()) + (l.periodShare().compareTo(BigDecimal.ONE) == 0 ? ""
								: " x " + percent(l.periodShare())),
						plain(l.kgCo2e()) + (l.marketBasedKgCo2e() == null || l.scope().name().equals("SCOPE_2") == false ? ""
								: "\nmarket: " + plain(l.marketBasedKgCo2e())));
			}
			document.add(lines);
			document.close();
		}
		catch (DocumentException ex) {
			throw new IllegalStateException("Could not render the report", ex);
		}
		return out.toByteArray();
	}

	private static void breakdown(Document document, String title, List<ReportResponse.Breakdown> rows) throws DocumentException {
		if (rows.isEmpty()) {
			return;
		}
		subheading(document, title);
		var table = table(6, 30, 14, 14, 14, 14, 14);
		head(table, "Name", "Scope 1", "Scope 2 (loc.)", "Scope 2 (mkt.)", "Scope 3", "Total t CO2e");
		for (var r : rows) {
			row(table, r.name(), tonnes(r.scope1KgCo2e().movePointLeft(3)), tonnes(r.scope2KgCo2e().movePointLeft(3)),
					tonnes(r.scope2MarketBasedKgCo2e().movePointLeft(3)), tonnes(r.scope3KgCo2e().movePointLeft(3)),
					tonnes(r.totalTCo2e()));
		}
		document.add(table);
	}

	private static void heading(Document document, String text) throws DocumentException {
		var paragraph = new Paragraph(text, H2);
		paragraph.setSpacingBefore(10);
		paragraph.setSpacingAfter(4);
		document.add(paragraph);
	}

	private static void subheading(Document document, String text) throws DocumentException {
		var paragraph = new Paragraph(text, SMALL_BOLD);
		paragraph.setSpacingBefore(6);
		document.add(paragraph);
	}

	private static PdfPTable table(int columns, float... widths) {
		var table = new PdfPTable(columns);
		table.setWidthPercentage(100);
		try {
			table.setWidths(widths);
		}
		catch (DocumentException ex) {
			throw new IllegalStateException(ex);
		}
		table.setSpacingBefore(3);
		table.setSpacingAfter(3);
		return table;
	}

	private static void head(PdfPTable table, String... cells) {
		for (var cell : cells) {
			var pdfCell = new PdfPCell(new Phrase(cell, SMALL_BOLD));
			pdfCell.setBorder(Rectangle.BOTTOM);
			pdfCell.setPadding(3);
			table.addCell(pdfCell);
		}
	}

	private static void row(PdfPTable table, String... cells) {
		for (var cell : cells) {
			var pdfCell = new PdfPCell(new Phrase(nvl(cell, ""), SMALL));
			pdfCell.setBorder(Rectangle.BOTTOM);
			pdfCell.setBorderColorBottom(java.awt.Color.LIGHT_GRAY);
			pdfCell.setPadding(3);
			table.addCell(pdfCell);
		}
	}

	private static String gasSplit(ReportResponse.FactorRow f) {
		var parts = new java.util.ArrayList<String>();
		if (f.co2().signum() > 0) parts.add("CO2 " + plain(f.co2()));
		if (f.ch4().signum() > 0) parts.add("CH4 " + plain(f.ch4()) + (f.ch4Fossil() ? " (fossil)" : " (biogenic)"));
		if (f.n2o().signum() > 0) parts.add("N2O " + plain(f.n2o()));
		if (f.hfcsKg().signum() > 0) parts.add("HFCs " + plain(f.hfcsKg()) + (f.blendComposition() == null ? "" : " (" + f.blendComposition() + ")"));
		if (f.pfcsKg().signum() > 0) parts.add("PFCs " + plain(f.pfcsKg()));
		if (f.sf6().signum() > 0) parts.add("SF6 " + plain(f.sf6()));
		if (f.nf3().signum() > 0) parts.add("NF3 " + plain(f.nf3()));
		if (f.biogenicCo2().signum() > 0) parts.add("biogenic CO2 " + plain(f.biogenicCo2()));
		return String.join(", ", parts);
	}

	private static String tonnes(BigDecimal value) {
		return value == null ? "" : value.setScale(3, java.math.RoundingMode.HALF_UP).toPlainString();
	}

	private static String plain(BigDecimal value) {
		return value == null ? "" : value.stripTrailingZeros().toPlainString();
	}

	private static String percent(BigDecimal share) {
		return share == null ? "" : share.movePointRight(2).setScale(2, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString() + "%";
	}

	private static String window(java.time.LocalDate from, java.time.LocalDate to) {
		if (from == null && to == null) return "whole period";
		return (from == null ? "" : "from " + from) + (to == null ? "" : " until " + to);
	}

	private static String join(String a, String b) {
		return b == null ? a : a + ", " + b;
	}

	private static String nvl(String value, String fallback) {
		return value == null ? fallback : value;
	}

	/** Page numbers and the run's identity on every page, plus the VOIDED banner when the run is void. */
	private static final class Footer extends PdfPageEventHelper {

		private final String identity;
		private final String banner;

		Footer(String identity, String banner) {
			this.identity = identity;
			this.banner = banner;
		}

		@Override
		public void onEndPage(PdfWriter writer, Document document) {
			var canvas = writer.getDirectContent();
			ColumnText.showTextAligned(canvas, Element.ALIGN_LEFT, new Phrase(identity, SMALL), document.left(), document.bottom() - 20, 0);
			ColumnText.showTextAligned(canvas, Element.ALIGN_RIGHT, new Phrase("Page " + writer.getPageNumber(), SMALL), document.right(), document.bottom() - 20, 0);
			if (banner != null) {
				ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, new Phrase(new Chunk(banner, H2)),
						(document.left() + document.right()) / 2, document.top() + 20, 0);
			}
		}
	}
}
