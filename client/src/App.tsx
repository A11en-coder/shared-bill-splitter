import "./App.css";
import { useEffect, useState } from "react";

function App() {
  type Group = {
    id: string;
    name: string;
  };

  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState<string>("");

  // Fetch groups from the backend API
  useEffect(() => {
    fetch("/api/groups")
      .then((response) => response.json())
      .then((data) => setGroups(data))
      .catch((error) => console.error("Error fetching groups:", error));
  }, []);

  return (
    <>
      <h1>Shared Bills</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault(); 
          if (newGroupName.trim() === "") return;

          fetch("/api/groups", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: newGroupName }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("network response failed");
              }
              return response.json();
            })
            .then((newGroup) => {
              setGroups([...groups, newGroup]);
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
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button type = "submit">Create Group</button>
      </form>
      <ul>
        {groups.map((group) => (
          <li key={group.id}>{group.name}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
