import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Cadastros() {
  const [condutores, setCondutores] = useState([])
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', tipo_veiculo: 'Carro', marca_veiculo: '',
    placa: '', cor_veiculo: '', km_inicial: '', data_entrega: '',
    situacao_veiculo: 'Novo', observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { loadCondutores() }, [])

  async function loadCondutores() {
    const { data } = await supabase.from('condutores').select('*').order('nome')
    setCondutores(data || [])
  }

  async function handleSave() {
    if (!form.nome || !form.email || !form.senha || !form.marca_veiculo || !form.placa) {
      toast.error('Preencha nome, e-mail, senha, marca e placa'); return
    }
    setSaving(true)
    try {
      // 1. Cria usuário no Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.senha,
        email_confirm: true,
      })
      if (authErr) throw authErr

      // 2. Insere na tabela condutores
      const { error: dbErr } = await supabase.from('condutores').insert({
        nome:             form.nome,
        email:            form.email,
        tipo_veiculo:     form.tipo_veiculo,
        marca_veiculo:    form.marca_veiculo,
        placa:            form.placa.toUpperCase(),
        cor_veiculo:      form.cor_veiculo || null,
        km_inicial:       form.km_inicial ? parseInt(form.km_inicial) : 0,
        data_entrega:     form.data_entrega || null,
        situacao_veiculo: form.situacao_veiculo,
        observacoes:      form.observacoes || null,
        is_admin:         false,
      })
      if (dbErr) throw dbErr

      toast.success(`Condutor ${form.nome} cadastrado!`)
      setForm({ nome: '', email: '', senha: '', tipo_veiculo: 'Carro', marca_veiculo: '', placa: '', cor_veiculo: '', km_inicial: '', data_entrega: '', situacao_veiculo: 'Novo', observacoes: '' })
      loadCondutores()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: 'var(--blbg)', color: 'var(--bltx)' }}>
            <i className="ti ti-user-plus" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Cadastrar condutor</div>
            <div className="card-sub">Dados de acesso e veículo</div>
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Nome completo</label>
            <input type="text" placeholder="Ex: João Silva" value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>
          <div className="fg">
            <label>E-mail de acesso</label>
            <input type="email" placeholder="condutor@empresa.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>

        <div className="fg">
          <label>Senha de acesso</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => set('senha', e.target.value)} />
          <span className="hint">O condutor usará esta senha para entrar no sistema</span>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Tipo de veículo</label>
            <select value={form.tipo_veiculo} onChange={e => set('tipo_veiculo', e.target.value)}>
              <option>Carro</option>
              <option>Moto</option>
              <option>Caminhonete</option>
              <option>Van</option>
            </select>
          </div>
          <div className="fg">
            <label>{form.tipo_veiculo === 'Moto' ? 'Marca/modelo da moto' : 'Marca/modelo do carro'}</label>
            <input type="text" placeholder={form.tipo_veiculo === 'Moto' ? 'Ex: Honda CG 160' : 'Ex: Fiat Strada 1.3'} value={form.marca_veiculo} onChange={e => set('marca_veiculo', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Placa</label>
            <input
              type="text"
              placeholder="MNB-3310"
              value={form.placa}
              onChange={e => set('placa', e.target.value.toUpperCase())}
              style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }}
            />
          </div>
          <div className="fg">
            <label>Cor do veículo</label>
            <input type="text" placeholder="Ex: Branco perolado" value={form.cor_veiculo} onChange={e => set('cor_veiculo', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Km inicial na entrega</label>
            <input type="number" placeholder="0 (novo) ou km atual" value={form.km_inicial} onChange={e => set('km_inicial', e.target.value)} />
          </div>
          <div className="fg">
            <label>Data de entrega ao condutor</label>
            <input type="date" value={form.data_entrega} onChange={e => set('data_entrega', e.target.value)} />
          </div>
        </div>

        <div className="fg">
          <label>Situação do veículo</label>
          <div className="chips" style={{ marginTop: 4 }}>
            <div
              className={`chip ${form.situacao_veiculo === 'Novo' ? 'active-blue' : ''}`}
              onClick={() => set('situacao_veiculo', 'Novo')}
            >
              <i className="ti ti-sparkles" aria-hidden="true" /> Novo
            </div>
            <div
              className={`chip ${form.situacao_veiculo === 'Semi-novo' ? 'active-amber' : ''}`}
              onClick={() => set('situacao_veiculo', 'Semi-novo')}
            >
              <i className="ti ti-refresh" aria-hidden="true" /> Semi-novo
            </div>
          </div>
        </div>

        <div className="fg">
          <label>Observações</label>
          <textarea
            placeholder="Anotações sobre o veículo ou condutor..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            style={{ minHeight: 52 }}
          />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Cadastrando...</>
              : <><i className="ti ti-check" aria-hidden="true" /> Cadastrar condutor</>
            }
          </button>
        </div>
      </div>

      {/* Lista de condutores */}
      <div className="card">
        <div className="section-title"><i className="ti ti-users" aria-hidden="true" />Condutores cadastrados</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Veículo</th>
                <th style={{ width: 80 }}>Placa</th>
                <th style={{ width: 70 }}>Km inicial</th>
                <th style={{ width: 80 }}>Situação</th>
                <th style={{ width: 80 }}>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {condutores.filter(c => !c.is_admin).length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--t3)' }}>Nenhum condutor cadastrado</td></tr>
                : condutores.filter(c => !c.is_admin).map(c => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.marca_veiculo} ({c.tipo_veiculo})</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{c.placa}</td>
                    <td>{c.km_inicial?.toLocaleString('pt-BR')}</td>
                    <td><span className={`badge ${c.situacao_veiculo === 'Novo' ? 'badge-ok' : 'badge-warn'}`}>{c.situacao_veiculo}</span></td>
                    <td>{c.data_entrega ? new Date(c.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
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
