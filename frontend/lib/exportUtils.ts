import * as XLSX from "xlsx";

export function downloadExcelFile(data: any[], fileName: string, sheetName: string = "Data") {
  try {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return false;
    }
    const ws = XLSX.utils.json_to_sheet(data);
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
    const ws = XLSX.utils.json_to_sheet(data);
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
