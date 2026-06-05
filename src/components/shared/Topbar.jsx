import { useAuth } from '../../lib/AuthContext'

export default function Topbar({ name, sub, darkMode, onToggleDark }) {
  const { signOut } = useAuth()

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          overflow: 'hidden', flexShrink: 0,
          background: 'var(--bg2)',
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
          className="ib icon-theme"
          onClick={onToggleDark}
          aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
        >
          <i className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`} aria-hidden="true" />
        </button>
        <button
          className="ib icon-logout"
          onClick={signOut}
          aria-label="Sair"
          title="Sair"
        >
          <i className="ti ti-logout" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
