import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import Topbar from '../components/shared/Topbar'
import Dashboard1 from '../components/admin/Dashboard1'
import Dashboard2 from '../components/admin/Dashboard2'
import Cadastros from '../components/admin/Cadastros'

const TABS = [
  { id: 'd1',  label: 'Dashboard',      icon: 'ti-chart-bar' },
  { id: 'd2',  label: 'Por condutor',   icon: 'ti-user-search' },
  { id: 'cad', label: 'Cadastros',      icon: 'ti-user-plus' },
]

export default function AdminApp() {
  const [dark, toggleDark] = useDarkMode()
  const [activeTab, setActiveTab] = useState('d1')

  return (
    <div className="app-shell">
      <Topbar
        name="Administrador"
        sub="Painel completo da frota"
        darkMode={dark}
        onToggleDark={toggleDark}
      />
      <div className="tabnav">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            {t.label}
          </div>
        ))}
      </div>
      <div className="content">
        {activeTab === 'd1'  && <Dashboard1 />}
        {activeTab === 'd2'  && <Dashboard2 />}
        {activeTab === 'cad' && <Cadastros />}
      </div>
    </div>
  )
}
