module.exports = ({ shop, invoice }) => {
  const itemsHtml = invoice.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <div style="font-weight: 600; color: #334155; font-size: 14px;">${item.name}</div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; color: #64748b; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #64748b; font-size: 14px;">৳${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">৳${item.total.toLocaleString()}</td>
    </tr>
  `).join('');

  const formattedDate = new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Invoice from ${shop.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; }
    .email-wrapper { width: 100%; padding: 40px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    .header { background-color: #005C72; padding: 32px 40px; text-align: center; color: #ffffff; }
    .brand-name { font-size: 28px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.02em; }
    .invoice-badge { display: inline-block; padding: 6px 12px; background-color: rgba(255, 255, 255, 0.15); border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .content { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
    .subtext { color: #64748b; font-size: 14px; margin-bottom: 32px; }
    .meta-grid { display: table; width: 100%; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
    .meta-item { display: table-cell; width: 50%; }
    .meta-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 4px; }
    .meta-value { font-size: 15px; font-weight: 600; color: #1e293b; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .total-card { background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: right; }
    .total-row { color: #64748b; font-size: 14px; margin-bottom: 8px; }
    .grand-total { color: #005C72; font-size: 24px; font-weight: 800; margin-top: 12px; }
    .footer { padding: 32px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; }
    .footer-text { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .support-box { font-size: 12px; color: #94a3b8; font-style: italic; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="brand-name">${shop.name}</div>
      </div>
      
      <div class="content">
        <div class="greeting">Hello, ${invoice.customerName || 'Valued Customer'}!</div>
        <p class="subtext">Thank you for shopping with us. Here is a summary of your recent purchase.</p>
        
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Invoice Date</div>
            <div class="meta-value">${formattedDate}</div>
          </div>
          <div class="meta-item" style="text-align: right;">
            <div class="meta-label">Order Reference</div>
            <div class="meta-value">#${invoice.invoiceNumber}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8;">Description</th>
              <th style="text-align: center; padding-bottom: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8;">Qty</th>
              <th style="text-align: right; padding-bottom: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8;">Rate</th>
              <th style="text-align: right; padding-bottom: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-card">
          <div class="total-row">Subtotal: ৳${invoice.subtotal.toLocaleString()}</div>
          ${invoice.discountAmount > 0 ? `<div class="total-row" style="color: #278818;">Discount: -৳${invoice.discountAmount.toLocaleString()}</div>` : ''}
          ${invoice.deliveryCharge > 0 ? `
            <div class="total-row">
              Delivery Charge: 
              <span style="font-weight: 600; color: ${invoice.isDeliveryPaid ? '#278818' : '#64748b'};">
                ৳${invoice.deliveryCharge.toLocaleString()} ${invoice.isDeliveryPaid ? '(Paid)' : ''}
              </span>
            </div>` : ''}
          ${invoice.advanceAmount > 0 ? `<div class="total-row">Advance Paid: -৳${invoice.advanceAmount.toLocaleString()}</div>` : ''}
          <div class="grand-total">৳${invoice.grandTotal.toLocaleString()}</div>
          <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">Grand Total</div>
        </div>

        ${invoice.notes ? `
        <div style="margin-top: 32px; padding: 16px; border-left: 4px solid #005C72; background-color: #f0f9ff; font-size: 13px; color: #005C72; font-weight: 500;">
          <strong>Note:</strong> ${invoice.notes}
        </div>` : ''}
      </div>

      <div class="footer">
        <div class="footer-text">${shop.receiptConfig?.footerText || 'Thank you for your purchase! We hope to see you again soon.'}</div>
        <div class="support-box">
          ${shop.address?.address_line1 ? `Managed by ${shop.name} • ${shop.address.address_line1}<br>` : ''}
          For support, contact us at ${process.env.TECH_SUPPORT_NUMBER || "01605742247"}.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
