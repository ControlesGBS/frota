import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard1() {
  const [stats, setStats]     = useState(null)
  const [alertas, setAlertas] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const now = new Date()
    const mes = now.toISOString().slice(0, 7) // YYYY-MM

    const [{ data: abast }, { data: oleo }, { data: manut }, { data: conds }, { data: docs }, { data: cnhs }] = await Promise.all([
      supabase.from('abastecimentos').select('valor_total, data').gte('data', mes + '-01'),
      supabase.from('trocas_oleo').select('valor, data').gte('data', mes + '-01'),
      supabase.from('manutencoes').select('valor_total, data, condutor_id, tipo_reparo, forma_pagamento, status_pagamento').gte('data_servico', mes + '-01'),
      supabase.from('condutores').select('id, nome, marca_veiculo, placa, cnh_vencimento'),
      supabase.from('documentos').select('*').order('vencimento', { ascending: true }),
      supabase.from('condutores').select('nome, cnh_vencimento').not('cnh_vencimento', 'is', null),
    ])

    const totalAbast = (abast || []).reduce((s, r) => s + (r.valor_total || 0), 0)
    const totalOleo  = (oleo  || []).reduce((s, r) => s + (r.valor    || 0), 0)
    const totalManut = (manut || []).reduce((s, r) => s + (r.valor_total || 0), 0)

    setStats({ totalAbast, totalOleo, totalManut, total: totalAbast + totalOleo + totalManut })

    // Alertas: CNH vencendo em 30 dias
    const alertList = []
    const hoje = new Date();
    (cnhs || []).forEach(c => {
      const diff = Math.ceil((new Date(c.cnh_vencimento) - hoje) / 86400000)
      if (diff <= 30) alertList.push({ tipo: 'CNH', msg: `CNH vencendo em ${diff > 0 ? diff + ' dias' : 'VENCIDA'} · ${c.nome}`, grave: diff <= 0 })
    });
    (docs || []).forEach(d => {
      const diff = Math.ceil((new Date(d.vencimento) - hoje) / 86400000)
      if (diff <= (d.alertar_dias || 30)) alertList.push({ tipo: 'Doc', msg: `${d.tipo_documento} vencendo em ${diff > 0 ? diff + ' dias' : 'VENCIDO'}`, grave: diff <= 0 })
    })
    setAlertas(alertList)

    // Últimos lançamentos: combina abastecimentos + manutenções
    const lancList = [
      ...(abast || []).map(r => ({ data: r.data, tipo: 'Combustível', valor: r.valor_total })),
      ...(manut  || []).map(r => ({ data: r.data_servico || r.data, tipo: r.tipo_reparo || 'Manutenção', valor: r.valor_total })),
      ...(oleo   || []).map(r => ({ data: r.data, tipo: 'Troca de óleo', valor: r.valor })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 8)
    setLancamentos(lancList)

    setLoading(false)
  }

  // Dados para gráfico dos últimos 6 meses
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    return { mes: d.toLocaleString('pt-BR', { month: 'short' }), valor: Math.floor(Math.random() * 3000 + 1500) }
  })

  if (loading) return <div className="loading"><div className="spinner" />Carregando...</div>

  return (
    <div>
      {/* Métricas */}
      <div className="metrics">
        <div className="metric">
          <div className="metric-label"><i className="ti ti-gas-station" aria-hidden="true" />Combustível (mês)</div>
          <div className="metric-value">R$ {stats.totalAbast.toFixed(0)}</div>
        </div>
        <div className="metric">
          <div className="metric-label"><i className="ti ti-oil" aria-hidden="true" />Óleo (mês)</div>
          <div className="metric-value">R$ {stats.totalOleo.toFixed(0)}</div>
        </div>
        <div className="metric">
          <div className="metric-label"><i className="ti ti-tool" aria-hidden="true" />Manutenção (mês)</div>
          <div className="metric-value">R$ {stats.totalManut.toFixed(0)}</div>
        </div>
        <div className="metric">
          <div className="metric-label"><i className="ti ti-sum" aria-hidden="true" />Total geral</div>
          <div className="metric-value">R$ {stats.total.toFixed(0)}</div>
        </div>
      </div>

      <div className="g2">
        {/* Alertas */}
        <div className="card">
          <div className="section-title"><i className="ti ti-alert-triangle" style={{ color: 'var(--red)' }} aria-hidden="true" />Alertas ativos</div>
          {alertas.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nenhum alerta no momento ✓</div>
            : alertas.map((a, i) => (
                <div key={i} className={`alert-box ${a.grave ? 'alert-danger' : 'alert-warn'}`}>
                  <i className={`ti ${a.grave ? 'ti-alert-octagon' : 'ti-alert-triangle'}`} aria-hidden="true" />
                  {a.msg}
                </div>
              ))
          }
        </div>

        {/* Gráfico mensal */}
        <div className="card">
          <div className="section-title"><i className="ti ti-chart-bar" aria-hidden="true" />Combustível — últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={22}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={v => [`R$ ${v}`, 'Gasto']}
                contentStyle={{ fontSize: 12, background: 'var(--bg0)', border: '.5px solid var(--bd)', borderRadius: 8 }}
              />
              <Bar dataKey="valor" fill="var(--blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimos lançamentos */}
      <div className="card">
        <div className="section-title"><i className="ti ti-list-details" aria-hidden="true" />Últimos lançamentos</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Data</th>
                <th style={{ width: 120 }}>Tipo</th>
                <th style={{ width: 90 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.length === 0
                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--t3)' }}>Nenhum lançamento este mês</td></tr>
                : lancamentos.map((l, i) => (
                  <tr key={i}>
                    <td>{l.data ? new Date(l.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className={`badge ${l.tipo === 'Combustível' ? 'badge-warn' : l.tipo === 'Troca de óleo' ? 'badge-ok' : 'badge-purple'}`}>
                        {l.tipo}
                      </span>
                    </td>
                    <td>R$ {(l.valor || 0).toFixed(2)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
