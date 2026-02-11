
const LOGO_URL = 'https://res.cloudinary.com/dvkt0lsqb/image/upload/v1770764148/HeraLogoOriginal_alsd3g.jpg';
const BRAND_PRIMARY = '#CD7F32'; // HSL(30, 61%, 50%) from index.css
const BRAND_ACCENT = '#DA9B5D'; 
const BRAND_DARK = '#0F172A'; // More professional dark blue-black
const BRAND_LIGHT = '#F8FAFC';
const CONTACT_EMAIL = 'admin@heracollections.com';
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
      background-color: #F1F5F9; 
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background-color: #ffffff; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
      border: 1px solid #E2E8F0;
    }
    .header { 
      text-align: center; 
      padding: 40px 40px; 
      background-color: #ffffff;
      border-bottom: 2px solid ${BRAND_PRIMARY};
      color: ${BRAND_DARK}; 
    }
    .logo-container {
      width: 100px;
      height: 100px;
      margin: 0 auto 16px;
      overflow: hidden;
      border-radius: 50%;
      border: 2px solid #F1F5F9;
    }
    .logo-img { 
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: ${BRAND_DARK};
      text-transform: uppercase;
    }
    .content { 
      padding: 40px; 
    }
    .section {
      background-color: ${BRAND_LIGHT};
      padding: 24px;
      border-radius: 8px;
      margin: 24px 0;
      border: 1px solid #E2E8F0;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${BRAND_PRIMARY};
      margin-bottom: 16px;
      display: block;
    }
    .button { 
      display: inline-block; 
      background-color: ${BRAND_PRIMARY}; 
      color: #ffffff !important; 
      text-decoration: none; 
      padding: 14px 32px; 
      border-radius: 6px; 
      font-weight: 600; 
      margin: 24px 0; 
      text-align: center; 
      transition: background-color 0.2s ease;
    }
    .footer { 
      text-align: center; 
      padding: 40px; 
      background-color: ${BRAND_DARK}; 
      color: #94A3B8; 
      font-size: 12px; 
    }
    .contact-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #334155;
    }
    .contact-item {
      display: block;
      margin: 8px 0;
      color: #CBD5E1;
      text-decoration: none;
    }
    .status-badge { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 4px; 
      font-size: 11px; 
      font-weight: 700; 
      text-transform: uppercase;
    }
    .badge-success { background-color: #DCFCE7; color: #166534; }
    .badge-error { background-color: #FEE2E2; color: #991B1B; }
    .badge-warning { background-color: #FEF3C7; color: #92400E; }
    .badge-info { background-color: #DBEAFE; color: #1E40AF; }
    
    .item-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 12px 0; 
      border-bottom: 1px solid #E2E8F0; 
    }
    .item-row:last-child { border-bottom: none; }
    .total-row { 
      font-weight: 700; 
      font-size: 18px; 
      color: ${BRAND_PRIMARY};
      margin-top: 12px; 
    }
    
    @media only screen and (max-width: 600px) {
      .container { margin: 0; border-radius: 0; border: none; }
      .content, .header, .footer { padding: 30px 20px; }
    }
  </style>
`;

export const wrapWithLayout = (title, content, headerExtra = '') => `
<!DOCTYPE html>
<html lang="en">
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
                <img src="${LOGO_URL}" alt="Hera Collection Logo" class="logo-img" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover;">
            </div>
            <h1>${title}</h1>
            ${headerExtra}
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Hera Collection. All rights reserved.</p>
            <div class="contact-info">
                <div class="contact-item">Email: ${CONTACT_EMAIL}</div>
                <div class="contact-item">Phone: ${CONTACT_PHONE}</div>
                <div class="contact-item">Location: ${CONTACT_LOCATION}</div>
            </div>
            <p style="margin-top: 24px; font-size: 10px; opacity: 0.5;">
                This is an automated administrative message from Hera Collection.
            </p>
        </div>
    </div>
</body>
</html>
`;

