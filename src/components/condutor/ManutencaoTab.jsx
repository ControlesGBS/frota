import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const REPAROS = [
  { id: 'Pneu',             icon: 'ti-circle' },
  { id: 'Baú',              icon: 'ti-box' },
  { id: 'Antena',           icon: 'ti-antenna' },
  { id: 'Relação',          icon: 'ti-settings-2' },
  { id: 'Lâmpada',          icon: 'ti-bulb' },
  { id: 'Pastilha de freio',icon: 'ti-brake' },
  { id: 'Outro',            icon: 'ti-dots' },
]
const TIPOS_MANUT   = ['Preventiva', 'Corretiva', 'Revisão', 'Emergencial']
const FORMAS_PAGTO  = ['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Boleto', 'A prazo']

export default function ManutencaoTab({ condutor }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    tipo_reparo: '',
    descricao_outro: '',
    tipo_manutencao: 'Corretiva',
    data_servico: today,
    km_reparo: '',
    oficina: '',
    valor_total: '',
    data_pagamento: today,
    forma_pagamento: 'Pix',
    pecas_materiais: '',
    observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.tipo_reparo)   { toast.error('Selecione o tipo de reparo'); return }
    if (!form.data_servico)  { toast.error('Informe a data do serviço'); return }
    if (!form.valor_total)   { toast.error('Informe o valor total'); return }

    setSaving(true)
    const { error } = await supabase.from('manutencoes').insert({
      condutor_id:      condutor.id,
      tipo_reparo:      form.tipo_reparo,
      descricao_outro:  form.tipo_reparo === 'Outro' ? form.descricao_outro : null,
      tipo_manutencao:  form.tipo_manutencao,
      data_servico:     form.data_servico,
      km_reparo:        form.km_reparo ? parseInt(form.km_reparo) : null,
      oficina:          form.oficina || null,
      valor_total:      parseFloat(form.valor_total),
      data_pagamento:   form.data_pagamento || null,
      forma_pagamento:  form.forma_pagamento,
      pecas_materiais:  form.pecas_materiais || null,
      observacoes:      form.observacoes || null,
      status_pagamento: 'Pendente',
    })
    setSaving(false)

    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Ordem de serviço salva!')
    setForm({
      tipo_reparo: '', descricao_outro: '', tipo_manutencao: 'Corretiva',
      data_servico: today, km_reparo: '', oficina: '', valor_total: '',
      data_pagamento: today, forma_pagamento: 'Pix', pecas_materiais: '', observacoes: '',
    })
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--pubg)', color: 'var(--putx)' }}>
            <i className="ti ti-tool" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Ordem de serviço — Manutenção</div>
            <div className="card-sub">Selecione o tipo de reparo realizado</div>
          </div>
        </div>

        {/* Grade de tipos de reparo */}
        <div className="fg">
          <label>Tipo de reparo</label>
          <div className="repair-grid">
            {REPAROS.map(r => (
              <div
                key={r.id}
                className={`repair-chip ${form.tipo_reparo === r.id ? 'selected' : ''}`}
                onClick={() => set('tipo_reparo', r.id)}
              >
                <i className={`ti ${r.icon}`} aria-hidden="true" />
                {r.id}
              </div>
            ))}
          </div>

          {/* Descrição só aparece quando "Outro" está selecionado */}
          {form.tipo_reparo === 'Outro' && (
            <div style={{ marginTop: 8 }}>
              <textarea
                placeholder="Descreva o que foi feito no veículo..."
                value={form.descricao_outro}
                onChange={e => set('descricao_outro', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '.5px solid var(--bd2)', background: 'var(--bg2)', color: 'var(--t1)', fontSize: 13, fontFamily: 'var(--font)', resize: 'vertical', minHeight: 72 }}
              />
            </div>
          )}
        </div>

        <div className="g2">
          <div className="fg">
            <label>Tipo de manutenção</label>
            <select value={form.tipo_manutencao} onChange={e => set('tipo_manutencao', e.target.value)}>
              {TIPOS_MANUT.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="fg">
            <label>Data do serviço</label>
            <input type="date" value={form.data_servico} onChange={e => set('data_servico', e.target.value)} />
          </div>
        </div>

        <div className="fg">
          <label>Oficina / prestador</label>
          <input type="text" placeholder="Ex: Auto Mecânica Silva · Montes Claros" value={form.oficina} onChange={e => set('oficina', e.target.value)} />
        </div>

        <div className="g2">
          <div className="fg">
            <label>Km no momento do reparo</label>
            <input type="number" placeholder="Ex: 48320" value={form.km_reparo} onChange={e => set('km_reparo', e.target.value)} />
          </div>
          <div className="fg">
            <label>Valor total do serviço (R$)</label>
            <input type="number" step="0.01" placeholder="Ex: 380.00" value={form.valor_total} onChange={e => set('valor_total', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Data de pagamento</label>
            <input type="date" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} />
          </div>
          <div className="fg">
            <label>Forma de pagamento</label>
            <div className="chips" style={{ marginTop: 4 }}>
              {FORMAS_PAGTO.map(f => (
                <div
                  key={f}
                  className={`chip ${form.forma_pagamento === f ? 'active-blue' : ''}`}
                  onClick={() => set('forma_pagamento', f)}
                  style={{ fontSize: 11, padding: '5px 10px' }}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fg">
          <label>Peças / materiais utilizados</label>
          <textarea
            placeholder="Ex: 2x pastilha freio Bosch R$89 · 1x disco TRW R$140..."
            value={form.pecas_materiais}
            onChange={e => set('pecas_materiais', e.target.value)}
            style={{ minHeight: 52 }}
          />
        </div>

        <div className="fg">
          <label>Observações adicionais</label>
          <textarea
            placeholder="Garantia do serviço, próxima revisão, pendências..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            style={{ minHeight: 52 }}
          />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
              : <><i className="ti ti-check" aria-hidden="true" /> Salvar OS</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
