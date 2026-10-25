import { useState } from "react";
import type { Group } from "./group";

type GroupFormProps = {
  onCreated: (group: Group) => void;
};

function GroupForm({ onCreated }: GroupFormProps) {
  const [newGroupName, setNewGroupName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const name = newGroupName.trim();
        if (!name) return;

        fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Could not create group: ${response.status}`);
            }
            return response.json() as Promise<Group>;
          })
          .then((newGroup) => {
            onCreated(newGroup);
            setNewGroupName("");
          })
          .catch((error) => console.error("Error creating group:", error));
      }}
    >
      <label htmlFor="new-group-name">New Group Name:</label>
      <input
        id="new-group-name"
        type="text"
        value={newGroupName}
        onChange={(event) => setNewGroupName(event.target.value)}
      />
      <button type="submit">Create Group</button>
    </form>
  );
}

export default GroupForm;
