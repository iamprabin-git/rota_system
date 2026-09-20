import type {
  DayHours,
  Employee,
  NiCategory,
  PayFrequency,
  Payslip,
  PayslipCalculation,
  PayslipInput,
  PayslipLine,
  StudentLoanPlan,
  TaxRegion,
} from "./types";
import { WEEKDAYS } from "./types";

/** Tax year 2026/27 — HMRC rates from 6 April 2026 to 5 April 2027. */
export const TAX_YEAR_LABEL = "2026/27";

export const PERSONAL_ALLOWANCE = 12_570;
export const PA_TAPER_START = 100_000;
export const ADDITIONAL_RATE_THRESHOLD = 125_140;

export const RUK_BASIC_LIMIT = 50_270;
export const RUK_RATES = { basic: 0.2, higher: 0.4, additional: 0.45 };

export const SCOTTISH_BANDS = [
  { upTo: 16_537, rate: 0.19 },
  { upTo: 29_526, rate: 0.2 },
  { upTo: 43_662, rate: 0.21 },
  { upTo: 75_000, rate: 0.42 },
  { upTo: 125_140, rate: 0.45 },
  { upTo: Infinity, rate: 0.48 },
] as const;

export const PERIODS: Record<
  PayFrequency,
  {
    count: number;
    label: string;
    pa: number;
    pt: number;
    uel: number;
    lel: number;
    st: number;
    qeLower: number;
    qeUpper: number;
    student: Record<Exclude<StudentLoanPlan, "none"> | "pg", number>;
  }
> = {
  weekly: {
    count: 52,
    label: "Weekly",
    pa: 242,
    pt: 242,
    uel: 967,
    lel: 129,
    st: 96,
    qeLower: 120,
    qeUpper: 967,
    student: { plan1: 517.3, plan2: 565.09, plan4: 649.9, plan5: 480.76, pg: 403.84 },
  },
  fortnightly: {
    count: 26,
    label: "Fortnightly",
    pa: 484,
    pt: 484,
    uel: 1934,
    lel: 258,
    st: 192,
    qeLower: 240,
    qeUpper: 1934,
    student: { plan1: 1034.61, plan2: 1130.19, plan4: 1299.8, plan5: 961.53, pg: 807.69 },
  },
  fourweekly: {
    count: 13,
    label: "4-weekly",
    pa: 967,
    pt: 967,
    uel: 3867,
    lel: 516,
    st: 384,
    qeLower: 480,
    qeUpper: 3867,
    student: { plan1: 2069.23, plan2: 2260.38, plan4: 2599.61, plan5: 1923.07, pg: 1615.38 },
  },
  monthly: {
    count: 12,
    label: "Monthly",
    pa: 1048,
    pt: 1048,
    uel: 4189,
    lel: 559,
    st: 417,
    qeLower: 520,
    qeUpper: 4189,
    student: { plan1: 2241.66, plan2: 2448.75, plan4: 2816.25, plan5: 2083.33, pg: 1750 },
  },
};

export const NLW = {
  age21: 12.71,
  age18to20: 10.85,
  under18: 8.0,
  apprentice: 8.0,
};

const NI_PRIMARY: Record<NiCategory, { mid: number; upper: number }> = {
  A: { mid: 0.08, upper: 0.02 },
  B: { mid: 0.0185, upper: 0.02 },
  C: { mid: 0, upper: 0 },
  H: { mid: 0.08, upper: 0.02 },
  J: { mid: 0.02, upper: 0.02 },
  M: { mid: 0.08, upper: 0.02 },
  V: { mid: 0.08, upper: 0.02 },
  Z: { mid: 0.02, upper: 0.02 },
};

