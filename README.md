## Main user actions
1. create group.
2. add group members.
3. record an expense paid by one member.
4. See each person's balance.
5. Record a payment from one group member to another to reduce a debt.

## Table Design
1. member
- id: unique
- name: string
- group: group
- createdAt: timestamp
- updatedAt: timestamp

2. expense
- id: unique
- amount: int
- createdBy: member
- paidBy: member
- group: group
- createdAt: timestamp
- updatedAt: timestamp

3. memberShare
- id: unique
- amount: int
- member: member
- expense: expense
- createdAt
- updatedAt

4. recordedPayments
- id: unique
- amount: int
- group: group
- fromMember: member
- toMember: member
- createdAt: timestamp
- updatedAt: timestamp

5. group
- id: unique
- name: string
- members: list
- createdAt: timestamp
- updatedAt: timestamp

## Example

Group: Flatmates  
Members: Alex, Blair, Casey

Expense:
- amount: 3000 cents ($30.00)
- group: Flatmates
- paidBy: Alex

Member shares for that expense:
- Alex: 1000 cents ($10.00)
- Blair: 1000 cents ($10.00)
- Casey: 1000 cents ($10.00)

Recorded payment:
- amount: 500 cents ($5.00)
- group: Flatmates
- fromMember: Blair
- toMember: Alex

Balances after the expense: Alex +$20.00, Blair -$10.00, Casey -$10.00.  
Balances after the payment: Alex +$15.00, Blair -$5.00, Casey -$10.00.

The payment reduces Blair's existing debt to Alex. Future expenses are split using their own amounts and shares.
