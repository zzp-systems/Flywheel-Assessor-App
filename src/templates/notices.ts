export const noticeOfEntryTemplate = `
<div class="document-page single-page">
  <div class="document-header">
    <h2>FLYWHEEL INVESTORS LLC</h2>
    <hr class="header-divider" />
  </div>
  
  <div class="document-title">
    <h3>NOTICE OF ENTRY TO STORAGE UNIT</h3>
    <p class="subtitle">Pursuant to Rental Agreement — Texas Property Code</p>
  </div>

  <div class="document-body flex-grow">
    <p>
      This notice is to inform you that Flywheel Investors LLC, as operator of <span class="placeholder-data" data-field="facilityName">[Facility Name]</span>, will enter Storage Unit <span class="placeholder-data" data-field="unitNumber">[Unit Number]</span> on <span class="placeholder-data" data-field="dateOfEntry">[Date of Entry]</span> between <span class="placeholder-data" data-field="timeWindow">[Time Window]</span> for the following purpose: <span class="placeholder-data" data-field="reasonForEntry">[Reason for Entry]</span>. 
    </p>
    <p>
      This entry is conducted in accordance with the rental agreement executed on <span class="placeholder-data" data-field="leaseStartDate">[Lease Start Date]</span>, which grants the operator right of access upon three (3) days prior written notice. If you have any questions, please contact <span class="placeholder-data" data-field="assessorName">[Assessor Name]</span> at the facility office. 
    </p>
    <p>
      This notice is provided in compliance with Texas Property Code and the terms of your rental agreement.
    </p>
    <br/>
    <p>To: <span class="placeholder-data" data-field="tenantName">[Tenant Name]</span></p>
    <p>Date of Notice: <span class="placeholder-data" data-field="assessmentDate">[Today's Date]</span></p>
  </div>

  <div class="signature-block" style="margin-top: 4rem; text-align: center;">
    <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #000; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
      <span class="placeholder-data" data-field="signatureImage"></span>
    </div>
    <p style="margin-top: 0.5rem; font-weight: bold; font-size: 10pt;">
      <span class="placeholder-data" data-field="assessorName">[Assessor Name]</span>
    </p>
    <p style="font-size: 8pt; color: #666; margin-top: 0.25rem;">
      <span class="placeholder-data" data-field="signatureTimestamp"></span>
    </p>
  </div>

  <div class="document-footer">
    Flywheel Investors LLC — Notice of Entry — Generated <span class="placeholder-data" data-field="generationTime">[Timestamp]</span>
  </div>
</div>
`;

export const noticeOfClaimTemplate = `
<div class="document-page single-page">
  <div class="document-header">
    <h2>FLYWHEEL INVESTORS LLC</h2>
    <hr class="header-divider" />
  </div>
  
  <div class="document-title">
    <h3>NOTICE OF CLAIM AND INTENT TO ENFORCE LANDLORD'S LIEN</h3>
  </div>

  <div class="document-body flex-grow">
    <p><strong>To: <span class="placeholder-data" data-field="tenantName">[Tenant Name]</span></strong></p>
    <p>
      You are hereby notified that Flywheel Investors LLC, as operator of <span class="placeholder-data" data-field="facilityName">[Facility Name]</span>, claims a contractual landlord's lien against the personal property stored in Unit <span class="placeholder-data" data-field="unitNumber">[Unit Number]</span> pursuant to Texas Property Code Chapter 59 and the terms of your rental agreement. 
    </p>
    <p>
      The amount required to satisfy this claim is <strong>$<span class="placeholder-data" data-field="amountDue">[Amount Due]</span></strong>. You have until <span class="placeholder-data" data-field="deadlineDate">[Date 14 Days Out]</span> to pay this amount in full. 
    </p>
    <p>
      Failure to pay will result in the sale of the stored property at public auction. This notice is sent via verified mail and posted at the unit on <span class="placeholder-data" data-field="assessmentDate">[Today's Date]</span>.
    </p>
  </div>

  <div class="signature-block" style="margin-top: 4rem; text-align: center;">
    <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #000; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
      <span class="placeholder-data" data-field="signatureImage"></span>
    </div>
    <p style="margin-top: 0.5rem; font-weight: bold; font-size: 10pt;">
      <span class="placeholder-data" data-field="assessorName">[Assessor Name]</span>
    </p>
    <p style="font-size: 8pt; color: #666; margin-top: 0.25rem;">
      <span class="placeholder-data" data-field="signatureTimestamp"></span>
    </p>
  </div>

  <div class="document-footer">
    Flywheel Investors LLC — Notice of Claim — Texas Property Code Chapter 59 — Generated <span class="placeholder-data" data-field="generationTime">[Timestamp]</span>
  </div>
</div>
`;

