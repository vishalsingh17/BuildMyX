/** Real calculations over explicitly fictional data. Currency uses integer pence. */
export type ReportingRow = {
  id: string;
  week: string;
  account: string;
  amount: string;
};
export type AcceptedRow = ReportingRow & { index: number; pence: number };
export type FlaggedRow = { index: number; id: string; reason: string };
export type ReportingResult = {
  accepted: AcceptedRow[];
  flagged: FlaggedRow[];
  totals: { week: string; pence: number; sources: number[] }[];
  change: number;
  percent: number | null;
};
export const sampleRows: ReportingRow[] = [
  ["R001", "Week 1", "North", "1200.00"],
  ["R002", "Week 1", "West", "800.00"],
  ["R003", "Week 1", "East", "1000.00"],
  ["R004", "Week 1", "North", "500.00"],
  ["R005", "Week 1", "West", "700.00"],
  ["R006", "Week 2", "North", "1600.00"],
  ["R007", "Week 2", "West", "900.00"],
  ["R008", "Week 2", "East", "1100.00"],
  ["R009", "Week 2", "North", "600.00"],
  ["R010", "Week 2", "West", "800.00"],
  ["R011", "Week 2", "", "350.00"],
  ["R012", "Week 2", "East", "tbc"],
  ["R007", "Week 2", "West", "900.00"],
].map(([id, week, account, amount]) => ({ id, week, account, amount }));

export function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function runReport(rows: ReportingRow[]): ReportingResult {
  const accepted: AcceptedRow[] = [],
    flagged: FlaggedRow[] = [],
    seen = new Set<string>();
  rows.forEach((row, index) => {
    let reason = "";
    if (!row.id.trim()) reason = "Missing record ID";
    else if (seen.has(row.id.trim()))
      reason = "Duplicate record ID; first occurrence retained";
    else if (!["Week 1", "Week 2"].includes(row.week))
      reason = "Unknown reporting period";
    else if (!row.account.trim()) reason = "Missing account";
    else if (!/^\d{1,8}(\.\d{1,2})?$/.test(row.amount.trim()))
      reason =
        "Amount must be a non-negative number with up to two decimal places";
    // Record IDs are reserved even for invalid records: duplicates need review.
    seen.add(row.id.trim());
    if (reason) flagged.push({ index, id: row.id || "No ID", reason });
    else {
      const [whole, fraction = ""] = row.amount.trim().split(".");
      accepted.push({
        ...row,
        index,
        pence: Number(whole) * 100 + Number(fraction.padEnd(2, "0")),
      });
    }
  });
  const totals = ["Week 1", "Week 2"].map((week) => {
    const sources = accepted.filter((row) => row.week === week);
    return {
      week,
      pence: sources.reduce((sum, row) => sum + row.pence, 0),
      sources: sources.map((row) => row.index),
    };
  });
  const change = totals[1].pence - totals[0].pence;
  return {
    accepted,
    flagged,
    totals,
    change,
    percent: totals[0].pence === 0 ? null : (change / totals[0].pence) * 100,
  };
}

export function csv(rows: (string | number)[][]): string {
  // Escape spreadsheet formulas in text cells, as well as CSV punctuation.
  return (
    rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell).replace(/^[=+@-]/, "'$&");
            return `"${value.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n") + "\r\n"
  );
}
