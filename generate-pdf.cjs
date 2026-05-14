const puppeteer = require('puppeteer');
const fs = require('fs');
const { marked } = require('marked');

async function createPDF() {
  const content = fs.readFileSync('content.md', 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Flywheel Assessor App Reference</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Grotesk:wght@700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }

        .cover {
          background-color: #1E3A5F;
          color: white;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px;
          page-break-after: always;
        }

        .cover h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 48px;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
        }

        .cover .subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          color: #F59E0B;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .content {
          padding: 40px 60px;
        }

        h2 {
          font-family: 'Space Grotesk', sans-serif;
          color: #1E3A5F;
          border-bottom: 2px solid #F59E0B;
          padding-bottom: 5px;
          margin-top: 40px;
        }

        h3 {
          font-family: 'Space Grotesk', sans-serif;
          color: #1E3A5F;
          margin-top: 30px;
        }

        a {
          color: #1E3A5F;
          text-decoration: none;
          font-weight: 600;
        }

        pre {
          background-color: #f4f4f4;
          padding: 15px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        code {
          background-color: #f4f4f4;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 13px;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          left: 60px;
          right: 60px;
          font-size: 10px;
          color: rgba(30, 58, 95, 0.5);
          text-transform: uppercase;
          text-align: center;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>Flywheel Investors</h1>
        <div class="subtitle">Flywheel Assessor App &mdash; Product & Technical Reference</div>
      </div>
      <div class="content">
        \${marked.parse(content)}
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync('temp.html', html);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: './public/Flywheel_Assessor_App_Reference.pdf',
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="font-size: 10px; color: rgba(30, 58, 95, 0.5); text-align: center; width: 100%; border-top: 1px solid #ccc; padding-top: 5px; margin: 0 40px; font-family: 'Inter', sans-serif;">Flywheel Investors &mdash; Flywheel Assessor App &mdash; Product Reference &bull; Page <span class="pageNumber"></span></div>`,
    margin: {
      top: '40px',
      bottom: '60px',
      left: '40px',
      right: '40px'
    }
  });

  await browser.close();
  console.log('PDF created successfully at ./public/Flywheel_Assessor_App_Reference.pdf');
}

createPDF().catch(console.error);
