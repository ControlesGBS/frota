import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const COMBUSTIVEIS = ['Gasolina', 'Etanol', 'Diesel']
const TIPOS_OLEO   = ['5W-30 Sintético', '5W-40 Sintético', '10W-40 Semi-sintético', '15W-40 Mineral']

export default function CombustivelTab({ condutor }) {
  const today = new Date().toISOString().split('T')[0]

  const [fuel, setFuel] = useState({
    data: today, tipo_combustivel: 'Gasolina', litros: '', preco_litro: '',
    km_abastecimento: '', posto: '', observacoes: ''
  })
  const [temOleo, setTemOleo] = useState(false)
  const [oleo, setOleo] = useState({
    data: today, km_troca: '', km_proxima: '', tipo_oleo: '5W-30 Sintético',
    quantidade_litros: '', valor: ''
  })
  const [saving, setSaving] = useState(false)

  const setF = (k, v) => setFuel(f => ({ ...f, [k]: v }))
  const setO = (k, v) => setOleo(o => ({ ...o, [k]: v }))

  const totalCombustivel = (parseFloat(fuel.litros) || 0) * (parseFloat(fuel.preco_litro) || 0)

  async function handleSave() {
    if (!fuel.litros || !fuel.preco_litro || !fuel.km_abastecimento) {
      toast.error('Preencha litros, preço e km do abastecimento'); return
    }
    setSaving(true)
    try {
      const { error: e1 } = await supabase.from('abastecimentos').insert({
        condutor_id:      condutor.id,
        data:             fuel.data,
        tipo_combustivel: fuel.tipo_combustivel,
        litros:           parseFloat(fuel.litros),
        preco_litro:      parseFloat(fuel.preco_litro),
        km_abastecimento: parseInt(fuel.km_abastecimento),
        posto:            fuel.posto || null,
        observacoes:      fuel.observacoes || null,
      })
      if (e1) throw e1

      if (temOleo) {
        const { error: e2 } = await supabase.from('trocas_oleo').insert({
          condutor_id:       condutor.id,
          data:              oleo.data,
          km_troca:          parseInt(oleo.km_troca),
          km_proxima:        oleo.km_proxima ? parseInt(oleo.km_proxima) : null,
          tipo_oleo:         oleo.tipo_oleo,
          quantidade_litros: oleo.quantidade_litros ? parseFloat(oleo.quantidade_litros) : null,
          valor:             oleo.valor ? parseFloat(oleo.valor) : null,
        })
        if (e2) throw e2
      }

      toast.success('Lançamento salvo!')
      setFuel({ data: today, tipo_combustivel: 'Gasolina', litros: '', preco_litro: '', km_abastecimento: '', posto: '', observacoes: '' })
      setTemOleo(false)
      setOleo({ data: today, km_troca: '', km_proxima: '', tipo_oleo: '5W-30 Sintético', quantidade_litros: '', valor: '' })
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* COMBUSTÍVEL */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--ambg)', color: 'var(--amtx)' }}>
            <i className="ti ti-gas-station" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Abastecimento</div>
            <div className="card-sub">Registre data, litros, valor e km</div>
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Data do abastecimento</label>
            <input type="date" value={fuel.data} onChange={e => setF('data', e.target.value)} />
          </div>
          <div className="fg">
            <label>Posto / local</label>
            <input type="text" placeholder="Ex: Posto Shell Av. Osmane" value={fuel.posto} onChange={e => setF('posto', e.target.value)} />
          </div>
        </div>

        <div className="fg">
          <label>Tipo de combustível</label>
          <div className="chips">
            {COMBUSTIVEIS.map(c => (
              <div
                key={c}
                className={`chip ${fuel.tipo_combustivel === c ? (c === 'Gasolina' ? 'active-blue' : c === 'Etanol' ? 'active-green' : 'active-amber') : ''}`}
                onClick={() => setF('tipo_combustivel', c)}
              >
                <i className={`ti ${c === 'Gasolina' ? 'ti-droplet' : c === 'Etanol' ? 'ti-leaf' : 'ti-engine'}`} aria-hidden="true" />
                {c}
              </div>
            ))}
          </div>
        </div>

        <div className="g3">
          <div className="fg">
            <label>Litros abastecidos</label>
            <input type="number" step="0.1" placeholder="40" value={fuel.litros} onChange={e => setF('litros', e.target.value)} />
          </div>
          <div className="fg">
            <label>Preço por litro (R$)</label>
            <input type="number" step="0.01" placeholder="5.89" value={fuel.preco_litro} onChange={e => setF('preco_litro', e.target.value)} />
          </div>
          <div className="fg">
            <label>Total pago (R$)</label>
            <input readOnly value={totalCombustivel > 0 ? `R$ ${totalCombustivel.toFixed(2)}` : ''} placeholder="Calculado auto" />
          </div>
        </div>

        <div className="fg">
          <label>Km no abastecimento</label>
          <input type="number" placeholder="Ex: 48320" value={fuel.km_abastecimento} onChange={e => setF('km_abastecimento', e.target.value)} />
          <span className="hint">Hodômetro atual</span>
        </div>

        <div className="fg">
          <label>Observações</label>
          <textarea placeholder="Notas sobre o abastecimento..." value={fuel.observacoes} onChange={e => setF('observacoes', e.target.value)} style={{ minHeight: 52 }} />
        </div>
      </div>

      {/* ÓLEO */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--grbg)', color: 'var(--grtx)' }}>
            <i className="ti ti-oil" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Troca de óleo</div>
            <div className="card-sub">Preencha apenas quando houver troca</div>
          </div>
        </div>

        <div className="toggle-row">
          <span style={{ fontSize: 13 }}>Houve troca de óleo nesta data?</span>
          <label className="toggle">
            <input type="checkbox" checked={temOleo} onChange={e => setTemOleo(e.target.checked)} />
            <span className="toggle-sl" />
          </label>
        </div>

        {temOleo && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '.5px solid var(--bd)' }}>
            <div className="g2">
              <div className="fg">
                <label>Data da troca</label>
                <input type="date" value={oleo.data} onChange={e => setO('data', e.target.value)} />
              </div>
              <div className="fg">
                <label>Km na troca de óleo</label>
                <input type="number" placeholder="Ex: 48320" value={oleo.km_troca} onChange={e => setO('km_troca', e.target.value)} />
              </div>
            </div>
            <div className="g3">
              <div className="fg">
                <label>Tipo de óleo</label>
                <select value={oleo.tipo_oleo} onChange={e => setO('tipo_oleo', e.target.value)}>
                  {TIPOS_OLEO.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Quantidade (litros)</label>
                <input type="number" step="0.5" placeholder="4" value={oleo.quantidade_litros} onChange={e => setO('quantidade_litros', e.target.value)} />
              </div>
              <div className="fg">
                <label>Valor pago (R$)</label>
                <input type="number" step="0.01" placeholder="180.00" value={oleo.valor} onChange={e => setO('valor', e.target.value)} />
              </div>
            </div>
            <div className="fg">
              <label>Próxima troca prevista (km)</label>
              <input type="number" placeholder="Ex: 53320" value={oleo.km_proxima} onChange={e => setO('km_proxima', e.target.value)} />
              <span className="hint">Gera alerta automático para o admin</span>
            </div>
          </div>
        )}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
              : <><i className="ti ti-check" aria-hidden="true" /> Salvar lançamento</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
