function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return "";
    }

    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export function buildCsvString(rows) {
    if (!rows?.length) {
        return "";
    }

    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];

    for (const row of rows) {
        lines.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
    }

    return lines.join("\n");
}

export function downloadCsv(filename, rows) {
    if (!rows?.length) {
        return false;
    }

    const csvContent = buildCsvString(rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    return true;
}
