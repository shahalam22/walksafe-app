"use client";

import { useLoader } from "@/hooks/useLoader";
import { fetchUsers } from "@/lib/admin-data";
import { AddUserForm } from "./AddUserForm";
import { UsersTable } from "./UsersTable";

/** Accounts: add a user or an admin; change or delete users. */
export function UsersPanel() {
  const users = useLoader(fetchUsers);
  return (
    <>
      <AddUserForm onAdded={users.reload} />
      <div className="card">
        <h2 className="card-title">Users</h2>
        <p className="muted small">Adding, changing or removing users needs the server to be running.</p>
        {users.error
          ? <p className="error">{users.error}</p>
          : <UsersTable users={users.data} onChanged={users.reload} />}
      </div>
    </>
  );
}
