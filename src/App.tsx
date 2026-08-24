import './App.css'
import './landing.css'

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
  return <header><div className="nav shell"><Brand /><nav><a href="/#why">Why it exists</a><a href="/#features">Features</a><a href="/#commitment">Commitment</a><a className="nav-cta" href="/app-install">Get the app</a></nav></div></header>
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
  const features: [IconName, string, string][] = [
    ['chart', 'Check app usage', 'See how much time you spend in each app today and notice the habits that quietly consume your attention.'],
    ['timer', 'Set a daily limit', 'Choose a healthy daily allowance for Instagram, YouTube or any other distracting app.'],
    ['shield', 'Block after time is used', 'Once the selected time is complete, the app is paused so one more scroll does not become another hour.'],
    ['spark', 'See your reason to stop', 'When you reopen a blocked app, Screen Jump Focus shows your chosen inspiring image or video.'],
  ]
  return <><Header /><main><section className="hero shell"><div className="hero-copy">
    <span className="pill"><span /> Less scrolling. More living.</span><h1>Use social media.<br/><em>Do not let it use you.</em></h1><p>Screen Jump Focus helps you reduce mindless scrolling, protect time for study, work and real life, and turn your intention to stop into a limit your phone can actually enforce.</p>
    <div className="hero-actions"><a className="button primary" href="/app-install"><Icon name="download" /> Download for Android</a><a className="button ghost" href="#features">Explore features</a></div><div className="trust"><span>✓ Free to try</span><span>✓ Private by design</span><span>✓ Android 8+</span></div>
  </div><PhonePreview /></section>
  <section className="why-section" id="why"><div className="shell why-grid"><div><p className="eyebrow">WHY WE BUILT IT</p><h2>Your attention should belong to you.</h2></div><div className="why-copy"><p>Social apps are useful, but endless feeds make it easy to lose time without choosing to. A quick check can become an hour of scrolling—and the things that matter get pushed aside.</p><p>Screen Jump Focus is not about giving up your phone. It is about using it on purpose: know where your time goes, decide what is enough, and get a meaningful reminder when habit tries to take over.</p></div></div></section>
  <section className="section shell" id="features"><div className="section-heading"><p className="eyebrow">BUILT FOR BETTER HABITS</p><h2>Four tools between you and the scroll</h2><p>Clear feedback, limits and reminders that make your daily intention easier to keep.</p></div><div className="feature-grid">{features.map(([icon,title,copy])=><article key={title}><span className="icon"><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  <section className="steps-section" id="how-it-works"><div className="shell"><div className="section-heading light"><p className="eyebrow">HOW IT WORKS</p><h2>Focus in three simple steps</h2></div><div className="steps"><article><b>01</b><h3>Review usage</h3><p>See how much time you spend in every app.</p></article><article><b>02</b><h3>Set your limits</h3><p>Choose a healthy daily timer for distracting apps.</p></article><article><b>03</b><h3>Stay committed</h3><p>Let Screen Jump Focus protect the goal you selected.</p></article></div></div></section>
  <section className="commitment shell" id="commitment"><div className="commitment-copy"><span className="coming">COMING SOON</span><p className="eyebrow">PAID COMMITMENT</p><h2>Put real weight behind your promise.</h2><p>Choose a commitment period—such as 7 days—and lock an amount you select. It is designed for the moments when motivation alone is not enough.</p><div className="commitment-note"><Icon name="shield"/><p><strong>Uninstalling or reinstalling will not erase an active commitment.</strong> If a commitment is broken, the locked amount is planned to be donated and you will receive proof of the donation.</p></div><p className="fine-print">This feature is still in development. No paid commitment is available yet. Final donation, withdrawal and verification terms will be shown clearly before launch.</p></div><div className="outcome-card"><div className="outcome"><span className="outcome-icon success"><Icon name="wallet"/></span><div><small>IF YOU COMPLETE IT</small><h3>Your money stays yours</h3><p>Start another commitment or withdraw the available amount.</p></div></div><div className="outcome"><span className="outcome-icon donate"><Icon name="heart"/></span><div><small>IF YOU BREAK IT</small><h3>The amount is donated</h3><p>Reinstalling does not reset the goal. Donation proof is provided.</p></div></div></div></section>
  <section className="cta shell"><div><p className="eyebrow">START TODAY</p><h2>Your attention is worth protecting.</h2><p>Download Screen Jump Focus and build a calmer relationship with your phone.</p></div><a className="button primary" href="/app-install">Get Screen Jump Focus <span>→</span></a></section>
  </main><Footer /></>
}

function InstallPage() {
  return <><Header /><main className="install-page"><section className="install-card"><div className="install-icon"><Icon name="phone" /></div><p className="eyebrow">ANDROID APP</p><h1>Install Screen Jump Focus</h1><p>Download the Android APK and start building healthier screen habits.</p><div className="app-info"><span className="brand-mark large"><span /></span><div><strong>Screen Jump Focus</strong><small>Android 8.0 and above</small><small>Latest college demo build</small></div></div><a className="button primary download" href={APK_PATH}><Icon name="download" /> Download APK</a><div className="install-help"><h3>How to install</h3><ol><li>Download the APK file.</li><li>Open the downloaded file.</li><li>Allow installation from this source if Android asks.</li><li>Tap Install, then open the app.</li></ol></div><p className="safety"><Icon name="shield" /> Secure APK download from cloud storage.</p></section></main><Footer /></>
}

function App() {
  return window.location.pathname.replace(/\/$/, '') === '/app-install' ? <InstallPage /> : <HomePage />
}

export default App
