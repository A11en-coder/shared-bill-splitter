import express from "express";
import { prisma } from "./db";
import { splitEvenly } from "./splitEvenly";
import { calculateBalances } from "./calculateBalances";

const app = express();
app.use(express.json());

// start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// create a get /groups endpoint that returns all groups in the database
app.get("/groups", async (req, res) => {
  try {
    const groups = await prisma.group.findMany();
    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// create a post /groups endpoint that creates a new group in the database
app.post("/groups", async (req, res) => {
  try {
    const { name } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Invalid group name" });
    }
    // save the trimmed name to the database
    const newGroup = await prisma.group.create({
      data: { name: name.trim() },
    });
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add a enpoint that adds a new member to a group
app.post("/groups/:groupId/members", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Invalid member name" });
    }
    // check if the group exists and obtain the group id from the database
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    // create the new member and associate it with the group
    const newMember = await prisma.member.create({
      data: {
        name: name.trim(),
        groupId: group.id,
      },
    });
    res.status(201).json(newMember);
  } catch (error) {
    console.error("Error adding member to group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add a get endpoint that gets the group details and all its members by group id
app.get("/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    // check if the group exists and obtain the group id from the database
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add a post endpoint that adds a new expense to a group and splits the expense evenly among the members
app.post("/groups/:groupId/expenses", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amountCents, payerId } = req.body;
    // check the validity of the request body parameters
    if (typeof description !== "string" || description.trim() === "") {
      return res.status(400).json({ error: "Invalid expense description" });
    }
    // check if amountCents is a positive integer with maximum value of 2,147,483,647 (max value for a 32-bit signed integer)
    if (
      typeof amountCents !== "number" ||
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0 ||
      amountCents > 2147483647
    ) {
      return res.status(400).json({ error: "Invalid expense amount" });
    }
    if (typeof payerId !== "string" || payerId.trim() === "") {
      return res.status(400).json({ error: "Invalid payer" });
    }
    // check if the group exists and obtain the group id from the database
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!group.members.some((member) => member.id === payerId)) {
      return res
        .status(400)
        .json({ error: "Payer is not a member of the group" });
    }
    // split the expense evenly among the members
    const memberIds = group.members.map((member) => member.id);
    // Sort the member IDs to ensure consistent distribution of the remainder
    memberIds.sort();
    const shares = splitEvenly(amountCents, memberIds);

    // create the new expense and associate it with the group and members
    const newExpense = await prisma.expense.create({
      data: {
        description: description.trim(),
        amountCents: amountCents,
        groupId: group.id,
        payerId,
        shares: {
          create: Object.entries(shares).map(([memberId, shareAmount]) => ({
            shareCents: shareAmount,
            member: {
              connect: { id: memberId },
            },
          })),
        },
      },
      include: { shares: true },
    });
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error adding expense to group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add a post endpoint that records a payment made by a member to another member in a group
app.post("/groups/:groupId/payments", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { payerId, payeeId, amountCents } = req.body;
    // check the validity of the request body parameters
    if (typeof payerId !== "string" || payerId.trim() === "") {
      return res.status(400).json({ error: "Invalid payer" });
    }
    if (typeof payeeId !== "string" || payeeId.trim() === "") {
      return res.status(400).json({ error: "Invalid payee" });
    }
    if (payerId === payeeId) {
      return res.status(400).json({ error: "Payer and payee cannot be the same" });
    }
    // check if amountCents is a positive integer with maximum value of 2,147,483,647 (max value for a 32-bit signed integer)
    if (
      typeof amountCents !== "number" ||
        !Number.isSafeInteger(amountCents) ||
        amountCents <= 0 ||
        amountCents > 2147483647
    ) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }
    // check if the group exists and obtain the group id from the database
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!group.members.some((member) => member.id === payerId)) {
      return res
        .status(400)
        .json({ error: "Payer is not a member of the group" });
    }
    if (!group.members.some((member) => member.id === payeeId)) {
      return res
        .status(400)
        .json({ error: "Payee is not a member of the group" });
    }
    // create the new payment and associate it with the group and members
    const newPayment = await prisma.payment.create({
      data: {
        amountCents: amountCents,
        groupId: group.id,
        payerId,
        payeeId,
      },
    });
    res.status(201).json(newPayment);
  } catch (error) {
    console.error("Error recording payment in group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// a get endpoint that returns the balances for each member in a group by group id
app.get("/groups/:groupId/balances", async (req, res) => {
  try {
    const { groupId } = req.params;
    // check if the group exists and obtain the group id from the database
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true, expenses: { include: { shares: true } }, payments: true },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    // calculate the balances for each member in the group
    const memberIds = group.members.map((member) => member.id);
    const expenses = group.expenses.map((expense) => ({
      payerId: expense.payerId,
      amountCents: expense.amountCents,
      shares: expense.shares.map((share) => ({
        memberId: share.memberId,
        shareCents: share.shareCents,
      })),
    }));
    const payments = group.payments.map((payment) => ({
      payerId: payment.payerId,
      payeeId: payment.payeeId,
      amountCents: payment.amountCents,
    }));
    const balances = calculateBalances(expenses, payments, memberIds);
    res.json(balances);
  } catch (error) {
    console.error("Error calculating balances for group:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
    