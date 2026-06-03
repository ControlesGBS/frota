import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function KmTab({ condutor }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    data: today, km_inicial: '', km_final: '', destino: '', observacoes: ''
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const kmInicial = parseInt(form.km_inicial) || 0
  const kmFinal   = parseInt(form.km_final)   || 0
  const percorrido = kmFinal > kmInicial ? kmFinal - kmInicial : 0

  async function handleSave() {
    if (!form.km_inicial) { toast.error('Informe o km inicial'); return }
    setSaving(true)
    const { error } = await supabase.from('km_diario').insert({
      condutor_id:  condutor.id,
      data:         form.data,
      km_inicial:   kmInicial,
      km_final:     kmFinal || null,
      destino:      form.destino || null,
      observacoes:  form.observacoes || null,
    })
    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Km registrado com sucesso!')
    setForm({ data: today, km_inicial: '', km_final: '', destino: '', observacoes: '' })
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--blbg)', color: 'var(--bltx)' }}>
            <i className="ti ti-road" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Registro de km do dia</div>
            <div className="card-sub">Hodômetro inicial e final</div>
          </div>
        </div>

        {/* Painel visual km */}
        <div className="km-strip">
          <div className="km-box">
            <div className="km-val">{kmInicial ? kmInicial.toLocaleString('pt-BR') : '—'}</div>
            <div className="km-lbl">Km inicial</div>
          </div>
          <div className="km-arrow"><i className="ti ti-arrow-right" aria-hidden="true" /></div>
          <div className="km-box">
            <div className="km-diff">+{percorrido.toLocaleString('pt-BR')} km</div>
            <div className="km-lbl">Percorridos</div>
          </div>
          <div className="km-arrow"><i className="ti ti-arrow-right" aria-hidden="true" /></div>
          <div className="km-box">
            <div className="km-val">{kmFinal ? kmFinal.toLocaleString('pt-BR') : '—'}</div>
            <div className="km-lbl">Km final</div>
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Data</label>
            <input type="date" value={form.data} onChange={e => set('data', e.target.value)} />
          </div>
          <div className="fg">
            <label>Destino / rota</label>
            <input type="text" placeholder="Ex: RZ01, Releitura" value={form.destino} onChange={e => set('destino', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Km inicial (hodômetro)</label>
            <input type="number" placeholder="Ex: 48320" value={form.km_inicial} onChange={e => set('km_inicial', e.target.value)} />
            <span className="hint">Leitura ao sair</span>
          </div>
          <div className="fg">
            <label>Km final (hodômetro)</label>
            <input type="number" placeholder="Ex: 48540" value={form.km_final} onChange={e => set('km_final', e.target.value)} />
            <span className="hint">Leitura ao retornar</span>
          </div>
        </div>

        <div className="fg">
          <label>Observações</label>
          <textarea placeholder="Ocorrências, paradas..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
              : <><i className="ti ti-check" aria-hidden="true" /> Salvar registro</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
