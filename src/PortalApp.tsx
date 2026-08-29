import {useCallback, useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import countries from 'i18n-iso-countries'
import englishCountries from 'i18n-iso-countries/langs/en.json'
import {getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString} from 'libphonenumber-js'
import type {CountryCode} from 'libphonenumber-js'
import {portalApi} from './portalApi'
import type {Commitment, Dashboard} from './portalApi'
import './portal.css'

countries.registerLocale(englishCountries)
const countryOptions = Object.entries(countries.getNames('en', {select: 'official'}))
  .filter(([code]) => isSupportedCountry(code as CountryCode))
  .sort(([, first], [, second]) => first.localeCompare(second)) as [CountryCode, string][]

function detectedCountry(): CountryCode {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return 'IN'
  const localeCountry = new Intl.Locale(navigator.language).region?.toUpperCase()
  return localeCountry && isSupportedCountry(localeCountry) ? localeCountry as CountryCode : 'IN'
}

function PortalBrand() {
  return <a className="brand portal-brand" href="/"><span className="brand-mark"><span /></span><span>Screen <strong>Jump</strong> Focus</span></a>
}

export function PortalApp(): React.JSX.Element {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === '/login') return <AuthPage mode="login" />
  if (path === '/register') return <AuthPage mode="register" />
  const dashboardPages: Record<string, DashboardPageName> = {
    '/dashboard': 'overview',
    '/dashboard/wallet': 'wallet',
    '/dashboard/commitments': 'commitments',
    '/dashboard/activity': 'activity',
    '/dashboard/profile': 'profile',
  }
  if (!portalApi.session()) {
    window.location.replace('/login')
    return <main className="portal-loading"><PortalBrand /><div className="loading-ring" /><p>Redirecting to login…</p></main>
  }
  return <DashboardPage page={dashboardPages[path] || 'overview'} />
}

