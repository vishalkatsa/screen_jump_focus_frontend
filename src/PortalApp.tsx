import {useCallback, useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import countries from 'i18n-iso-countries'
import englishCountries from 'i18n-iso-countries/langs/en.json'
import {getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString} from 'libphonenumber-js'
import type {CountryCode} from 'libphonenumber-js'
import {portalApi} from './portalApi'
import type {Bank, BankAccount, Dashboard, RechargeQuote, WithdrawalRequest} from './portalApi'
import {PAID_COMMITMENTS_ENABLED} from './featureFlags'
import './portal.css'

type CashfreeCheckoutResult = {error?: {message?: string}}
type CashfreeInstance = {checkout(options: {paymentSessionId: string; redirectTarget: '_self' | '_modal'}): Promise<CashfreeCheckoutResult>}
declare global { interface Window { Cashfree?: (options: {mode: 'sandbox' | 'production'}) => CashfreeInstance } }
let cashfreeScript: Promise<void> | null = null

function loadCashfree(): Promise<void> {
  if (window.Cashfree) return Promise.resolve()
  if (cashfreeScript) return cashfreeScript
  cashfreeScript = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load secure payment checkout.'))
    document.head.appendChild(script)
  })
  return cashfreeScript
}

countries.registerLocale(englishCountries)
const formatMoney = (value: number) => `₹${Number(value).toFixed(2)}`
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
  const [authReady, setAuthReady] = useState(false)
  useEffect(() => { void portalApi.restore().finally(() => setAuthReady(true)) }, [])
  if (!authReady) return <main className="portal-loading"><PortalBrand /><div className="loading-ring" /><p>Checking your session…</p></main>
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === '/login') return <AuthPage mode="login" />
  if (path === '/register') return <AuthPage mode="register" />
  const dashboardPages: Record<string, DashboardPageName> = {
    '/dashboard': 'overview',
    '/dashboard/wallet': 'wallet',
    '/dashboard/withdrawal': 'withdrawal',
    '/dashboard/bank-accounts': 'bank-accounts',
    '/dashboard/activity': 'activity',
    '/dashboard/profile': 'profile',
  }
  if (PAID_COMMITMENTS_ENABLED) dashboardPages['/dashboard/commitments'] = 'commitments'
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

  return <main className="portal-auth"><section className="auth-panel"><PortalBrand /><div className="auth-heading"><p className="eyebrow">SECURE WEB ACCOUNT</p><h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1><p>{isRegister ? 'View your wallet and payout details from any browser.' : 'Login to view your Screen Jump Focus account.'}</p></div><form onSubmit={submit}>
    {isRegister ? <div className="name-grid"><label>First name<input required value={firstName} onChange={event => setFirstName(event.target.value)} /></label><label>Last name<input value={lastName} onChange={event => setLastName(event.target.value)} /></label></div> : null}
    {isRegister ? <div className="country-phone-grid"><label>Country<select value={countryCode} onChange={event => setCountryCode(event.target.value as CountryCode)}>{countryOptions.map(([code, name]) => <option key={code} value={code}>{name} (+{getCountryCallingCode(code)})</option>)}</select></label><label>Mobile number<input autoComplete="tel" inputMode="tel" maxLength={22} minLength={5} placeholder={`+${getCountryCallingCode(countryCode)} mobile number`} required type="tel" value={mobileNumber} onChange={event => setMobileNumber(event.target.value)} /></label></div> : null}
    <label>Email<input autoComplete="email" required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
    <label>Password<div className="password-field"><input autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setVisible(value => !value)}>{visible ? 'Hide' : 'Show'}</button></div></label>
    {isRegister ? <label className="terms-consent"><input checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} required type="checkbox" /><span>I agree to the <a href="/#guidelines" target="_blank" rel="noreferrer">Terms &amp; Conditions</a></span></label> : null}
    {error ? <p className="portal-error">{error}</p> : null}
    <button className="portal-submit" disabled={busy || (isRegister && !termsAccepted)} type="submit">{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Login'}</button>
  </form><p className="auth-switch">{isRegister ? 'Already registered?' : 'New to Screen Jump Focus?'} <a href={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create account'}</a></p><p className="auth-security">No device ID or installation ID is collected by the web portal.</p></section><aside className="auth-story"><span className="pill"><span /> Your focus account</span><div className="auth-one-percent"><strong>Built for the 1% people who choose focus over distraction.</strong><span>Protect your time. Achieve what others only plan.</span></div><h2>One calm place for your progress.</h2><p>Review wallet activity, bank accounts and withdrawal requests from a clean web dashboard.</p><ul></ul></aside></main>
}

type DashboardPageName = 'overview' | 'wallet' | 'withdrawal' | 'bank-accounts' | 'commitments' | 'activity' | 'profile'

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
  const withdraw = async (amount: number, bankAccountId: string) => {
	setBusy('withdrawal'); setError('')
	try { await portalApi.withdraw(amount, bankAccountId); await load() }
	catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to request withdrawal.'); throw reason }
    finally { setBusy('') }
  }
  if (!data) return <main className="portal-loading"><PortalBrand /><div className="loading-ring" /><p>{error || 'Loading your dashboard…'}</p>{error ? <button onClick={load}>Try again</button> : null}</main>
  const money = formatMoney
  let content: React.JSX.Element
  if (page === 'profile') content = <ProfilePage data={data} />
  else if (page === 'wallet') content = <WalletPage data={data} money={money} onReload={load} />
  else if (page === 'withdrawal') content = <WithdrawalPage data={data} money={money} busy={busy === 'withdrawal'} onWithdraw={withdraw} />
  else if (page === 'bank-accounts') content = <BankAccountsPage userName={data.user.full_name} />
  else if (PAID_COMMITMENTS_ENABLED && page === 'commitments') content = <CommitmentsPage data={data} onPageChange={setCommitmentPage} />
  else if (page === 'activity') content = <ActivityPage data={data} money={money} onPageChange={setTransactionPage} />
  else content = <OverviewPage data={data} money={money} />

  return <div className="portal-dashboard"><div className="dashboard-layout"><DashboardSidebar active={page} data={data} onLogout={logout} /><div className="dashboard-page">{error ? <p className="dashboard-error">{error}</p> : null}{content}</div></div></div>
}

