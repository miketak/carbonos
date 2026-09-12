package com.carbonos.ghg.internal.export;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.carbonos.ghg.internal.Scope;
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
 * period, emissions by scope with the market-based method and the breakdowns,
 * gases, biogenic CO2, base year, methodology and factors, exclusions, lines.
 * Built from the report composite, which reads the run's snapshot only.
 *
 * <p>Readability (spec 07.8): every enum prints through {@link ReportLabels},
 * every date and instant in reader form, and a heading is never the last
 * thing on a page. A heading that introduces a table is the table's first
 * row, a header row spanning every column, so the layout engine moves
 * heading, column header and first data row as one block and repeats the
 * header rows when the table continues on a new page. A heading that
 * introduces a paragraph shares the paragraph with it.
 */
public final class ReportPdf {

	private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
	private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
	private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 9);
	private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 7.5f);
	private static final Font SMALL_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f);

	/** The by-gas table's reconciling row and the sentences under it (spec 07.7), as the page prints them. */
	static final String UNSPLIT_ROW = "CO2e from factors without a gas split";
	static final String UNSPLIT_RULE = "Factors that publish CO2e only are listed on one row. Their CO2, CH4 and N2O are "
			+ "not separable; the source did not publish them.";
	static final String MARKET_BASED_NOTE = "The market-based scope 2 figure is not split by gas; its instruments and "
			+ "balance are in section 04.";

	/** The section headings in document order, for the layout test. */
	static final List<String> HEADINGS = List.of("Report", "1. Company and organizational boundary",
			"2. Operational boundary", "3. Reporting period", "4. Emissions by scope (tonnes CO2e)",
			"5. Emissions by gas", "6. Biogenic CO2", "7. Base year", "8. Methodology and emission factors",
			"8a. Data quality and uncertainty", "9. Exclusions", "10. Snapshot lines (kg CO2e)");

	/** The subheadings that introduce a table, for the layout test. */
	static final List<String> TABLE_SUBHEADINGS = List.of("Scope 3 by category (declared and reported)", "By facility",
			"By legal entity", "By country", "Emissions profile over time", "Other views of the same periods",
			"Emission factors applied", "Emissions by data quality tier", "Operations left out of the boundary",
			"Records left out of the run");

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

			var header = titled("Report", H2, 30, 70);
			row(header, "Reporting entity", join(h.organizationName(), h.address()));
			row(header, "Contact", nvl(h.contact(), "not recorded"));
			row(header, "Reporting period", h.periodLabel() + " (" + ReportLabels.period(h.periodStart(), h.periodEnd()) + ")");
			row(header, "Prepared by", nvl(h.preparedBy(), "not recorded") + ", " + ReportLabels.instant(h.preparedAt()));
			row(header, "Approved by", nvl(h.approvedBy(), "not yet approved"));
			row(header, "Published", h.publishedAt() == null ? "not published"
					: ReportLabels.instant(h.publishedAt()) + " by " + nvl(h.publishedBy(), "unknown"));
			// spec 05.5: two numberings, two names; the report version here, the boundary version in section 1
			row(header, "Report version", h.version() + (h.supersedes().isEmpty() ? "" : ", supersedes " + String.join(", ", h.supersedes()))
					+ (h.supersededBy() == null ? "" : "; superseded by " + h.supersededBy()));
			row(header, "Final designated", h.finalDesignatedBy() == null ? "not designated"
					: "by " + h.finalDesignatedBy() + " on " + ReportLabels.day(h.finalDesignatedAt())
							+ (h.finalNote() == null ? "" : ": " + h.finalNote()));
			row(header, "Assurance", ReportLabels.label(h.assuranceLevel())
					+ (h.assuranceProvider() == null ? "" : " by " + h.assuranceProvider())
					+ (h.assuranceStatement() == null ? "" : " (" + h.assuranceStatement() + ")"));
			document.add(header);

			paragraph(document, "1. Company and organizational boundary", report.company().organizationName() + ", "
					+ ReportLabels.lower(report.company().consolidationApproach()) + " approach (Corporate Standard, chapter 3)."
					+ (report.company().boundaryVersion() == null ? ""
							: " Boundary version " + report.company().boundaryVersion().version().versionNo()
									+ (h.boundaryVersionCount() == null ? "" : " of " + h.boundaryVersionCount()) + "."));
			if (report.company().boundaryVersion() != null) {
				var boundary = titled("Boundary version " + report.company().boundaryVersion().version().versionNo(), SMALL_BOLD,
						34, 22, 22, 22);
				head(boundary, "Legal entity", "Table 1 row", "Share", "Window");
				for (var entry : report.company().boundaryVersion().entries()) {
					row(boundary, entry.entityName() + (entry.excluded() ? " (excluded: " + entry.exclusionReason() + ")" : ""),
							entry.table1Row(), percent(entry.accountingShare()),
							window(entry.effectiveFrom(), entry.effectiveTo()));
				}
				document.add(boundary);
			}

			var ob = report.operationalBoundary();
			var declaration = new StringBuilder("Scopes covered: " + ReportLabels.list(ob.scopesCovered())
					+ ". Scope 3 categories declared: "
					+ (ob.scope3Categories().isEmpty() ? "none" : ReportLabels.list(ob.scope3Categories())) + ".");
			for (var item : ob.notQuantified()) {
				declaration.append(' ').append(ReportLabels.label(item.category())).append(" is declared, not quantified: ")
					.append(sentence(item.reason()));
			}
			if (ob.exclusionsRationale() != null) {
				declaration.append(' ').append(ob.exclusionsRationale());
			}
			paragraph(document, "2. Operational boundary", declaration.toString());

			paragraph(document, "3. Reporting period", ReportLabels.period(report.period().periodStart(), report.period().periodEnd())
					+ " (" + report.period().inventoryName() + ", " + ReportLabels.lower(report.period().status()) + ").");

			var e = report.emissions();
			var scopes = titled("4. Emissions by scope (tonnes CO2e)", H2, 60, 40);
			row(scopes, "Scope 1", tonnes(e.scope1TCo2e()));
			row(scopes, "Scope 2, location-based", tonnes(e.scope2LocationBasedTCo2e()));
			row(scopes, "Scope 2, market-based", tonnes(e.scope2MarketBasedTCo2e()));
			row(scopes, "Scope 3", tonnes(e.scope3TCo2e()));
			row(scopes, "Total (location-based scope 2)", tonnes(e.totalTCo2e()));
			document.add(scopes);
			// spec 07.8: the market-based method sits under the scope table, once its context is clear
			subparagraph(document, "Scope 2, market-based method", "Basis: " + ReportLabels.label(e.scope2MarketBasis()) + ". "
					+ nvl(e.residualMixDisclosure(), "")
					+ (e.marketInstruments().isEmpty() ? " No contractual instruments were held." : ""));
			for (var instrument : e.marketInstruments()) {
				var outcomes = new ArrayList<String>();
				for (var c : instrument.criteria()) {
					outcomes.add(ReportLabels.criterion(c.code()) + ": " + ReportLabels.label(c.answer()));
				}
				document.add(new Paragraph(instrument.facilityName() + ", " + ReportLabels.lower(instrument.instrumentType())
						+ ", " + plain(instrument.kgCo2ePerKwh()) + " kg CO2e/kWh (" + instrument.source() + ")"
						+ (instrument.certificateId() == null ? "" : ", certificate " + instrument.certificateId())
						+ (instrument.registry() == null ? "" : " at " + instrument.registry())
						+ (instrument.vintage() == null ? "" : ", vintage " + instrument.vintage())
						+ (instrument.retirementDate() == null ? "" : ", retired " + ReportLabels.date(instrument.retirementDate()))
						+ ": " + (instrument.meetsQualityCriteria() ? "meets every Scope 2 Quality Criterion" : "not applied") + ". "
						+ String.join("; ", outcomes) + ".", SMALL));
			}
			if (!report.byScope3Category().isEmpty()) {
				var cats = titled("Scope 3 by category (declared and reported)", SMALL_BOLD, 40, 20, 10, 30);
				head(cats, "Category", "Declared", "Lines", "t CO2e");
				for (var c : report.byScope3Category()) {
					row(cats, ReportLabels.label(c.category()), c.declared() ? "yes" : "no (reported, not declared)",
							String.valueOf(c.lineCount()), c.lineCount() == 0 && c.notQuantifiedReason() != null
									? "declared, not quantified: " + c.notQuantifiedReason()
									: c.lineCount() == 0 ? "declared, not quantified: no reason recorded" : tonnes(c.tCo2e()));
				}
				document.add(cats);
			}
			breakdown(document, "By facility", report.byFacility());
			breakdown(document, "By legal entity", report.byEntity());
			breakdown(document, "By country", report.byCountry());
			if (!report.intensity().isEmpty()) {
				var lines = new ArrayList<String>();
				for (var i : report.intensity()) {
					lines.add(plain(i.tCo2ePerUnit()) + " t CO2e per " + i.unit() + " of " + i.name() + " ("
							+ plain(i.value()) + " " + i.unit() + ")");
				}
				subparagraph(document, "Intensity", String.join("\n", lines));
			}

			var gases = titled("5. Emissions by gas", H2, 40, 30, 30);
			head(gases, "Gas", "Mass (t)", "t CO2e");
			ReportResponse.Gas unsplit = null;
			for (var g : report.byGas()) {
				if (g.isUnsplit()) {
					unsplit = g;
					row(gases, UNSPLIT_ROW, "not separable", tonnes(g.tCo2e()));
				}
				else {
					row(gases, g.gas(), tonnes(g.tonnes()), tonnes(g.tCo2e()));
				}
			}
			document.add(gases);
			// spec 07.7: the table foots to the report's total, and says where the unsplit CO2e comes from
			document.add(new Paragraph("Total (scope 2 location-based), ties to section 04: " + tonnes(byGasTotal(report))
					+ " t CO2e. " + MARKET_BASED_NOTE, BODY));
			if (unsplit != null) {
				document.add(new Paragraph("The row '" + UNSPLIT_ROW + "' comes from: "
						+ (unsplit.factors() == null ? "" : String.join(", ", unsplit.factors())) + ". " + UNSPLIT_RULE, SMALL));
			}

			paragraph(document, "6. Biogenic CO2", tonnes(report.biogenicCo2T()) + " t of biogenic CO2, reported outside the scopes.");

			if (report.baseYear() == null) {
				paragraph(document, "7. Base year", "No base year designated.");
			}
			else {
				var b = report.baseYear();
				paragraph(document, "7. Base year", b.periodLabel() + " (" + b.inventoryName() + "), significance threshold "
						+ b.thresholdPercent() + "% applied to each change and to the cumulative effect. Mid-year structural changes: "
						+ ReportLabels.lower(b.structuralChangeConvention()) + ". Why this year: " + b.reason()
						+ (b.originalBase() == null ? "" : " Base-year emissions (" + b.originalBase().label() + "): "
								+ tonnes(b.originalBase().totalKgCo2e().movePointLeft(3)) + " t CO2e."));
				if (!b.recalculations().isEmpty()) {
					// spec 06.1: the report shows every candidate with the decision taken on it
					var first = true;
					for (var entry : b.recalculations()) {
						var decision = entry.decision();
						var text = new StringBuilder(ReportLabels.label(decision.status())).append(" (")
							.append(ReportLabels.lower(decision.triggerType())).append("): ").append(decision.reason());
						if (decision.decisionNote() != null) {
							text.append(" Decision: ").append(decision.decisionNote()).append('.');
						}
						if (decision.decidedBy() != null) {
							text.append(" Decided by ").append(decision.decidedBy())
								.append(decision.decidedAt() == null ? "" : ", " + ReportLabels.instant(decision.decidedAt()))
								.append('.');
						}
						if (entry.recalculatedBase() != null) {
							text.append(" Recalculated base (").append(entry.recalculatedBase().label()).append("): ")
								.append(tonnes(entry.recalculatedBase().totalKgCo2e().movePointLeft(3))).append(" t CO2e.");
						}
						if (first) {
							subparagraph(document, "Recalculation history", text.toString());
							first = false;
						}
						else {
							document.add(new Paragraph(text.toString(), SMALL));
						}
					}
				}
				if (!b.profile().isEmpty()) {
					var profile = titled("Emissions profile over time", SMALL_BOLD, 14, 42, 22, 22);
					head(profile, "Period", "Inventory", "Final run (t CO2e)", "Recalculated (t CO2e)");
					for (var p : b.profile()) {
						row(profile, p.periodLabel(), p.name(),
								p.totalKgCo2e() == null ? "not yet final" : tonnes(p.totalKgCo2e().movePointLeft(3)),
								p.recalculatedTotalKgCo2e() == null ? "" : tonnes(p.recalculatedTotalKgCo2e().movePointLeft(3)));
					}
					document.add(profile);
				}
				if (b.otherViews() != null && !b.otherViews().isEmpty()) {
					var others = titled("Other views of the same periods, not comparable with the base year (a different "
							+ "consolidation approach or GWP set)", SMALL_BOLD, 18, 40, 22, 20);
					head(others, "Period", "Inventory", "Approach / GWP", "Final run (t CO2e)");
					for (var p : b.otherViews()) {
						row(others, p.periodLabel(), p.name(),
								ReportLabels.label(p.consolidationApproach()) + " / " + ReportLabels.label(p.gwpSet()),
								p.totalKgCo2e() == null ? "not yet final" : tonnes(p.totalKgCo2e().movePointLeft(3)));
					}
					document.add(others);
				}
			}

			paragraph(document, "8. Methodology and emission factors", report.methodology().statement());
			var factors = titled("Emission factors applied", SMALL_BOLD, 26, 14, 30, 8, 22);
			head(factors, "Factor", "kg CO2e / unit", "Gases (kg per unit)", "GWP", "Source");
			for (var f : report.factors()) {
				row(factors, f.name(), plain(f.kgCo2ePerUnit()) + " / " + f.unit(), gasSplit(f), ReportLabels.label(f.gwpSet()),
						f.source());
			}
			document.add(factors);

			var dq = report.dataQuality();
			paragraph(document, "8a. Data quality and uncertainty", dq.statement()
					+ (dq.uncertaintyStatement() == null ? "" : "\n" + dq.uncertaintyStatement()));
			if (!dq.byTier().isEmpty()) {
				var tiers = titled("Emissions by data quality tier", SMALL_BOLD, 8, 36, 14, 14, 14, 14);
				head(tiers, "Tier", "Quality", "Scope 1 (t)", "Scope 2 (t)", "Scope 3 (t)", "Share");
				for (var t : dq.byTier()) {
					row(tiers, String.valueOf(t.tier()), t.label(), tonnes(t.scope1KgCo2e().movePointLeft(3)),
							tonnes(t.scope2KgCo2e().movePointLeft(3)), tonnes(t.scope3KgCo2e().movePointLeft(3)),
							plain(t.sharePercent()) + "%");
				}
				document.add(tiers);
			}

			// spec 07.8: "9. Exclusions" heads whichever exclusion table comes first
			var exclusionsHeading = "9. Exclusions";
			if (report.boundaryExclusions().isEmpty() && report.exclusions().isEmpty()) {
				paragraph(document, exclusionsHeading, "No exclusions.");
			}
			if (!report.exclusionSummary().isEmpty()) {
				var summary = titled(exclusionsHeading, H2, 40, 20, 40);
				exclusionsHeading = null;
				head(summary, "Reason", "Records", "Estimated t CO2e left out");
				for (var x : report.exclusionSummary()) {
					row(summary, ReportLabels.label(x.reason()), String.valueOf(x.recordCount()), tonnes(x.estimatedTCo2e())
							+ (x.unestimatedCount() == 0 ? "" : " (" + x.unestimatedCount() + " not estimated)"));
				}
				document.add(summary);
			}
			if (!report.boundaryExclusions().isEmpty()) {
				var ops = exclusionsHeading == null ? titled("Operations left out of the boundary", SMALL_BOLD, 40, 20, 40)
						: titled(exclusionsHeading, H2, "Operations left out of the boundary", 40, 20, 40);
				exclusionsHeading = null;
				head(ops, "Operation", "Reason", "Detail");
				for (var x : report.boundaryExclusions()) {
					row(ops, x.facilityName() == null ? x.entityName() + " (whole entity)" : x.facilityName() + " (" + x.entityName() + ")",
							ReportLabels.label(x.reason()), nvl(x.detail(), ""));
				}
				document.add(ops);
			}
			if (!report.exclusions().isEmpty()) {
				var recs = exclusionsHeading == null ? titled("Records left out of the run", SMALL_BOLD, 22, 16, 12, 12, 26, 12)
						: titled(exclusionsHeading, H2, "Records left out of the run", 22, 16, 12, 12, 26, 12);
				head(recs, "Record", "Facility", "Quantity", "Period", "Reason and justification", "Est. kg CO2e");
				for (var x : report.exclusions()) {
					row(recs, ref(x.recordRef()) + x.activityType(), x.facilityName(), plain(x.quantity()) + " " + x.unit(),
							ReportLabels.period(x.periodStart(), x.periodEnd()),
							ReportLabels.label(x.exclusionReason()) + (x.exclusionDetail() == null ? "" : ": " + x.exclusionDetail())
									+ (x.exclusionJustification() == null ? "" : ". " + x.exclusionJustification()),
							x.estimatedKgCo2e() == null ? "" : plain(x.estimatedKgCo2e()));
				}
				document.add(recs);
			}

			var lines = titled("10. Snapshot lines (kg CO2e)", H2, 18, 22, 9, 15, 12, 8, 16);
			head(lines, "Facility", "Record / factor", "Scope", "Quantity", "kg CO2e / unit", "Share", "kg CO2e");
			for (var l : report.lines()) {
				row(lines, l.facilityName(), ref(l.recordRef()) + nvl(l.activityType(), "") + "\n" + l.factorName(),
						ReportLabels.label(l.scope()),
						plain(l.quantity()) + " " + l.unit() + (l.convertedQuantity().compareTo(l.quantity()) == 0 ? ""
								: " = " + plain(l.convertedQuantity()) + " " + l.factorUnit())
								+ (l.conversionNote() == null ? "" : "\n" + l.conversionNote()),
						plain(l.kgCo2ePerUnit()), percent(l.weight()) + (l.periodShare().compareTo(BigDecimal.ONE) == 0 ? ""
								: " x " + percent(l.periodShare())),
						plain(l.kgCo2e()) + (l.marketBasedKgCo2e() == null || l.scope() != Scope.SCOPE_2 ? ""
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

	/** The footing figure (spec 07.7), summed from the rows for a snapshot stored before the field existed. */
	private static BigDecimal byGasTotal(ReportResponse report) {
		if (report.byGasTotalTCo2e() != null) {
			return report.byGasTotalTCo2e();
		}
		return report.byGas().stream().map(ReportResponse.Gas::tCo2e).reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private static void breakdown(Document document, String title, List<ReportResponse.Breakdown> rows) throws DocumentException {
		if (rows.isEmpty()) {
			return;
		}
		var table = titled(title, SMALL_BOLD, 30, 14, 14, 14, 14, 14);
		head(table, "Name", "Scope 1", "Scope 2 (loc.)", "Scope 2 (mkt.)", "Scope 3", "Total t CO2e");
		for (var r : rows) {
			row(table, r.name(), tonnes(r.scope1KgCo2e().movePointLeft(3)), tonnes(r.scope2KgCo2e().movePointLeft(3)),
					tonnes(r.scope2MarketBasedKgCo2e().movePointLeft(3)), tonnes(r.scope3KgCo2e().movePointLeft(3)),
					tonnes(r.totalTCo2e()));
		}
		document.add(table);
	}

	/** A section heading and the paragraph it introduces, as one paragraph with a line break, so they never separate. */
	private static void paragraph(Document document, String heading, String text) throws DocumentException {
		var paragraph = new Paragraph();
		paragraph.add(new Chunk(heading, H2));
		paragraph.add(Chunk.NEWLINE);
		paragraph.add(new Chunk(text, BODY));
		paragraph.setSpacingBefore(10);
		paragraph.setSpacingAfter(4);
		document.add(paragraph);
	}

	/** A subheading and its paragraph, kept together the same way. */
	private static void subparagraph(Document document, String heading, String text) throws DocumentException {
		var paragraph = new Paragraph();
		paragraph.add(new Chunk(heading, SMALL_BOLD));
		paragraph.add(Chunk.NEWLINE);
		paragraph.add(new Chunk(text, SMALL));
		paragraph.setSpacingBefore(6);
		paragraph.setSpacingAfter(2);
		document.add(paragraph);
	}

	/** A table whose first row is its heading, spanning every column; {@link #head} then adds the column header. */
	private static PdfPTable titled(String heading, Font font, float... widths) {
		return titled(heading, font, null, widths);
	}

	/** A table headed by a section heading and a subheading on the next line, both in the heading row. */
	private static PdfPTable titled(String heading, Font font, String subheading, float... widths) {
		var table = new PdfPTable(widths.length);
		table.setWidthPercentage(100);
		try {
			table.setWidths(widths);
		}
		catch (DocumentException ex) {
			throw new IllegalStateException(ex);
		}
		table.setSpacingBefore(font == H2 ? 10 : 6);
		table.setSpacingAfter(3);
		var phrase = new Phrase(heading, font);
		if (subheading != null) {
			phrase.add(Chunk.NEWLINE);
			phrase.add(new Chunk(subheading, SMALL_BOLD));
		}
		var cell = new PdfPCell(phrase);
		cell.setColspan(widths.length);
		cell.setBorder(Rectangle.NO_BORDER);
		cell.setPaddingLeft(0);
		cell.setPaddingBottom(4);
		table.addCell(cell);
		table.setHeaderRows(1);
		return table;
	}

	/** The column header row; it joins the heading as a header row, so both repeat when the table continues. */
	private static void head(PdfPTable table, String... cells) {
		for (var cell : cells) {
			var pdfCell = new PdfPCell(new Phrase(cell, SMALL_BOLD));
			pdfCell.setBorder(Rectangle.BOTTOM);
			pdfCell.setPadding(3);
			table.addCell(pdfCell);
		}
		table.setHeaderRows(table.getRows().size());
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
		var parts = new ArrayList<String>();
		if (f.co2().signum() > 0) parts.add("CO2 " + plain(f.co2()));
		if (f.ch4().signum() > 0) parts.add("CH4 " + plain(f.ch4()) + (f.ch4Fossil() ? " (fossil)" : " (biogenic)"));
		if (f.n2o().signum() > 0) parts.add("N2O " + plain(f.n2o()));
		if (f.hfcsKg().signum() > 0) parts.add("HFCs " + plain(f.hfcsKg()) + (f.blendComposition() == null ? "" : " (" + f.blendComposition() + ")"));
		if (f.pfcsKg().signum() > 0) parts.add("PFCs " + plain(f.pfcsKg()));
		if (f.sf6().signum() > 0) parts.add("SF6 " + plain(f.sf6()));
		if (f.nf3().signum() > 0) parts.add("NF3 " + plain(f.nf3()));
		if (f.biogenicCo2().signum() > 0) parts.add("biogenic CO2 " + plain(f.biogenicCo2()));
		return parts.isEmpty() ? "CO2e only, no gas split published" : String.join(", ", parts);
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
		return (from == null ? "" : "from " + ReportLabels.date(from)) + (to == null ? "" : (from == null ? "" : " ") + "until " + ReportLabels.date(to));
	}

	private static String join(String a, String b) {
		return b == null ? a : a + ", " + b;
	}

	/** The record number as a prefix, "ACT-0007 ", or nothing for a line of a run before the numbers existed. */
	private static String ref(String recordRef) {
		return recordRef == null || recordRef.isEmpty() ? "" : recordRef + " ";
	}

	/** Free text as a sentence: a full stop is added only when the author left none. */
	private static String sentence(String text) {
		var trimmed = text == null ? "" : text.strip();
		return trimmed.isEmpty() || trimmed.endsWith(".") ? trimmed : trimmed + ".";
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
