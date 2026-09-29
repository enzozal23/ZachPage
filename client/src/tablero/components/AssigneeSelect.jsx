function userLabel(user) {
  return user.username || user.email
}

function AssigneeSelect({ value, users, onChange }) {
  const labels = new Set(users.map(userLabel))
  const current = value || ''

  return (
    <select value={current} onChange={(e) => onChange(e.target.value)}>
      <option value="">Sin asignar</option>
      {current && !labels.has(current) && <option value={current}>{current}</option>}
      {users.map((user) => {
        const label = userLabel(user)
        return (
          <option key={user.id} value={label}>
            {label}
          </option>
        )
      })}
    </select>
  )
}

export default AssigneeSelect
