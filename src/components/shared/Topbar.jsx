import { useAuth } from '../../lib/AuthContext'

export default function Topbar({ name, sub, darkMode, onToggleDark }) {
  const { signOut } = useAuth()

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Ícone moto */}
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--blbg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="ti ti-motorbike" style={{ fontSize: 20, color: 'var(--blue)' }} aria-hidden="true" />
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
