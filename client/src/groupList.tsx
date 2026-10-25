import type { Group } from "./group";
import GroupDetails from "./groupDetails";
import { useState } from "react";

type GroupListProps = {
  groups: Group[];
};

function GroupList({ groups }: GroupListProps) {
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  return (
    <div>
        <h2>Groups</h2>
        <ul>
            {groups.map((group) => (
                <li key={group.id}>
                    <button onClick={() => setSelectedGroup(group)}>{group.name}</button>
                </li>
            ))}
        </ul>
        {selectedGroup && <GroupDetails group={selectedGroup} />}
    </div>
  );
}

export default GroupList;
