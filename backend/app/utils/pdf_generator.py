import traceback
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """
    Generate a PDF invoice.
    """
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("INVOICE", styles["Title"]))
        elements.append(Spacer(1, 5 * mm))

        elements.append(
            Paragraph(f"Restaurant: {invoice_data.get('restaurant_name', 'N/A')}", styles["Normal"])
        )
        elements.append(
            Paragraph(f"Date: {invoice_data.get('invoice_date', datetime.now().strftime('%Y-%m-%d'))}", styles["Normal"])
        )
        elements.append(Spacer(1, 5 * mm))

        orders = invoice_data.get("orders", [])
        if orders:
            table_data = [["#", "Order ID", "Customer", "Items", "Total", "Date"]]
            for i, order in enumerate(orders, 1):
                table_data.append([
                    str(i),
                    order.get("order_id", "")[:8],
                    order.get("customer_name", ""),
                    order.get("items_summary", ""),
                    f"Rs. {order.get('total', 0):.2f}",
                    order.get("date", ""),
                ])

            table = Table(table_data, repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4CAF50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 8 * mm))

        summary_data = [
            ["Total Amount", f"Rs. {invoice_data.get('total_amount', 0):.2f}"],
            ["Commission Rate", f"{invoice_data.get('commission_rate', 0)}%"],
            ["Commission", f"Rs. {invoice_data.get('commission', 0):.2f}"],
            ["Net Amount (Restaurant)", f"Rs. {invoice_data.get('net_amount', 0):.2f}"],
            ["Paid Amount", f"Rs. {invoice_data.get('paid_amount', 0):.2f}"],
            [
                "Balance Due",
                f"Rs. {invoice_data.get('net_amount', 0) - invoice_data.get('paid_amount', 0):.2f}",
            ],
        ]
        summary_table = Table(summary_data, colWidths=[150, 150])
        summary_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(summary_table)

        doc.build(elements)
        result = buffer.getvalue()
        return result
    except Exception as e:
        traceback.print_exc()
        raise
