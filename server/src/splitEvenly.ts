// export a function that takes an amount in cents and a list of member IDs, then returns each member’s share in cents
export function splitEvenly(amountInCents: number, memberIds: string[]): Record<string, number> {
  const numMembers = memberIds.length;
    if (numMembers === 0) {
        throw new Error("No members provided");
    }
    // calculate the base share for each member
    const baseShare = Math.floor(amountInCents / numMembers);

    
    const remainder = amountInCents % numMembers;
    
    // create a record to hold each member's share
    const shares: Record<string, number> = {};
    
    // calculate the shares for each member, distributing the remainder to the first few members
    for (const [i, memberId] of memberIds.entries()) {
      shares[memberId] = baseShare + (i < remainder ? 1 : 0);
    }

    return shares;
}
