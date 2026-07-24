# DATABASE.md — RentalPM Data Model

PostgreSQL via Prisma. All monetary fields are `Decimal(12,2)` (or `(6,4)` for
rates). Every model has `createdAt`/`updatedAt`. Soft delete via `deletedAt`
where noted. Financial records use `voidedAt` instead of deletion.

## Entities

### Identity & people
- **User** — admin login. `email`, `passwordHash`, `role (UserRole)`, `name`,
  optional links to `Owner/Tenant/Vendor` for future portals. Auth.js
  `Account`/`Session`/`VerificationToken` models included for future OAuth &
  password reset.
- **Owner** — property owner (may be "self"). Contact + tax/payment placeholders.
  Has many `PropertyOwner`, `OwnerDistribution`, `OwnerContribution`, `Document`.
- **Tenant** — renter. Contact, employment, emergency contact, status. Has many
  `LeaseTenant`, `Payment`, `MaintenanceRequest`, `Document`, `Inspection`.
- **Vendor** — contractor. Category, license, insurance expiry, W-9 status,
  rate. Has many `MaintenanceRequest`, `Expense`, `Document`.

### Property graph
- **Property** — core asset. Address, type, physical stats, valuation, status,
  primary photo, notes, optional `managerId`, optional `ownerEntity`. Has many
  `PropertyOwner`, `Unit`, `Expense`, `MaintenanceRequest`, `Document`,
  `Inspection`, `Task`. One `Mortgage`, many `InsurancePolicy`, `PropertyTax`.
- **PropertyOwner** — join table (Property ↔ Owner) with `ownershipPercent` and
  `isPrimary`, enabling multiple owners per property.
- **Unit** — rentable space in a property. Number, beds/baths, sqft, market &
  current rent, deposit, `UnitStatus`, available date, amenities, parking.
- **Mortgage** — loan on a property: lender, balance, rate, monthly payment,
  escrow, start/maturity.
- **InsurancePolicy** — carrier, policy #, coverage, premium, effective/expiry.
- **PropertyTax** — year, assessed value, annual amount, due date, paid flag.

### Leasing
- **Lease** — Property + Unit + one/many `LeaseTenant`. Start/end, rent,
  deposits, late fee, grace period, rent due day, `LeaseStatus`,
  `RenewalStatus`, move-in/out. Has many `Charge`, `SecurityDeposit`,
  `Document`. Expiration alerts derived from `endDate`.
- **LeaseTenant** — join (Lease ↔ Tenant) with `isPrimary`.

### Money
- **Charge** — a line owed on a lease: `ChargeType`, `amount`, `dueDate`,
  `ChargeStatus`, description. Paid via allocations. `voidedAt` for reversal.
- **Payment** — money received from a tenant: `amount`, `receivedOn`,
  `PaymentMethod`, `reference`, `processorRef`, `enteredById`, notes,
  `voidedAt`. Split across charges via `PaymentAllocation`.
- **PaymentAllocation** — join (Payment ↔ Charge) with `amount`; supports
  partial payments and per-charge status.
- **SecurityDeposit** — deposit held for a lease/tenant: `amount`,
  `receivedOn`, account, interest, `deductions`, `refundAmount`, `refundedOn`,
  `DepositStatus`.
- **Expense** — money out: `date`, Property (+ optional Unit), optional Vendor,
  `ExpenseCategory`, amount, `PaymentMethod`, receipt Document, `taxDeductible`,
  `isRecurring`, notes, `enteredById`.
- **OwnerDistribution** / **OwnerContribution** — money paid to / received from
  an owner, per period, optionally per property.

### Operations
- **MaintenanceRequest** — `number` (auto), Property (+ optional Unit/Tenant),
  `MaintenanceCategory`, description, `Priority`, `MaintenanceStatus`, optional
  Vendor, estimated/actual cost, reported/scheduled/completed dates, notes,
  photos (Document). 
- **Inspection** — Property (+ optional Unit/Tenant), `InspectionType`, date,
  inspector, `conditionRating`, notes, issuesFound, followUpRequired,
  nextInspectionDate. Has many `InspectionItem`.
- **InspectionItem** — checklist row: `area`, `ConditionRating`, notes.
- **Task** — Title, description, optional Property/Tenant/Owner/Vendor, due
  date, `Priority`, `TaskStatus`, `TaskCategory`, reminderAt, notes.

### System
- **Document** — metadata + storage key. Polymorphic-ish: optional FKs to
  Property/Unit/Tenant/Lease/Owner/Vendor/MaintenanceRequest/Expense/Inspection.
  `DocumentCategory`, name, mimeType, size, uploadedById.
