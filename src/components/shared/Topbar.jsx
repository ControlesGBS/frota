import { useAuth } from '../../lib/AuthContext'

export default function Topbar({ name, sub, darkMode, onToggleDark }) {
  const { signOut } = useAuth()

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Moto no lugar do quadrado azul */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          overflow: 'hidden', flexShrink: 0,
          background: '#f0f0ec',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="/moto.jpg" alt="Moto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div className="topbar-name">{name}</div>
          {sub && <div className="topbar-sub">{sub}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <button
          className={`ib ${darkMode ? 'active' : ''}`}
          onClick={onToggleDark}
          aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
          style={{ color: 'var(--t1)' }}
        >
          <i className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" style={{ fontSize: 18 }} />
        </button>
        <button
          className="ib"
          onClick={signOut}
          aria-label="Sair"
          title="Sair"
          style={{ color: 'var(--t1)' }}
        >
          <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  )
}
