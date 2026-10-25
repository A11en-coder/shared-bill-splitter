// export a function that calculates the balances for each member based on their expenses and payments, with the starting balance for each member being 0. The payments should have both payer and payee's id. This function should also take in memberIds
export function calculateBalances(
  expenses: {
    payerId: string;
    amountCents: number;
    shares: { memberId: string; shareCents: number }[];
  }[],
  payments: { payeeId: string; payerId: string; amountCents: number }[],
  memberIds: string[],
): Record<string, number> {
  const balances: Record<string, number> = {};

  const getBalance = (memberId: string): number => {
    const balance = balances[memberId];
    if (balance === undefined) {
      throw new Error(`Unknown member ${memberId}`);
    }
    return balance;
  };

  // initialize balances for each member
  for (const memberId of memberIds) {
    balances[memberId] = 0;
  }

  // for each expense, add the amount to the payer's balance and subtract the shares from each member's balance. Rember the typechecking for shares.
  for (const expense of expenses) {
    balances[expense.payerId] =
      getBalance(expense.payerId) + expense.amountCents;
    for (const share of expense.shares) {
      if (
        typeof share.shareCents !== "number" ||
        !Number.isSafeInteger(share.shareCents)
      ) {
        throw new Error(`Invalid share amount for member ${share.memberId}`);
      }
      balances[share.memberId] =
        getBalance(share.memberId) - share.shareCents;
    }
  }

  // for each payment, increment the amount from the payer's balance and subtract it to the payee's balance
  for (const payment of payments) {
    balances[payment.payerId] =
      getBalance(payment.payerId) + payment.amountCents;
    balances[payment.payeeId] =
      getBalance(payment.payeeId) - payment.amountCents;
  }

  return balances;
}
