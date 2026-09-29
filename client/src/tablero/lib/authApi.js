async function request(path, options) {
  let res
  try {
    res = await fetch(path, options)
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  return res
}

export async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (res.status === 401) {
    throw new Error('Email o contraseña incorrectos.')
  }
  if (res.status >= 500) {
    throw new Error('No se pudo conectar con el servidor.')
  }
  if (!res.ok) {
    throw new Error('No se pudo iniciar sesión.')
  }

  return res.json()
}

export async function fetchMe(token) {
  const res = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return null
  return res.json()
}