function AuthPage({mode}: {mode: 'login' | 'register'}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [countryCode, setCountryCode] = useState<CountryCode>(detectedCountry)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const isRegister = mode === 'register'

  useEffect(() => { if (portalApi.session()) window.location.replace('/dashboard') }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    const parsedMobile = isRegister ? parsePhoneNumberFromString(mobileNumber, countryCode) : null
    if (isRegister && !parsedMobile?.isValid()) { setError('Enter a valid mobile number for the selected country.'); return }
    setBusy(true)
    try {
      if (isRegister) await portalApi.register(firstName.trim(), lastName.trim(), parsedMobile!.number, countryCode, email.trim().toLowerCase(), password, termsAccepted)
      else await portalApi.login(email.trim().toLowerCase(), password)
      window.location.replace('/dashboard')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue.') }
    finally { setBusy(false) }
  }

  return <main className="portal-auth"><section className="auth-panel"><PortalBrand /><div className="auth-heading"><p className="eyebrow">SECURE WEB ACCOUNT</p><h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1><p>{isRegister ? 'View your wallet, commitments and donation proof from any browser.' : 'Login to view your Screen Jump Focus account.'}</p></div><form onSubmit={submit}>
    {isRegister ? <div className="name-grid"><label>First name<input required value={firstName} onChange={event => setFirstName(event.target.value)} /></label><label>Last name<input value={lastName} onChange={event => setLastName(event.target.value)} /></label></div> : null}
    {isRegister ? <div className="country-phone-grid"><label>Country<select value={countryCode} onChange={event => setCountryCode(event.target.value as CountryCode)}>{countryOptions.map(([code, name]) => <option key={code} value={code}>{name} (+{getCountryCallingCode(code)})</option>)}</select></label><label>Mobile number<input autoComplete="tel" inputMode="tel" maxLength={22} minLength={5} placeholder={`+${getCountryCallingCode(countryCode)} mobile number`} required type="tel" value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} /></label></div> : null}
    <label>Email<input autoComplete="email" required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
    <label>Password<div className="password-field"><input autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button></div></label>
    {isRegister ? <label className="terms-consent"><input checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} required type="checkbox" /><span>I agree to the <a href="/#guidelines" target="_blank" rel="noreferrer">Terms &amp; Conditions</a></span></label> : null}
    {error ? <p className="portal-error">{error}</p> : null}
    <button className="portal-submit" disabled={busy || (isRegister && !termsAccepted)} type="submit">{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Login'}</button>
  </form><p className="auth-switch">{isRegister ? 'Already registered?' : 'New to Screen Jump Focus?'} <a href={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create account'}</a></p><p className="auth-security">No device ID or installation ID is collected by the web portal.</p></section><aside className="auth-story"><span className="pill"><span /> Your focus account</span><div className="auth-one-percent"><strong>Built for the 1% people who choose focus over distraction.</strong><span>Protect your time. Achieve what others only plan.</span></div><h2>One calm place for your progress.</h2><p>Review wallet activity, commitment results, violations and verified donation proof. Paid commitments remain protected and can only be started from the Android app.</p><ul></ul></aside></main>
}

type DashboardPageName = 'overview' | 'wallet' | 'commitments' | 'activity' | 'profile'

function DashboardPage({page}: {page: DashboardPageName}) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [commitmentPage, setCommitmentPage] = useState(1)
  const [transactionPage, setTransactionPage] = useState(1)
  const load = useCallback(() => portalApi.dashboard(commitmentPage, transactionPage).then(setData).catch(reason => {
    if (!portalApi.session() || (reason instanceof Error && 'status' in reason && (reason.status === 401 || reason.status === 403))) {
      portalApi.clearSession()
      window.location.replace('/login')
    }
    else setError(reason instanceof Error ? reason.message : 'Unable to load dashboard.')
  }), [commitmentPage, transactionPage])
  useEffect(() => { void load() }, [load])
  const logout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return
    await portalApi.logout(); window.location.replace('/login')
  }
  const withdraw = async (amount: number) => {
    setBusy('withdrawal'); setError('')
    try { await portalApi.withdraw(amount); await load() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to request withdrawal.') }
    finally { setBusy('') }
  }
  if (!data) return <main className="portal-loading"><PortalBrand /><div className="loading-ring" /><p>{error || 'Loading your dashboard…'}</p>{error ? <button onClick={load}>Try again</button> : null}</main>
  const money = (value: number) => `₹${Number(value).toFixed(2)}`
  let content: React.JSX.Element
  if (page === 'profile') content = <ProfilePage data={data} />
  else if (page === 'wallet') content = <WalletPage data={data} money={money} busy={busy === 'withdrawal'} onWithdraw={withdraw} />
  else if (page === 'commitments') content = <CommitmentsPage data={data} onPageChange={setCommitmentPage} />
  else if (page === 'activity') content = <ActivityPage data={data} money={money} onPageChange={setTransactionPage} />
  else content = <OverviewPage data={data} money={money} />

  return <div className="portal-dashboard"><div className="dashboard-layout"><DashboardSidebar active={page} data={data} onLogout={logout} /><div className="dashboard-page">{error ? <p className="dashboard-error">{error}</p> : null}{content}</div></div></div>
}

function DashboardSidebar({active, data, onLogout}: {active: DashboardPageName; data: Dashboard; onLogout(): Promise<void>}) {
  const initial = (data.user.first_name || data.user.email).charAt(0).toUpperCase()
  return <aside className="dashboard-sidebar"><div className="sidebar-brand"><PortalBrand /></div><nav className="sidebar-nav" aria-label="Dashboard navigation"><a className={active === 'overview' ? 'active' : ''} href="/dashboard"><span>⌂</span>Overview</a><a className={active === 'wallet' ? 'active' : ''} href="/dashboard/wallet"><span>₹</span>Wallet</a><a className={active === 'commitments' ? 'active' : ''} href="/dashboard/commitments"><span>✓</span>Commitments</a><a className={active === 'activity' ? 'active' : ''} href="/dashboard/activity"><span>↕</span>Activity</a><a className={`mobile-profile ${active === 'profile' ? 'active' : ''}`} href="/dashboard/profile"><span>{initial}</span>Profile</a></nav><div className="sidebar-bottom"><a className="sidebar-app" href="/app-install"><span>▣</span>Get Android app</a><button onClick={() => void onLogout()} type="button"><span>↪</span>Logout</button><a className={`sidebar-user ${active === 'profile' ? 'active' : ''}`} href="/dashboard/profile"><span className="sidebar-avatar">{initial}</span><div><strong>{data.user.full_name}</strong><small>{data.user.email}</small></div><b>›</b></a></div></aside>
}

