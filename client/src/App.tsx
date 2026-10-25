import "./App.css";
import { useEffect, useState } from "react";
import GroupForm from "./groupForm";
import GroupList from "./groupList";
import type { Group } from "./group";

function App() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetch("/api/groups")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load groups: ${response.status}`);
        }
        return response.json() as Promise<Group[]>;
      })
      .then((data) => setGroups(data))
      .catch((error) => console.error("Error fetching groups:", error));
  }, []);

  return (
    <>
      <h1>Shared Bills</h1>
      <GroupForm onCreated={(newGroup) => setGroups((current) => [...current, newGroup])} />
      <GroupList groups={groups} />
    </>
  );
}

export default App;
