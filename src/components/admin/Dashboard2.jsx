import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard2() {
  const [condutores, setCondutores] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('condutores').select('id, nome, marca_veiculo, placa, cnh_vencimento, cnh_categoria, cnh_pontos, is_admin')
      .eq('is_admin', false)
      .then(({ data }) => {
        setCondutores(data || [])
        if (data?.length) setSelectedId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (selectedId && mes) loadData()
  }, [selectedId, mes])

  async function loadData() {
    setLoading(true)

    // Calcula início e fim do mês corretamente
    const [ano, mesNum] = mes.split('-').map(Number)
    const ini = `${mes}-01`
    const ultimoDia = new Date(ano, mesNum, 0).getDate()
    const fim = `${mes}-${String(ultimoDia).padStart(2, '0')}`

    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from('abastecimentos').select('*').eq('condutor_id', selectedId).gte('data', ini).lte('data', fim).order('data'),
      supabase.from('trocas_oleo').select('*').eq('condutor_id', selectedId).gte('data', ini).lte('data', fim).order('data'),
      supabase.from('manutencoes').select('*').eq('condutor_id', selectedId).gte('data_servico', ini).lte('data_servico', fim).order('data_servico'),
      supabase.from('vistorias').select('*').eq('condutor_id', selectedId).order('data_vistoria', { ascending: false }).limit(1),
    ])

    const abast   = r1.data || []
    const oleo    = r2.data || []
    const manut   = r3.data || []
    const vistoria = r4.data || []

    // Histórico 6 meses combustível
    const fuelHistory = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(ano, mesNum - 1, 1), 5 - i)
        const s = format(startOfMonth(d), 'yyyy-MM-dd')
        const e = format(endOfMonth(d), 'yyyy-MM-dd')
        return supabase.from('abastecimentos')
          .select('valor_total')
          .eq('condutor_id', selectedId)
          .gte('data', s)
          .lte('data', e)
          .then(({ data: r }) => ({
            mes: format(d, 'MMM', { locale: ptBR }),
            valor: (r || []).reduce((acc, x) => acc + (x.valor_total || 0), 0)
          }))
      })
    )

    // Histórico 6 meses manutenção
    const manutHistory = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(ano, mesNum - 1, 1), 5 - i)
        const s = format(startOfMonth(d), 'yyyy-MM-dd')
        const e = format(endOfMonth(d), 'yyyy-MM-dd')
        return supabase.from('manutencoes')
          .select('valor_total')
          .eq('condutor_id', selectedId)
          .gte('data_servico', s)
          .lte('data_servico', e)
          .then(({ data: r }) => ({
            mes: format(d, 'MMM', { locale: ptBR }),
            valor: (r || []).reduce((acc, x) => acc + (x.valor_total || 0), 0)
          }))
      })
    )

    const totalAbast = abast.reduce((s, r) => s + (r.valor_total || 0), 0)
    const totalOleo  = oleo.reduce((s, r) => s + (r.valor || 0), 0)
    const totalManut = manut.reduce((s, r) => s + (r.valor_total || 0), 0)

    setData({ abast, oleo, manut, vistoria: vistoria[0] || null, totalAbast, totalOleo, totalManut, fuelHistory, manutHistory })
    setLoading(false)
  }

  const condutor = condutores.find(c => c.id === selectedId)

  function cnhStatus(venc) {
    if (!venc) return { label: 'Não informado', cls: 'badge-info' }
    const diff = Math.ceil((new Date(venc) - new Date()) / 86400000)
    if (diff < 0)   return { label: 'VENCIDA', cls: 'badge-danger' }
    if (diff <= 30) return { label: `Vence em ${diff} dias`, cls: 'badge-danger' }
    if (diff <= 90) return { label: `Vence em ${diff} dias`, cls: 'badge-warn' }
    return { label: 'Regular', cls: 'badge-ok' }
  }

  const mesesOpts = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: ptBR }) }
  })

  return (
    <div>
      <div className="card">
        <div className="g2">
          <div className="fg" style={{ marginBottom: 0 }}>
            <label>Condutor</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {condutores.map(c => (
                <option key={c.id} value={c.id}>{c.nome} · {c.marca_veiculo}</option>
              ))}
            </select>
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label>Mês de referência</label>
            <select value={mes} onChange={e => setMes(e.target.value)}>
              {mesesOpts.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" />Carregando dados...</div>}

      {!loading && data && condutor && (
        <>
          <div className="g2">
            <div className="card">
              <div className="section-title" style={{ fontSize: 12 }}><i className="ti ti-id" aria-hidden="true" />CNH do condutor</div>
              <div className="info-box">
                <div className="info-row"><span className="info-lbl">Categoria</span><span className="info-val">{condutor.cnh_categoria || '—'}</span></div>
                <div className="info-row">
                  <span className="info-lbl">Vencimento</span>
                  <span className="info-val" style={{ color: condutor.cnh_vencimento && new Date(condutor.cnh_vencimento) < new Date() ? 'var(--red)' : 'var(--t1)' }}>
                    {condutor.cnh_vencimento ? new Date(condutor.cnh_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
                <div className="info-row"><span className="info-lbl">Situação</span><span className={`badge ${cnhStatus(condutor.cnh_vencimento).cls}`}>{cnhStatus(condutor.cnh_vencimento).label}</span></div>
                <div className="info-row"><span className="info-lbl">Pontos</span><span className="info-val">{condutor.cnh_pontos ?? 0} pts</span></div>
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{ fontSize: 12 }}><i className="ti ti-clipboard-check" aria-hidden="true" />Laudo de vistoria</div>
              <div className="info-box">
                {data.vistoria ? (
                  <>
                    <div className="info-row"><span className="info-lbl">Última vistoria</span><span className="info-val">{new Date(data.vistoria.data_vistoria + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
                    <div className="info-row"><span className="info-lbl">Resultado</span><span className={`badge ${data.vistoria.resultado === 'Aprovado' ? 'badge-ok' : data.vistoria.resultado === 'Reprovado' ? 'badge-danger' : 'badge-warn'}`}>{data.vistoria.resultado}</span></div>
                    <div className="info-row"><span className="info-lbl">Próxima data</span><span className="info-val">{data.vistoria.proxima_vistoria ? new Date(data.vistoria.proxima_vistoria + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span></div>
                    {data.vistoria.arquivo_url && (
                      <div className="info-row">
                        <span className="info-lbl">Laudo</span>
                        <a href={data.vistoria.arquivo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)' }}>
                          <i className="ti ti-download" aria-hidden="true" /> Ver arquivo
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nenhuma vistoria registrada</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            <div className="metric">
              <div className="metric-label"><i className="ti ti-gas-station" aria-hidden="true" />Combustível</div>
              <div className="metric-value">R$ {data.totalAbast.toFixed(0)}</div>
              <div className="metric-sub">{data.abast.reduce((s, r) => s + (r.litros || 0), 0).toFixed(0)} L no mês</div>
            </div>
            <div className="metric">
              <div className="metric-label"><i className="ti ti-oil" aria-hidden="true" />Óleo</div>
              <div className="metric-value">R$ {data.totalOleo.toFixed(0)}</div>
              <div className="metric-sub">{data.oleo.length} troca(s)</div>
            </div>
            <div className="metric">
              <div className="metric-label"><i className="ti ti-tool" aria-hidden="true" />Manutenção</div>
              <div className="metric-value">R$ {data.totalManut.toFixed(0)}</div>
              <div className="metric-sub">{data.manut.length} OS no mês</div>
            </div>
          </div>

          <div className="g2">
            <div className="card">
              <div className="section-title" style={{ fontSize: 12 }}><i className="ti ti-chart-bar" aria-hidden="true" />Combustível — 6 meses</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data.fuelHistory} barSize={18}>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--t3)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={v => [`R$ ${v.toFixed(0)}`, 'Combustível']} contentStyle={{ fontSize: 11, background: 'var(--bg0)', border: '.5px solid var(--bd)', borderRadius: 8 }} />
                  <Bar dataKey="valor" fill="var(--blue)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="section-title" style={{ fontSize: 12 }}><i className="ti ti-chart-bar" aria-hidden="true" />Manutenção — 6 meses</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={data.manutHistory} barSize={18}>
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'var(--t3)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={v => [`R$ ${v.toFixed(0)}`, 'Manutenção']} contentStyle={{ fontSize: 11, background: 'var(--bg0)', border: '.5px solid var(--bd)', borderRadius: 8 }} />
                  <Bar dataKey="valor" fill="var(--pur)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><i className="ti ti-gas-station" aria-hidden="true" />Abastecimentos do mês</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Data</th>
                    <th style={{ width: 80 }}>Tipo</th>
                    <th style={{ width: 60 }}>Litros</th>
                    <th style={{ width: 70 }}>Preço/L</th>
                    <th style={{ width: 70 }}>Total</th>
                    <th style={{ width: 70 }}>Km</th>
                    <th>Posto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.abast.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t3)' }}>Nenhum abastecimento neste mês</td></tr>
                    : data.abast.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td><span className={`badge ${r.tipo_combustivel === 'Gasolina' ? 'badge-info' : r.tipo_combustivel === 'Etanol' ? 'badge-ok' : 'badge-warn'}`}>{r.tipo_combustivel}</span></td>
                        <td>{r.litros} L</td>
                        <td>R$ {r.preco_litro?.toFixed(2)}</td>
                        <td>R$ {r.valor_total?.toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{r.km_abastecimento?.toLocaleString('pt-BR')}</td>
                        <td>{r.posto || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><i className="ti ti-tool" aria-hidden="true" />Manutenções do mês</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Data</th>
                    <th style={{ width: 110 }}>Reparo</th>
                    <th>Oficina</th>
                    <th style={{ width: 75 }}>Valor</th>
                    <th style={{ width: 70 }}>Pgto.</th>
                    <th style={{ width: 70 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.manut.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--t3)' }}>Nenhuma manutenção neste mês</td></tr>
                    : data.manut.map((r, i) => (
                      <tr key={i}>
                        <td>{r.data_servico ? new Date(r.data_servico + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                        <td><span className="badge badge-purple">{r.tipo_reparo === 'Outro' ? r.descricao_outro?.slice(0, 20) || 'Outro' : r.tipo_reparo}</span></td>
                        <td>{r.oficina || '—'}</td>
                        <td>R$ {r.valor_total?.toFixed(2)}</td>
                        <td>{r.forma_pagamento || '—'}</td>
                        <td><span className={`badge ${r.status_pagamento === 'Pago' ? 'badge-ok' : 'badge-warn'}`}>{r.status_pagamento}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