function OverviewPage({data, money}: {data: Dashboard; money(value: number): string}) {
  return <main className="dashboard-main"><div className="dashboard-welcome"><div><p className="eyebrow">ACCOUNT DASHBOARD</p><h1>Welcome, {data.user.first_name}</h1><p>{data.user.email}{data.customer ? ` · Customer ${data.customer}` : ''}</p></div><a className="app-link" href="/app-install">Get Android app</a></div><section className="balance-grid"><Balance label="Available" value={money(data.wallet.available_balance)} tone="green" /><Balance label="Locked" value={money(data.wallet.locked_balance)} /><Balance label="Pending donation" value={money(data.wallet.pending_donation_balance)} tone="red" /><Balance label="Pending withdrawal" value={money(data.wallet.pending_withdrawal_balance)} tone="blue" /></section></main>
}

function WalletPage({data, money, busy, onWithdraw}: {data: Dashboard; money(value: number): string; busy: boolean; onWithdraw(amount: number): void}) {
  const [amount, setAmount] = useState('')
  const available = Number(data.wallet.available_balance)
  const requestedAmount = Number(amount)
  const validAmount = Number.isFinite(requestedAmount) && requestedAmount > 0 && requestedAmount <= available
  return <main className="dashboard-main"><PageHeading eyebrow="WALLET" title="Your wallet" description="Review available, locked and pending balances." /><section className="balance-grid"><Balance label="Available" value={money(available)} tone="green" /><Balance label="Locked" value={money(data.wallet.locked_balance)} /><Balance label="Pending donation" value={money(data.wallet.pending_donation_balance)} tone="red" /><Balance label="Pending withdrawal" value={money(data.wallet.pending_withdrawal_balance)} tone="blue" /></section><section className="withdraw-panel"><div><small>WITHDRAW AVAILABLE BALANCE</small><h2>Request a withdrawal</h2><p>Enter an amount up to your available balance. After requesting, it moves to pending withdrawal until payout is processed.</p></div><div className="withdraw-form"><label>Amount<input max={available} min="1" placeholder="₹0.00" step="0.01" type="number" value={amount} onChange={event => setAmount(event.target.value)} /></label><button disabled={busy || !validAmount} onClick={() => onWithdraw(requestedAmount)} type="button">{busy ? 'Requesting…' : 'Request withdrawal'}</button></div></section><section className="portal-recharge"><div><small>WALLET RECHARGE</small><h2>Online recharge is coming soon</h2><p>Wallet balance cannot be manually changed from this dashboard. Future credits will be added only after a verified payment-gateway webhook.</p></div><span>Future feature</span></section></main>
}

function CommitmentsPage({data, onPageChange}: {data: Dashboard; onPageChange(page: number): void}) {
  return <main className="dashboard-main paginated-main"><PageHeading eyebrow="COMMITMENTS" title="Your commitment history" description="Paid commitments can only be started and verified in the Android app." /><section className="dashboard-section paginated-section"><div className="commitment-grid">{data.commitments.length ? data.commitments.map(item => <CommitmentCard key={item.name} commitment={item} />) : <Empty text="No paid commitments yet." />}</div><PaginationControls pagination={data.pagination.commitments} onChange={onPageChange} /></section></main>
}