export function roundPence(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumHours(days: DayHours): number {
  return roundPence(WEEKDAYS.reduce((sum, day) => sum + (Number(days[day]) || 0), 0));
}

export function emptyDays(): DayHours {
  return { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
}

export function parseTaxCode(raw: string) {
  const original = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const week1 = /\bW1\b|\bM1\b|\bX\b/.test(original);
  const cleaned = original.replace(/\bW1\b|\bM1\b|\bX\b/g, "").trim();

  let region: "ruk" | "scotland" | "wales" = "ruk";
  let body = cleaned;
  if (body.startsWith("S")) {
    region = "scotland";
    body = body.slice(1);
  } else if (body.startsWith("C")) {
    region = "wales";
    body = body.slice(1);
  }

  if (body === "NT") {
    return { region, allowance: 0, kCode: false, flatRate: 0, noTax: true, week1, label: original };
  }
  if (body === "BR") {
    return { region, allowance: 0, kCode: false, flatRate: 0.2, noTax: false, week1, label: original };
  }
  if (body === "D0") {
    return {
      region,
      allowance: 0,
      kCode: false,
      flatRate: region === "scotland" ? 0.42 : 0.4,
      noTax: false,
      week1,
      label: original,
    };
  }
  if (body === "D1") {
    return {
      region,
      allowance: 0,
      kCode: false,
      flatRate: region === "scotland" ? 0.45 : 0.45,
      noTax: false,
      week1,
      label: original,
    };
  }
  if (body === "0T") {
    return { region, allowance: 0, kCode: false, flatRate: null, noTax: false, week1, label: original };
  }

  const kCode = body.startsWith("K");
  const numeric = (kCode ? body.slice(1) : body).replace(/[A-Z]/g, "");
  const digits = Number.parseInt(numeric, 10);
  const allowance = Number.isFinite(digits) ? digits * 10 : PERSONAL_ALLOWANCE;

  return {
    region,
    allowance,
    kCode,
    flatRate: null as number | null,
    noTax: false,
    week1,
    label: original,
  };
}

export function taperPersonalAllowance(allowance: number, annualIncome: number): number {
  if (annualIncome <= PA_TAPER_START) return allowance;
  const reduction = Math.floor((annualIncome - PA_TAPER_START) / 2);
  return Math.max(0, allowance - reduction);
}

function taxOnIncome(annualIncome: number, region: TaxRegion | "ruk" | "scotland" | "wales", pa: number): number {
  if (annualIncome <= 0) return 0;
  const tapered = taperPersonalAllowance(pa, annualIncome);
  const taxable = Math.max(0, annualIncome - tapered);

  const scottish = region === "scotland";
  if (!scottish) {
    const basicWidth = Math.max(0, RUK_BASIC_LIMIT - tapered);
    const higherWidth = Math.max(0, ADDITIONAL_RATE_THRESHOLD - tapered - basicWidth);
    const basic = Math.min(taxable, basicWidth);
    const higher = Math.min(Math.max(0, taxable - basicWidth), higherWidth);
    const additional = Math.max(0, taxable - basicWidth - higherWidth);
    return (
      basic * RUK_RATES.basic +
      higher * RUK_RATES.higher +
      additional * RUK_RATES.additional
    );
  }

  let tax = 0;
  let remaining = taxable;
  let previousTaxableThreshold = 0;
  for (const band of SCOTTISH_BANDS) {
    const taxableTop = Math.max(0, band.upTo - tapered);
    const width = Math.max(0, taxableTop - previousTaxableThreshold);
    const slice = Math.min(remaining, width);
    tax += slice * band.rate;
    remaining -= slice;
    previousTaxableThreshold = taxableTop;
    if (remaining <= 0) break;
  }
  return tax;
}

function periodIncomeTax(opts: {
  periodTaxableGross: number;
  frequency: PayFrequency;
  taxCode: string;
  taxRegion: TaxRegion;
  week1: boolean;
  taxPeriod: number;
  ytdTaxableGross: number;
  ytdTaxPaid: number;
}): number {
  const parsed = parseTaxCode(opts.taxCode);
  const region =
    parsed.region === "scotland" || opts.taxRegion === "scotland"
      ? "scotland"
      : parsed.region === "wales"
        ? "wales"
        : opts.taxRegion;
  const freq = PERIODS[opts.frequency];
  const methodWeek1 = opts.week1 || parsed.week1;

  if (parsed.noTax) return 0;

  const periodNumber = methodWeek1 ? 1 : Math.min(freq.count, Math.max(1, opts.taxPeriod));
  const grossToDate = methodWeek1
    ? opts.periodTaxableGross
    : opts.ytdTaxableGross + opts.periodTaxableGross;

  const estimatedAnnual = (grossToDate / periodNumber) * freq.count;

  if (parsed.flatRate !== null) {
    const taxToDate = grossToDate * parsed.flatRate;
    const due = methodWeek1 ? taxToDate : taxToDate - opts.ytdTaxPaid;
    return Math.max(0, roundPence(due));
  }

  let pa = parsed.kCode ? 0 : parsed.allowance;
  if (parsed.kCode) {
    const kAddition = (parsed.allowance / freq.count) * periodNumber;
    const incomeToDate = grossToDate + kAddition;
    const annualised = (incomeToDate / periodNumber) * freq.count;
    const taxToDate = taxOnIncome(annualised, region, 0) * (periodNumber / freq.count);
    const due = methodWeek1 ? taxToDate : taxToDate - opts.ytdTaxPaid;
    return Math.max(0, roundPence(due));
  }

  pa = taperPersonalAllowance(pa, estimatedAnnual);
  const annualisedPay = (grossToDate / periodNumber) * freq.count;
  const annualTax = taxOnIncome(annualisedPay, region, pa);
  const taxToDate = annualTax * (periodNumber / freq.count);
  const due = methodWeek1 ? taxToDate : taxToDate - opts.ytdTaxPaid;
  return Math.max(0, roundPence(due));
}

function employeeNI(gross: number, frequency: PayFrequency, category: NiCategory): number {
  const { pt, uel } = PERIODS[frequency];
  const rates = NI_PRIMARY[category];
  const mid = Math.max(0, Math.min(gross, uel) - pt);
  const upper = Math.max(0, gross - uel);
  return roundPence(mid * rates.mid + upper * rates.upper);
}

function employerNI(gross: number, frequency: PayFrequency, category: NiCategory): number {
  const { st, uel } = PERIODS[frequency];
  if (category === "C") {
    return roundPence(Math.max(0, gross - st) * 0.15);
  }
  if (category === "M" || category === "H" || category === "V") {
    return roundPence(Math.max(0, gross - uel) * 0.15);
  }
  return roundPence(Math.max(0, gross - st) * 0.15);
}

function studentLoanDeduction(gross: number, frequency: PayFrequency, plan: StudentLoanPlan): number {
  if (plan === "none") return 0;
  const threshold = PERIODS[frequency].student[plan];
  if (gross <= threshold) return 0;
  return Math.floor((gross - threshold) * 0.09);
}

function postgraduateLoanDeduction(gross: number, frequency: PayFrequency, enabled: boolean): number {
  if (!enabled) return 0;
  const threshold = PERIODS[frequency].student.pg;
  if (gross <= threshold) return 0;
  return Math.floor((gross - threshold) * 0.06);
}

function pensionContribution(gross: number, frequency: PayFrequency, percent: number, basis: Employee["pensionBasis"]): number {
  if (percent <= 0) return 0;
  const { qeLower, qeUpper } = PERIODS[frequency];
  const pensionable =
    basis === "pensionable" ? gross : Math.max(0, Math.min(gross, qeUpper) - qeLower);
  return roundPence(pensionable * (percent / 100));
}

export function ageOn(dateOfBirth: string, onDate: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const on = new Date(onDate);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(on.getTime())) return null;
  let age = on.getFullYear() - dob.getFullYear();
  const month = on.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && on.getDate() < dob.getDate())) age -= 1;
  return age;
}

