import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- CSV Generator ---
export const generateCSV = (data, filename) => {
    if (!data || !data.length) {
        alert("No data available to export.");
        return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of data) {
        const values = headers.map((header) => {
            const val =
                row[header] !== null && row[header] !== undefined
                    ? row[header]
                    : "";
            const escaped = ("" + val).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// --- PDF Generator ---
export const generatePDF = (
    data,
    columns,
    title,
    filename,
    sections = [],
    companyName = "HireHero"
) => {
    if (!data || !data.length) {
        alert("No data available to export.");
        return;
    }

    const doc = new jsPDF();
    let currentY = 20;

    // 1. Header (Updated to use Company Name)
    doc.setFontSize(22);
    doc.setTextColor(0, 81, 147); // #005193
    doc.text(companyName, 14, currentY);
    currentY += 10;

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(title, 14, currentY);
    currentY += 6;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, currentY);
    currentY += 15;

    // 2. Executive Summary (ALWAYS INCLUDED)
    doc.setFontSize(14);
    doc.setTextColor(0, 81, 147);
    doc.text("Executive Summary", 14, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setTextColor(60);
    // Note: "HireHero" mention preserved here as requested
    const summaryText = `This report contains data for ${
        data.length
    } records. It was generated automatically by the HireHero system to provide insights into ${title.toLowerCase()}.`;
    const splitText = doc.splitTextToSize(summaryText, 180);
    doc.text(splitText, 14, currentY);
    currentY += splitText.length * 5 + 5;

    // 3. Key Metrics (Optional)
    if (sections.includes("Key Metrics")) {
        doc.setFontSize(14);
        doc.setTextColor(0, 81, 147);
        doc.text("Key Metrics", 14, currentY);
        currentY += 7;

        doc.setFontSize(10);
        doc.setTextColor(60);

        let metrics = [];

        // Check for Salary
        const hasSalary = data.some((d) => d.Salary);
        if (hasSalary) {
            const salaries = data
                .map((d) =>
                    parseFloat(
                        (d.Salary || "0").toString().replace(/[^0-9.-]+/g, "")
                    )
                )
                .filter((n) => !isNaN(n));
            if (salaries.length) {
                const avg =
                    salaries.reduce((a, b) => a + b, 0) / salaries.length;
                metrics.push(`Average Salary: $${avg.toFixed(2)}`);
                metrics.push(
                    `Highest Salary: $${Math.max(...salaries).toFixed(2)}`
                );
            }
        }

        // Check for Rating/Score
        const hasRating = data.some((d) => d.AvgRating);
        if (hasRating) {
            const ratings = data
                .map((d) => parseFloat(d.AvgRating))
                .filter((n) => !isNaN(n));
            if (ratings.length) {
                const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                metrics.push(`Average Rating: ${avg.toFixed(1)} / 5.0`);
            }
        }

        // Check for Match Score
        const hasMatch = data.some((d) => d.Score); // e.g., "85%"
        if (hasMatch) {
            const scores = data
                .map((d) => parseFloat((d.Score || "0").replace("%", "")))
                .filter((n) => !isNaN(n));
            if (scores.length) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                metrics.push(`Average Match Score: ${avg.toFixed(1)}%`);
            }
        }

        // Generic Count
        metrics.push(`Total Records: ${data.length}`);

        // Render Metrics
        metrics.forEach((m) => {
            doc.text(`• ${m}`, 20, currentY);
            currentY += 6;
        });
        currentY += 10;
    }

    // 4. Detailed Data Table (Optional - mapped from "Full Data Table")
    if (sections.includes("Full Data Table")) {
        const tableColumn = columns.map((col) => col.header);
        const tableRows = [];

        data.forEach((item) => {
            const rowData = columns.map((col) => item[col.dataKey]);
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: currentY,
            theme: "grid",
            headStyles: {
                fillColor: [0, 81, 147],
                textColor: 255,
                fontStyle: "bold",
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            didDrawPage: (data) => {
                // Reset Y if table breaks page
                currentY = data.cursor.y;
            },
        });
    }

    doc.save(`${filename}.pdf`);
};