function ActivityPage({data, money, onPageChange}: {data: Dashboard; money(value: number): string; onPageChange(page: number): void}) {
  return <main className="dashboard-main paginated-main"><PageHeading eyebrow="WALLET ACTIVITY" title="Transactions" description="Review all activity recorded against your wallet." /><section className="dashboard-section paginated-section"><div className="transaction-table">{data.transactions.length ? data.transactions.map(item => <div className="transaction-row" key={item.name}><span className={`transaction-icon ${item.transaction_type.toLowerCase()}`}>{item.transaction_type[0]}</span><div><strong>{item.transaction_type}</strong><small>{new Date(item.processed_at).toLocaleString()}{item.note ? ` · ${item.note}` : ''}</small></div><b>{money(item.amount)}</b><em>{item.status}</em></div>) : <Empty text="No wallet transactions yet." />}</div><PaginationControls pagination={data.pagination.transactions} onChange={onPageChange} /></section></main>
}

function PaginationControls({pagination, onChange}: {pagination: Dashboard['pagination']['commitments']; onChange(page: number): void}) {
  return <nav className="pagination-controls" aria-label="Pagination"><button disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)} type="button">Previous</button><span>Page {pagination.page} of {pagination.total_pages} · {pagination.total} records</span><button disabled={pagination.page >= pagination.total_pages} onClick={() => onChange(pagination.page + 1)} type="button">Next</button></nav>
}

function PageHeading({eyebrow, title, description}: {eyebrow: string; title: string; description: string}) {
  return <div className="dashboard-welcome"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></div>
}

function ProfilePage({data}: {data: Dashboard}) {
  return <main className="dashboard-main profile-main"><div className="dashboard-welcome"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Review the details connected to your Screen Jump Focus account.</p></div></div><section className="profile-card"><div className="profile-hero"><span>{(data.user.first_name || data.user.email).charAt(0).toUpperCase()}</span><div><h2>{data.user.full_name}</h2><p>Screen Jump Focus member</p></div></div><div className="profile-details"><ProfileDetail label="First name" value={data.user.first_name} /><ProfileDetail label="Last name" value={data.user.last_name || '—'} /><ProfileDetail label="Email" value={data.user.email} /><ProfileDetail label="Customer account" value={data.customer || 'Not linked'} /></div></section><section className="profile-security"><strong>Your financial data stays protected</strong><p>Paid commitments can only be started and verified through the Android app. This website never receives your app setup details.</p></section></main>
}

function ProfileDetail({label, value}: {label: string; value: string}) {
  return <div><small>{label}</small><strong>{value}</strong></div>
}

function Balance({label, value, tone = ''}: {label: string; value: string; tone?: string}) { return <article className={`balance-card ${tone}`}><small>{label}</small><strong>{value}</strong></article> }
function Empty({text}: {text: string}) { return <div className="portal-empty">{text}</div> }

function CommitmentCard({commitment}: {commitment: Commitment}) {
  return <article className="web-commitment"><div className="web-commitment-top"><span className={`status-badge ${commitment.status.toLowerCase()}`}>{commitment.status}</span><strong>₹{Number(commitment.deposit_amount).toFixed(2)}</strong></div><h3>{commitment.goal_days}-day commitment</h3><p>{new Date(commitment.start_at).toLocaleDateString()} → {new Date(commitment.end_at).toLocaleDateString()}</p>{commitment.awaiting_mobile_verification ? <div className="verification-note">Open the Android app online to verify completion.</div> : null}{commitment.violation ? <div className="violation-note"><strong>{commitment.violation.reason}</strong><span>Detected {new Date(commitment.violation.detected_at).toLocaleString()}</span></div> : null}{commitment.donation ? <a className="proof-link" href={commitment.donation.proof_url} target="_blank" rel="noreferrer">View donation proof ↗</a> : null}<small className="terms-version">Terms: {commitment.terms_version}</small></article>
}
