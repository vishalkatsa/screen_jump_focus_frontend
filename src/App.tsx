import './App.css'
import './landing.css'
import {useEffect, useState} from 'react'
import {PortalApp} from './PortalApp'

const APK_PATH = 'https://publicvishal.s3.ap-south-1.amazonaws.com/app-release.apk'
type IconName = 'chart' | 'timer' | 'shield' | 'spark' | 'download' | 'phone' | 'heart' | 'wallet'

function Icon({name}: {name: IconName}) {
  const paths: Record<IconName, React.ReactNode> = {
    chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3-1.4 4.3a2 2 0 0 1-1.3 1.3L5 10l4.3 1.4a2 2 0 0 1 1.3 1.3L12 17l1.4-4.3a2 2 0 0 1 1.3-1.3L19 10l-4.3-1.4a2 2 0 0 1-1.3-1.3L12 3Z"/></>,
    download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5a5.5 5.5 0 0 0 1.1-8.9Z"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <a className="brand" href="/" aria-label="Screen Jump Focus home"><span className="brand-mark"><span /></span><span>Screen <strong>Jump</strong> Focus</span></a>
}

function Header() {
  return <header><div className="nav shell"><Brand /><nav><a href="/#why">Why it exists</a><a href="/#features">Features</a><a href="/#demo">Demo</a><a href="/#modes">Choose a mode</a><a href="/#commitment">Commitment</a><a href="/#guidelines">Guidelines</a><a href="/login">Account</a><a className="nav-cta" href="/app-install">Get the app</a></nav></div></header>
}

function Footer() {
  return <footer><div className="shell footer-inner"><Brand /><p>Built for healthier digital habits.</p><a className="linkedin-link" href="https://www.linkedin.com/in/vishal-kumar-763b1724a" target="_blank" rel="noreferrer" aria-label="Vishal Kumar on LinkedIn"><span>in</span> Vishal Kumar</a><p>© 2026 Screen Jump Focus</p></div></footer>
}

function PhonePreview() {
  return <div className="phone-wrap"><div className="glow" /><div className="phone">
    <div className="phone-bar"><span>9:41</span><span>● ● ▰</span></div><div className="mini-brand"><span className="brand-mark"><span /></span></div>
    <p className="eyebrow">TODAY</p><h3>Your screen time</h3><div className="screen-card"><strong>2h 35m</strong><span>across 21 apps</span></div><h4>App usage</h4>
    {['Instagram', 'WhatsApp', 'Maps'].map((app, index) => <div className="app-row" key={app}><span className="app-dot">{app[0]}</span><span>{app}<i /></span><small>{[65, 18, 12][index]}m</small></div>)}
    <div className="phone-tabs"><b>▥<small>Usage</small></b><b>⌛<small>Limits</small></b></div>
  </div></div>
}

function HomePage() {
  const [motivationOpen, setMotivationOpen] = useState(false)
  useEffect(() => {
    if (!motivationOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMotivationOpen(false) }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [motivationOpen])
  const features: [IconName, string, string][] = [
    ['chart', 'Check app usage', 'See how much time you spend in each app today and notice the habits that quietly consume your attention.'],
    ['timer', 'Set a daily limit', 'Choose a healthy daily allowance for Instagram, YouTube or any other distracting app.'],
    ['shield', 'Block after time is used', 'Once the selected time is complete, the app is paused so one more scroll does not become another hour.'],
    ['spark', 'See your reason to stop', 'When you reopen a blocked app, Screen Jump Focus shows your chosen inspiring image or video.'],
  ]
  const appSetupEvents = [
    ['You log out', 'Amount stays safe', 'You can safely sign in again on this phone.'],
    ['Your login renews automatically', 'Amount stays safe', 'You stay signed in and your app setup stays safe.'],
    ['You are asked to log in again', 'Amount stays safe', 'Logging in again on this phone does not affect your setup.'],
    ['The app closes or restarts', 'Amount stays safe', 'Opening the app again keeps your current setup.'],
    ['The app is updated', 'Amount stays safe', 'A normal update keeps your app data and setup.'],
    ['App data is cleared', 'May be donated', 'During an active paid commitment, your locked amount may go to donation.'],
    ['The app is removed and installed again', 'May be donated', 'During an active paid commitment, your locked amount may go to donation.'],
  ] as const
  return <><Header /><main><section className="hero shell"><div className="hero-copy">
    <span className="pill"><span /> Less scrolling. More living.</span><h1>Use social media.<br/><em>Do not let it use you.</em></h1><p>Screen Jump Focus helps you reduce mindless scrolling, protect time for study, work and real life, and turn your intention to stop into a limit your phone can actually enforce.</p><div className="one-percent-message"><strong>Built for the 1% People who choose focus over distraction.</strong><span>Protect your time. Achieve what others only plan.</span></div>
    <div className="hero-actions"><a className="button primary" href="/app-install"><Icon name="download" /> Download for Android</a><span className="button ios-soon">iOS · Coming soon</span><a className="button ghost" href="#features">Explore features</a></div><div className="trust"><span>✓ Free to try</span><span>✓ Private by design</span><span>✓ Android 8+</span></div>
  </div><PhonePreview /></section>
  <section className="why-section" id="why"><div className="shell why-grid"><div><p className="eyebrow">WHY WE BUILT IT</p><h2>Your attention should belong to you.</h2></div><div className="why-copy"><p>Social apps are useful, but endless feeds make it easy to lose time without choosing to. A quick check can become an hour of scrolling—and the things that matter get pushed aside.</p><p>Screen Jump Focus is not about giving up your phone. It is about using it on purpose: know where your time goes, decide what is enough, and get a meaningful reminder when habit tries to take over.</p></div></div></section>
  <section className="section shell" id="features"><div className="section-heading"><p className="eyebrow">BUILT FOR BETTER HABITS</p><h2>Four tools between you and the scroll</h2><p>Clear feedback, limits and reminders that make your daily intention easier to keep.</p></div><div className="feature-grid">{features.map(([icon,title,copy])=> icon === 'spark' ? <article className="feature-preview" key={title} onClick={() => setMotivationOpen(true)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setMotivationOpen(true) } }} role="button" tabIndex={0}><span className="icon"><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p><span className="preview-link">Watch example video <b>▶</b></span></article> : <article key={title}><span className="icon"><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  <section className="demo-section" id="demo"><div className="shell"><div className="section-heading"><p className="eyebrow">PRODUCT DEMO</p><h2>See Screen Jump Focus in action</h2><p>Watch how app usage, daily limits and the blocker work together on Android.</p></div><div className="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/Zf20Ckw8l4Q?rel=0" title="Screen Jump Focus app demo" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><a className="youtube-link" href="https://youtu.be/Zf20Ckw8l4Q" target="_blank" rel="noreferrer">Watch on YouTube <span>↗</span></a></div></section>
  <section className="steps-section" id="how-it-works"><div className="shell"><div className="section-heading light"><p className="eyebrow">HOW IT WORKS</p><h2>Focus in three simple steps</h2></div><div className="steps"><article><b>01</b><h3>Review usage</h3><p>See how much time you spend in every app.</p></article><article><b>02</b><h3>Set your limits</h3><p>Choose a healthy daily timer for distracting apps.</p></article><article><b>03</b><h3>Stay committed</h3><p>Let Screen Jump Focus protect the goal you selected.</p></article></div></div></section>
  <section className="modes-section shell" id="modes"><div className="section-heading"><p className="eyebrow">CHOOSE HOW YOU FOCUS</p><h2>Guest mode or paid commitment?</h2><p>Both modes can limit distracting apps. The difference is how strongly your goal is protected.</p></div><div className="mode-grid"><article className="mode-card guest"><div className="mode-top"><span className="mode-icon"><Icon name="phone" /></span><div><small>FREE &amp; FLEXIBLE</small><h3>Guest mode</h3></div></div><p>Use app timers without creating an account or locking money.</p><ul><li><strong>No login needed</strong><span>Start using timers directly on your phone.</span></li><li><strong>No money involved</strong><span>There is no wallet lock or donation risk.</span></li><li><strong>You stay in control</strong><span>Change or remove timers whenever no local goal is active.</span></li><li><strong>Saved on this phone</strong><span>Clearing app data or removing the app can erase local settings.</span></li></ul><a className="mode-action secondary" href="/app-install">Try guest mode</a></article><article className="mode-card paid"><div className="recommended">STRONGER ACCOUNTABILITY</div><div className="mode-top"><span className="mode-icon"><Icon name="shield" /></span><div><small>ACCOUNT &amp; WALLET REQUIRED</small><h3>Paid commitment</h3></div></div><p>Lock an amount from your wallet and protect your app timers for a period you choose.</p><ul><li><strong>Login required</strong><span>Your commitment and wallet activity are linked to your account.</span></li><li><strong>Your amount is locked</strong><span>Complete the commitment and the amount becomes available again.</span></li><li><strong>Timers stay protected</strong><span>You cannot edit, remove or reset protected timers while it is active.</span></li><li><strong>Breaking it has a result</strong><span>Changing phones, clearing app data or reinstalling may send the locked amount to donation.</span></li></ul><a className="mode-action primary" href="/app-install">Use paid commitment</a></article></div><p className="mode-note"><strong>Not sure?</strong> Start in guest mode. You can create an account and choose a paid commitment later.</p></section>
  <section className="commitment shell" id="commitment"><div className="commitment-copy"><span className="available">AVAILABLE IN THE ANDROID APP</span><p className="eyebrow">PAID COMMITMENT</p><h2>Put real weight behind your promise.</h2><p>Choose a commitment period—such as 7 days—and lock an amount you select from your wallet. Your existing protected app timers stay locked for the full period.</p><div className="commitment-note"><Icon name="shield"/><p><strong>An active commitment is protected on the phone where you started it.</strong> Moving to another phone, clearing app data, or removing and reinstalling the app breaks the commitment the next time the app connects.</p></div><p className="fine-print">You review and accept the commitment and donation terms before the amount is locked.</p></div><div className="outcome-card"><div className="outcome"><span className="outcome-icon success"><Icon name="wallet"/></span><div><small>IF YOU COMPLETE IT</small><h3>Your amount is unlocked</h3><p>The amount returns to your available wallet balance. You may request withdrawal, subject to administrator processing.</p></div></div><div className="outcome"><span className="outcome-icon donate"><Icon name="heart"/></span><div><small>IF THE COMMITMENT IS BROKEN</small><h3>The amount moves to donation</h3><p>It moves to pending donation. After administrator processing, donation proof is shown in your account.</p></div></div></div></section>
  <section className="guidelines-section" id="guidelines"><div className="shell"><div className="section-heading"><p className="eyebrow">GUIDELINES &amp; TERMS</p><h2>Know what affects your app setup</h2><p>The app remembers this setup on your phone to keep paid commitments protected.</p></div><div className="guideline-grid"><div className="identity-card"><h3>Your app setup</h3><div className="identity-list">{appSetupEvents.map(([event,result,detail]) => <div className="identity-row" key={event}><div><strong>{event}</strong><p>{detail}</p></div><span className={result === 'May be donated' ? 'identity-badge new' : 'identity-badge'}>{result}</span></div>)}</div></div><div className="terms-column"><article className="term-card danger"><span className="outcome-icon donate"><Icon name="heart" /></span><div><small>WHEN A COMMITMENT IS BROKEN</small><h3>When the amount goes to donation</h3><p>During an active commitment, moving to another phone or starting with a fresh app setup breaks the commitment the next time the app connects. Clearing app data and removing and reinstalling the app both start a fresh setup.</p></div></article><article className="term-card safe"><span className="outcome-icon success"><Icon name="shield" /></span><div><small>SAFE ACTIONS</small><h3>These do not break a commitment</h3><p>Logging out, being asked to log in again, closing or restarting the app, and normal app updates keep your app setup safe.</p></div></article><article className="terms-summary"><h3>Commitment terms</h3><ul><li>The selected amount is locked for the complete commitment period.</li><li>Existing protected timers cannot be edited, removed or reset while active.</li><li>Successful completion unlocks the amount for reuse or a withdrawal request.</li><li>If the commitment is broken by changing phones or starting a fresh app setup, the time and basic security details are saved and the amount moves to pending donation.</li><li>Donation and withdrawal completion require administrator processing.</li></ul><p>Starting a paid commitment confirms that you understand and accept these rules.</p></article></div></div></div></section>
  <section className="cta shell"><div><p className="eyebrow">START TODAY</p><h2>Your attention is worth protecting.</h2><p>Download Screen Jump Focus and build a calmer relationship with your phone.</p></div><a className="button primary" href="/app-install">Get Screen Jump Focus <span>→</span></a></section>
  </main><Footer />{motivationOpen ? <div aria-label="Motivation video preview" aria-modal="true" className="video-modal" onMouseDown={event => { if (event.target === event.currentTarget) setMotivationOpen(false) }} role="dialog"><div className="video-modal-card"><button aria-label="Close video" className="video-modal-close" onClick={() => setMotivationOpen(false)} type="button">×</button><div className="video-modal-heading"><p className="eyebrow">BLOCKER PREVIEW</p><h2>See your reason to stop</h2><p>This is how your chosen motivation can appear when you try to reopen a blocked app.</p></div><video autoPlay controls playsInline src="/motivation.mp4">Your browser does not support this video.</video></div></div> : null}</>
}

function InstallPage() {
  return <><Header /><main className="install-page"><section className="install-card"><div className="install-icon"><Icon name="phone" /></div><p className="eyebrow">ANDROID APP</p><h1>Install Screen Jump Focus</h1><p>Download the Android APK and start building healthier screen habits.</p><div className="app-info"><span className="brand-mark large"><span /></span><div><strong>Screen Jump Focus</strong><small>Android 8.0 and above</small><small>Latest college demo build</small></div></div><a className="button primary download" href={APK_PATH}><Icon name="download" /> Download APK</a><div className="ios-coming"><strong>iOS app</strong><span>Coming soon</span><p>We are working on the iPhone version of Screen Jump Focus.</p></div><div className="install-help"><h3>How to install</h3><ol><li>Download the APK file.</li><li>Open the downloaded file.</li><li>Allow installation from this source if Android asks.</li><li>Tap Install, then open the app.</li></ol></div><p className="safety"><Icon name="shield" /> Secure APK download from cloud storage.</p></section></main><Footer /></>
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === '/login' || path === '/register' || path === '/dashboard' || path.startsWith('/dashboard/')) return <PortalApp />
  return path === '/app-install' ? <InstallPage /> : <HomePage />
}

export default App
