import * as XLSX from "xlsx";

function sanitizeExportData(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    if (!row || typeof row !== "object") return row;
    const cleanRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      if (typeof val === "string") {
        // Check if value is a base64 data URL or byte code
        if (val.startsWith("data:") || (val.length > 250 && !val.includes(" ") && !val.startsWith("http"))) {
          cleanRow[key.replace(/url|link/i, "Available").replace(/_+/g, " ").trim() || "Attachment Available"] =
            val.trim().length > 0 ? "Yes" : "No";
          continue;
        }
      }
      cleanRow[key] = val;
    }
    return cleanRow;
  });
}

export function downloadExcelFile(data: any[], fileName: string, sheetName: string = "Data") {
  try {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return false;
    }
    const sanitized = sanitizeExportData(data);
    const ws = XLSX.utils.json_to_sheet(sanitized);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // Excel max sheet name is 31 chars
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Excel download failed:", err);
    // Fallback to CSV
    return downloadCSVFile(data, fileName.replace(/\.xlsx$/, ".csv"));
  }
}

export function downloadCSVFile(data: any[], fileName: string) {
  try {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return false;
    }
    const sanitized = sanitizeExportData(data);
    const ws = XLSX.utils.json_to_sheet(sanitized);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("CSV download failed:", err);
    return false;
  }
}
