const BASE_URL = 'https://edge.phoneware.cloud'

export async function getPhone(domain, mac, token) {
  const res = await fetch(`${BASE_URL}/domains/${domain}/phones/${mac}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) throw new Error('NOT_FOUND')
  if (res.status === 401 || res.status === 403) throw new Error('SESSION_EXPIRED')
  if (!res.ok) throw new Error('NETWORK_ERROR')
  return res.json()
}

export async function enableGlobalOtp(domain, phone, token) {
  const body = { ...phone, 'global-one-time-pass': 'yes' }
  const res = await fetch(`${BASE_URL}/domains/${domain}/phones`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401 || res.status === 403) throw new Error('SESSION_EXPIRED')
  if (!res.ok) throw new Error('NETWORK_ERROR')
  return res
}
