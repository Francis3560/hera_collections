
const LOGO_URL = 'https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769805371/HeraCollection_Logo-removebg-preview_tcjo8h.png';
const BRAND_PRIMARY = '#7C3AED';
const BRAND_ACCENT = '#A855F7';
const BRAND_DARK = '#1f2937';
const BRAND_LIGHT = '#f9fafb';
const CONTACT_EMAIL = 'info@heracollections.com';
const CONTACT_PHONE = '+254 718 577 608 / +254 707 064 827';
const CONTACT_LOCATION = 'Nairobi, Kenya';

export const getBaseStyles = () => `
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      line-height: 1.6; 
      color: ${BRAND_DARK}; 
      margin: 0; 
      padding: 0; 
      background-color: #f3f4f6; 
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background-color: #ffffff; 
      border-radius: 24px; 
      overflow: hidden; 
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
    }
    .header { 
      text-align: center; 
      padding: 48px 40px; 
      background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%); 
      color: white; 
    }
    .logo-container {
      background: white;
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border-radius: 20px;
      padding: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .logo-img { 
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.025em;
      text-transform: uppercase;
    }
    .content { 
      padding: 48px 40px; 
    }
    .section {
      background-color: ${BRAND_LIGHT};
      padding: 32px;
      border-radius: 20px;
      margin: 32px 0;
      border: 1px solid #e5e7eb;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${BRAND_PRIMARY};
      margin-bottom: 20px;
      display: block;
    }
    .button { 
      display: inline-block; 
      background: ${BRAND_PRIMARY}; 
      color: white !important; 
      text-decoration: none; 
      padding: 16px 36px; 
      border-radius: 14px; 
      font-weight: 700; 
      margin: 32px 0; 
      text-align: center; 
      box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
      transition: all 0.2s ease;
    }
    .footer { 
      text-align: center; 
      padding: 48px 40px; 
      background-color: ${BRAND_LIGHT}; 
      color: #6b7280; 
      font-size: 13px; 
      border-top: 1px solid #e5e7eb; 
    }
    .contact-info {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      display: grid;
      gap: 12px;
    }
    .contact-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #4b5563;
    }
    .status-badge { 
      display: inline-block; 
      padding: 6px 16px; 
      border-radius: 100px; 
      font-size: 12px; 
      font-weight: 700; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-error { background: #fee2e2; color: #b91c1c; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-info { background: #dbeafe; color: #1d4ed8; }
    
    .item-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 16px 0; 
      border-bottom: 1px solid #e5e7eb; 
    }
    .item-row:last-child { border-bottom: none; }
    .total-row { 
      font-weight: 800; 
      font-size: 20px; 
      color: ${BRAND_PRIMARY};
      margin-top: 16px; 
    }
    
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content, .header, .footer { padding: 32px 24px; }
    }
  </style>
`;

export const wrapWithLayout = (title, content, headerExtra = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${getBaseStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="${LOGO_URL}" alt="Hera Collection Logo" class="logo-img">
            </div>
            <h1>${title}</h1>
            ${headerExtra}
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. Crafted for elegance.</p>
            <div class="contact-info">
                <div class="contact-item">📧 ${CONTACT_EMAIL}</div>
                <div class="contact-item">📞 ${CONTACT_PHONE}</div>
                <div class="contact-item">📍 ${CONTACT_LOCATION}</div>
            </div>
            <p style="margin-top: 32px; font-size: 11px; opacity: 0.6;">
                This is an automated message. Please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
`;