function DashboardSidebar({active, data, onLogout}: {active: DashboardPageName; data: Dashboard; onLogout(): Promise<void>}) {
  const initial = (data.user.first_name || data.user.email).charAt(0).toUpperCase()
  return <aside className="dashboard-sidebar"><div className="sidebar-brand"><PortalBrand /></div><nav className="sidebar-nav" aria-label="Dashboard navigation"><a className={active === 'overview' ? 'active' : ''} href="/dashboard"><span>⌂</span>Overview</a><a className={active === 'wallet' ? 'active' : ''} href="/dashboard/wallet"><span>₹</span>Wallet</a><a className={active === 'withdrawal' ? 'active' : ''} href="/dashboard/withdrawal"><span>⇩</span>Withdrawal</a><a className={active === 'bank-accounts' ? 'active' : ''} href="/dashboard/bank-accounts"><span>▤</span>Bank Accounts</a>{PAID_COMMITMENTS_ENABLED ? <a className={active === 'commitments' ? 'active' : ''} href="/dashboard/commitments"><span>✓</span>Commitments</a> : null}<a className={active === 'activity' ? 'active' : ''} href="/dashboard/activity"><span>↕</span>Activity</a><a className={`mobile-profile ${active === 'profile' ? 'active' : ''}`} href="/dashboard/profile"><span>{initial}</span>Profile</a></nav><div className="sidebar-bottom"><a className="sidebar-app" href="/app-install"><span>▣</span>Get Android app</a><button onClick={() => void onLogout()} type="button"><span>↪</span>Logout</button><a className={`sidebar-user ${active === 'profile' ? 'active' : ''}`} href="/dashboard/profile"><span className="sidebar-avatar">{initial}</span><div><strong>{data.user.full_name}</strong><small>{data.user.email}</small></div><b>›</b></a></div></aside>
}