function nlwWarning(employee: Employee, hourlyRate: number, paymentDate: string): string | null {
  const age = ageOn(employee.dateOfBirth, paymentDate);
  if (age === null) {
    if (hourlyRate < NLW.age21) {
      return `Hourly rate is below the National Living Wage of £${NLW.age21.toFixed(2)} (age 21+ from April 2026).`;
    }
    return null;
  }
  const floor = age >= 21 ? NLW.age21 : age >= 18 ? NLW.age18to20 : NLW.under18;
  if (hourlyRate + 1e-9 < floor) {
    return `Hourly rate is below the ${age >= 21 ? "National Living Wage" : "National Minimum Wage"} of £${floor.toFixed(2)} for this age.`;
  }
  return null;
}

export function taxYearFor(dateIso: string): { start: Date; end: Date; label: string } {
  const date = new Date(dateIso);
  const year = date.getFullYear();
  const startsThisCalendar =
    date.getMonth() > 3 || (date.getMonth() === 3 && date.getDate() >= 6);
  const startYear = startsThisCalendar ? year : year - 1;
  return {
    start: new Date(startYear, 3, 6),
    end: new Date(startYear + 1, 3, 5),
    label: `${startYear}/${String(startYear + 1).slice(-2)}`,
  };
}

export function taxPeriodFor(paymentDate: string, frequency: PayFrequency): number {
  const { start } = taxYearFor(paymentDate);
  const pay = new Date(paymentDate);
  if (frequency === "monthly") {
    const months =
      (pay.getFullYear() - start.getFullYear()) * 12 + (pay.getMonth() - start.getMonth()) + 1;
    return Math.min(12, Math.max(1, months));
  }
  const ms = pay.getTime() - start.getTime();
  const days = Math.floor(ms / 86_400_000);
  const weeks = Math.floor(days / 7) + 1;
  const max = PERIODS[frequency].count;
  const divisor = frequency === "weekly" ? 1 : frequency === "fortnightly" ? 2 : 4;
  return Math.min(max, Math.max(1, Math.ceil(weeks / divisor)));
}

