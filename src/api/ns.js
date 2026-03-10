let parentOrigin = null
let requestId = 0
const pendingRequests = new Map()

export function setParentOrigin(origin) {
  parentOrigin = origin
}

function proxyFetch(request) {
  return new Promise((resolve, reject) => {
    if (!parentOrigin) {
      reject(new Error('NETWORK_ERROR'))
      return
    }
    const id = ++requestId
    pendingRequests.set(id, { resolve, reject })
    window.parent.postMessage({ type: 'apiRequest', id, ...request }, parentOrigin)
  })
}

window.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'apiResponse') return
  const pending = pendingRequests.get(data.id)
  if (!pending) return
  pendingRequests.delete(data.id)
  if (data.error) {
    pending.reject(new Error(data.error))
  } else {
    pending.resolve(data.result)
  }
})

export async function getPhone(domain, mac, token) {
  return proxyFetch({ action: 'getPhone', domain, mac, token })
}

export async function enableGlobalOtp(domain, phone, token) {
  return proxyFetch({ action: 'enableOtp', domain, phone, token })
}
