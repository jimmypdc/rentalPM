// Human-readable labels + badge tones for every enum, plus option lists for forms.

export type BadgeTone =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "slate";

function labelFromEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Generic label helper (falls back to title-casing the enum value). */
export function label(value: string | null | undefined): string {
  if (!value) return "—";
  const custom = ALL_LABELS[value];
  return custom ?? labelFromEnum(value);
}

const ALL_LABELS: Record<string, string> = {
  SINGLE_FAMILY: "Single Family",
  MIXED_USE: "Mixed Use",
  HVAC: "HVAC",
  HOA: "HOA",
  W9: "W-9",
  ACH: "ACH",
  MONTH_TO_MONTH: "Month-to-Month",
  W_NINE: "W-9",
  MOVE_IN: "Move-In",
  MOVE_OUT: "Move-Out",
  TODO: "To Do",
  CREDIT_CARD: "Credit Card",
  PROPERTY_TAXES: "Property Taxes",
  MORTGAGE_INTEREST: "Mortgage Interest",
  CAPITAL_IMPROVEMENT: "Capital Improvement",
  MANAGEMENT_FEES: "Management Fees",
  GENERAL_CONTRACTOR: "General Contractor",
  APPLIANCE_REPAIR: "Appliance Repair",
  PENDING_SIGNATURE: "Pending Signature",
  EXPIRING_SOON: "Expiring Soon",
  NOT_RENEWING: "Not Renewing",
  PARTIALLY_REFUNDED: "Partially Refunded",
  APPLIED_TO_BALANCE: "Applied to Balance",
  WAITING_ON_PARTS: "Waiting on Parts",
  WAITING_ON_VENDOR: "Waiting on Vendor",
  NEEDS_ATTENTION: "Needs Attention",
  NOT_REQUESTED: "Not Requested",
  UNDER_RENOVATION: "Under Renovation",
  NOTICE_GIVEN: "Notice Given",
  VENDOR_INSURANCE: "Vendor Insurance",
  OWNER_AGREEMENT: "Owner Agreement",
  MANAGEMENT_AGREEMENT: "Management Agreement",
};

export function enumOptions(
  e: Record<string, string>,
): { value: string; label: string }[] {
  return Object.values(e).map((v) => ({ value: v, label: label(v) }));
}

// ── Badge tone maps ──────────────────────────────────────────
export const statusTones: Record<string, BadgeTone> = {
  // property / unit
  ACTIVE: "green",
  INACTIVE: "slate",
  SOLD: "neutral",
  UNDER_RENOVATION: "amber",
  OCCUPIED: "green",
  VACANT: "amber",
  NOTICE_GIVEN: "purple",
  UNAVAILABLE: "slate",
  // tenant
  APPLICANT: "blue",
  FORMER: "slate",
  DENIED: "red",
  // lease
  DRAFT: "slate",
  PENDING_SIGNATURE: "amber",
  EXPIRING_SOON: "amber",
  MONTH_TO_MONTH: "blue",
  TERMINATED: "red",
  EXPIRED: "slate",
  // charge / payment
  UNPAID: "red",
  PARTIAL: "amber",
  PAID: "green",
  LATE: "red",
  WAIVED: "slate",
  VOID: "slate",
  // deposit
  HELD: "blue",
  PARTIALLY_REFUNDED: "amber",
  REFUNDED: "green",
  APPLIED_TO_BALANCE: "purple",
  // maintenance
  NEW: "blue",
  ASSIGNED: "purple",
  SCHEDULED: "purple",
  IN_PROGRESS: "amber",
  WAITING_ON_PARTS: "amber",
  WAITING_ON_VENDOR: "amber",
  COMPLETED: "green",
  CANCELLED: "slate",
  // task
  TODO: "blue",
  WAITING: "amber",
  // priority
  LOW: "slate",
  NORMAL: "blue",
  HIGH: "amber",
  EMERGENCY: "red",
  // condition
  EXCELLENT: "green",
  GOOD: "green",
  FAIR: "amber",
  POOR: "red",
  NEEDS_ATTENTION: "red",
  // w9
  RECEIVED: "green",
  REQUESTED: "amber",
  NOT_REQUESTED: "slate",
};

export function tone(value: string | null | undefined): BadgeTone {
  if (!value) return "neutral";
  return statusTones[value] ?? "neutral";
}

