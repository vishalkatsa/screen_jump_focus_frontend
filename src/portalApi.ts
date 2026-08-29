const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://screen.localhost:8000').replace(/\/$/, '')
const portalPath = '/api/method/screen_jump_focus.api.web_portal'

export type PortalUser = {email: string; first_name: string; last_name?: string; full_name: string; user_image?: string}
export type PortalSession = {access_token: string; refresh_token: string; access_expires_in: number; refresh_expires_in: number; user: PortalUser}
export type Wallet = {currency: string; available_balance: number; locked_balance: number; pending_donation_balance: number; pending_withdrawal_balance: number}
export type Commitment = {
  name: string; status: string; goal_days: number; start_at: string; end_at: string;
  deposit_amount: number; terms_version: string; awaiting_mobile_verification: boolean;
  violation?: {reason: string; detected_at: string; status: string} | null;
  donation?: {organisation: string; proof_url: string; donated_at: string} | null;
}
export type Transaction = {name: string; transaction_type: string; amount: number; status: string; commitment?: string; note?: string; processed_at: string}
export type Pagination = {page: number; page_size: number; total: number; total_pages: number}
export type Dashboard = {user: PortalUser; customer?: string; wallet: Wallet; commitments: Commitment[]; transactions: Transaction[]; pagination: {commitments: Pagination; transactions: Pagination}; recharge: {enabled: boolean; message: string}}

const storageKey = 'screen_jump_focus_web_session'

export class PortalApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

function savedSession(): PortalSession | null {
  const value = sessionStorage.getItem(storageKey)
  if (!value) return null
  try { return JSON.parse(value) as PortalSession } catch { sessionStorage.removeItem(storageKey); return null }
}

function saveSession(session: PortalSession | null) {
  if (session) sessionStorage.setItem(storageKey, JSON.stringify(session))
  else sessionStorage.removeItem(storageKey)
}

async function request<T>(method: string, body?: object, accessToken?: string, query?: Record<string, number | string>): Promise<T> {
  let response: Response
  try {
    const search = query ? `?${new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)])).toString()}` : ''
    response = await fetch(`${API_BASE_URL}${portalPath}.${method}${search}`, {
      method: body ? 'POST' : 'GET',
      headers: {Accept: 'application/json', ...(body ? {'Content-Type': 'application/json'} : {}), ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {})},
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new PortalApiError('Cannot reach the server. Please try again.', 0)
  }
  const payload = await response.json().catch(() => ({})) as {message?: T | string; _error_message?: string; _server_messages?: string}
  if (!response.ok) throw new PortalApiError(errorMessage(payload, response.status), response.status)
  if (payload.message === undefined) throw new PortalApiError('Server returned an invalid response.', 502)
  return payload.message as T
}

function errorMessage(payload: {message?: unknown; _error_message?: string; _server_messages?: string}, status: number) {
  if (payload._error_message) return payload._error_message
  if (payload._server_messages) {
    try {
      const messages = JSON.parse(payload._server_messages) as string[]
      const parsed = messages.map(item => { try { return (JSON.parse(item) as {message?: string}).message } catch { return item } }).find(Boolean)
      if (parsed) return parsed
    } catch { /* use fallback */ }
  }
  if (typeof payload.message === 'string') return payload.message
  if (status === 401 || status === 403) return 'Your session has expired. Please login again.'
  return 'Unable to complete the request. Please try again.'
}

async function authorized<T>(method: string, body?: object, query?: Record<string, number | string>): Promise<T> {
  const session = savedSession()
  if (!session) throw new PortalApiError('Login is required.', 401)
  try {
    return await request<T>(method, body, session.access_token, query)
  } catch (error) {
    if (!(error instanceof PortalApiError) || (error.status !== 401 && error.status !== 403)) throw error
    try {
      const next = await request<PortalSession>('refresh', {refresh_token: session.refresh_token})
      saveSession(next)
      return await request<T>(method, body, next.access_token, query)
    } catch (refreshError) {
      saveSession(null)
      throw refreshError
    }
  }
}

export const portalApi = {
  session: savedSession,
  clearSession: () => saveSession(null),
  async login(email: string, password: string) {
    const session = await request<PortalSession>('login', {email, password}); saveSession(session); return session
  },
  async register(firstName: string, lastName: string, mobileNumber: string, countryCode: string, email: string, password: string, termsAccepted: boolean) {
    const session = await request<PortalSession>('register', {first_name: firstName, last_name: lastName, mobile_number: mobileNumber, country_code: countryCode, email, password, terms_accepted: termsAccepted}); saveSession(session); return session
  },
  dashboard: (commitmentPage = 1, transactionPage = 1) => authorized<Dashboard>('dashboard', undefined, {commitment_page: commitmentPage, transaction_page: transactionPage}),
  withdraw: (amount: number) => authorized<{transaction: string; status: string; wallet: Wallet}>('withdraw', {amount}),
  async logout() {
    const session = savedSession(); saveSession(null)
    if (session) await request('logout', {refresh_token: session.refresh_token}, session.access_token).catch(() => undefined)
  },
}
