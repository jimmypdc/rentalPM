/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PrismaClient,
  Prisma,
  MaintenanceStatus,
  Priority,
  MaintenanceCategory,
  ExpenseCategory,
  PaymentMethod,
  TaskStatus,
  TaskCategory,
  LeaseStatus,
  UnitStatus,
  VendorCategory,
  InspectionType,
  ConditionRating,
  DocumentCategory,
  NotificationSeverity,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const D = (n: number) => new Prisma.Decimal(n.toFixed(2));
const monthsAgo = (m: number, day = 1) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m, day);
  d.setHours(9, 0, 0, 0);
  return d;
};
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

async function main() {
  console.log("🌱 Seeding RentalPM...");

  // ── Clean (idempotent) ──────────────────────────────────────
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.paymentAllocation.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.charge.deleteMany(),
    prisma.securityDeposit.deleteMany(),
    prisma.inspectionItem.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.document.deleteMany(),
    prisma.maintenanceRequest.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.task.deleteMany(),
    prisma.ownerDistribution.deleteMany(),
    prisma.ownerContribution.deleteMany(),
    prisma.leaseTenant.deleteMany(),
    prisma.lease.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.mortgage.deleteMany(),
    prisma.insurancePolicy.deleteMany(),
    prisma.propertyTax.deleteMany(),
    prisma.propertyOwner.deleteMany(),
    prisma.property.deleteMany(),
    prisma.tenant.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.owner.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Admin user ─────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "admin@rentalpm.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Jim Podgorny",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      phone: "(305) 555-0100",
    },
  });
  console.log(`  ✓ admin: ${adminEmail} / ${adminPassword}`);

  // ── Owners ─────────────────────────────────────────────────
  const ownerSelf = await prisma.owner.create({
    data: {
      firstName: "Jim",
      lastName: "Podgorny",
      company: "Podgorny Holdings LLC",
      isSelf: true,
      email: adminEmail,
      phone: "(305) 555-0100",
      city: "Miami",
      state: "FL",
      contactMethod: "EMAIL",
      managementFeePercent: D(0),
    },
  });
  const ownerSmith = await prisma.owner.create({
    data: {
      firstName: "John",
      lastName: "Smith",
      company: "Sunshine Rentals LLC",
      email: "john.smith@example.com",
      phone: "(407) 555-0142",
      street: "88 Lakeview Dr",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      contactMethod: "EMAIL",
      managementFeePercent: D(8),
    },
  });
  const ownerGarcia = await prisma.owner.create({
    data: {
      firstName: "Maria",
      lastName: "Garcia",
      email: "maria.garcia@example.com",
      phone: "(813) 555-0177",
      street: "204 Bayshore Blvd",
      city: "Tampa",
      state: "FL",
      zip: "33606",
      contactMethod: "PHONE",
      managementFeePercent: D(10),
    },
  });

  // ── Vendors ────────────────────────────────────────────────
  const vendorData: {
    companyName: string; contactName: string; category: VendorCategory;
    phone: string; email: string; preferred?: boolean; rate: number; insExp: number;
  }[] = [
    { companyName: "Sunshine Plumbing Co.", contactName: "Rick Waters", category: "PLUMBER", phone: "(305) 555-0201", email: "rick@sunshineplumbing.com", preferred: true, rate: 95, insExp: 200 },
    { companyName: "Bright Spark Electric", contactName: "Dana Volt", category: "ELECTRICIAN", phone: "(305) 555-0202", email: "dana@brightspark.com", preferred: true, rate: 110, insExp: 45 },
    { companyName: "CoolBreeze HVAC", contactName: "Tom Frost", category: "HVAC", phone: "(305) 555-0203", email: "tom@coolbreeze.com", rate: 120, insExp: 15 },
    { companyName: "GreenScape Lawn Care", contactName: "Luis Verde", category: "LANDSCAPER", phone: "(305) 555-0204", email: "luis@greenscape.com", preferred: true, rate: 60, insExp: 300 },
    { companyName: "AllFix Handyman Services", contactName: "Pete Nails", category: "HANDYMAN", phone: "(305) 555-0205", email: "pete@allfix.com", rate: 75, insExp: 120 },
    { companyName: "ClearView Cleaning", contactName: "Sara Shine", category: "CLEANER", phone: "(305) 555-0206", email: "sara@clearview.com", rate: 45, insExp: 90 },
    { companyName: "TopSeal Roofing", contactName: "Marco Beam", category: "ROOFING", phone: "(305) 555-0207", email: "marco@topseal.com", rate: 130, insExp: -10 },
  ];
  const vendors = [];
  for (const v of vendorData) {
    vendors.push(
      await prisma.vendor.create({
        data: {
          companyName: v.companyName, contactName: v.contactName, category: v.category,
          phone: v.phone, email: v.email, city: "Miami", state: "FL",
          preferred: v.preferred ?? false, hourlyRate: D(v.rate),
          wNineStatus: "RECEIVED", insuranceExpiration: daysFromNow(v.insExp),
          licenseNumber: `FL-${1000 + vendors.length}`,
        },
      }),
    );
  }

  // ── Properties ─────────────────────────────────────────────
  type PropSpec = {
    name: string; type: any; street: string; city: string; zip: string; county: string;
    owner: string; value: number; purchase: number; mortgage: number; rate: number; pmt: number;
    taxAnnual: number; insAnnual: number; hoa: number; sqft: number; year: number;
    beds: number; baths: number;
    units: { number: string; beds: number; baths: number; sqft: number; rent: number; deposit: number; status: UnitStatus }[];
  };
  const specs: PropSpec[] = [
    {
      name: "Coral Gables Bungalow", type: "SINGLE_FAMILY", street: "1423 Alhambra Cir",
      city: "Coral Gables", zip: "33134", county: "Miami-Dade", owner: "self",
      value: 685000, purchase: 512000, mortgage: 358000, rate: 0.0625, pmt: 2650,
      taxAnnual: 9200, insAnnual: 3800, hoa: 0, sqft: 1850, year: 1996, beds: 3, baths: 2,
      units: [{ number: "1", beds: 3, baths: 2, sqft: 1850, rent: 3400, deposit: 3400, status: "OCCUPIED" }],
    },
    {
      name: "Wynwood Duplex", type: "DUPLEX", street: "260 NW 25th St",
      city: "Miami", zip: "33127", county: "Miami-Dade", owner: "self",
      value: 720000, purchase: 540000, mortgage: 402000, rate: 0.059, pmt: 2980,
      taxAnnual: 10400, insAnnual: 4600, hoa: 0, sqft: 2400, year: 2004, beds: 4, baths: 4,
      units: [
        { number: "A", beds: 2, baths: 2, sqft: 1200, rent: 2650, deposit: 2650, status: "OCCUPIED" },
        { number: "B", beds: 2, baths: 2, sqft: 1200, rent: 2700, deposit: 2700, status: "OCCUPIED" },
      ],
    },
    {
      name: "Brickell Ave Condo", type: "CONDO", street: "1200 Brickell Ave #1804",
      city: "Miami", zip: "33131", county: "Miami-Dade", owner: "smith",
      value: 495000, purchase: 430000, mortgage: 301000, rate: 0.064, pmt: 2210,
      taxAnnual: 6800, insAnnual: 2200, hoa: 780, sqft: 1050, year: 2011, beds: 2, baths: 2,
      units: [{ number: "1804", beds: 2, baths: 2, sqft: 1050, rent: 3100, deposit: 3100, status: "OCCUPIED" }],
    },
    {
      name: "Orlando Fourplex", type: "QUADPLEX", street: "715 Delaney Ave",
      city: "Orlando", zip: "32801", county: "Orange", owner: "smith",
      value: 940000, purchase: 720000, mortgage: 548000, rate: 0.061, pmt: 3980,
      taxAnnual: 12800, insAnnual: 6100, hoa: 0, sqft: 4200, year: 1988, beds: 8, baths: 4,
      units: [
        { number: "1", beds: 2, baths: 1, sqft: 1000, rent: 1850, deposit: 1850, status: "OCCUPIED" },
        { number: "2", beds: 2, baths: 1, sqft: 1000, rent: 1800, deposit: 1800, status: "OCCUPIED" },
        { number: "3", beds: 2, baths: 1, sqft: 1050, rent: 1900, deposit: 1900, status: "VACANT" },
        { number: "4", beds: 2, baths: 1, sqft: 1050, rent: 1950, deposit: 1950, status: "NOTICE_GIVEN" },
      ],
    },
    {
      name: "Tampa Heights Triplex", type: "TRIPLEX", street: "402 E Frances Ave",
      city: "Tampa", zip: "33602", county: "Hillsborough", owner: "garcia",
      value: 610000, purchase: 465000, mortgage: 333000, rate: 0.0635, pmt: 2460,
      taxAnnual: 7900, insAnnual: 4300, hoa: 0, sqft: 3000, year: 1975, beds: 6, baths: 3,
      units: [
        { number: "1", beds: 2, baths: 1, sqft: 1000, rent: 1700, deposit: 1700, status: "OCCUPIED" },
        { number: "2", beds: 2, baths: 1, sqft: 1000, rent: 1750, deposit: 1750, status: "OCCUPIED" },
        { number: "3", beds: 2, baths: 1, sqft: 1000, rent: 1650, deposit: 0, status: "UNDER_RENOVATION" },
      ],
    },
    {
      name: "St. Petersburg Cottage", type: "SINGLE_FAMILY", street: "331 18th Ave N",
      city: "St. Petersburg", zip: "33704", county: "Pinellas", owner: "garcia",
      value: 445000, purchase: 352000, mortgage: 244000, rate: 0.0605, pmt: 1720,
      taxAnnual: 5600, insAnnual: 3100, hoa: 0, sqft: 1400, year: 1958, beds: 3, baths: 2,
      units: [{ number: "1", beds: 3, baths: 2, sqft: 1400, rent: 2500, deposit: 2500, status: "OCCUPIED" }],
    },
  ];

  const ownerMap: Record<string, string> = { self: ownerSelf.id, smith: ownerSmith.id, garcia: ownerGarcia.id };
  const properties: any[] = [];
  const allUnits: any[] = [];

  for (const s of specs) {
    const property: any = await prisma.property.create({
      data: {
        name: s.name, type: s.type, street: s.street, city: s.city, state: "FL",
        zip: s.zip, county: s.county, status: "ACTIVE",
        purchaseDate: monthsAgo(40, 15), purchasePrice: D(s.purchase),
        estimatedValue: D(s.value), propertyTaxAnnual: D(s.taxAnnual),
        insuranceAnnual: D(s.insAnnual), hoaMonthly: D(s.hoa),
        squareFeet: s.sqft, yearBuilt: s.year, bedrooms: s.beds, bathrooms: D(s.baths),
        managerId: admin.id, ownerEntity: s.owner === "self" ? "Podgorny Holdings LLC" : undefined,
        notes: "Managed in-house. See documents tab for lease & insurance.",
        owners: { create: { ownerId: ownerMap[s.owner], ownershipPercent: D(100), isPrimary: true } },
        mortgage: {
          create: {
            lender: pick(["Chase", "Wells Fargo", "Bank of America", "Rocket Mortgage"], properties.length),
            originalAmount: D(s.purchase * 0.8), balance: D(s.mortgage), interestRate: D(s.rate),
            monthlyPayment: D(s.pmt), escrowMonthly: D((s.taxAnnual + s.insAnnual) / 12),
            startDate: monthsAgo(40, 15), maturityDate: daysFromNow(365 * 27),
          },
        },
        insurancePolicies: {
          create: {
            carrier: pick(["Citizens", "State Farm", "Tower Hill", "Universal"], properties.length),
            policyNumber: `POL-${20000 + properties.length}`, coverage: D(s.value),
            premiumAnnual: D(s.insAnnual), effectiveDate: monthsAgo(6), expirationDate: daysFromNow(180 - properties.length * 30),
          },
        },
        propertyTaxes: {
          create: {
            year: new Date().getFullYear(), assessedValue: D(s.value * 0.9), amount: D(s.taxAnnual),
            dueDate: daysFromNow(60 + properties.length * 10), paid: false,
          },
        },
      },
    });
    properties.push({ ...property, ownerKey: s.owner });

    for (const u of s.units) {
      const unit = await prisma.unit.create({
        data: {
          propertyId: property.id, number: u.number, bedrooms: u.beds, bathrooms: D(u.baths),
          squareFeet: u.sqft, marketRent: D(u.rent), currentRent: D(u.status === "OCCUPIED" || u.status === "NOTICE_GIVEN" ? u.rent : u.rent),
          depositAmount: D(u.deposit), status: u.status,
          availableDate: u.status === "VACANT" ? daysFromNow(-14) : u.status === "NOTICE_GIVEN" ? daysFromNow(21) : undefined,
          amenities: "In-unit W/D, Central A/C, Dishwasher", parking: "1 assigned space",
        },
      });
      allUnits.push({ ...unit, propertyName: property.name, ownerKey: s.owner, rent: u.rent, deposit: u.deposit });
    }
  }

  // ── Tenants ────────────────────────────────────────────────
  const tenantNames = [
    ["Emily", "Rodriguez"], ["Michael", "Chen"], ["Jessica", "Williams"], ["David", "Thompson"],
    ["Ashley", "Martinez"], ["James", "Anderson"], ["Sophia", "Nguyen"], ["Daniel", "Brown"],
    ["Olivia", "Davis"], ["Christopher", "Lee"], ["Isabella", "Moore"], ["Matthew", "Clark"],
  ];
  const tenants = [];
  for (let i = 0; i < tenantNames.length; i++) {
    const [first, last] = tenantNames[i];
    tenants.push(
      await prisma.tenant.create({
        data: {
          firstName: first, lastName: last,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          phone: `(305) 555-0${300 + i}`,
          employer: pick(["Baptist Health", "University of Miami", "Carnival Corp", "Publix", "Royal Caribbean", "Self-Employed"], i),
          monthlyIncome: D(5200 + i * 350),
          emergencyName: pick(["Robert", "Linda", "Carlos", "Nancy"], i) + " " + last,
          emergencyPhone: `(786) 555-0${400 + i}`,
          status: "ACTIVE",
          vehicleInfo: pick(["Honda Civic (silver)", "Toyota Camry (blue)", "Ford F-150 (black)", "None"], i),
          pets: pick(["None", "1 cat", "1 small dog (25lb)", "None"], i),
        },
      }),
    );
  }

  // ── Leases + charges + payments + deposits ─────────────────
  const occupiedUnits = allUnits.filter((u) => u.status === "OCCUPIED" || u.status === "NOTICE_GIVEN");
  const leases = [];
  const nowMonthIndex = 0; // current month
  let tenantCursor = 0;

  for (let idx = 0; idx < occupiedUnits.length; idx++) {
    const unit = occupiedUnits[idx];
    const tenant = tenants[tenantCursor % tenants.length];
    tenantCursor++;

    // Stagger lease start dates 4-14 months ago; 12-month terms.
    const startOffset = 4 + (idx % 10);
    const start = monthsAgo(startOffset, 1);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const monthsUntilEnd = Math.round((end.getTime() - Date.now()) / (30 * 86400000));
    const status: LeaseStatus =
      unit.status === "NOTICE_GIVEN" ? "MONTH_TO_MONTH"
      : monthsUntilEnd <= 2 ? "EXPIRING_SOON"
      : "ACTIVE";

    const lease = await prisma.lease.create({
      data: {
        propertyId: unit.propertyId, unitId: unit.id, startDate: start, endDate: end,
        rent: D(unit.rent), securityDeposit: D(unit.deposit), lateFee: D(75), gracePeriodDays: 5,
        rentDueDay: 1, status, renewalStatus: status === "EXPIRING_SOON" ? "OFFERED" : "NONE",
        moveInDate: start,
        tenants: { create: { tenantId: tenant.id, isPrimary: true } },
      },
    });
    leases.push({ ...lease, unit, tenant, rentAmount: unit.rent });

    // Security deposit record
    await prisma.securityDeposit.create({
      data: {
        leaseId: lease.id, tenantId: tenant.id, amount: D(unit.deposit),
        receivedOn: start, account: "FL Deposit Trust ****4821", status: "HELD",
      },
    });

    // Charges: from lease start month through current month (cap 12).
    const monthsOfHistory = Math.min(startOffset, 12);
    for (let m = monthsOfHistory; m >= nowMonthIndex; m--) {
      const due = monthsAgo(m, unit.number === "B" ? 1 : 1);
      due.setDate(1);
      const isCurrentMonth = m === nowMonthIndex;
      const isPrevMonth = m === 1;

      const charge = await prisma.charge.create({
        data: {
          leaseId: lease.id, type: "RENT", amount: D(unit.rent), dueDate: due,
          description: `Monthly rent — ${due.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
          status: "UNPAID",
        },
      });

      // Payment behavior: historic months paid; current month varies by tenant index.
      let payFraction = 1;
      let late = false;
      if (isCurrentMonth) {
        const mod = idx % 5;
        if (mod === 0) payFraction = 0; // unpaid this month
        else if (mod === 1) payFraction = 0.5; // partial
        else payFraction = 1;
      } else if (isPrevMonth && idx % 4 === 0) {
        late = true; // paid late last month
      }

      if (payFraction > 0) {
        const paidAmount = unit.rent * payFraction;
        const receivedOn = new Date(due);
        receivedOn.setDate(late ? 12 : 2 + (idx % 3));
        const payment = await prisma.payment.create({
          data: {
            tenantId: tenant.id, amount: D(paidAmount), receivedOn,
            method: pick<PaymentMethod>(["ACH", "CHECK", "ZELLE", "ACH", "CREDIT_CARD"], idx),
            reference: `RENT-${lease.id.slice(-4)}-${m}`, enteredById: admin.id,
            allocations: { create: { chargeId: charge.id, amount: D(paidAmount) } },
          },
        });
        void payment;
        await prisma.charge.update({
          where: { id: charge.id },
          data: { status: payFraction >= 1 ? "PAID" : "PARTIAL" },
        });

        if (late) {
          // add a late fee charge (paid)
          const lf = await prisma.charge.create({
            data: { leaseId: lease.id, type: "LATE_FEE", amount: D(75), dueDate: due, description: "Late fee", status: "PAID" },
          });
          await prisma.payment.create({
            data: {
              tenantId: tenant.id, amount: D(75), receivedOn, method: "ACH",
              reference: `LF-${lease.id.slice(-4)}`, enteredById: admin.id,
              allocations: { create: { chargeId: lf.id, amount: D(75) } },
            },
          });
        }
      } else if (isCurrentMonth) {
        // unpaid current -> mark LATE if past grace
        const overdue = new Date(due);
        overdue.setDate(overdue.getDate() + 6);
        await prisma.charge.update({
          where: { id: charge.id },
          data: { status: overdue < new Date() ? "LATE" : "UNPAID" },
        });
      }
    }
  }

  // ── Expenses (12 months across properties) ─────────────────
  const expenseTemplates: { cat: ExpenseCategory; desc: string; base: number }[] = [
    { cat: "PROPERTY_TAXES", desc: "Quarterly property tax", base: 2300 },
    { cat: "INSURANCE", desc: "Insurance premium", base: 380 },
    { cat: "REPAIRS", desc: "Plumbing repair", base: 240 },
    { cat: "LANDSCAPING", desc: "Monthly lawn service", base: 120 },
    { cat: "UTILITIES", desc: "Water/sewer (common)", base: 90 },
    { cat: "MANAGEMENT_FEES", desc: "Management fee", base: 210 },
    { cat: "HOA", desc: "HOA dues", base: 780 },
    { cat: "MAINTENANCE", desc: "General maintenance", base: 160 },
    { cat: "CLEANING", desc: "Turnover cleaning", base: 220 },
    { cat: "CAPITAL_IMPROVEMENT", desc: "Water heater replacement", base: 1450 },
  ];
  let expCount = 0;
  for (let m = 11; m >= 0; m--) {
    for (let p = 0; p < properties.length; p++) {
      const property = properties[p];
      // 1-2 expenses per property per month
      const count = 1 + ((m + p) % 2);
      for (let c = 0; c < count; c++) {
        const t = expenseTemplates[(m + p + c) % expenseTemplates.length];
        if (t.cat === "HOA" && property.name.indexOf("Condo") === -1) continue;
        const vendor = pick(vendors, m + p + c);
        const amount = t.base * (0.8 + ((m * 7 + p * 3 + c) % 5) / 10);
        await prisma.expense.create({
          data: {
            date: monthsAgo(m, 5 + ((p + c) % 20)), propertyId: property.id,
            vendorId: ["REPAIRS", "MAINTENANCE", "LANDSCAPING", "CLEANING", "CAPITAL_IMPROVEMENT"].includes(t.cat) ? vendor.id : undefined,
            category: t.cat, description: t.desc, amount: D(amount),
            method: pick<PaymentMethod>(["ACH", "CHECK", "CREDIT_CARD"], expCount),
            taxDeductible: t.cat !== "CAPITAL_IMPROVEMENT", isRecurring: ["LANDSCAPING", "MANAGEMENT_FEES", "HOA", "INSURANCE"].includes(t.cat),
            enteredById: admin.id,
          },
        });
        expCount++;
      }
    }
  }

  // ── Maintenance requests ───────────────────────────────────
  const maintSpecs: { title: string; cat: MaintenanceCategory; prio: Priority; status: MaintenanceStatus; est: number; act?: number; daysAgo: number }[] = [
    { title: "Kitchen sink leaking under cabinet", cat: "PLUMBING", prio: "HIGH", status: "IN_PROGRESS", est: 250, daysAgo: 3 },
    { title: "A/C not cooling — unit blowing warm", cat: "HVAC", prio: "EMERGENCY", status: "SCHEDULED", est: 600, daysAgo: 1 },
    { title: "Bedroom outlet not working", cat: "ELECTRICAL", prio: "NORMAL", status: "NEW", est: 150, daysAgo: 5 },
    { title: "Dishwasher not draining", cat: "APPLIANCE", prio: "NORMAL", status: "WAITING_ON_PARTS", est: 320, daysAgo: 9 },
    { title: "Roof leak in hallway after storm", cat: "ROOF", prio: "HIGH", status: "ASSIGNED", est: 1200, daysAgo: 6 },
    { title: "Garbage disposal jammed", cat: "PLUMBING", prio: "LOW", status: "COMPLETED", est: 120, act: 110, daysAgo: 20 },
    { title: "Repaint living room after move-out", cat: "PAINTING", prio: "NORMAL", status: "COMPLETED", est: 480, act: 450, daysAgo: 34 },
    { title: "Pest control — ants in kitchen", cat: "PEST_CONTROL", prio: "NORMAL", status: "WAITING_ON_VENDOR", est: 140, daysAgo: 4 },
    { title: "Front door lock sticking", cat: "GENERAL_REPAIR", prio: "LOW", status: "NEW", est: 90, daysAgo: 2 },
    { title: "Water heater replacement", cat: "PLUMBING", prio: "HIGH", status: "COMPLETED", est: 1500, act: 1450, daysAgo: 28 },
  ];
  const catToVendorCat: Record<string, VendorCategory> = {
    PLUMBING: "PLUMBER", ELECTRICAL: "ELECTRICIAN", HVAC: "HVAC", ROOF: "ROOFING",
    PAINTING: "PAINTER", PEST_CONTROL: "PEST_CONTROL", APPLIANCE: "APPLIANCE_REPAIR", GENERAL_REPAIR: "HANDYMAN",
  };
  for (let i = 0; i < maintSpecs.length; i++) {
    const m = maintSpecs[i];
    const unit = pick(allUnits, i);
    const lease = leases.find((l) => l.unitId === unit.id);
    const vendorCat = catToVendorCat[m.cat];
    const vendor = vendors.find((v) => v.category === vendorCat) ?? (m.status !== "NEW" ? pick(vendors, i) : undefined);
    await prisma.maintenanceRequest.create({
      data: {
        propertyId: unit.propertyId, unitId: unit.id, tenantId: lease?.tenant.id,
        category: m.cat, title: m.title, description: `Reported by tenant. ${m.title}. Please assess and resolve.`,
        priority: m.prio, status: m.status,
        vendorId: m.status === "NEW" ? undefined : vendor?.id,
        estimatedCost: D(m.est), actualCost: m.act ? D(m.act) : undefined,
        reportedDate: daysFromNow(-m.daysAgo),
        scheduledDate: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS"].includes(m.status) ? daysFromNow(2) : undefined,
        completedDate: m.status === "COMPLETED" ? daysFromNow(-(m.daysAgo - 4)) : undefined,
        internalNotes: m.prio === "EMERGENCY" ? "Tenant has small children — prioritize." : undefined,
      },
    });
  }

  // ── Tasks ──────────────────────────────────────────────────
  const taskSpecs: { title: string; cat: TaskCategory; prio: Priority; status: TaskStatus; due: number }[] = [
    { title: "Renew insurance policy — Orlando Fourplex", cat: "COMPLIANCE", prio: "HIGH", status: "TODO", due: 12 },
    { title: "Follow up on lease renewal (unit 4)", cat: "LEASE", prio: "NORMAL", status: "IN_PROGRESS", due: 5 },
    { title: "Send owner statement to John Smith", cat: "OWNER", prio: "NORMAL", status: "TODO", due: 3 },
    { title: "Schedule annual A/C service", cat: "MAINTENANCE", prio: "NORMAL", status: "TODO", due: -2 },
    { title: "Collect W-9 from TopSeal Roofing", cat: "VENDOR", prio: "LOW", status: "WAITING", due: 20 },
    { title: "File quarterly property taxes", cat: "ACCOUNTING", prio: "HIGH", status: "TODO", due: -1 },
    { title: "Move-in inspection for new tenant", cat: "INSPECTION", prio: "NORMAL", status: "TODO", due: 8 },
    { title: "Chase overdue rent — current month", cat: "RENT", prio: "HIGH", status: "IN_PROGRESS", due: 1 },
    { title: "Post vacancy listing for Orlando unit 3", cat: "GENERAL", prio: "NORMAL", status: "TODO", due: 4 },
  ];
  for (let i = 0; i < taskSpecs.length; i++) {
    const t = taskSpecs[i];
    await prisma.task.create({
      data: {
        title: t.title, category: t.cat, priority: t.prio, status: t.status,
        dueDate: daysFromNow(t.due), reminderAt: daysFromNow(t.due - 1),
        propertyId: pick(properties, i).id,
        description: "Auto-generated seed task.",
      },
    });
  }

  // ── Inspections ────────────────────────────────────────────
  const inspAreas = ["Walls", "Floors", "Ceilings", "Windows", "Kitchen", "Bathrooms", "HVAC", "Plumbing", "Electrical", "Smoke Detectors", "Exterior", "Roof"];
  for (let i = 0; i < 4; i++) {
    const unit = pick(allUnits, i * 2);
    const lease = leases.find((l) => l.unitId === unit.id);
    await prisma.inspection.create({
      data: {
        propertyId: unit.propertyId, unitId: unit.id, tenantId: lease?.tenant.id,
        type: pick<InspectionType>(["ROUTINE", "MOVE_IN", "ANNUAL", "SAFETY"], i),
        inspectionDate: daysFromNow(-(10 + i * 15)), inspector: "Jim Podgorny",
        conditionRating: pick<ConditionRating>(["GOOD", "EXCELLENT", "FAIR", "GOOD"], i),
        followUpRequired: i % 3 === 0, issuesFound: i % 3 === 0 ? "Minor caulking needed in master bath." : undefined,
        nextInspectionDate: daysFromNow(180),
        items: {
          create: inspAreas.map((area, a) => ({
            area,
            rating: pick<ConditionRating>(["EXCELLENT", "GOOD", "GOOD", "FAIR"], a + i),
            notes: a % 5 === 0 ? "Looks good." : undefined,
          })),
        },
      },
    });
  }

  // ── Documents (metadata) ───────────────────────────────────
  const docSpecs: { name: string; cat: DocumentCategory }[] = [
    { name: "Lease Agreement.pdf", cat: "LEASE" },
    { name: "Rental Application.pdf", cat: "APPLICATION" },
    { name: "Homeowners Insurance Policy.pdf", cat: "INSURANCE" },
    { name: "Mortgage Statement.pdf", cat: "MORTGAGE" },
    { name: "Property Tax Bill.pdf", cat: "PROPERTY_TAX" },
    { name: "Move-In Inspection Report.pdf", cat: "INSPECTION" },
    { name: "Plumbing Invoice.pdf", cat: "INVOICE" },
  ];
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    for (let d = 0; d < 3; d++) {
      const spec = docSpecs[(i + d) % docSpecs.length];
      await prisma.document.create({
        data: {
          name: spec.name, category: spec.cat, propertyId: property.id,
          mimeType: "application/pdf", sizeBytes: 120000 + i * 5000 + d * 900,
          storageKey: `seed/${property.id}/${spec.name}`, uploadedById: admin.id,
        },
      });
    }
  }

  // ── Owner distributions/contributions ──────────────────────
  for (const o of [ownerSmith, ownerGarcia]) {
    for (let m = 3; m >= 1; m--) {
      await prisma.ownerDistribution.create({
        data: {
          ownerId: o.id, amount: D(2200 + m * 120), date: monthsAgo(m, 28),
          periodLabel: monthsAgo(m, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
          notes: "Monthly net distribution after fees & expenses.",
        },
      });
    }
  }

  // ── Notifications ──────────────────────────────────────────
  const notifs: { type: string; title: string; body: string; sev: NotificationSeverity; href: string }[] = [
    { type: "RENT_OVERDUE", title: "Rent overdue", body: "1+ tenants have unpaid rent for the current month.", sev: "CRITICAL", href: "/payments" },
    { type: "LEASE_EXPIRING", title: "Lease expiring soon", body: "A lease expires within 60 days.", sev: "WARNING", href: "/leases" },
    { type: "INSURANCE_EXPIRING", title: "Insurance renewal due", body: "A property insurance policy expires within 60 days.", sev: "WARNING", href: "/properties" },
    { type: "VENDOR_INSURANCE", title: "Vendor insurance expired", body: "TopSeal Roofing insurance is expired.", sev: "CRITICAL", href: "/vendors" },
    { type: "MAINTENANCE_OPEN", title: "Emergency maintenance open", body: "An emergency request needs attention.", sev: "CRITICAL", href: "/maintenance" },
    { type: "TASK_OVERDUE", title: "Tasks overdue", body: "You have overdue tasks.", sev: "WARNING", href: "/tasks" },
  ];
  for (const n of notifs) {
    await prisma.notification.create({
      data: { userId: admin.id, type: n.type, title: n.title, body: n.body, severity: n.sev, href: n.href },
    });
  }

  // ── Activity log ───────────────────────────────────────────
  const activities = [
    { action: "PAYMENT_RECORDED", entityType: "Payment", summary: "Recorded rent payment from Emily Rodriguez" },
    { action: "MAINTENANCE_CREATED", entityType: "MaintenanceRequest", summary: "New emergency request: A/C not cooling" },
    { action: "LEASE_CREATED", entityType: "Lease", summary: "Created lease for Brickell Ave Condo #1804" },
    { action: "EXPENSE_ENTERED", entityType: "Expense", summary: "Entered expense: Water heater replacement ($1,450)" },
    { action: "DOCUMENT_UPLOADED", entityType: "Document", summary: "Uploaded Lease Agreement.pdf" },
    { action: "TENANT_CREATED", entityType: "Tenant", summary: "Added tenant Michael Chen" },
    { action: "INSPECTION_COMPLETED", entityType: "Inspection", summary: "Completed routine inspection" },
  ];
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    await prisma.activityLog.create({
      data: {
        action: a.action, entityType: a.entityType, summary: a.summary,
        userId: admin.id, propertyId: pick(properties, i).id, createdAt: daysFromNow(-i),
      },
    });
  }

  const counts = {
    properties: properties.length, units: allUnits.length, tenants: tenants.length,
    leases: leases.length, vendors: vendors.length,
    charges: await prisma.charge.count(), payments: await prisma.payment.count(),
    expenses: await prisma.expense.count(), maintenance: await prisma.maintenanceRequest.count(),
    tasks: await prisma.task.count(), documents: await prisma.document.count(),
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