// ── Enum value lists (mirror Prisma enums for form <select>s) ─
export const PropertyTypeValues = [
  "SINGLE_FAMILY", "CONDO", "TOWNHOUSE", "DUPLEX", "TRIPLEX", "QUADPLEX",
  "MULTIFAMILY", "COMMERCIAL", "MIXED_USE", "OTHER",
] as const;
export const PropertyStatusValues = ["ACTIVE", "INACTIVE", "SOLD", "UNDER_RENOVATION"] as const;
export const UnitStatusValues = ["OCCUPIED", "VACANT", "NOTICE_GIVEN", "UNDER_RENOVATION", "UNAVAILABLE"] as const;
export const TenantStatusValues = ["APPLICANT", "ACTIVE", "NOTICE_GIVEN", "FORMER", "DENIED"] as const;
export const LeaseStatusValues = ["DRAFT", "PENDING_SIGNATURE", "ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH", "TERMINATED", "EXPIRED"] as const;
export const RenewalStatusValues = ["NONE", "OFFERED", "RENEWING", "NOT_RENEWING"] as const;
export const ChargeTypeValues = ["RENT", "LATE_FEE", "PET_RENT", "UTILITY", "PARKING", "REPAIR", "DEPOSIT", "OTHER"] as const;
export const ChargeStatusValues = ["UNPAID", "PARTIAL", "PAID", "LATE", "WAIVED", "VOID"] as const;
export const PaymentMethodValues = ["ACH", "CHECK", "CASH", "CREDIT_CARD", "WIRE", "ZELLE", "VENMO", "OTHER"] as const;
export const DepositStatusValues = ["HELD", "PARTIALLY_REFUNDED", "REFUNDED", "APPLIED_TO_BALANCE"] as const;
export const ExpenseCategoryValues = [
  "MORTGAGE_INTEREST", "PROPERTY_TAXES", "INSURANCE", "HOA", "REPAIRS", "MAINTENANCE",
  "UTILITIES", "LANDSCAPING", "PEST_CONTROL", "CLEANING", "MANAGEMENT_FEES", "LEGAL",
  "ACCOUNTING", "ADVERTISING", "CAPITAL_IMPROVEMENT", "SUPPLIES", "TRAVEL", "OTHER",
] as const;
export const MaintenanceCategoryValues = [
  "PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "ROOF", "LANDSCAPING", "PEST_CONTROL",
  "STRUCTURAL", "PAINTING", "CLEANING", "GENERAL_REPAIR", "OTHER",
] as const;
export const PriorityValues = ["LOW", "NORMAL", "HIGH", "EMERGENCY"] as const;
export const MaintenanceStatusValues = [
  "NEW", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_ON_PARTS", "WAITING_ON_VENDOR",
  "COMPLETED", "CANCELLED",
] as const;
export const VendorCategoryValues = [
  "PLUMBER", "ELECTRICIAN", "HVAC", "GENERAL_CONTRACTOR", "HANDYMAN", "LANDSCAPER",
  "CLEANER", "PEST_CONTROL", "ROOFING", "APPLIANCE_REPAIR", "PAINTER", "LOCKSMITH", "OTHER",
] as const;
export const InspectionTypeValues = ["MOVE_IN", "MOVE_OUT", "ROUTINE", "ANNUAL", "SAFETY", "CONDITION"] as const;
export const ConditionRatingValues = ["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_ATTENTION"] as const;
export const TaskStatusValues = ["TODO", "IN_PROGRESS", "WAITING", "COMPLETED"] as const;
export const TaskCategoryValues = [
  "LEASE", "RENT", "MAINTENANCE", "INSPECTION", "ACCOUNTING", "OWNER", "VENDOR", "COMPLIANCE", "GENERAL",
] as const;
export const DocumentCategoryValues = [
  "LEASE", "APPLICATION", "INSPECTION", "INSURANCE", "MORTGAGE", "PROPERTY_TAX", "HOA", "RECEIPT",
  "INVOICE", "W9", "VENDOR_INSURANCE", "OWNER_AGREEMENT", "MANAGEMENT_AGREEMENT", "PHOTO", "OTHER",
] as const;
export const ContactMethodValues = ["EMAIL", "PHONE", "TEXT", "MAIL"] as const;
export const WNineStatusValues = ["NOT_REQUESTED", "REQUESTED", "RECEIVED"] as const;

export function optionsFrom(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: label(v) }));
}
