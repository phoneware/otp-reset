export default function UserInfoBar({ user, userScope, territory, domain }) {
  return (
    <div className="user-info">
      <strong>{user}</strong> &middot; {userScope}<br />
      Territory: <strong>{territory}</strong><br />
      Domain: <strong>{domain}</strong>
    </div>
  )
}