function OverviewPage({data, money}: {data: Dashboard; money(value: number): string}) {
  return <main className="dashboard-main"><div className="dashboard-welcome"><div><p className="eyebrow">ACCOUNT DASHBOARD</p><h1>Welcome, {data.user.first_name}</h1><p>{data.user.email}{data.customer ? ` · Customer ${data.customer}` : ''}</p></div><a className="app-link" href="/app-install">Get Android app</a></div><section className="balance-grid"><Balance label="Available" value={money(data.wallet.available_balance)} tone="green" />{PAID_COMMITMENTS_ENABLED ? <><Balance label="Locked" value={money(data.wallet.locked_balance)} /><Balance label="Pending donation" value={money(data.wallet.pending_donation_balance)} tone="red" /></> : null}<Balance label="Pending withdrawal" value={money(data.wallet.pending_withdrawal_balance)} tone="blue" /></section></main>
}

function WalletPage({data, money, onReload}: {data: Dashboard; money(value: number): string; onReload(): Promise<void>}) {
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargeBusy, setRechargeBusy] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [quote, setQuote] = useState<RechargeQuote | null>(null)
  const available = Number(data.wallet.available_balance)
  const rechargeValue = Number(rechargeAmount)
  const validRecharge = Number.isFinite(rechargeValue) && rechargeValue >= 1 && rechargeValue <= 100000

  useEffect(() => {
    if (!validRecharge) { setQuote(null); return }
    let cancelled = false
    const timer = window.setTimeout(() => {
      portalApi.rechargeQuote(rechargeValue).then(result => {
        if (!cancelled) setQuote(result)
      }).catch(reason => {
        if (!cancelled) { setQuote(null); setPaymentMessage(reason instanceof Error ? reason.message : 'Unable to calculate payment fees.') }
      })
    }, 250)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [rechargeValue, validRecharge])

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('cashfree_order_id')
    if (!orderId) return
    let stopped = false
    let attempts = 0
    const check = async () => {
      try {
        const status = await portalApi.rechargeStatus(orderId)
        if (stopped) return
        setPaymentMessage(status.status === 'Paid' ? `Payment successful. ${money(status.amount)} added to your wallet.` : `Payment status: ${status.status}. Waiting for secure payment confirmation.`)
        if (status.status === 'Paid') { await onReload(); return }
        if (status.status === 'Failed' || status.status === 'User Dropped' || attempts >= 14) return
        attempts += 1
        window.setTimeout(() => void check(), 2000)
      } catch (reason) {
        if (!stopped) setPaymentMessage(reason instanceof Error ? reason.message : 'Unable to check payment status.')
      }
    }
    void check()
    return () => { stopped = true }
  }, [money, onReload])

  const startRecharge = async () => {
    if (!validRecharge) return
    setRechargeBusy(true); setPaymentMessage('')
    try {
      const order = await portalApi.createRecharge(rechargeValue)
      await loadCashfree()
      if (!window.Cashfree) throw new Error('Secure payment checkout is unavailable.')
      const result = await window.Cashfree({mode: order.environment}).checkout({paymentSessionId: order.payment_session_id, redirectTarget: '_modal'})
      if (result?.error) throw new Error(result.error.message || 'Unable to open payment checkout.')
      setPaymentMessage('Checking payment status…')
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const status = await portalApi.rechargeStatus(order.order_id)
        if (status.status === 'Paid') {
          setPaymentMessage(`Payment successful. ${money(status.amount)} added to your wallet.`)
          await onReload()
          break
        }
        if (status.status === 'Failed' || status.status === 'User Dropped') {
          setPaymentMessage(status.status === 'Failed' ? 'Payment failed. Your wallet was not charged.' : 'Payment was cancelled.')
          break
        }
        if (attempt === 14) {
          setPaymentMessage('Payment confirmation is taking longer than expected. Please refresh shortly.')
          break
        }
        await new Promise(resolve => window.setTimeout(resolve, 2000))
      }
    } catch (reason) {
      setPaymentMessage(reason instanceof Error ? reason.message : 'Unable to start payment.')
    } finally { setRechargeBusy(false) }
  }

  return <main className="dashboard-main">
    <PageHeading eyebrow="WALLET" title="Your wallet" description="Review available, locked and pending balances." />
    {paymentMessage ? <p className="payment-message">{paymentMessage}</p> : null}
    <section className="balance-grid"><Balance label="Available" value={money(available)} tone="green" />{PAID_COMMITMENTS_ENABLED ? <><Balance label="Locked" value={money(data.wallet.locked_balance)} /><Balance label="Pending donation" value={money(data.wallet.pending_donation_balance)} tone="red" /></> : null}<Balance label="Pending withdrawal" value={money(data.wallet.pending_withdrawal_balance)} tone="blue" /></section>
    <section className="recharge-panel"><div><small>SECURE WALLET RECHARGE</small><h2>Add money securely</h2><p>Your wallet receives the entered amount after verified payment. Platform and gateway fees include 18% GST.</p>{quote ? <div className="fee-breakdown"><span>Wallet credit <b>{money(quote.wallet_amount)}</b></span><span>Platform fee ({quote.platform_fee_percentage}%) <b>{money(quote.platform_fee_amount)}</b></span><span>GST on platform fee ({quote.platform_fee_gst_percentage}%) <b>{money(quote.platform_fee_gst_amount)}</b></span><span>Gateway fee ({quote.gateway_fee_percentage}%) <b>{money(quote.gateway_fee_amount)}</b></span><span>GST on gateway fee ({quote.gateway_fee_gst_percentage}%) <b>{money(quote.gateway_fee_gst_amount)}</b></span><strong>Total payable <b>{money(quote.total_payable)}</b></strong></div> : null}</div><div className="withdraw-form"><label>Wallet amount<input autoComplete="off" inputMode="decimal" maxLength={9} placeholder="₹0.00" type="text" value={rechargeAmount} onChange={event => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) setRechargeAmount(event.target.value) }} /></label><button disabled={rechargeBusy || !validRecharge || !quote} onClick={() => void startRecharge()} type="button">{rechargeBusy ? 'Opening…' : quote ? `Pay ${money(quote.total_payable)}` : 'Proceed to pay'}</button></div></section>
  </main>
}

