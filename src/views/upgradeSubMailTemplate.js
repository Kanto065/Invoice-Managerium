function upgradeSubMailTemplate(name, planName) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        background-color: #f8fafb;
        color: #333333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .header h1 {
        color: #005C72;
        margin: 0;
      }
      .content {
        line-height: 1.6;
      }
      .plan-box {
        background-color: #f0f7f9;
        border-left: 4px solid #005C72;
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #888888;
      }
      .btn {
        display: inline-block;
        background-color: #005C72;
        color: #ffffff;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Kanto Invoice</h1>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        <p>Great news! Your subscription request has been approved by the admin.</p>
        <div class="plan-box">
          <strong>Plan Upgraded To:</strong> ${planName}
        </div>
        <p>Your shop's limits have been successfully updated. You can now log into your dashboard and take full advantage of your new features!</p>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Kanto Invoice Team</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Kanto Invoice. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

module.exports = upgradeSubMailTemplate;