export function generateFormalReportHTML(data: any): string {
  const dt = new Date(data.date);
  const formattedDate = dt.toLocaleString();

  let failedItemsHtml = '';
  Object.values(data.items).forEach((item: any) => {
    if (item.status === 'Fail') {
      failedItemsHtml += `
        <div class="fail-item">
          <strong>[${item.tier}] ${item.text}</strong><br/>
          Note: ${item.note || 'None'}
        </div>
      `;
    }
  });

  let photosHtml = '';
  if (data.photos && data.photos.length > 0) {
    const photosPerPage = 6;
    const totalPages = Math.ceil(data.photos.length / photosPerPage);
    
    for (let p = 0; p < totalPages; p++) {
      const pagePhotos = data.photos.slice(p * photosPerPage, (p + 1) * photosPerPage);
      let gridItems = '';
      
      pagePhotos.forEach((photo: any) => {
        const ids = photo.linkedItemIds || (photo.linkedItemId ? [photo.linkedItemId] : []);
        const itemNames = ids.map((id: string) => data.items[id] ? data.items[id].text.split('—')[0] : id).join(', ');
        const itemName = itemNames || 'Unlinked';
        const loc = `${photo.facilityName || data.facilityName || ''} - Unit ${photo.unitNumber || data.unitNumber || ''}`;
        
        gridItems += `
          <div class="photo-print-card">
            <div class="img-container">
              <img src="${photo.dataUri}" alt="Evidence" />
            </div>
            <div class="photo-meta">
              <p><strong>Item:</strong> ${itemName}</p>
              <p><strong>Location:</strong> ${loc}</p>
              <p style="margin-top: 0.5rem;" class="no-print">
                <a href="${photo.dataUri}" target="_blank" rel="noreferrer" class="view-btn">View Full Size</a>
              </p>
            </div>
          </div>
        `;
      });
      
      photosHtml += `
        <div class="page-break" style="margin-top: 2rem;">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem;">
            <span>PHOTOGRAPHIC EVIDENCE</span>
            <span style="font-size: 10pt; font-family: sans-serif;">${p + 1} of ${totalPages}</span>
          </div>
          <div class="photo-print-grid">
            ${gridItems}
          </div>
        </div>
      `;
    }
  }

  let signatureHtml = '';
  if (data.assessorSignature) {
    signatureHtml = `
      <div class="signature-block page-break-inside-avoid" style="margin-top: 4rem; text-align: center;">
        <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #000; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
          <img src="${data.assessorSignature}" style="max-height: 80px; mix-blend-mode: multiply; print-color-adjust: exact;" />
        </div>
        <p style="margin-top: 0.5rem; font-weight: bold; font-size: 10pt;">${data.assessorName || 'Assessor Signature'}</p>
        <p style="font-size: 8pt; color: #666; margin-top: 0.25rem;">Signed: ${new Date(data.signatureTimestamp!).toLocaleString()}</p>
      </div>
    `;
  }

  let pendingWorkOrdersHtml = '';
  if (data.workOrders && data.workOrders.length > 0) {
    let woRows = '';
    data.workOrders.forEach((wo: any) => {
      woRows += `
        <tr>
          <td style="padding: 0.5rem; border: 1px solid #ccc; font-weight: bold;">${wo.itemText.split('—')[0]}</td>
          <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: center;"><span style="color: ${wo.priority === 'Critical' ? '#DC2626' : '#F59E0B'}; font-weight: bold;">${wo.priority}</span></td>
          <td style="padding: 0.5rem; border: 1px solid #ccc;">${wo.note || '—'}</td>
        </tr>
      `;
    });
    pendingWorkOrdersHtml = `
      <div class="section-title" style="margin-top: 2rem;">PENDING WORK ORDERS</div>
      <table class="info-table" style="margin-bottom: 0; font-size: 9pt;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left; width: 40%;">Task</th>
            <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: center; width: 20%;">Priority</th>
            <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left; width: 40%;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${woRows}
        </tbody>
      </table>
    `;
  }

  let detailedChecklistHtml = '';
  const tiers = [
    { id: 'Red', name: 'RED LIGHT TIER (CRITICAL)', color: '#DC2626' },
    { id: 'Yellow', name: 'YELLOW LIGHT TIER (MODERATE)', color: '#F59E0B' },
    { id: 'Green', name: 'GREEN LIGHT TIER (MINOR/COSMETIC)', color: '#059669' },
    { id: 'Slate', name: 'ACCESS CREDENTIALS & ISSUED ITEMS', color: '#1F2937' }
  ];

  detailedChecklistHtml += '<div class="section-title page-break" style="margin-top: 2rem;">DETAILED ASSESSMENT CHECKLIST</div>';
  detailedChecklistHtml += '<p style="font-size: 9pt; font-weight: bold; font-style: italic; margin-bottom: 1rem; color: #4b5563;">Complete Item-by-Assessment Results</p>';
  
  tiers.forEach(tier => {
    const items = Object.values(data.items).filter((item: any) => item.tier === tier.id);
    if (items.length > 0) {
      detailedChecklistHtml += `
        <div class="page-break-inside-avoid" style="margin-bottom: 1.5rem;">
          <h4 style="background-color: ${tier.color}; color: white; padding: 0.5rem; font-size: 9pt; text-transform: uppercase;">${tier.name}</h4>
          <table class="info-table" style="margin-bottom: 0;">
            <thead>
              <tr style="background-color: #f3f4f6; font-size: 9pt;">
                <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left; width: 50%;">Item Name</th>
                <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: center; width: 100px;">Status</th>
                <th style="padding: 0.5rem; border: 1px solid #ccc; text-align: left;">Notes</th>
              </tr>
            </thead>
            <tbody style="font-size: 9pt;">
      `;
      items.forEach((item: any, idx: number) => {
        const bg = idx % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;';
        const parts = item.text.split('—');
        const itemName = parts[0].trim();
        const itemDesc = parts.length > 1 ? `<span style="font-size: 8pt; color: #4b5563; display: block; margin-top: 2px;">${parts[1].trim()}</span>` : '';
        
        let statusHtml = '';
        if (item.status === 'Pass') statusHtml = '<span style="color: #059669; font-weight: bold;">✓ Pass</span>';
        else if (item.status === 'Fail') statusHtml = '<span style="color: #DC2626; font-weight: bold;">✗ Fail</span>';
        else if (item.status === 'N/A') statusHtml = '<span style="color: #9ca3af; font-weight: bold;">N/A</span>';
        else statusHtml = '<span style="color: #d1d5db; font-weight: bold;">—</span>';

        detailedChecklistHtml += `
          <tr style="${bg}">
            <td style="padding: 0.5rem; border: 1px solid #ccc;"><strong>${itemName}</strong>${itemDesc}</td>
            <td style="padding: 0.5rem; border: 1px solid #ccc; text-align: center;">${statusHtml}</td>
            <td style="padding: 0.5rem; border: 1px solid #ccc; font-style: italic; color: #374151;">${item.note || '—'}</td>
          </tr>
        `;
      });
      detailedChecklistHtml += `</tbody></table></div>`;
    }
  });

  return `
<div class="document-page">
  <div class="document-header">
    <h2>FLYWHEEL INVESTORS LLC</h2>
    <hr class="header-divider" />
  </div>
  
  <div class="document-title">
    <h3>${(data.type || 'FORMAL ASSESSMENT REPORT').toUpperCase()}</h3>
    <p class="subtitle">Self-Storage Facility Condition Assessment</p>
  </div>

  <div class="document-body">
    <table class="info-table">
      <tr><td><strong>Facility:</strong> ${data.facilityName || 'N/A'}</td><td><strong>Unit Type:</strong> ${data.unitType || 'N/A'}</td></tr>
      <tr><td><strong>Unit:</strong> ${data.unitNumber || 'N/A'}</td><td><strong>Assessor:</strong> ${data.assessorName || 'N/A'}</td></tr>
      <tr><td><strong>Building:</strong> ${data.building || 'N/A'}</td><td><strong>Weather:</strong> ${data.weather || 'N/A'}</td></tr>
    </table>

    <div class="section-title">FORENSIC SUMMARY</div>
    <div class="summary-box">
      <h4>Assessor Notes / Deficiencies</h4>
      <p>${data.assessorNotes ? data.assessorNotes.replace(/\n/g, '<br/>') : 'None'}</p>
      
      <h4 style="margin-top: 1rem;">Failed Items</h4>
      ${failedItemsHtml || '<p>No failed items.</p>'}
    </div>
    
    ${detailedChecklistHtml}

    ${pendingWorkOrdersHtml}

    ${photosHtml}

    ${signatureHtml}

  </div>

  <div class="document-footer">
    Flywheel Investors LLC — Texas Property Code Chapter 59 — ${data.type || 'Assessment Report'} — Generated ${formattedDate}
  </div>
</div>
`;
}