function WithdrawalPage({data, money, busy, onWithdraw}: {data: Dashboard; money(value: number): string; busy: boolean; onWithdraw(amount: number, bankAccountId: string): Promise<void>}) {
  const [amount, setAmount] = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [message, setMessage] = useState('')
  const available = Number(data.wallet.available_balance)
  const requestedAmount = Number(amount)
  const validAmount = Number.isFinite(requestedAmount) && requestedAmount > 0 && requestedAmount <= available
  const validWithdrawal = validAmount && bankAccountId.length > 0

  useEffect(() => {
    let cancelled = false
    Promise.all([portalApi.bankAccounts(), portalApi.withdrawalRequests()]).then(([accounts, withdrawalRequests]) => {
      if (cancelled) return
      setBankAccounts(accounts)
      setRequests(withdrawalRequests)
      setBankAccountId(accounts.find(account => account.is_default)?.id || accounts[0]?.id || '')
    }).catch(reason => {
      if (!cancelled) setMessage(reason instanceof Error ? reason.message : 'Unable to load bank accounts.')
    })
    return () => { cancelled = true }
  }, [])

  const submitWithdrawal = async () => {
    if (!validWithdrawal) return
    setMessage('')
    try {
      await onWithdraw(requestedAmount, bankAccountId)
      setAmount('')
      setMessage('Withdrawal request submitted for administrator review.')
      setRequests(await portalApi.withdrawalRequests())
    } catch { /* dashboard shows the safe API error */ }
  }

  return <main className="dashboard-main withdrawal-main">
    <PageHeading eyebrow="WITHDRAWAL" title="Request a withdrawal" description="Send your available wallet balance to a saved bank account after administrator approval." />
    <section className="balance-grid"><Balance label="Available" value={money(available)} tone="green" /><Balance label="Pending withdrawal" value={money(data.wallet.pending_withdrawal_balance)} tone="blue" /></section>
    {message ? <p className="bank-message">{message}</p> : null}
    <section className="withdraw-panel"><div><small>WITHDRAW AVAILABLE BALANCE</small><h2>Withdrawal details</h2><p>{bankAccounts.length ? 'Select one of your saved accounts and enter an amount. Your balance will be deducted only after administrator approval.' : 'Add a bank account before requesting a withdrawal.'}</p>{!bankAccounts.length ? <a className="manage-bank-link" href="/dashboard/bank-accounts">Add bank account →</a> : null}</div><div className="withdraw-form"><label>Bank account<select value={bankAccountId} onChange={event => setBankAccountId(event.target.value)}><option value="">Select account</option>{bankAccounts.map(account => <option key={account.id} value={account.id}>{account.bank} · {account.account_number_masked}</option>)}</select></label><label>Amount<input max={available} min="1" placeholder="₹0.00" step="0.01" type="number" value={amount} onChange={event => setAmount(event.target.value)} /></label><button disabled={busy || !validWithdrawal} onClick={() => void submitWithdrawal()} type="button">{busy ? 'Requesting…' : 'Request withdrawal'}</button></div></section>
    <section className="withdrawal-history"><div className="dashboard-title"><div><p className="eyebrow">REQUEST HISTORY</p><h2>My withdrawal requests</h2></div></div>{requests.length ? <div className="withdrawal-request-list">{requests.map(request => <article className="withdrawal-request-row" key={request.request_id}><div><strong>{request.request_id}</strong><span>{request.bank_account.bank} · {request.bank_account.account_number_masked}</span><small>{new Date(request.requested_at).toLocaleString()}</small></div><b>{money(request.amount)}</b><em className={`status-badge ${request.status.toLowerCase()}`}>{request.status}</em>{request.rejection_reason ? <p>{request.rejection_reason}</p> : null}</article>)}</div> : <Empty text="No withdrawal requests yet." />}</section>
  </main>
}

