// Single source of truth for all financial formulas.
// Every function is pure and documented so the UI can surface the formula via tooltip.

export const METRIC_FORMULAS = {
  noi: "NOI = Effective Gross Income − Operating Expenses (excludes debt service & capex)",
  capRate: "Cap Rate = Annual NOI ÷ Property Value",
  cashOnCash: "Cash-on-Cash = Annual Pre-Tax Cash Flow ÷ Cash Invested",
  cashFlow: "Cash Flow = NOI − Annual Debt Service",
  equity: "Equity = Estimated Value − Mortgage Balance",
  ltv: "LTV = Mortgage Balance ÷ Estimated Value",
  expenseRatio: "Expense Ratio = Operating Expenses ÷ Effective Gross Income",
  occupancy: "Occupancy Rate = Occupied Units ÷ Total Units",
  collectionRate: "Collection Rate = Rent Collected ÷ Rent Billed",
  egi: "Effective Gross Income = Gross Rental Income − Vacancy Loss + Other Income",
  grm: "Gross Rent Multiplier = Property Value ÷ Annual Gross Rent",
} as const;

const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

/** Net Operating Income (annual). Operating expenses exclude mortgage & capex. */
export function noi(effectiveGrossIncome: number, operatingExpenses: number): number {
  return effectiveGrossIncome - operatingExpenses;
}

/** Cap rate as a percentage. */
export function capRate(annualNoi: number, propertyValue: number): number {
  return safeDiv(annualNoi, propertyValue) * 100;
}

/** Annual cash flow after debt service. */
export function cashFlow(annualNoi: number, annualDebtService: number): number {
  return annualNoi - annualDebtService;
}

/** Cash-on-cash return as a percentage. */
export function cashOnCash(annualCashFlow: number, cashInvested: number): number {
  return safeDiv(annualCashFlow, cashInvested) * 100;
}

export function equity(estimatedValue: number, mortgageBalance: number): number {
  return estimatedValue - mortgageBalance;
}

/** Loan-to-value as a percentage. */
export function ltv(mortgageBalance: number, estimatedValue: number): number {
  return safeDiv(mortgageBalance, estimatedValue) * 100;
}

/** Operating expense ratio as a percentage. */
export function expenseRatio(operatingExpenses: number, egi: number): number {
  return safeDiv(operatingExpenses, egi) * 100;
}

export function occupancyRate(occupiedUnits: number, totalUnits: number): number {
  return safeDiv(occupiedUnits, totalUnits) * 100;
}

export function collectionRate(collected: number, billed: number): number {
  return safeDiv(collected, billed) * 100;
}

export function effectiveGrossIncome(
  grossRent: number,
  vacancyLoss: number,
  otherIncome: number,
): number {
  return grossRent - vacancyLoss + otherIncome;
}

export function grossRentMultiplier(value: number, annualGrossRent: number): number {
  return safeDiv(value, annualGrossRent);
}

/** Full per-property financial snapshot from raw annualized inputs. */
export interface PropertyFinancialInputs {
  annualGrossRent: number;
  vacancyLoss: number;
  otherIncome: number;
  operatingExpenses: number; // excludes mortgage principal/interest & capex
  annualDebtService: number;
  estimatedValue: number;
  mortgageBalance: number;
  cashInvested: number;
}

export interface PropertyFinancials {
  grossRent: number;
  egi: number;
  operatingExpenses: number;
  noi: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  capRate: number;
  cashOnCash: number;
  equity: number;
  ltv: number;
  expenseRatio: number;
}

export function computePropertyFinancials(
  i: PropertyFinancialInputs,
): PropertyFinancials {
  const egi = effectiveGrossIncome(i.annualGrossRent, i.vacancyLoss, i.otherIncome);
  const operating = i.operatingExpenses;
  const netOperating = noi(egi, operating);
  const annualCashFlow = cashFlow(netOperating, i.annualDebtService);
  return {
    grossRent: i.annualGrossRent,
    egi,
    operatingExpenses: operating,
    noi: netOperating,
    annualCashFlow,
    monthlyCashFlow: annualCashFlow / 12,
    capRate: capRate(netOperating, i.estimatedValue),
    cashOnCash: cashOnCash(annualCashFlow, i.cashInvested),
    equity: equity(i.estimatedValue, i.mortgageBalance),
    ltv: ltv(i.mortgageBalance, i.estimatedValue),
    expenseRatio: expenseRatio(operating, egi),
  };
}
