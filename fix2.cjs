const fs = require('fs');

function replaceFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Inspection -> Assessment
  content = content.replace(/InspectionData/g, 'AssessmentData');
  content = content.replace(/InspectionType/g, 'AssessmentType');
  content = content.replace(/useInspection/g, 'useAssessment');
  content = content.replace(/queueInspection/g, 'queueAssessment');
  content = content.replace(/current_inspection/g, 'current_assessment');
  content = content.replace(/FlywheelInspectionDB/g, 'FlywheelAssessmentDB');
  
  content = content.replace(/inspections/gi, 'assessments');
  content = content.replace(/inspection/g, 'assessment');
  content = content.replace(/Inspection/g, 'Assessment');
  
  // Note: already replaced in data.ts and types.ts manually?
  // Let's replace the string literals
  content = content.replace(/Move-In Baseline/g, 'Move-In Assessment Report');
  content = content.replace(/Mid-Tenancy/g, 'Unit Health & Safety Assessment');
  // 'Move-Out' was replaced to 'Move-Out Assessment Report' in data.ts and types.ts. We should fix any 'Move-Out' that appears as inspection type.
  content = content.replace(/Move-Out/g, 'Move-Out Assessment Report');
  
  fs.writeFileSync(file, content);
}

const glob = require('fs').readdirSync('src', { recursive: true })
  .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  .map(f => 'src/' + f);

glob.forEach(replaceFile);
replaceFile('index.html');