function BankAccountsPage({userName}: {userName: string}) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [accountHolderName, setAccountHolderName] = useState(userName)
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const validAccount = accountHolderName.trim().length >= 2
    && selectedBank.length > 0
    && /^\d{6,30}$/.test(accountNumber)
    && accountNumber === confirmAccountNumber
    && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)

  const refreshAccounts = async () => {
    const accounts = await portalApi.bankAccounts()
    setBankAccounts(accounts)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([portalApi.banks(), portalApi.bankAccounts()]).then(([availableBanks, accounts]) => {
      if (cancelled) return
      setBanks(availableBanks)
      setBankAccounts(accounts)
      setSelectedBank(availableBanks[0]?.name || '')
    }).catch(reason => {
      if (!cancelled) setMessage(reason instanceof Error ? reason.message : 'Unable to load bank accounts.')
    })
    return () => { cancelled = true }
  }, [])

  const addAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (!validAccount || bankAccounts.length >= 2) return
    setBusy(true); setMessage('')
    try {
      await portalApi.addBankAccount(accountHolderName.trim(), selectedBank, accountNumber, ifscCode)
      setAccountNumber(''); setConfirmAccountNumber(''); setIfscCode('')
      setMessage('Bank account added successfully.')
      await refreshAccounts()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to add bank account.')
    } finally { setBusy(false) }
  }

  const removeAccount = async (account: BankAccount) => {
    if (!window.confirm(`Remove ${account.bank} ${account.account_number_masked}?`)) return
    setBusy(true); setMessage('')
    try {
      await portalApi.removeBankAccount(account.id)
      setMessage('Bank account removed.')
      await refreshAccounts()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to remove bank account.')
    } finally { setBusy(false) }
  }

  return <main className="dashboard-main bank-accounts-main">
    <PageHeading eyebrow="PAYOUT ACCOUNTS" title="Bank accounts" description="Manage the accounts that can receive your approved withdrawals." />
    <section className="bank-accounts-panel">
      <div className="bank-panel-heading"><div><small>SAVED ACCOUNTS</small><h2>Your bank accounts</h2><p>Add up to two accounts. Account numbers remain masked after saving.</p></div><strong>{bankAccounts.length}/2 accounts</strong></div>
      {message ? <p className="bank-message">{message}</p> : null}
      <div className="saved-bank-accounts">
        {bankAccounts.map(account => <article className="saved-bank-account" key={account.id}><div><strong>{account.bank}</strong><span>{account.account_number_masked} · {account.ifsc_code}</span><small>{account.account_holder_name}{account.is_default ? ' · Default' : ''}</small></div><button disabled={busy} onClick={() => void removeAccount(account)} type="button">Remove</button></article>)}
        {!bankAccounts.length ? <p className="no-bank-account">No bank account added yet.</p> : null}
      </div>
      {bankAccounts.length < 2 ? <form className="bank-account-form" onSubmit={addAccount}>
        <label>Account holder<input autoComplete="name" value={accountHolderName} onChange={event => setAccountHolderName(event.target.value)} /></label>
        <label>Bank<select value={selectedBank} onChange={event => setSelectedBank(event.target.value)}>{banks.map(bank => <option key={bank.name} value={bank.name}>{bank.bank_name}</option>)}</select></label>
        <label>Account number<input autoComplete="off" inputMode="numeric" value={accountNumber} onChange={event => { if (/^\d{0,30}$/.test(event.target.value)) setAccountNumber(event.target.value) }} /></label>
        <label>Confirm number<input autoComplete="off" inputMode="numeric" value={confirmAccountNumber} onChange={event => { if (/^\d{0,30}$/.test(event.target.value)) setConfirmAccountNumber(event.target.value) }} /></label>
        <label>IFSC code<input autoComplete="off" maxLength={11} value={ifscCode} onChange={event => setIfscCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} /></label>
        <button disabled={busy || !validAccount} type="submit">{busy ? 'Saving…' : 'Add account'}</button>
      </form> : null}
    </section>
  </main>
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
  return <main className="dashboard-main profile-main"><div className="dashboard-welcome"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Review the details connected to your Screen Jump Focus account.</p></div></div><section className="profile-card"><div className="profile-hero"><span>{(data.user.first_name || data.user.email).charAt(0).toUpperCase()}</span><div><h2>{data.user.full_name}</h2><p>Screen Jump Focus member</p></div></div><div className="profile-details"><ProfileDetail label="First name" value={data.user.first_name} /><ProfileDetail label="Last name" value={data.user.last_name || '—'} /><ProfileDetail label="Email" value={data.user.email} /><ProfileDetail label="Customer account" value={data.customer || 'Not linked'} /></div></section><section className="profile-security"><strong>Your financial data stays protected</strong><p>This web dashboard shows wallet, bank account and withdrawal details only.</p></section></main>
}

