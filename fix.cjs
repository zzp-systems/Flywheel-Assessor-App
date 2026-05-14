const fs = require('fs');

function replaceFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/print:hidden/g, 'no-print');
  content = content.replace(/hidden print:block/g, 'print-only');
  content = content.replace(/hidden print:flex/g, 'print-only flex'); // Or we can let print-only class handle display: block !important, maybe flex isn't needed. Wait, we'll see.
  content = content.replace(/print-page-break/g, 'page-break');
  fs.writeFileSync(file, content);
}

replaceFile('src/App.tsx');
replaceFile('src/components/PhotoTracker.tsx');
replaceFile('src/components/ChecklistView.tsx');
replaceFile('src/components/ForensicSummary.tsx');
replaceFile('src/components/DocumentGenerator.tsx');
replaceFile('src/components/DetailedChecklistPrint.tsx');
replaceFile('src/templates/notices.ts');