- **Notification** — type, title, body, severity, `readAt`, optional entity
  links, for the alert center.
- **ActivityLog** — audit timeline: `action`, `entityType`, `entityId`,
  human `summary`, optional Property/Tenant links, `userId`, `createdAt`.

## Enums

`UserRole` (ADMIN, MANAGER, OWNER, TENANT, VENDOR) ·
`PropertyType` (SINGLE_FAMILY, CONDO, TOWNHOUSE, DUPLEX, TRIPLEX, QUADPLEX,
MULTIFAMILY, COMMERCIAL, MIXED_USE, OTHER) ·
`PropertyStatus` (ACTIVE, INACTIVE, SOLD, UNDER_RENOVATION) ·
`UnitStatus` (OCCUPIED, VACANT, NOTICE_GIVEN, UNDER_RENOVATION, UNAVAILABLE) ·
`TenantStatus` (APPLICANT, ACTIVE, NOTICE_GIVEN, FORMER, DENIED) ·
`LeaseStatus` (DRAFT, PENDING_SIGNATURE, ACTIVE, EXPIRING_SOON, MONTH_TO_MONTH,
TERMINATED, EXPIRED) ·
`RenewalStatus` (NONE, OFFERED, RENEWING, NOT_RENEWING) ·
`ChargeType` (RENT, LATE_FEE, PET_RENT, UTILITY, PARKING, REPAIR, DEPOSIT,
OTHER) ·
`ChargeStatus` (UNPAID, PARTIAL, PAID, LATE, WAIVED, VOID) ·
`PaymentMethod` (ACH, CHECK, CASH, CREDIT_CARD, WIRE, ZELLE, VENMO, OTHER) ·
`DepositStatus` (HELD, PARTIALLY_REFUNDED, REFUNDED, APPLIED_TO_BALANCE) ·
`ExpenseCategory` (MORTGAGE_INTEREST, PROPERTY_TAXES, INSURANCE, HOA, REPAIRS,
MAINTENANCE, UTILITIES, LANDSCAPING, PEST_CONTROL, CLEANING, MANAGEMENT_FEES,
LEGAL, ACCOUNTING, ADVERTISING, CAPITAL_IMPROVEMENT, SUPPLIES, TRAVEL, OTHER) ·
`MaintenanceCategory` (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, ROOF, LANDSCAPING,
PEST_CONTROL, STRUCTURAL, PAINTING, CLEANING, GENERAL_REPAIR, OTHER) ·
`Priority` (LOW, NORMAL, HIGH, EMERGENCY) ·
`MaintenanceStatus` (NEW, ASSIGNED, SCHEDULED, IN_PROGRESS, WAITING_ON_PARTS,
WAITING_ON_VENDOR, COMPLETED, CANCELLED) ·
`VendorCategory` (PLUMBER, ELECTRICIAN, HVAC, GENERAL_CONTRACTOR, HANDYMAN,
LANDSCAPER, CLEANER, PEST_CONTROL, ROOFING, APPLIANCE_REPAIR, PAINTER,
LOCKSMITH, OTHER) ·
`InspectionType` (MOVE_IN, MOVE_OUT, ROUTINE, ANNUAL, SAFETY, CONDITION) ·
`ConditionRating` (EXCELLENT, GOOD, FAIR, POOR, NEEDS_ATTENTION) ·
`TaskStatus` (TODO, IN_PROGRESS, WAITING, COMPLETED) ·
`TaskCategory` (LEASE, RENT, MAINTENANCE, INSPECTION, ACCOUNTING, OWNER, VENDOR,
COMPLIANCE, GENERAL) ·
`DocumentCategory` (LEASE, APPLICATION, INSPECTION, INSURANCE, MORTGAGE,
PROPERTY_TAX, HOA, RECEIPT, INVOICE, W9, VENDOR_INSURANCE, OWNER_AGREEMENT,
MANAGEMENT_AGREEMENT, PHOTO, OTHER) ·
`NotificationSeverity` (INFO, WARNING, CRITICAL) ·
`WNineStatus` (NOT_REQUESTED, REQUESTED, RECEIVED)

## Indexing strategy

- FK columns indexed (`propertyId`, `unitId`, `leaseId`, `tenantId`,
  `vendorId`, `ownerId`).
- Filter/sort columns indexed: `Charge.dueDate`, `Charge.status`,
  `Payment.receivedOn`, `Expense.date`, `Lease.endDate`, `Lease.status`,
  `MaintenanceRequest.status`, `Task.dueDate`, `Unit.status`.
- Soft-delete queries rely on `deletedAt IS NULL` predicates.

See `ERD.md` for the Mermaid entity-relationship diagram.
