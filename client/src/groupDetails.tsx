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

  return (
    <div>
      <h2>{group.name}</h2>
      <h3>Members:</h3>
      <ul>
        {members.map((member) => (
          <li key={member.id}>{member.name}</li>
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
    </div>
  );
}

export default GroupDetails;