function ProfileDetail({label, value}: {label: string; value: string}) {
  return <div><small>{label}</small><strong>{value}</strong></div>
}

function Balance({label, value, tone = ''}: {label: string; value: string; tone?: string}) { return <article className={`balance-card ${tone}`}><small>{label}</small><strong>{value}</strong></article> }
function Empty({text}: {text: string}) { return <div className="portal-empty">{text}</div> }

function CommitmentCard({commitment}: {commitment: Dashboard['commitments'][number]}) {
  return <article className="web-commitment"><div className="web-commitment-top"><span className={`status-badge ${commitment.status.toLowerCase()}`}>{commitment.status}</span><strong>₹{Number(commitment.deposit_amount).toFixed(2)}</strong></div><h3>{commitment.goal_days}-day commitment</h3><p>{new Date(commitment.start_at).toLocaleDateString()} → {new Date(commitment.end_at).toLocaleDateString()}</p>{commitment.awaiting_mobile_verification ? <div className="verification-note">Open the Android app online to verify completion.</div> : null}{commitment.violation ? <div className="violation-note"><strong>{commitment.violation.reason}</strong><span>Detected {new Date(commitment.violation.detected_at).toLocaleString()}</span></div> : null}{commitment.donation ? <a className="proof-link" href={commitment.donation.proof_url} target="_blank" rel="noreferrer">View donation proof ↗</a> : null}<small className="terms-version">Terms: {commitment.terms_version}</small></article>
}
