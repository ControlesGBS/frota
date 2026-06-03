import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useDarkMode } from '../hooks/useDarkMode'
import Topbar from '../components/shared/Topbar'
import KmTab from '../components/condutor/KmTab'
import CombustivelTab from '../components/condutor/CombustivelTab'
import ManutencaoTab from '../components/condutor/ManutencaoTab'
import VistoriaTab from '../components/condutor/VistoriaTab'

const TABS = [
  { id: 'km',   label: 'Hodômetro',      icon: 'ti-road' },
  { id: 'fuel', label: 'Combust./Óleo',  icon: 'ti-gas-station' },
  { id: 'man',  label: 'Manutenção',     icon: 'ti-tool' },
  { id: 'vist', label: 'Vistoria',       icon: 'ti-clipboard-check' },
]

export default function CondutorApp() {
  const { condutor } = useAuth()
  const [dark, toggleDark] = useDarkMode()
  const [activeTab, setActiveTab] = useState('km')

  const veiculoLabel = condutor
    ? `${condutor.marca_veiculo} · ${condutor.placa}`
    : '...'

  return (
    <div className="app-shell">
      <Topbar
        name={condutor?.nome ?? 'Condutor'}
        sub={veiculoLabel}
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
        {activeTab === 'km'   && <KmTab condutor={condutor} />}
        {activeTab === 'fuel' && <CombustivelTab condutor={condutor} />}
        {activeTab === 'man'  && <ManutencaoTab condutor={condutor} />}
        {activeTab === 'vist' && <VistoriaTab condutor={condutor} />}
      </div>
    </div>
  )
}
