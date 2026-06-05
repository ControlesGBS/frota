import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function KmTab({ condutor }) {
  const today = new Date().toISOString().split('T')[0]

  // Jornada ativa (buscada do banco)
  const [jornada, setJornada]     = useState(null)   // registro em andamento
  const [loadingJ, setLoadingJ]   = useState(true)

  // Formulário de SAÍDA
  const [formSaida, setFormSaida] = useState({
    data: today, km_saida: '', destino: '',
  })

  // Formulário de CHEGADA
  const [formChegada, setFormChegada] = useState({
    km_chegada: '', observacoes: '',
  })

  const [saving, setSaving] = useState(false)

  // ── Busca jornada em andamento ao montar ──────────────────
  useEffect(() => {
    if (condutor?.id) buscarJornada()
  }, [condutor])

  async function buscarJornada() {
    setLoadingJ(true)
    const { data } = await supabase
      .from('km_diario')
      .select('*')
      .eq('condutor_id', condutor.id)
      .is('km_final', null)          // sem km_final = jornada em aberto
      .order('created_at', { ascending: false })
      .limit(1)
    setJornada(data?.[0] ?? null)
    setLoadingJ(false)
  }

  // ── Registrar SAÍDA ───────────────────────────────────────
  async function handleSaida() {
    if (!formSaida.km_saida) { toast.error('Informe o km de saída'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('km_diario')
      .insert({
        condutor_id: condutor.id,
        data:        formSaida.data,
        km_inicial:  parseInt(formSaida.km_saida),
        destino:     formSaida.destino || null,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { toast.error('Erro ao registrar saída: ' + error.message); return }
    toast.success('Saída registrada!')
    setJornada(data)
    setFormSaida({ data: today, km_saida: '', destino: '' })
  }

  // ── Registrar CHEGADA (encerrar jornada) ──────────────────
  async function handleChegada() {
    if (!formChegada.km_chegada) { toast.error('Informe o km de chegada'); return }
    const kmFinal = parseInt(formChegada.km_chegada)
    if (kmFinal <= jornada.km_inicial) {
      toast.error('Km de chegada deve ser maior que o km de saída'); return
    }
    setSaving(true)
    const { error } = await supabase
      .from('km_diario')
      .update({
        km_final:    kmFinal,
        observacoes: formChegada.observacoes || null,
      })
      .eq('id', jornada.id)
    setSaving(false)
    if (error) { toast.error('Erro ao encerrar jornada: ' + error.message); return }
    toast.success('Jornada encerrada! ✓')
    setJornada(null)
    setFormChegada({ km_chegada: '', observacoes: '' })
  }

  const percorrido = formChegada.km_chegada
    ? Math.max(0, parseInt(formChegada.km_chegada) - jornada?.km_inicial)
    : null

  if (loadingJ) return (
    <div className="loading"><div className="spinner" /> Carregando...</div>
  )

  return (
    <div>
      {/* ── JORNADA EM ANDAMENTO ── */}
      {jornada ? (
        <div className="card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'var(--ambg)', color: 'var(--amtx)' }}>
              <i className="ti ti-road" aria-hidden="true" />
            </div>
            <div>
              <div className="card-title">Hodômetro do dia</div>
              <div className="card-sub">Jornada em andamento</div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{ marginBottom: 12 }}>
            <span className="jornada-status-pill">
              <i className="ti ti-point-filled" style={{ fontSize: 10 }} aria-hidden="true" />
              Saída registrada às {new Date(jornada.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {' · '}Km {jornada.km_inicial.toLocaleString('pt-BR')}
            </span>
          </div>

          {/* Strip visual */}
          <div className="jornada-strip ativa">
            <div className="jornada-row">
              <div className="jornada-km-item">
                <div className="jornada-km-val">{jornada.km_inicial.toLocaleString('pt-BR')}</div>
                <div className="jornada-km-lbl">Km saída</div>
              </div>
              <div className="jornada-arrow"><i className="ti ti-arrow-right" aria-hidden="true" /></div>
              <div className="jornada-km-item">
                <div className="jornada-km-diff">
                  {percorrido !== null ? `+${percorrido.toLocaleString('pt-BR')} km` : '+??? km'}
                </div>
                <div className="jornada-km-lbl">Percorridos</div>
              </div>
              <div className="jornada-arrow"><i className="ti ti-arrow-right" aria-hidden="true" /></div>
              <div className="jornada-km-item">
                <div className="jornada-km-val">
                  {formChegada.km_chegada ? parseInt(formChegada.km_chegada).toLocaleString('pt-BR') : '—'}
                </div>
                <div className="jornada-km-lbl">Km chegada</div>
              </div>
            </div>
          </div>

          {/* Campos de chegada */}
          <div className="fg">
            <label>Km de chegada (hodômetro agora)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder={`Ex: ${jornada.km_inicial + 200}`}
              value={formChegada.km_chegada}
              onChange={e => setFormChegada(f => ({ ...f, km_chegada: e.target.value }))}
            />
            <span className="hint">Leitura ao retornar</span>
          </div>

          <div className="fg">
            <label>Observações</label>
            <textarea
              placeholder="Ocorrências, paradas..."
              value={formChegada.observacoes}
              onChange={e => setFormChegada(f => ({ ...f, observacoes: e.target.value }))}
              style={{ minHeight: 52 }}
            />
          </div>

          <div className="btn-row" style={{ gap: 8 }}>
            {/* botão para registrar nova saída parcial — avançado, opcional */}
            <button className="btn btn-primary btn-block" onClick={handleChegada} disabled={saving}>
              {saving
                ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
                : <><i className="ti ti-flag-check" aria-hidden="true" /> Encerrar jornada</>
              }
            </button>
          </div>
        </div>

      ) : (
        /* ── FORMULÁRIO DE SAÍDA ── */
        <div className="card">
          <div className="card-header">
            <div className="card-icon" style={{ background: 'var(--blbg)', color: 'var(--bltx)' }}>
              <i className="ti ti-road" aria-hidden="true" />
            </div>
            <div>
              <div className="card-title">Hodômetro do dia</div>
              <div className="card-sub">Registre a saída agora</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px',
            marginBottom: 14, fontSize: 12, color: 'var(--t3)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <i className="ti ti-info-circle" aria-hidden="true" />
            Nenhuma jornada iniciada hoje
          </div>

          <div className="fg">
            <label>Data</label>
            <input type="date" value={formSaida.data} onChange={e => setFormSaida(f => ({ ...f, data: e.target.value }))} />
          </div>

          <div className="fg">
            <label>Km de saída (hodômetro agora)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Ex: 48320"
              value={formSaida.km_saida}
              onChange={e => setFormSaida(f => ({ ...f, km_saida: e.target.value }))}
            />
            <span className="hint">Leitura ao sair</span>
          </div>

          <div className="fg">
            <label>Destino / rota</label>
            <input
              type="text"
              placeholder="Ex: Entrega centro"
              value={formSaida.destino}
              onChange={e => setFormSaida(f => ({ ...f, destino: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary btn-block" onClick={handleSaida} disabled={saving} style={{ marginTop: 4 }}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
              : <><i className="ti ti-arrow-right" aria-hidden="true" /> Registrar saída</>
            }
          </button>
        </div>
      )}

      {/* ── HISTÓRICO RECENTE ── */}
      <HistoricoKm condutorId={condutor?.id} />
    </div>
  )
}

// ── Histórico dos últimos registros ──────────────────────────
function HistoricoKm({ condutorId }) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!condutorId) return
    supabase
      .from('km_diario')
      .select('*')
      .eq('condutor_id', condutorId)
      .not('km_final', 'is', null)   // só jornadas encerradas
      .order('data', { ascending: false })
      .limit(7)
      .then(({ data }) => { setRegistros(data || []); setLoading(false) })
  }, [condutorId])

  if (loading) return null
  if (registros.length === 0) return null

  return (
    <div className="card">
      <div className="section-title">
        <i className="ti ti-history" aria-hidden="true" />
        Histórico recente
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Saída</th>
              <th>Chegada</th>
              <th>km</th>
              <th>Destino</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.km_inicial?.toLocaleString('pt-BR')}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.km_final?.toLocaleString('pt-BR')}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--grn)' }}>
                  +{(r.km_final - r.km_inicial).toLocaleString('pt-BR')}
                </td>
                <td style={{ color: 'var(--t2)' }}>{r.destino || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
