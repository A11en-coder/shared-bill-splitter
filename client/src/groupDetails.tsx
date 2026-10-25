import { useEffect, useState } from "react";
import type { Group } from "./group";

// this component is used to display the details of a group, including its name and a list of members
type GroupDetailsProps = {
  group: Group;
};

type Member = {
  id: string;
  name: string;
};

function GroupDetails({ group }: GroupDetailsProps) {
  // the members are stored in a state variable, which is initialized to an empty array
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [description, setDescription] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [payerId, setPayerId] = useState("");
  const [balance, setBalance] = useState<Record<string, number>>({});
  const [balanceRefresh, setBalanceRefresh] = useState(0); // state variable to trigger balance refresh
  const [paymentPayerId, setPaymentPayerId] = useState("");
  const [paymentPayeeId, setPaymentPayeeId] = useState("");
  const [paymentAmountDollars, setPaymentAmountDollars] = useState("");

  // fetch the members of the group when the component mounts
  useEffect(() => {
    fetch(`/api/groups/${group.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load members: ${response.status}`);
        }
        // the response is expected to be an array of Member objects, which we map to an array of member names
        return response.json() as Promise<{ members: Member[] }>;
      })
      // set the members state variable to the array of member names
      .then((data) => setMembers(data.members))
      .catch((error) => console.error("Error fetching members:", error));
  }, [group.id]);

  // fetch the balance of each member when the component mounts
  useEffect(() => {
    fetch(`/api/groups/${group.id}/balances`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load balance: ${response.status}`);
        }
        return response.json() as Promise<Record<string, number>>;
      })
      .then((data) => setBalance(data))
      .catch((error) => console.error("Error fetching balance:", error));
  }, [group.id, balanceRefresh]);

  return (
    <div>
      <h2>{group.name}</h2>
      <h3>Members:</h3>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            {member.name} - Balance: $
            {balance[member.id]
              ? (balance[member.id] / 100).toFixed(2)
              : "0.00"}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const name = newMemberName.trim();
          if (!name) return;

          fetch(`/api/groups/${group.id}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Could not add member: ${response.status}`);
              }
              return response.json() as Promise<Member>;
            })
            .then((newMember) => {
              setMembers((current) => [...current, newMember]);
              setNewMemberName("");
            })
            .catch((error) => console.error("Error adding member:", error));
        }}
      >
        <label htmlFor="new-member-name">New Member Name:</label>
        <input
          id="new-member-name"
          type="text"
          value={newMemberName}
          onChange={(event) => setNewMemberName(event.target.value)}
        />
        <button type="submit">Add Member</button>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          // convert the amount from dollars to cents
          const amountCents = Math.round(parseFloat(amountDollars) * 100);

          // check the description, amountCents, and payerId are valid
          if (
            !description.trim() ||
            isNaN(amountCents) ||
            amountCents <= 0 ||
            !payerId
          ) {
            console.error("Invalid expense data");
            return;
          }

          // further validate the amountCents to ensure it is a positive integer and does not exceed 2,147,483,647
          if (!Number.isSafeInteger(amountCents) || amountCents > 2147483647) {
            console.error("Invalid expense amount");
            return;
          }

          // send a POST request to the server to add the new expense
          fetch(`/api/groups/${group.id}/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, amountCents, payerId }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Could not add expense: ${response.status}`);
              }
              return response.json();
            })
            .then(() => {
              setDescription("");
              setAmountDollars("");
              setPayerId("");
              setBalanceRefresh((prev) => prev + 1);
            })
            .catch((error) => console.error("Error adding expense:", error));
        }}
      >
        <label htmlFor="expense-description">Expense Description:</label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <label htmlFor="expense-amount">Expense Amount:</label>
        <input
          id="expense-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amountDollars}
          onChange={(event) => setAmountDollars(event.target.value)}
        />
        <label htmlFor="payer-select">Payer:</label>
        <select
          id="payer-select"
          value={payerId}
          onChange={(event) => setPayerId(event.target.value)}
          required
        >
          <option value="">Select a payer</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <button type="submit">Add expense</button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          // validate the payment form inputs
          if (
            !paymentPayerId ||
            !paymentPayeeId ||
            paymentPayerId === paymentPayeeId ||
            isNaN(parseFloat(paymentAmountDollars)) ||
            parseFloat(paymentAmountDollars) <= 0 || !Number.isSafeInteger(Math.round(parseFloat(paymentAmountDollars) * 100)) ||
            Math.round(parseFloat(paymentAmountDollars) * 100) > 2147483647
          ) {
            console.error("Invalid payment data");
            return;
          }
          
          // convert the payment amount from dollars to cents
          const paymentAmountCents = Math.round(parseFloat(paymentAmountDollars) * 100);

          // send a POST request to the server to record the payment
          fetch(`/api/groups/${group.id}/payments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payerId: paymentPayerId,
              payeeId: paymentPayeeId,
              amountCents: paymentAmountCents,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Could not record payment: ${response.status}`);  
              }
              return response.json();
            })
            .then(() => {
              setPaymentPayerId("");
              setPaymentPayeeId("");
              setPaymentAmountDollars("");
              setBalanceRefresh((prev) => prev + 1);
            })
            .catch((error) => console.error("Error recording payment:", error));
        }}
      >
        <label htmlFor="payment-payer-select">Payment Payer:</label>
        <select
          id="payment-payer-select"
          value={paymentPayerId}
          onChange={(event) => setPaymentPayerId(event.target.value)}
          required
        >
          <option value="">Select a payer</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <label htmlFor="payment-payee-select">Payment Payee:</label>
        <select
          id="payment-payee-select"
          value={paymentPayeeId}
          onChange={(event) => setPaymentPayeeId(event.target.value)}
          required
        >
          <option value="">Select a payee</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <label htmlFor="payment-amount">Payment Amount:</label>
        <input
          id="payment-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={paymentAmountDollars}
          onChange={(event) => setPaymentAmountDollars(event.target.value)}
        />
        <button type="submit">Record Payment</button>
      </form>
    </div>
  );
}

export default GroupDetails;