export function ytdFromPayslips(payslips: Payslip[], employeeId: string, paymentDate: string) {
  const { start, end } = taxYearFor(paymentDate);
  const inYear = payslips.filter((slip) => {
    if (slip.employeeId !== employeeId) return false;
    const paid = new Date(slip.paymentDate);
    return paid >= start && paid <= end && paid < new Date(paymentDate);
  });
  return inYear.reduce(
    (acc, slip) => ({
      gross: roundPence(acc.gross + slip.calculation.grossPay),
      tax: roundPence(acc.tax + slip.calculation.payeTax),
      ni: roundPence(acc.ni + slip.calculation.employeeNI),
      pension: roundPence(acc.pension + slip.calculation.employeePension),
      studentLoan: roundPence(
        acc.studentLoan + slip.calculation.studentLoan + slip.calculation.postgraduateLoan,
      ),
      net: roundPence(acc.net + slip.calculation.netPay),
      taxableGross: roundPence(
        acc.taxableGross + slip.calculation.grossPay - slip.calculation.employeePension,
      ),
    }),
    { gross: 0, tax: 0, ni: 0, pension: 0, studentLoan: 0, net: 0, taxableGross: 0 },
  );
}

export function calculatePayslip(
  employee: Employee,
  input: PayslipInput,
  previousPayslips: Payslip[],
): PayslipCalculation {
  const fromDays = sumHours(input.days);
  const regularHours = roundPence(Number(input.totalHours) || fromDays);
  const overtimeHours = roundPence(Number(input.overtimeHours) || 0);
  const hourlyRate = roundPence(employee.hourlyRate);
  const overtimeRate = roundPence(hourlyRate * (employee.overtimeMultiplier || 1.5));
  const regularPay = roundPence(regularHours * hourlyRate);
  const overtimePay = roundPence(overtimeHours * overtimeRate);
  const bonus = roundPence(Number(input.bonus) || 0);
  const otherPaymentsTotal = roundPence(
    input.otherPayments.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
  );
  const otherDeductionsTotal = roundPence(
    input.otherDeductions.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
  );
  const grossPay = roundPence(regularPay + overtimePay + bonus + otherPaymentsTotal);

  const freq = input.periodType;
  const employeePension = pensionContribution(
    grossPay,
    freq,
    employee.pensionEmployeePercent,
    employee.pensionBasis,
  );
  const employerPension = pensionContribution(
    grossPay,
    freq,
    employee.pensionEmployerPercent,
    employee.pensionBasis,
  );
  const { qeLower, qeUpper } = PERIODS[freq];
  const qualifyingEarnings = roundPence(Math.max(0, Math.min(grossPay, qeUpper) - qeLower));

  const taxableGross = roundPence(grossPay - employeePension);
  const parsed = parseTaxCode(employee.taxCode);
  const ytd = ytdFromPayslips(previousPayslips, employee.id, input.paymentDate);
  const hasYtd = ytd.gross > 0 || ytd.taxableGross > 0;
  const week1 = input.week1 || parsed.week1 || !hasYtd;
  const taxPeriod = input.taxPeriod || taxPeriodFor(input.paymentDate, freq);

  const payeTax = periodIncomeTax({
    periodTaxableGross: taxableGross,
    frequency: freq,
    taxCode: employee.taxCode,
    taxRegion: employee.taxRegion,
    week1,
    taxPeriod,
    ytdTaxableGross: ytd.taxableGross,
    ytdTaxPaid: ytd.tax,
  });

  const niGross = grossPay;
  const employeeNIValue = employeeNI(niGross, freq, employee.niCategory);
  const employerNIValue = employerNI(niGross, freq, employee.niCategory);
  const studentLoan = studentLoanDeduction(grossPay, freq, employee.studentLoan);
  const postgraduateLoan = postgraduateLoanDeduction(grossPay, freq, employee.postgraduateLoan);

  const totalDeductions = roundPence(
    payeTax +
      employeeNIValue +
      employeePension +
      studentLoan +
      postgraduateLoan +
      otherDeductionsTotal,
  );
  const netPay = roundPence(grossPay - totalDeductions);
  const totalHours = regularHours + overtimeHours;

  const lines: PayslipLine[] = [];
  if (regularHours > 0) {
    lines.push({
      section: "payment",
      label: "Basic hours",
      hours: regularHours,
      rate: hourlyRate,
      amount: regularPay,
    });
  }
  if (overtimeHours > 0) {
    lines.push({
      section: "payment",
      label: `Overtime (${employee.overtimeMultiplier}×)`,
      hours: overtimeHours,
      rate: overtimeRate,
      amount: overtimePay,
    });
  }
  if (bonus > 0) lines.push({ section: "payment", label: "Bonus", amount: bonus });
  for (const line of input.otherPayments) {
    if (line.amount) lines.push({ section: "payment", label: line.label || "Other pay", amount: roundPence(line.amount) });
  }
  if (payeTax) lines.push({ section: "deduction", label: "PAYE income tax", amount: payeTax });
  if (employeeNIValue) {
    lines.push({ section: "deduction", label: `National Insurance (Cat ${employee.niCategory})`, amount: employeeNIValue });
  }
  if (employeePension) {
    lines.push({
      section: "deduction",
      label: `Workplace pension (${employee.pensionEmployeePercent}%)`,
      amount: employeePension,
    });
  }
  if (studentLoan) {
    lines.push({
      section: "deduction",
      label: `Student loan (${employee.studentLoan.replace("plan", "Plan ")})`,
      amount: studentLoan,
    });
  }
  if (postgraduateLoan) {
    lines.push({ section: "deduction", label: "Postgraduate loan", amount: postgraduateLoan });
  }
  for (const line of input.otherDeductions) {
    if (line.amount) {
      lines.push({
        section: "deduction",
        label: line.label || "Other deduction",
        amount: roundPence(line.amount),
      });
    }
  }
  if (employerNIValue) {
    lines.push({ section: "employer", label: "Employer National Insurance", amount: employerNIValue });
  }
  if (employerPension) {
    lines.push({
      section: "employer",
      label: `Employer pension (${employee.pensionEmployerPercent}%)`,
      amount: employerPension,
    });
  }

  return {
    taxYear: taxYearFor(input.paymentDate).label,
    taxPeriod,
    method: week1 ? "week1" : "cumulative",
    regularHours,
    overtimeHours,
    hourlyRate,
    overtimeRate,
    regularPay,
    overtimePay,
    bonus,
    otherPaymentsTotal,
    grossPay,
    qualifyingEarnings,
    employeePension,
    employerPension,
    taxablePay: taxableGross,
    payeTax,
    employeeNI: employeeNIValue,
    employerNI: employerNIValue,
    studentLoan,
    postgraduateLoan,
    otherDeductionsTotal,
    totalDeductions,
    netPay,
    takeHomeHourly: totalHours > 0 ? roundPence(netPay / totalHours) : 0,
    ytd: {
      gross: roundPence(ytd.gross + grossPay),
      tax: roundPence(ytd.tax + payeTax),
      ni: roundPence(ytd.ni + employeeNIValue),
      pension: roundPence(ytd.pension + employeePension),
      studentLoan: roundPence(ytd.studentLoan + studentLoan + postgraduateLoan),
      net: roundPence(ytd.net + netPay),
    },
    nlwWarning: nlwWarning(employee, hourlyRate, input.paymentDate),
    lines,
  };
}
