/* =========================================================
   SwiftLoan.ai — unit tests for js/core.js
   Run: node tests/unit.test.js   (no dependencies)
   ========================================================= */
const C = require('../js/core.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) { cond ? pass++ : (fail++, fails.push(msg)); }
function eq(actual, expected, msg) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
     `${msg}\n     expected ${JSON.stringify(expected)}\n     got      ${JSON.stringify(actual)}`);
}
function near(actual, expected, tol, msg) {
  ok(Math.abs(actual - expected) <= tol, `${msg} (expected ~${expected}, got ${actual})`);
}
function group(name) { console.log('\n• ' + name); }

/* ---------- fmtINR ---------- */
group('fmtINR — Indian currency grouping');
eq(C.fmtINR(500000), '₹5,00,000', 'fmtINR lakh grouping');
eq(C.fmtINR(1500000), '₹15,00,000', 'fmtINR 15 lakh');
eq(C.fmtINR(0), '₹0', 'fmtINR zero');
eq(C.fmtINR(NaN), '₹0', 'fmtINR NaN → ₹0');
eq(C.fmtINR(16488.7), '₹16,489', 'fmtINR rounds');

/* ---------- emi ---------- */
group('emi — amortised monthly instalment');
near(C.emi(500000, 11.5, 36), 16489, 2, 'emi 5L @11.5% / 36mo ≈ 16,489');
near(C.emi(7500000, 11.5, 36), 247320, 50, 'emi 75L @11.5% / 36mo ≈ 2,47,320');
eq(C.emi(120000, 0, 12), 10000, 'emi 0% interest = P/n');
eq(C.emi(0, 11, 12), 0, 'emi zero principal → 0');
eq(C.emi(500000, 11, 0), 0, 'emi zero tenure → 0 (no divide-by-zero)');

/* ---------- emiBreakdown ---------- */
group('emiBreakdown — totals & ratio');
const bd = C.emiBreakdown(500000, 11.5, 36);
near(bd.total, bd.emi * 36, 0.001, 'total = emi × months');
near(bd.interest, bd.total - 500000, 0.001, 'interest = total − principal');
ok(bd.principalRatio > 0 && bd.principalRatio < 1, 'principalRatio in (0,1)');
eq(C.emiBreakdown(0, 11, 12).principalRatio, 0, 'ratio 0 when total 0');

/* ---------- amountBounds ---------- */
group('amountBounds — per product (scalability)');
eq(C.amountBounds('Personal Loan'), { min: 50000, max: 2500000 }, 'personal bounds');
eq(C.amountBounds('Business Loan'), { min: 100000, max: 7500000 }, 'business bounds');
eq(C.amountBounds('anything else'), { min: 50000, max: 7500000 }, 'default bounds');

/* ---------- validateField ---------- */
group('validateField — loanType');
eq(C.validateField('loanType', ''), 'Please select a loan type.', 'empty type errors');
eq(C.validateField('loanType', 'Personal Loan'), '', 'valid type ok');

group('validateField — loanAmount (context-aware)');
eq(C.validateField('loanAmount', ''), 'Enter an amount.', 'empty amount');
eq(C.validateField('loanAmount', 'abc'), 'Enter a valid amount.', 'non-numeric amount');
ok(C.validateField('loanAmount', '40000', { loanType: 'Personal Loan' }).startsWith('Minimum'), 'personal below min');
eq(C.validateField('loanAmount', '50000', { loanType: 'Personal Loan' }), '', 'personal at min ok');
ok(C.validateField('loanAmount', '3000000', { loanType: 'Personal Loan' }).startsWith('Maximum'), 'personal above max (25L)');
ok(C.validateField('loanAmount', '80000', { loanType: 'Business Loan' }).startsWith('Minimum'), 'business below 1L min');
eq(C.validateField('loanAmount', '100000', { loanType: 'Business Loan' }), '', 'business at 1L min ok');
ok(C.validateField('loanAmount', '8000000', { loanType: 'Business Loan' }).startsWith('Maximum'), 'business above 75L max');

group('validateField — name / phone / email');
eq(C.validateField('fullName', 'ab'), 'Enter your full name.', 'name too short');
eq(C.validateField('fullName', 'Ravi Kumar'), '', 'name ok');
eq(C.validateField('phone', '12345'), 'Enter a valid 10-digit mobile number.', 'short phone');
eq(C.validateField('phone', '5876543210'), 'Enter a valid 10-digit mobile number.', 'phone not starting 6-9');
eq(C.validateField('phone', '9876543210'), '', 'valid phone');
eq(C.validateField('email', 'nope'), 'Enter a valid email address.', 'bad email');
eq(C.validateField('email', 'user@swiftloan.ai'), '', 'valid email');
eq(C.validateField('unknownField', 'x'), '', 'unknown field → no error');

/* ---------- tracker lookup ---------- */
group('normaliseId / lookupApp');
eq(C.normaliseId('  sl-2048 '), 'SL-2048', 'trims + uppercases');
const apps = { 'SL-2048': { type: 'Personal Loan' } };
eq(C.lookupApp(' sl-2048 ', apps).app.type, 'Personal Loan', 'found (case/space-insensitive)');
eq(C.lookupApp('SL-9999', apps).app, null, 'unknown id → null');
eq(C.lookupApp('', apps).key, '', 'empty id key is empty');

/* ---------- makeRefId ---------- */
group('makeRefId — deterministic with rng');
eq(C.makeRefId(() => 0), 'SL-1000', 'rng 0 → SL-1000');
eq(C.makeRefId(() => 0.99999), 'SL-9999', 'rng ~1 → SL-9999');
ok(/^SL-\d{4}$/.test(C.makeRefId()), 'default rng → SL-#### format');

/* ---------- i18n parity ---------- */
group('i18n — EN/HI dictionary parity');
require('../js/i18n.js');
const I = globalThis.SLI18N;
ok(I && I.en && I.hi, 'SLI18N dictionary present');
const enKeys = Object.keys(I.en), hiKeys = Object.keys(I.hi);
eq(enKeys.filter(k => !(k in I.hi)), [], 'every EN key has an HI translation');
eq(hiKeys.filter(k => !(k in I.en)), [], 'no orphan HI keys');
ok(enKeys.length >= 60, 'dictionary covers 60+ strings (' + enKeys.length + ')');
ok(enKeys.every(k => I.hi[k] && I.hi[k].trim().length > 0), 'no empty HI values');

/* ---------- report ---------- */
console.log('\n' + '─'.repeat(48));
if (fail === 0) {
  console.log(`✓ ALL ${pass} ASSERTIONS PASSED`);
  process.exit(0);
} else {
  console.log(`✗ ${fail} FAILED, ${pass} passed`);
  fails.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
