"use client";

import { changeAccount, deleteAccount } from "@/lib/accounts";
import { userName, type UserRow } from "@/lib/admin-data";
import { fmtDateTime, fmtNum } from "@/lib/format";
import { explain } from "@/lib/server-api";

type Action = "password" | "active" | "delete";

/** Asks what it needs, then runs the change. False if the admin cancelled. */
async function runAction(u: UserRow, action: Action) {
  const name = userName(u);
  if (action === "password") {
    const password = prompt(`New password for ${name} (at least 6 characters):`);
    if (!password) return false;
    await changeAccount(u.id, { password });
    alert(`Password changed for ${name}.`);
  } else if (action === "active") {
    await changeAccount(u.id, { active: !u.is_active });
  } else {
    if (!confirm(`Delete ${name}? They can no longer sign in. Their sessions are kept.`)) return false;
    await deleteAccount(u.id);
  }
  return true;
}

// Admins are listed but not changed here: each admin manages their own password.
export function UsersTable({ users, onChanged }: { users: UserRow[] | undefined; onChanged: () => void }) {
  async function act(u: UserRow, action: Action) {
    try {
      if (await runAction(u, action)) onChanged();
    } catch (err) {
      alert(explain(err));
    }
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Sessions</th><th>Added</th><th />
          </tr>
        </thead>
        <tbody>
          {!users && <tr><td colSpan={7} className="empty">Loading…</td></tr>}
          {users?.map((u) => (
            <tr key={u.id}>
              <td>{u.display_name || "—"}</td>
              <td>{u.email}</td>
              <td>{u.role === "admin" ? "Admin" : "Blind user"}</td>
              <td>{u.is_active ? "Active" : "Turned off"}</td>
              <td className="num">{fmtNum(u.sessions[0]?.count ?? 0)}</td>
              <td>{fmtDateTime(u.created_at)}</td>
              <td className="actions">
                {u.role !== "admin" && (
                  <>
                    <button type="button" className="btn small" onClick={() => act(u, "password")}>New password</button>
                    <button type="button" className="btn small" onClick={() => act(u, "active")}>
                      {u.is_active ? "Turn off" : "Turn on"}
                    </button>
                    <button type="button" className="btn small danger" onClick={() => act(u, "delete")}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
