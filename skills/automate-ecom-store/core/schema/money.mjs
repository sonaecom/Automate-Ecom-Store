/** Money is an integer minor-unit amount plus an ISO currency. */

export function money(amountMinor, currency) {
  if (!Number.isInteger(amountMinor)) throw new Error("MONEY_MINOR");
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) throw new Error("MONEY_CURRENCY");
  return { amountMinor, currency };
}

export function gmvMatches(branchTotals, companyTotal) {
  if (!branchTotals.every((row) => row.currency === companyTotal.currency)) return false;
  const sum = branchTotals.reduce((total, row) => total + row.amountMinor, 0);
  return sum === companyTotal.amountMinor;
}