export function generateHabitationReportHTML(data: any): string {
  const dt = new Date(data.date);
  const formattedDate = dt.toLocaleString();
  
  const habitationItem = data.items['y-mid-6'];
  const note = habitationItem ? habitationItem.note : 'No notes provided.';

  let photosHtml = '';
  if (data.photos && data.photos.length > 0) {
    const linkedPhotos = data.photos.filter((p: any) => {
      const ids = p.linkedItemIds || (p.linkedItemId ? [p.linkedItemId] : []);
      return ids.includes('y-mid-6');
    });

    if (linkedPhotos.length > 0) {
      const photosPerPage = 6;
      const totalPages = Math.ceil(linkedPhotos.length / photosPerPage);

      for (let p = 0; p < totalPages; p++) {
        const pagePhotos = linkedPhotos.slice(p * photosPerPage, (p + 1) * photosPerPage);
        let gridItems = '';
        
        pagePhotos.forEach((photo: any) => {
          const loc = `${photo.facilityName || data.facilityName || ''} - Unit ${photo.unitNumber || data.unitNumber || ''}`;
          
          gridItems += `
            <div class="photo-print-card">
              <div class="img-container">
                <img src="${photo.dataUri}" alt="Evidence" />
              </div>
              <div class="photo-meta">
                <p><strong>Item:</strong> Habitation Evidence</p>
                <p><strong>Location:</strong> ${loc}</p>
              </div>
            </div>
          `;
        });
        
        photosHtml += `
          <div class="page-break" style="margin-top: 2rem;">
            <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem;">
              <span>PHOTOGRAPHIC EVIDENCE</span>
              <span style="font-size: 10pt; font-family: sans-serif;">${p + 1} of ${totalPages}</span>
            </div>
            <div class="photo-print-grid">
              ${gridItems}
            </div>
          </div>
        `;
      }
    }
  }

  let signatureHtml = '';
  if (data.assessorSignature) {
    signatureHtml = `
      <div class="signature-block page-break-inside-avoid" style="margin-top: 4rem; text-align: center;">
        <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #000; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
          <img src="${data.assessorSignature}" style="max-height: 80px; mix-blend-mode: multiply; print-color-adjust: exact;" />
        </div>
        <p style="margin-top: 0.5rem; font-weight: bold; font-size: 10pt;">${data.assessorName || 'Assessor Signature'}</p>
        <p style="font-size: 8pt; color: #666; margin-top: 0.25rem;">Signed: ${new Date(data.signatureTimestamp!).toLocaleString()}</p>
      </div>
    `;
  }

  return `
<div class="document-page single-page">
  <div class="document-header">
    <h2>FLYWHEEL INVESTORS LLC</h2>
    <hr class="header-divider" />
  </div>
  
  <div class="document-title">
    <h3>HABITATION VIOLATION REPORT</h3>
    <p class="subtitle">Texas Property Code §59.009</p>
  </div>

  <div class="document-body flex-grow">
    <table class="info-table">
      <tr><td><strong>Facility:</strong> ${data.facilityName || 'N/A'}</td><td><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</td></tr>
      <tr><td><strong>Unit:</strong> ${data.unitNumber || 'N/A'}</td><td><strong>Assessor:</strong> ${data.assessorName || 'N/A'}</td></tr>
    </table>

    <div style="margin-top: 2rem; padding: 1.5rem; background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 0.5rem; color: #991b1b; font-weight: 500;">
      <p>This report documents evidence of unauthorized habitation in the above-referenced storage unit, in violation of Texas Property Code §59.009 and the facility's rental agreement. The operator reserves all rights to terminate the lease, remove the occupant, and seek legal remedies.</p>
    </div>

    <div class="section-title" style="margin-top: 2rem;">ASSESSOR NOTES</div>
    <div class="summary-box">
      <p>${note ? note.replace(/\n/g, '<br/>') : 'None'}</p>
    </div>
    
    ${photosHtml}

    ${(() => {
      if (data.assessorSignature) {
        return `
          <div class="signature-block page-break-inside-avoid" style="margin-top: 4rem; text-align: center;">
            <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #000; min-height: 60px; display: flex; align-items: flex-end; justify-content: center;">
              <img src="${data.assessorSignature}" style="max-height: 80px; mix-blend-mode: multiply; print-color-adjust: exact;" />
            </div>
            <p style="margin-top: 0.5rem; font-weight: bold; font-size: 10pt;">${data.assessorName || 'Assessor Signature'}</p>
            <p style="font-size: 8pt; color: #666; margin-top: 0.25rem;">Signed: ${new Date(data.signatureTimestamp!).toLocaleString()}</p>
          </div>
        `;
      }
      return '';
    })()}

  </div>

  <div class="document-footer">
    Flywheel Investors LLC — Habitation Violation Report — Generated ${formattedDate}
  </div>
</div>
`;
}

export function processTemplate(template: string, data: Record<string, string>): string {
  let processed = template;
  // Replace each span that has data-field with the actual data value
  const regex = /<span class="placeholder-data"[^>]*data-field="([^"]+)"[^>]*>.*?<\/span>/g;
  
  processed = processed.replace(regex, (match, fieldName) => {
    const value = data[fieldName];
    if (value !== undefined && value !== '') {
      if (fieldName === 'signatureImage') {
        return `<img src="${value}" style="max-height: 80px; mix-blend-mode: multiply; print-color-adjust: exact;" alt="Signature" />`;
      }
      return `<span class="placeholder-data filled">${value}</span>`;
    }
    return match;
  });

  return processed;
}
