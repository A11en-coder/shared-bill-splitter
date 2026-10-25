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
  // the members are stored in a state variable, which is initialized to an empty array. the list of members should not be strings
  const [members, setMembers] = useState<Member[]>([]);

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
    </div>
  );
}

export default GroupDetails;