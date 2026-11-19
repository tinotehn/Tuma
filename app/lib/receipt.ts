import { PDFDocument, rgb } from "pdf-lib";

export async function generateReceipts(
    ref: string, 
    biller: string, 
    acc: string, 
    amount: number, 
    fee: number, 
    total: number, 
    phone: string, 
    date: string
): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([400, 600]);
    const { height } = page.getSize();

    // Forest green brand accent color (matching your Tuma UI specs)
    const primaryColor = rgb(0.08, 0.38, 0.22); 
    const darkNeutral = rgb(0.1, 0.1, 0.1);
    const mutedColor = rgb(0.4, 0.4, 0.4);

    // Header & Title
    page.drawText("TUMA — Payment Receipt", { x: 50, y: height - 50, size: 18, color: primaryColor });
    
    // Metadata rows (Fixed to use direct arguments instead of 'data.')
    page.drawText(`Ref: ${ref}`, { x: 50, y: height - 85, size: 11, color: mutedColor });
    page.drawText(`Date: ${date}`, { x: 50, y: height - 105, size: 11, color: mutedColor });
    
    // Divider line
    page.drawLine({
        start: { x: 50, y: height - 120 },
        end: { x: 350, y: height - 120 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });

    // Transaction Details
    page.drawText(`Biller: ${biller}`, { x: 50, y: height - 150, size: 14, color: darkNeutral });
    page.drawText(`Account: ${acc}`, { x: 50, y: height - 175, size: 12, color: darkNeutral });
    page.drawText(`Phone: ${phone}`, { x: 50, y: height - 200, size: 12, color: darkNeutral });
    
    page.drawText(`Amount: $${amount.toFixed(2)}`, { x: 50, y: height - 235, size: 12, color: darkNeutral });
    page.drawText(`Service Fee: $${fee.toFixed(2)}`, { x: 50, y: height - 260, size: 12, color: darkNeutral });
    
    // Total Paid Highlight
    page.drawText(`Total Paid: $${total.toFixed(2)}`, { x: 50, y: height - 300, size: 14, color: primaryColor });
    
    // Footer
    page.drawText("Thank you for using Tuma Payments", { x: 50, y: height - 360, size: 10, color: mutedColor });
    
    const bytes = await pdf.save();
    return Buffer.from(bytes);
}