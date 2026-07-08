(() => {
  'use strict';

  const WHATSAPP_NUMBER = '9613763181';
  const POLICY_YEAR = 2026; // Tariff V17 effective June 19, 2026
  const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const num = (v) => Number(v || 0);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function waLink(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function getForm(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function selectedText(select) {
    return select.options[select.selectedIndex]?.textContent || select.value;
  }

  function optionMarkup(options) {
    return options.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
  }

  function renderResult(targetId, payload) {
    const target = qs(targetId);
    const notes = (payload.notes || []).map((n) => `<li class="${n.type || ''}">${n.text}</li>`).join('');
    const rows = (payload.rows || []).map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('');
    const whatsapp = payload.whatsappText ? `<a class="btn whatsapp-btn" target="_blank" rel="noopener" href="${waLink(payload.whatsappText)}">Request this quote on WhatsApp</a>` : '';

    target.classList.remove('empty-state');
    target.innerHTML = `
      <h3>${payload.title}</h3>
      <div class="price">${money(payload.total)} <span>${payload.priceLabel || 'estimated total'}</span></div>
      <ul class="breakdown">${rows}</ul>
      ${notes ? `<ul class="note-list">${notes}</ul>` : ''}
      <div class="result-actions">${whatsapp}</div>
      <p class="small-print">Indicative premium only. Final issuance remains subject to underwriting approval, documents, policy conditions, and confirmation.</p>
    `;
  }

  function renderReferral(targetId, title, rows, notes, whatsappText) {
    renderResult(targetId, {
      title,
      total: 0,
      priceLabel: 'refer / manual quote',
      rows,
      notes: [{ type: 'warning', text: 'This case requires manual review before a reliable premium can be confirmed.' }, ...(notes || [])],
      whatsappText
    });
  }

  function baseMessage(product, details, total, notes = []) {
    return [
      'Hello Jalal, I would like to request this insurance quote.',
      `Product: ${product}`,
      ...details,
      total ? `Estimated Premium: ${money(total)}` : 'Estimated Premium: Requires manual review',
      notes.length ? `Notes: ${notes.join(' | ')}` : '',
      'Please help me proceed with the next steps.'
    ].filter(Boolean).join('\n');
  }

  // Navigation
  const navToggle = qs('#navToggle');
  const navLinks = qs('#navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    qsa('.nav-links a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  const quickWhatsapp = qs('#quickWhatsapp');
  if (quickWhatsapp) {
    quickWhatsapp.href = waLink('Hello Jalal, I would like help with an insurance quote.');
    quickWhatsapp.target = '_blank';
    quickWhatsapp.rel = 'noopener';
  }
  const generalWhatsapp = qs('#generalWhatsapp');
  if (generalWhatsapp) {
    generalWhatsapp.href = waLink('Hello Jalal, I would like to request a manual insurance quote.\nProduct needed:\nClient details:\nPlease advise on the required information.');
    generalWhatsapp.target = '_blank';
    generalWhatsapp.rel = 'noopener';
  }

  // Medical data
  const ageBands = [
    { key: '14d-17', label: '14 days - 17Y', min: 0, max: 17 },
    { key: '18-24', label: '18Y - 24Y', min: 18, max: 24 },
    { key: '25-30', label: '25Y - 30Y', min: 25, max: 30 },
    { key: '31-35', label: '31Y - 35Y', min: 31, max: 35 },
    { key: '36-40', label: '36Y - 40Y', min: 36, max: 40 },
    { key: '41-45', label: '41Y - 45Y', min: 41, max: 45 },
    { key: '46-50', label: '46Y - 50Y', min: 46, max: 50 },
    { key: '51-55', label: '51Y - 55Y', min: 51, max: 55 },
    { key: '56-60', label: '56Y - 60Y', min: 56, max: 60 },
    { key: '61-64', label: '61Y - 64Y', min: 61, max: 64 },
    { key: '65-70', label: '65Y - 70Y', min: 65, max: 70 },
    { key: '71-75', label: '71Y - 75Y', min: 71, max: 75 },
    { key: '76-80', label: '76Y - 80Y', min: 76, max: 80 },
    { key: '81+', label: '81Y+', min: 81, max: 999 }
  ];

  const hdfBands = ageBands.map((b) => b.key === '81+' ? { ...b, key: '81-99', label: '81Y - 99Y', max: 99 } : b);

  function bandFor(age, bands = ageBands) {
    return bands.find((b) => age >= b.min && age <= b.max);
  }

  const medicalPlans = {
    youth: {
      label: 'Panacea Youth', categories: ['individual'], classes: ['A', 'B', 'S'], amb: ['included'], cost: 35, bands: ageBands,
      inHospital: {
        '18-24': { A: 560, B: 475, S: 425 },
        '25-30': { A: 660, B: 555, S: 500 },
        '31-35': { A: 895, B: 760, S: 675 }
      }
    },
    ultra: {
      label: 'Panacea Ultra', categories: ['individual', 'family'], classes: ['A', 'B', 'S'], amb: ['none', '0', '15'], cost: 35, bands: ageBands,
      inHospital: {
        individual: {
          '14d-17': { A: 700, B: 600, S: 465 }, '18-24': { A: 950, B: 690, S: 570 }, '25-30': { A: 1360, B: 980, S: 810 }, '31-35': { A: 1530, B: 1030, S: 890 }, '36-40': { A: 1650, B: 1180, S: 920 }, '41-45': { A: 1700, B: 1320, S: 1000 }, '46-50': { A: 2000, B: 1500, S: 1200 }, '51-55': { A: 2480, B: 1770, S: 1450 }, '56-60': { A: 3750, B: 2450, S: 1920 }, '61-64': { A: 4920, B: 3300, S: 2550 }, '65-70': { A: 6600, B: 4800, S: 3450 }, '71-75': { A: 9200, B: 5700, S: 4300 }, '76-80': { A: 10000, B: 7800, S: 5300 }, '81+': { A: 13000, B: 9000, S: 6900 }
        },
        family: {
          '14d-17': { A: 644, B: 552, S: 428 }, '18-24': { A: 874, B: 635, S: 524 }, '25-30': { A: 1251, B: 902, S: 745 }, '31-35': { A: 1408, B: 948, S: 819 }, '36-40': { A: 1518, B: 1086, S: 846 }, '41-45': { A: 1564, B: 1214, S: 920 }, '46-50': { A: 1840, B: 1380, S: 1104 }, '51-55': { A: 2282, B: 1628, S: 1334 }, '56-60': { A: 3450, B: 2254, S: 1766 }, '61-64': { A: 4526, B: 3036, S: 2346 }, '65-70': { A: 6072, B: 4416, S: 3174 }, '71-75': { A: 8464, B: 5244, S: 3956 }, '76-80': { A: 9200, B: 7176, S: 4876 }, '81+': { A: 11960, B: 8280, S: 6348 }
        }
      },
      ambRates: {
        individual: { '14d-17': { '0': 250, '15': 165 }, '18-24': { '0': 480, '15': 285 }, '25-30': { '0': 555, '15': 345 }, '31-35': { '0': 562, '15': 385 }, '36-40': { '0': 630, '15': 450 }, '41-45': { '0': 630, '15': 450 }, '46-50': { '0': 714, '15': 500 }, '51-55': { '0': 756, '15': 572 }, '56-60': { '0': 814, '15': 630 }, '61-64': { '0': 903, '15': 710 }, '65-70': { '0': 1365, '15': 950 }, '71-75': { '0': 1722, '15': 1200 }, '76-80': { '0': 1900, '15': 1250 }, '81+': { '0': 2200, '15': 1600 } },
        family: { '14d-17': { '0': 230, '15': 152 }, '18-24': { '0': 442, '15': 262 }, '25-30': { '0': 511, '15': 317 }, '31-35': { '0': 520, '15': 354 }, '36-40': { '0': 580, '15': 414 }, '41-45': { '0': 580, '15': 414 }, '46-50': { '0': 657, '15': 460 }, '51-55': { '0': 696, '15': 526 }, '56-60': { '0': 749, '15': 580 }, '61-64': { '0': 835, '15': 653 }, '65-70': { '0': 1256, '15': 874 }, '71-75': { '0': 1584, '15': 1104 }, '76-80': { '0': 1748, '15': 1150 }, '81+': { '0': 2024, '15': 1472 } }
      }
    },
    essential: {
      label: 'Panacea Essential', categories: ['individual'], classes: ['A', 'B', 'S'], amb: ['none', '0', '15'], cost: 35, bands: ageBands,
      inHospital: { individual: { '14d-17': { A: 500, B: 385, S: 285 }, '18-24': { A: 700, B: 500, S: 415 }, '25-30': { A: 980, B: 700, S: 550 }, '31-35': { A: 1100, B: 800, S: 600 }, '36-40': { A: 1240, B: 850, S: 650 }, '41-45': { A: 1320, B: 900, S: 700 }, '46-50': { A: 1600, B: 1100, S: 900 }, '51-55': { A: 1850, B: 1250, S: 1000 }, '56-60': { A: 3000, B: 1930, S: 1400 }, '61-64': { A: 3755, B: 2500, S: 1770 }, '65-70': { A: 5320, B: 3500, S: 2450 }, '71-75': { A: 6600, B: 4450, S: 3000 }, '76-80': { A: 8050, B: 5500, S: 3800 }, '81+': { A: 10560, B: 7200, S: 4700 } } },
      ambRates: { individual: { '14d-17': { '0': 200, '15': 127 }, '18-24': { '0': 380, '15': 233 }, '25-30': { '0': 450, '15': 297 }, '31-35': { '0': 517, '15': 339 }, '36-40': { '0': 575, '15': 350 }, '41-45': { '0': 575, '15': 350 }, '46-50': { '0': 640, '15': 382 }, '51-55': { '0': 670, '15': 403 }, '56-60': { '0': 720, '15': 498 }, '61-64': { '0': 831, '15': 541 }, '65-70': { '0': 1100, '15': 763 }, '71-75': { '0': 1300, '15': 954 }, '76-80': { '0': 1400, '15': 1007 }, '81+': { '0': 1600, '15': 1272 } } }
    },
    basic: {
      label: 'Panacea Basic', categories: ['individual'], classes: ['A', 'B', 'S'], amb: ['none', '0', '15'], cost: 35, bands: ageBands,
      inHospital: { individual: { '14d-17': { A: 335, B: 270, S: 202 }, '18-24': { A: 530, B: 364, S: 297 }, '25-30': { A: 725, B: 478, S: 406 }, '31-35': { A: 753, B: 578, S: 437 }, '36-40': { A: 865, B: 630, S: 481 }, '41-45': { A: 954, B: 664, S: 492 }, '46-50': { A: 1126, B: 781, S: 655 }, '51-55': { A: 1240, B: 874, S: 711 }, '56-60': { A: 2052, B: 1324, S: 978 }, '61-64': { A: 2656, B: 1742, S: 1367 }, '65-70': { A: 3644, B: 2458, S: 1761 }, '71-75': { A: 4492, B: 3043, S: 2129 }, '76-80': { A: 5602, B: 4022, S: 2783 }, '81+': { A: 7376, B: 5210, S: 3520 } } },
      ambRates: { individual: { '14d-17': { '0': 167, '15': 108 }, '18-24': { '0': 315, '15': 198 }, '25-30': { '0': 387, '15': 252 }, '31-35': { '0': 437, '15': 288 }, '36-40': { '0': 459, '15': 297 }, '41-45': { '0': 459, '15': 297 }, '46-50': { '0': 495, '15': 324 }, '51-55': { '0': 518, '15': 342 }, '56-60': { '0': 594, '15': 423 }, '61-64': { '0': 707, '15': 459 }, '65-70': { '0': 900, '15': 648 }, '71-75': { '0': 1017, '15': 810 }, '76-80': { '0': 1139, '15': 855 }, '81+': { '0': 1337, '15': 1080 } } }
    },
    abroad: {
      label: 'Panacea Abroad', categories: ['individual', 'family'], classes: ['A'], amb: ['none', '0', '15'], cost: 35, bands: ageBands,
      inHospital: { individual: { '14d-17': { A: 875 }, '18-24': { A: 1190 }, '25-30': { A: 1680 }, '31-35': { A: 1932 }, '36-40': { A: 2128 }, '41-45': { A: 2240 }, '46-50': { A: 2590 }, '51-55': { A: 3080 }, '56-60': { A: 4760 }, '61-64': { A: 6048 }, '65-70': { A: 8148 }, '71-75': { A: 11200 }, '76-80': { A: 12040 }, '81+': { A: 16100 } }, family: { '14d-17': { A: 805 }, '18-24': { A: 1095 }, '25-30': { A: 1546 }, '31-35': { A: 1778 }, '36-40': { A: 1957 }, '41-45': { A: 2061 }, '46-50': { A: 2383 }, '51-55': { A: 2834 }, '56-60': { A: 4379 }, '61-64': { A: 5564 }, '65-70': { A: 7496 }, '71-75': { A: 10304 }, '76-80': { A: 11077 }, '81+': { A: 14812 } } },
      ambRates: { individual: { '14d-17': { '0': 301, '15': 224 }, '18-24': { '0': 630, '15': 399 }, '25-30': { '0': 728, '15': 483 }, '31-35': { '0': 749, '15': 490 }, '36-40': { '0': 840, '15': 571 }, '41-45': { '0': 840, '15': 571 }, '46-50': { '0': 952, '15': 658 }, '51-55': { '0': 1008, '15': 728 }, '56-60': { '0': 1085, '15': 812 }, '61-64': { '0': 1204, '15': 910 }, '65-70': { '0': 1820, '15': 1288 }, '71-75': { '0': 2296, '15': 1610 }, '76-80': { '0': 2520, '15': 1652 }, '81+': { '0': 2632, '15': 2170 } }, family: { '14d-17': { '0': 277, '15': 206 }, '18-24': { '0': 580, '15': 367 }, '25-30': { '0': 669, '15': 444 }, '31-35': { '0': 689, '15': 451 }, '36-40': { '0': 773, '15': 525 }, '41-45': { '0': 773, '15': 525 }, '46-50': { '0': 876, '15': 605 }, '51-55': { '0': 927, '15': 669 }, '56-60': { '0': 998, '15': 748 }, '61-64': { '0': 1107, '15': 837 }, '65-70': { '0': 1674, '15': 1184 }, '71-75': { '0': 2113, '15': 1481 }, '76-80': { '0': 2318, '15': 1520 }, '81+': { '0': 2422, '15': 1996 } } }
    },
    hdf: {
      label: 'HDF Santé', categories: ['individual'], classes: ['A', 'B', 'SP'], amb: ['none', '100', '85'], cost: 35, bands: hdfBands,
      inHospital: { individual: { '14d-17': { A: 270, B: 214, SP: 165 }, '18-24': { A: 452, B: 308, SP: 256 }, '25-30': { A: 609, B: 396, SP: 336 }, '31-35': { A: 620, B: 459, SP: 354 }, '36-40': { A: 704, B: 497, SP: 406 }, '41-45': { A: 788, B: 536, SP: 406 }, '46-50': { A: 945, B: 648, SP: 553 }, '51-55': { A: 991, B: 679, SP: 578 }, '56-60': { A: 1638, B: 1022, SP: 802 }, '61-64': { A: 2209, B: 1432, SP: 1159 }, '65-70': { A: 2741, B: 1939, SP: 1435 }, '71-75': { A: 3413, B: 2436, SP: 1712 }, '76-80': { A: 4414, B: 3203, SP: 2321 }, '81-99': { A: 5821, B: 4095, SP: 3031 } } },
      ambRates: { individual: { '14d-17': { '100': 123, '85': 81 }, '18-24': { '100': 252, '85': 151 }, '25-30': { '100': 312, '85': 189 }, '31-35': { '100': 312, '85': 196 }, '36-40': { '100': 343, '85': 221 }, '41-45': { '100': 343, '85': 221 }, '46-50': { '100': 378, '85': 231 }, '51-55': { '100': 413, '85': 242 }, '56-60': { '100': 424, '85': 298 }, '61-64': { '100': 501, '85': 322 }, '65-70': { '100': 763, '85': 501 }, '71-75': { '100': 879, '85': 557 }, '76-80': { '100': 893, '85': 606 }, '81-99': { '100': 1050, '85': 812 } } }
    },
    hdfCfe: {
      label: 'HDF Santé Co-CFE', categories: ['individual'], classes: ['A', 'B'], amb: ['none'], cost: 35, bands: hdfBands,
      inHospital: { individual: { '14d-17': { A: 136, B: 129 }, '18-24': { A: 196, B: 186 }, '25-30': { A: 251, B: 239 }, '31-35': { A: 291, B: 277 }, '36-40': { A: 316, B: 300 }, '41-45': { A: 340, B: 323 }, '46-50': { A: 412, B: 391 }, '51-55': { A: 431, B: 409 }, '56-60': { A: 649, B: 616 }, '61-64': { A: 909, B: 864 }, '65-70': { A: 1231, B: 1170 }, '71-75': { A: 1547, B: 1470 }, '76-80': { A: 2034, B: 1933 }, '81-99': { A: 2601, B: 2471 } } },
      ambRates: { individual: {} }
    }
  };

  const ambLabels = { none: 'No ambulatory / in-hospital only', '0': 'Ambulatory Excess 0%', '15': 'Ambulatory Excess 15%', included: 'Ambulatory included in Youth tariff', '100': 'Out-Hospital 100% - limited network', '85': 'Out-Hospital 85% - limited network' };
  const categoryLabels = { individual: 'Individual', family: 'Family rate (3 members and above)' };

  function setupMedical() {
    const plan = qs('#medicalPlan');
    const cat = qs('#medicalCategory');
    const cls = qs('#medicalClass');
    const amb = qs('#medicalAmbulatory');
    if (!plan) return;
    plan.innerHTML = optionMarkup(Object.entries(medicalPlans).map(([value, p]) => ({ value, label: p.label })));
    function refresh() {
      const p = medicalPlans[plan.value];
      cat.innerHTML = optionMarkup(p.categories.map((value) => ({ value, label: categoryLabels[value] })));
      cls.innerHTML = optionMarkup(p.classes.map((value) => ({ value, label: `Class ${value}` })));
      amb.innerHTML = optionMarkup(p.amb.map((value) => ({ value, label: ambLabels[value] || value })));
    }
    plan.addEventListener('change', refresh);
    refresh();
  }

  setupMedical();

  qs('#medicalForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = getForm(form);
    const p = medicalPlans[data.plan];
    const age = num(data.age);
    const band = bandFor(age, p.bands);
    const notes = [];
    if (!band) {
      renderReferral('#medicalResult', 'Medical quote needs review', [['Age', age || 'Not provided']], [{ type: 'warning', text: 'The selected age is outside the supported tariff bands.' }], baseMessage('Medical Insurance', [`Client: ${data.clientName || 'Not provided'}`, `Age: ${age}`, `Plan: ${p.label}`], 0));
      return;
    }

    const inTable = p.inHospital[data.category] || p.inHospital;
    const inHospital = inTable?.[band.key]?.[data.hospitalClass];
    if (inHospital === undefined) {
      renderReferral('#medicalResult', 'Medical quote needs review', [['Plan', p.label], ['Age bracket', band.label]], [{ type: 'warning', text: 'This combination is not available in the selected tariff.' }], baseMessage('Medical Insurance', [`Client: ${data.clientName || 'Not provided'}`, `Age: ${age}`, `Plan: ${p.label}`, `Category: ${categoryLabels[data.category]}`, `Class: ${data.hospitalClass}`], 0));
      return;
    }

    let ambRate = 0;
    if (data.ambulatory !== 'none' && data.ambulatory !== 'included') {
      ambRate = p.ambRates?.[data.category]?.[band.key]?.[data.ambulatory] || 0;
    }
    const cost = p.cost || 0;
    const total = inHospital + ambRate + cost;
    if (age > 64 && !['youth'].includes(data.plan)) notes.push({ type: 'warning', text: 'Maximum first enrollment age is generally 64; older ages may require company approval or continuity.' });
    if (data.plan === 'youth' && (age < 18 || age > 35)) notes.push({ type: 'warning', text: 'Panacea Youth is designed for ages 18 to 35 only.' });
    if (data.medicalCondition && data.medicalCondition.includes('Yes')) notes.push({ type: 'warning', text: 'Declared medical condition requires medical/underwriting review.' });
    if (data.continuity && data.continuity.includes('Yes')) notes.push({ type: 'ok', text: 'Continuity/proof of previous insurance should be attached if available.' });
    notes.push({ text: 'Required documents: signed medical proposal, copy of ID, continuity proof/medical card if available, and additional reports if requested.' });

    const details = [`Client: ${data.clientName || 'Not provided'}`, `Age: ${age}`, `Age bracket: ${band.label}`, `Plan: ${p.label}`, `Category: ${categoryLabels[data.category]}`, `Class: ${data.hospitalClass}`, `Ambulatory: ${ambLabels[data.ambulatory]}`];
    renderResult('#medicalResult', {
      title: `${p.label} estimate`, total,
      rows: [['Age bracket', band.label], ['In-hospital premium', money(inHospital)], ['Ambulatory premium', money(ambRate)], ['Cost of policy', money(cost)], ['Total yearly premium', money(total)]],
      notes,
      whatsappText: baseMessage('Medical Insurance', details, total, notes.map((n) => n.text))
    });
  });

  // Motor
  const motorRates = {
    Platinum: { min: 785, bands: [{ minAge: 0, maxAge: 1, rates: [3.5, 3.2, 2.65, 2.5] }, { minAge: 2, maxAge: 3, rates: [3.6, 3.3, 2.75, 2.6] }, { minAge: 4, maxAge: 5, rates: [3.7, 3.4, 2.9, 2.8] }] },
    Gold: { min: 655, bands: [{ minAge: 0, maxAge: 1, rates: [3.0, 2.75, 2.5, 2.4] }, { minAge: 2, maxAge: 3, rates: [3.15, 2.85, 2.6, 2.5] }, { minAge: 4, maxAge: 6, rates: [3.4, 3.0, 2.75, 2.65] }, { minAge: 7, maxAge: 9, rates: [3.65, 3.5, 3.25, 2.75] }, { minAge: 10, maxAge: 12, rates: [3.85, 3.7, 3.55, 3.25] }] },
    Silver: { min: 580, bands: [{ minAge: 0, maxAge: 1, rates: [2.7, 2.3, 2.1, 2.0] }, { minAge: 2, maxAge: 3, rates: [2.85, 2.4, 2.2, 2.1] }, { minAge: 4, maxAge: 6, rates: [3.0, 2.6, 2.4, 2.25] }, { minAge: 7, maxAge: 9, rates: [3.35, 3.2, 2.95, 2.5] }, { minAge: 10, maxAge: 12, rates: [3.6, 3.4, 3.25, 3.0] }] }
  };
  function valueBracket(value) { if (value < 25000) return 0; if (value < 50000) return 1; if (value < 100000) return 2; return 3; }
  function carAge(year) { return Math.max(0, POLICY_YEAR - year); }
  function motorProductToggles() {
    const product = qs('#motorProduct')?.value;
    qsa('.motor-all-risks').forEach((el) => el.classList.toggle('hidden', product !== 'allRisks'));
    qsa('.motor-tpl-private').forEach((el) => el.classList.toggle('hidden', product !== 'tplPrivate'));
    qsa('.motor-other-tpl').forEach((el) => el.classList.toggle('hidden', product !== 'otherTpl'));
  }
  qs('#motorProduct')?.addEventListener('change', motorProductToggles);
  motorProductToggles();

  function otherTplPremium(type, limit, metric) {
    let bi = 0, md = 0, notes = [], label = '';
    if (type === 'miniVan') { bi = 90; md = limit === '50000' ? 65 : limit === '100000' ? 70 : 0; label = 'Mini Van'; }
    if (type === 'cargoVan') { bi = 90; md = limit === '50000' ? 75 : limit === '100000' ? 80 : 0; label = 'Cargo Van'; }
    if (type === 'pickupTruck') {
      label = 'Private Pickup / Truck';
      if (!metric) notes.push('Total weight is required for accurate truck pricing.');
      if (metric <= 4530) { bi = 90; md = limit === '50000' ? 100 : limit === '100000' ? 110 : 0; }
      else if (metric <= 10000) { bi = 200; md = limit === '50000' ? 165 : limit === '100000' ? 195 : 0; }
      else if (metric < 20000) { bi = 200; md = limit === '50000' ? 240 : limit === '100000' ? 275 : 0; }
      else { notes.push('Truck weight 20,000 kg or above requires underwriting referral.'); bi = 200; }
    }
    if (type === 'motorcycle') { label = 'Motorcycle'; bi = metric < 125 ? 25 : 35; md = limit === '50000' ? 45 : limit === '100000' ? 50 : 0; }
    if (type === 'bus') { label = 'Private Bus / Van / School Bus'; bi = metric <= 11 ? 135 : metric <= 24 ? 200 : 300; md = limit === '50000' ? 90 : limit === '100000' ? 100 : 0; }
    if (type === 'tractor') { label = 'Tractor / Agricultural Equipment'; bi = 100; md = limit === '50000' ? 155 : limit === '100000' ? 185 : 0; notes.push('Subject to prior approval.'); }
    if (type === 'bulldozer') { label = 'Bulldozer / Loader / Excavator'; bi = 100; md = limit === '50000' ? 220 : limit === '100000' ? 245 : 0; notes.push('Subject to prior approval.'); }
    if (type === 'mixer') { label = 'Concrete Mixer / Pump'; bi = 200; md = limit === '50000' ? 220 : limit === '100000' ? 245 : 0; notes.push('Subject to prior approval.'); }
    return { bi, md, total: bi + md, notes, label };
  }

  qs('#motorForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = getForm(form);
    const value = num(data.value);
    const age = carAge(num(data.year));
    const driverAge = num(data.driverAge);
    const notes = [];
    if (driverAge < 21) notes.push({ type: 'warning', text: 'Minimum driver age is 21 years old in the tariff.' });
    if (value >= 150000) notes.push({ type: 'warning', text: 'Vehicles valued at $150,000 or above should be referred for preferential/special rates.' });
    if (data.electricHybrid === 'on') notes.push({ type: 'warning', text: 'Electric/hybrid vehicles have special battery depreciation and fire/charging exclusions.' });

    if (data.product === 'allRisks') {
      const planData = motorRates[data.plan];
      const row = planData.bands.find((b) => age >= b.minAge && age <= b.maxAge);
      if (!row) {
        renderReferral('#motorResult', 'Motor All Risks needs review', [['Vehicle', data.vehicle], ['Car age', `${age} years`], ['Car value', money(value)]], notes, baseMessage('Motor All Risks', [`Client: ${data.clientName || 'Not provided'}`, `Vehicle: ${data.vehicle}`, `Manufacturing year: ${data.year}`, `Car age: ${age}`, `Car value: ${money(value)}`, `Plan: ${data.plan}`], 0, notes.map((n) => n.text)));
        return;
      }
      const rate = row.rates[valueBracket(value)];
      const calculated = value * rate / 100;
      const base = Math.max(calculated, planData.min);
      const compulsory = data.compulsory === 'on' ? 45 : 0;
      const pv = data.politicalViolence === 'on' ? Math.max(value * 0.005, 100) : 0;
      const film = data.film === 'on' ? 400 : 0;
      const vinyl = data.vinyl === 'on' ? Math.max(base * 0.15, 200) : 0;
      if (data.politicalViolence === 'on' && value > 60000) notes.push({ type: 'warning', text: 'Political Violence tariff is up to car value $60,000; higher values require Motor underwriting referral.' });
      if (base === planData.min) notes.push({ text: `Minimum ${data.plan} premium applied: ${money(planData.min)}.` });
      notes.push({ text: 'Photos/inspection are mandatory before binding cover, except for brand new vehicles.' });
      const total = base + compulsory + pv + film + vinyl;
      renderResult('#motorResult', { title: `${data.plan} All Risks estimate`, total, rows: [['Vehicle age', `${age} years`], ['Rate applied', `${rate}%`], ['Calculated premium', money(calculated)], ['Base after minimum check', money(base)], ['Compulsory premium', money(compulsory)], ['Political Violence add-on', money(pv)], ['Film Protection', money(film)], ['Vinyl/Matte Paint loading', money(vinyl)], ['Total', money(total)]], notes, whatsappText: baseMessage('Motor All Risks', [`Client: ${data.clientName || 'Not provided'}`, `Vehicle: ${data.vehicle}`, `Manufacturing year: ${data.year}`, `Car age: ${age}`, `Car value: ${money(value)}`, `Plan: ${data.plan}`, `Rate: ${rate}%`], total, notes.map((n) => n.text)) });
      return;
    }

    if (data.product === 'totalLoss') {
      const base = Math.max(value * 0.015, 215);
      const compulsory = data.compulsory === 'on' ? 45 : 0;
      const total = base + compulsory;
      if (age > 19) notes.push({ type: 'warning', text: 'Total Loss tariff applies to car age 0-19; older vehicles need review.' });
      renderResult('#motorResult', { title: 'Total Loss estimate', total, rows: [['Vehicle age', `${age} years`], ['Rate applied', '1.50%'], ['Base after minimum check', money(base)], ['Compulsory premium', money(compulsory)], ['Total', money(total)]], notes, whatsappText: baseMessage('Motor Total Loss', [`Client: ${data.clientName || 'Not provided'}`, `Vehicle: ${data.vehicle}`, `Manufacturing year: ${data.year}`, `Car age: ${age}`, `Car value: ${money(value)}`], total, notes.map((n) => n.text)) });
      return;
    }

    if (data.product === 'tplPrivate') {
      const mdPremiums = { none: 0, '1': 55, '2': 65, '3': 75 };
      const mdLimits = { none: 'No MMD / Motor Material Damage extension', '1': 'MMD Option 1 - $500,000 annual limit', '2': 'MMD Option 2 - $750,000 annual limit', '3': 'MMD Option 3 - $1,000,000 annual limit' };
      const mdBenefits = { none: 'Bodily Injury only', '1': 'Accident-only road assistance, family medical expenses $2,000, death/PTD $4,000', '2': 'Accident road assistance + 1 mechanical/electrical ride up to 75 km, family medical expenses $2,500, death/PTD $5,000', '3': 'Accident road assistance + 2 mechanical/electrical rides, family medical expenses $5,000, death/PTD $10,000' };
      const bi = 45;
      const md = mdPremiums[data.tplOption];
      const total = bi + md;
      notes.push({ text: 'MMD covers material damages to third parties up to the selected annual limit, including fire/explosion of the insured vehicle up to the same chosen limit.' });
      renderResult('#motorResult', { title: 'Private Car TPL + MMD estimate', total, rows: [['Bodily injury premium', money(bi)], ['MMD / Motor Material Damage option', mdLimits[data.tplOption]], ['MMD premium', money(md)], ['Option benefits', mdBenefits[data.tplOption]], ['Total', money(total)]], notes, whatsappText: baseMessage('Motor TPL + MMD - Private Car', [`Client: ${data.clientName || 'Not provided'}`, `Vehicle: ${data.vehicle}`, `MMD option: ${mdLimits[data.tplOption]}`, `Option benefits: ${mdBenefits[data.tplOption]}`], total, notes.map((n) => n.text)) });
      return;
    }

    if (data.product === 'otherTpl') {
      const other = otherTplPremium(data.otherVehicleType, data.otherMaterialLimit, num(data.otherMetric));
      const raEligible = ['miniVan', 'cargoVan', 'pickupTruck'].includes(data.otherVehicleType);
      const roadAssistance = data.otherRoadAssistance === 'on' && raEligible ? 15 : 0;
      const total = other.total + roadAssistance;
      const allNotes = [...notes, ...other.notes.map((text) => ({ type: text.includes('approval') || text.includes('referral') || text.includes('required') ? 'warning' : '', text }))];
      if (data.otherRoadAssistance === 'on' && !raEligible) allNotes.push({ type: 'warning', text: 'Optional $15 road assistance is listed only for eligible mini vans, cargo vans, and pickup/truck categories in the tariff.' });
      if (roadAssistance) allNotes.push({ text: 'Optional Road Assistance added: accident rides with unlimited km and 1 mechanical/electrical failure ride up to 35 km, including crane service, for eligible vehicles.' });
      renderResult('#motorResult', { title: `${other.label} TPL + MMD estimate`, total, rows: [['Category', other.label], ['Bodily injury premium', money(other.bi)], ['MMD / Motor Material Damage limit', data.otherMaterialLimit === 'none' ? 'No MMD extension' : money(data.otherMaterialLimit)], ['MMD premium', money(other.md)], ['Optional road assistance', money(roadAssistance)], ['Total', money(total)]], notes: allNotes, whatsappText: baseMessage('Motor TPL + MMD - Other Vehicle', [`Client: ${data.clientName || 'Not provided'}`, `Vehicle: ${data.vehicle}`, `Category: ${other.label}`, `Metric: ${data.otherMetric || 'Not provided'}`, `MMD limit: ${data.otherMaterialLimit}`, `Optional road assistance: ${roadAssistance ? 'Yes' : 'No'}`], total, allNotes.map((n) => n.text)) });
    }
  });

  // Travel
  const travelOutbound = {
    wwExUSCanada: {
      Silver: { 7: 18, 15: 22, 31: 35, 45: 40, 92: 55, 180: 105, 365: 155 },
      Gold: { 7: 24, 15: 30, 31: 38, 45: 46, 92: 60, 180: 140, 365: 200 },
      GoldPlus: { 7: 28, 15: 40, 31: 65, 45: 75, 92: 90, 180: 150, 365: 300 },
      Platinum: { 7: 32, 15: 45, 31: 75, 45: 85, 92: 100, 180: 210, 365: 330 }
    },
    worldwide: {
      Silver: { 7: 25, 15: 33, 31: 65, 45: 70, 92: 75, 180: 140, 365: 300 },
      Gold: { 7: 32, 15: 44, 31: 70, 45: 75, 92: 95, 180: 165, 365: 320 },
      GoldPlus: { 7: 35, 15: 50, 31: 75, 45: 80, 92: 110, 180: 220, 365: 340 },
      Platinum: { 7: 37, 15: 54, 31: 90, 45: 95, 92: 120, 180: 256, 365: 430 }
    }
  };
  const inbound = { '100000': { 7: 32, 10: 50, 15: 55, 21: 68, 31: 75, 62: 80, 92: 82 }, '50000': { 7: 25, 10: 30, 15: 45, 21: 48, 31: 50, 62: 52, 92: 55 } };
  function setupTravel() {
    const type = qs('#travelType'); const duration = qs('#travelDuration'); const plan = qs('#travelPlan');
    if (!type) return;
    function refresh() {
      const isOut = type.value === 'outbound';
      qsa('.outbound-only').forEach((el) => el.classList.toggle('hidden', !isOut));
      duration.innerHTML = isOut ? optionMarkup([7, 15, 31, 45, 92, 180, 365].map((d) => ({ value: d, label: d === 365 ? 'Up to 1 year (max. 92 days/trip)' : `Up to ${d} days` }))) : optionMarkup([7, 10, 15, 21, 31, 62, 92].map((d) => ({ value: d, label: `${d} days` })));
      plan.innerHTML = isOut ? optionMarkup([{ value: 'Silver', label: 'Silver - up to $50,000' }, { value: 'Gold', label: 'Gold - up to $100,000' }, { value: 'GoldPlus', label: 'Gold Plus - up to $300,000' }, { value: 'Platinum', label: 'Platinum - up to $500,000' }]) : optionMarkup([{ value: '100000', label: 'Limit $100,000' }, { value: '50000', label: 'Limit $50,000' }]);
    }
    type.addEventListener('change', refresh); refresh();
  }
  setupTravel();

  qs('#travelForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget; const data = getForm(form);
    const age = num(data.age); const travellers = Math.max(1, num(data.travellers)); const duration = Number(data.duration);
    const notes = [];
    let base = 0; let ageLoading = 0; let sportsLoading = 0; let discount = 0; let total = 0; let productLabel = '';
    if (data.type === 'outbound') {
      base = travelOutbound[data.scope][data.plan][duration];
      productLabel = `Travel Outbound ${selectedText(qs('#travelPlan'))}`;
      let perPerson = base;
      if (age >= 76 && age <= 86) { ageLoading = perPerson * 0.75; perPerson += ageLoading; notes.push({ type: 'warning', text: 'Ages 76 to 86: 75% premium increase applies and COVID-19 is not covered.' }); }
      if (age > 86) notes.push({ type: 'warning', text: 'Age above 86 requires company review.' });
      if (data.sports === 'on') { sportsLoading = perPerson * 0.50; perPerson += sportsLoading; notes.push({ text: 'Sports activities loading of 50% applied.' }); }
      let subtotal = perPerson * travellers;
      let discRate = travellers >= 41 ? 0.35 : travellers >= 31 ? 0.25 : travellers >= 21 ? 0.15 : travellers >= 11 ? 0.05 : 0;
      discount = subtotal * discRate;
      total = subtotal - discount;
      if (discRate) notes.push({ type: 'ok', text: `Group discount applied: ${Math.round(discRate * 100)}%.` });
      notes.push({ text: 'Maximum allowed stay outside the country of residence is 92 consecutive days per trip.' });
    } else {
      base = inbound[data.plan][duration];
      productLabel = `Travel Inbound ${selectedText(qs('#travelPlan'))}`;
      total = base * travellers;
      if (age > 75) notes.push({ type: 'warning', text: 'Travel In tariff is up to age 75. Older ages require review.' });
      notes.push({ text: 'Travel In covers individuals coming to Lebanon and should be issued prior to travel.' });
    }
    renderResult('#travelResult', { title: `${productLabel} estimate`, total, rows: [['Base premium per person', money(base)], ['Age loading', money(ageLoading)], ['Sports loading', money(sportsLoading)], ['Travellers', travellers], ['Group discount', `-${money(discount)}`], ['Total premium', money(total)]], notes, whatsappText: baseMessage('Travel Insurance', [`Client/group: ${data.clientName || 'Not provided'}`, `Type: ${data.type}`, `Age: ${age}`, `Travellers: ${travellers}`, `Duration: ${selectedText(qs('#travelDuration'))}`, `Plan: ${selectedText(qs('#travelPlan'))}`, `Destination: ${data.destination || 'Not provided'}`], total, notes.map((n) => n.text)) });
  });

  // School
  qs('#schoolForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getForm(e.currentTarget); const persons = num(data.students) + num(data.teachers); const rate = data.option === '1' ? 4 : 7; const calc = persons * rate; const total = Math.max(calc, 500);
    const notes = [];
    if (total === 500) notes.push({ text: 'Minimum annual premium of $500 applied.' });
    notes.push({ text: 'Required documents: list of students, list of teachers, and any additional document requested case-by-case.' });
    const limits = data.option === '1' ? 'Death/PTD $25,000, Medical Expenses $3,000, Aggregate $150,000' : 'Death/PTD $35,000, Medical Expenses $5,000, Aggregate $250,000';
    renderResult('#schoolResult', { title: 'School Liability estimate', total, rows: [['Students', data.students], ['Teachers', data.teachers], ['Total insured persons', persons], ['Rate per person', money(rate)], ['Calculated premium', money(calc)], ['Limits', limits], ['Total after minimum check', money(total)]], notes, whatsappText: baseMessage('School Liability', [`School/camp: ${data.schoolName || 'Not provided'}`, `Students: ${data.students}`, `Teachers: ${data.teachers}`, `Option: ${data.option}`, `Limits: ${limits}`], total, notes.map((n) => n.text)) });
  });

  // Site works
  function setupSite() {
    const duration = qs('#siteDuration'); const workType = qs('#siteWorkType');
    if (!duration) return;
    duration.innerHTML = optionMarkup(Array.from({ length: 24 }, (_, i) => i + 1).map((m) => ({ value: m, label: `${m} month${m > 1 ? 's' : ''}` })));
    function refresh() { qsa('.building-only').forEach((el) => el.classList.toggle('hidden', workType.value !== 'renovationBuilding')); }
    workType.addEventListener('change', refresh); refresh();
  }
  setupSite();

  function standardRenovation(area, duration, loc) {
    let areaBase = area <= 200 ? 0 : area <= 350 ? 50 : area <= 500 ? 100 : null;
    if (areaBase === null) return null;
    const ext = loc === 'internalExternal';
    const wcaStart = ext ? 350 : 250;
    const wca = wcaStart + areaBase + 25 * (duration - 1);
    let liab = 0;
    if (!ext) liab = duration <= 3 ? 100 : duration <= 6 ? 125 : duration <= 9 ? 150 : 200;
    else liab = duration <= 3 ? 125 : duration <= 6 ? 150 : duration <= 9 ? 175 : 250;
    return { wca, liab };
  }
  function buildingRenovation(duration, loc, floors) {
    if (floors === 'above10') return null;
    const f = Number(floors);
    const ext = loc === 'internalExternal';
    const wStartInternal = f === 3 ? 450 : f === 6 ? 475 : 500;
    const wStartExternal = f === 3 ? 550 : f === 6 ? 575 : 600;
    const wca = (ext ? wStartExternal : wStartInternal) + 25 * (duration - 1);
    let liab;
    if (!ext) liab = duration <= 3 ? 150 : duration <= 6 ? 175 : duration <= 9 ? 200 : 300;
    else {
      const d = duration <= 3 ? 0 : duration <= 6 ? 1 : duration <= 9 ? 2 : 3;
      const tables = { 3: [200, 225, 250, 300], 6: [225, 250, 275, 350], 10: [250, 275, 300, 400] };
      liab = tables[f][d];
    }
    return { wca, liab };
  }
  function constructionWorks(area, duration) {
    if (area <= 500) {
      if (duration > 12) return null;
      const wca = 450 + 25 * (duration - 1);
      const liab = duration <= 3 ? 150 : duration <= 6 ? 200 : duration <= 9 ? 225 : 250;
      return { wca, liab };
    }
    if (area > 2500) return null;
    const brackets = [{ d: 6, r: .75, l: 250 }, { d: 9, r: .85, l: 300 }, { d: 12, r: .90, l: 300 }, { d: 15, r: 1.10, l: 400 }, { d: 18, r: 1.15, l: 400 }, { d: 24, r: 1.35, l: 500 }];
    const b = brackets.find((x) => duration <= x.d) || brackets[brackets.length - 1];
    return { wca: Math.max(area * b.r, 700), liab: b.l, bracket: `${b.d} months / ${money(b.r)} per sqm` };
  }

  qs('#siteForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getForm(e.currentTarget); const area = num(data.area); const duration = num(data.duration); const notes = [];
    let result = null; let title = 'Site Works estimate';
    if (data.workType === 'renovationStandard') { result = standardRenovation(area, duration, data.locationType); title = 'Standard Renovation estimate'; if (area > 500) notes.push({ type: 'warning', text: 'Area above 500 sqm must be referred to underwriting.' }); }
    if (data.workType === 'renovationBuilding') { result = buildingRenovation(duration, data.locationType, data.floors); title = 'Building Renovation estimate'; if (data.floors === 'above10') notes.push({ type: 'warning', text: 'Building above 10 floors must be referred to underwriting.' }); }
    if (data.workType === 'construction') { result = constructionWorks(area, duration); title = 'Construction / Finishing Works estimate'; if (!result) notes.push({ type: 'warning', text: 'This construction duration/area combination requires underwriting review.' }); }
    if (!result) {
      renderReferral('#siteResult', 'Site works quote needs review', [['Project', data.project || 'Not provided'], ['Area', `${area} sqm`], ['Duration', `${duration} months`]], notes, baseMessage('Site Works / Renovation', [`Applicant: ${data.clientName || 'Not provided'}`, `Project: ${data.project || 'Not provided'}`, `Work type: ${data.workType}`, `Area: ${area} sqm`, `Duration: ${duration} months`], 0, notes.map((n) => n.text)));
      return;
    }
    let subtotal = result.wca + result.liab; let swing = 0;
    if (data.swing === 'on') { swing = subtotal * 0.20; notes.push({ text: 'Swing use additional premium of 20% applied.' }); }
    if (data.scaffolding === 'on') notes.push({ text: 'Scaffolding declared; attach works details and photos where required.' });
    notes.push({ text: 'License of works showing area in sqm is mandatory.' });
    const total = subtotal + swing;
    renderResult('#siteResult', { title, total, rows: [['Area', `${area} sqm`], ['Duration', `${duration} months`], ['Workmen Compensation premium', money(result.wca)], ['Third Party Liability premium', money(result.liab)], ['Applied construction bracket', result.bracket || 'Standard table'], ['Swing loading', money(swing)], ['Total premium', money(total)]], notes, whatsappText: baseMessage('Site Works / Renovation', [`Applicant: ${data.clientName || 'Not provided'}`, `Project: ${data.project || 'Not provided'}`, `Work type: ${selectedText(qs('#siteWorkType'))}`, `Area: ${area} sqm`, `Duration: ${duration} months`, `Location type: ${data.locationType}`], total, notes.map((n) => n.text)) });
  });

  // Expat
  function expatToggles() {
    const isStandard = qs('#expatPlan')?.value === 'standard';
    qsa('.standard-only').forEach((el) => el.classList.toggle('hidden', !isStandard));
  }
  qs('#expatPlan')?.addEventListener('change', expatToggles); expatToggles();
  qs('#expatForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getForm(e.currentTarget); const notes = []; let base = 0;
    if (data.plan === 'standard') {
      const rates = { female: { limited: 70, full: 110 }, male: { limited: 95, full: 145 } };
      base = rates[data.gender][data.network];
    } else base = 175;
    const rider = data.rider === 'on' ? 40 : 0;
    if (num(data.age) > 57) notes.push({ type: 'warning', text: 'Age above 57 requires referral to LIA Assurex.' });
    notes.push({ text: 'Required information: copy of expat passport plus full name and ID of sponsor.' });
    const total = base + rider;
    renderResult('#expatResult', { title: 'Expat Insurance estimate', total, rows: [['Plan', selectedText(qs('#expatPlan'))], ['Gender', data.gender], ['Network', data.plan === 'standard' ? data.network : 'Full Network'], ['Base premium', money(base)], ['Outpatient rider', money(rider)], ['Total premium', money(total)]], notes, whatsappText: baseMessage('Expat Insurance', [`Client: ${data.clientName || 'Not provided'}`, `Age: ${data.age}`, `Gender: ${data.gender}`, `Plan: ${selectedText(qs('#expatPlan'))}`, `Network: ${data.plan === 'standard' ? data.network : 'Full Network'}`, `Outpatient rider: ${data.rider === 'on' ? 'Yes' : 'No'}`], total, notes.map((n) => n.text)) });
  });

  // Lift
  const liftOptions = [
    { any: '$10,000', agg: '$60,000', premium: 60 },
    { any: '$20,000', agg: '$100,000', premium: 100 },
    { any: '$25,000', agg: '$100,000', premium: 125 },
    { any: '$50,000', agg: '$100,000', premium: 150 },
    { any: '$30,000', agg: '$150,000', premium: 250 }
  ];
  qs('#liftForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getForm(e.currentTarget); const option = liftOptions[Number(data.option)]; const lifts = Math.max(1, num(data.lifts)); const total = option.premium * lifts;
    const notes = [{ text: 'Attach lift/building details if requested before issuance.' }];
    renderResult('#liftResult', { title: 'Lift Liability estimate', total, rows: [['Number of lifts', lifts], ['Bodily injury any one claim', option.any], ['Aggregate limit', option.agg], ['Premium per lift', money(option.premium)], ['Total premium', money(total)]], notes, whatsappText: baseMessage('Lift Liability', [`Client/building: ${data.clientName || 'Not provided'}`, `Number of lifts: ${lifts}`, `Any one claim limit: ${option.any}`, `Aggregate limit: ${option.agg}`], total, notes.map((n) => n.text)) });
  });
})();
