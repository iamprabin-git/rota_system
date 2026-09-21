export type PayFrequency = "weekly" | "fortnightly" | "fourweekly" | "monthly";

export type TaxRegion = "england" | "scotland" | "wales" | "ni";

export type NiCategory =
  | "A"
  | "B"
  | "C"
  | "H"
  | "J"
  | "M"
  | "V"
  | "Z";

export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5";

export type PensionBasis = "qualifying" | "pensionable";

export type PaymentMethod = "bacs" | "cash" | "cheque";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type CompanyAccess = "allowed" | "disallowed";

export type CompanyLive = "active" | "deactive";

export type CrmStage = "lead" | "onboarding" | "active" | "at-risk" | "closed";

export const CRM_STAGES: CrmStage[] = ["lead", "onboarding", "active", "at-risk", "closed"];

export type Company = {
  id: string;
  name: string;
  tradingName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  payeReference: string;
  accountsOfficeRef: string;
  email: string;
  phone: string;
  logo?: string;
  access?: CompanyAccess;
  live?: CompanyLive;
  crmStage?: CrmStage;
  crmNotes?: string;
  nextFollowUp?: string;
  lastContactedAt?: string;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  payrollNumber: string;
  niNumber: string;
  taxCode: string;
  taxRegion: TaxRegion;
  niCategory: NiCategory;
  hourlyRate: number;
  overtimeMultiplier: number;
  startDate: string;
  dateOfBirth: string;
  studentLoan: StudentLoanPlan;
  postgraduateLoan: boolean;
  pensionEmployeePercent: number;
  pensionEmployerPercent: number;
  pensionBasis: PensionBasis;
  paymentMethod: PaymentMethod;
  bankSortCode: string;
  bankAccountLast4: string;
  email: string;
  companyId: string;
  createdAt: string;
};

export type UserRole = "admin" | "agent" | "user";

export type AccountStatus = "pending" | "active" | "disabled";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  createdAt: string;
  avatar?: string;
  phone?: string;
  jobTitle?: string;
  notifyEmail?: boolean;
  status?: AccountStatus;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  avatar: string;
};

export type HourLog = {
  id: string;
  employeeId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  overtimeHours: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  status?: ApprovalStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type PaymentStatus = "due" | "received";

export type Payment = {
  id: string;
  employeeId: string;
  payslipId: string | null;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate: string;
  method: PaymentMethod | "";
  reference: string;
  notes: string;
  createdAt: string;
};

export type CompanyPayment = {
  id: string;
  companyId: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate: string;
  method: PaymentMethod | "";
  reference: string;
  notes: string;
  createdAt: string;
};

export type CompanyFollowUp = {
  id: string;
  companyId: string;
  note: string;
  dueDate: string;
  completedAt: string;
  createdAt: string;
};

export type FileCategory = "timesheet" | "statement" | "id" | "other";

export type RecordFile = {
  id: string;
  employeeId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  notes: string;
  uploadedAt: string;
};

export type DayHours = Record<Weekday, number>;

export type RotaEntry = {
  id: string;
  employeeId: string;
  weekStart: string;
  days: DayHours;
  overtimeHours: number;
  notes: string;
};

export type PaymentLineInput = {
  label: string;
  amount: number;
};

export type PayslipInput = {
  employeeId: string;
  periodType: PayFrequency;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  taxPeriod: number;
  week1: boolean;
  days: DayHours;
  totalHours: number;
  overtimeHours: number;
  bonus: number;
  otherPayments: PaymentLineInput[];
  otherDeductions: PaymentLineInput[];
};

export type PayslipLine = {
  section: "payment" | "deduction" | "employer";
  label: string;
  hours?: number;
  rate?: number;
  amount: number;
};

export type PayslipYtd = {
  gross: number;
  tax: number;
  ni: number;
  pension: number;
  studentLoan: number;
  net: number;
};

export type PayslipCalculation = {
  taxYear: string;
  taxPeriod: number;
  method: "cumulative" | "week1";
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  regularPay: number;
  overtimePay: number;
  bonus: number;
  otherPaymentsTotal: number;
  grossPay: number;
  qualifyingEarnings: number;
  employeePension: number;
  employerPension: number;
  taxablePay: number;
  payeTax: number;
  employeeNI: number;
  employerNI: number;
  studentLoan: number;
  postgraduateLoan: number;
  otherDeductionsTotal: number;
  totalDeductions: number;
  netPay: number;
  takeHomeHourly: number;
  ytd: PayslipYtd;
  nlwWarning: string | null;
  lines: PayslipLine[];
};

export type Payslip = PayslipInput & {
  id: string;
  createdAt: string;
  status?: ApprovalStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  snapshot: {
    employeeName: string;
    jobTitle: string;
    niNumber: string;
    taxCode: string;
    taxRegion: TaxRegion;
    niCategory: NiCategory;
    payrollNumber: string;
    paymentMethod: PaymentMethod;
    bankSortCode: string;
    bankAccountLast4: string;
    companyName: string;
    companyAddress: string;
    payeReference: string;
    companyId?: string;
  };
  calculation: PayslipCalculation;
};

export type Database = {
  companies: Company[];
  employees: Employee[];
  users: User[];
  rota: RotaEntry[];
  payslips: Payslip[];
  hourLogs: HourLog[];
  payments: Payment[];
  companyPayments: CompanyPayment[];
  companyFollowUps: CompanyFollowUp[];
  files: RecordFile[];
};
