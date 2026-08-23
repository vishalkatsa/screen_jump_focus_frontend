import './App.css'

const APK_PATH = 'https://publicvishal.s3.ap-south-1.amazonaws.com/app-release.apk'
type IconName = 'chart' | 'timer' | 'shield' | 'spark' | 'download' | 'phone'

function Icon({name}: {name: IconName}) {
  const paths: Record<IconName, React.ReactNode> = {
    chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    spark: <><path d="m12 3-1.4 4.3a2 2 0 0 1-1.3 1.3L5 10l4.3 1.4a2 2 0 0 1 1.3 1.3L12 17l1.4-4.3a2 2 0 0 1 1.3-1.3L19 10l-4.3-1.4a2 2 0 0 1-1.3-1.3L12 3Z"/></>,
    download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5"/><path d="M5 21h14"/></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <a className="brand" href="/" aria-label="Screen Jump Focus home"><span className="brand-mark"><span /></span><span>Screen <strong>Jump</strong> Focus</span></a>
}

function Header() {
  return <header><div className="nav shell"><Brand /><nav><a href="/#features">Features</a><a href="/#how-it-works">How it works</a><a className="nav-cta" href="/app-install">Get the app</a></nav></div></header>
}

function Footer() {
  return <footer><div className="shell footer-inner"><Brand /><p>Built for healthier digital habits.</p><p>© 2026 Screen Jump Focus</p></div></footer>
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
    ['chart', 'Screen time insights', 'See daily app usage and understand exactly where your time goes.'],
    ['timer', 'Individual app timers', 'Choose a daily time limit for each distracting app on your phone.'],
    ['shield', 'Reliable app blocker', 'When a limit is complete, Screen Jump Focus helps you return home.'],
    ['spark', 'Personal inspiration', 'Use your own image or video as a positive reminder when an app is blocked.'],
  ]
  return <><Header /><main><section className="hero shell"><div className="hero-copy">
    <span className="pill"><span /> Android digital wellbeing</span><h1>Take back your time.<br/><em>Keep your focus.</em></h1><p>Understand your screen habits, set meaningful app limits and stay focused with a blocker designed around your goals.</p>
    <div className="hero-actions"><a className="button primary" href="/app-install"><Icon name="download" /> Download for Android</a><a className="button ghost" href="#features">Explore features</a></div><div className="trust"><span>✓ Free to try</span><span>✓ Private by design</span><span>✓ Android 8+</span></div>
  </div><PhonePreview /></section>
  <section className="section shell" id="features"><div className="section-heading"><p className="eyebrow">BUILT FOR BETTER HABITS</p><h2>Everything you need to focus</h2><p>Simple tools that help you understand, limit and improve your digital routine.</p></div><div className="feature-grid">{features.map(([icon,title,copy])=><article key={title}><span className="icon"><Icon name={icon}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  <section className="steps-section" id="how-it-works"><div className="shell"><div className="section-heading light"><p className="eyebrow">HOW IT WORKS</p><h2>Focus in three simple steps</h2></div><div className="steps"><article><b>01</b><h3>Review usage</h3><p>See how much time you spend in every app.</p></article><article><b>02</b><h3>Set your limits</h3><p>Choose a healthy daily timer for distracting apps.</p></article><article><b>03</b><h3>Stay committed</h3><p>Let Screen Jump Focus protect the goal you selected.</p></article></div></div></section>
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
