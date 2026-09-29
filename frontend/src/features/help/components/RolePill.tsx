/** Who can do what the article describes; read from the page's `role` front matter. */
export function RolePill({ role }: { role: string }) {
  return (
    <span className="help-role">
      <span className="help-role-label">Role</span> {role}
    </span>
  )
}
