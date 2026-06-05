import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function nomeParaEmail(nome) {
  return nome.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '') + '@frota.interno'
}

export default function Cadastros() {
  const [condutores, setCondutores] = useState([])
  const [form, setForm] = useState({
    nome: '', sobrenome: '', senha: '', tipo_veiculo: 'Moto', marca_veiculo: '',
    placa: '', cor_veiculo: '', km_inicial: '', data_entrega: '',
    situacao_veiculo: 'Novo', observacoes: '',
  })
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState(null)   // id do condutor sendo editado
  const [editForm, setEditForm] = useState({})      // dados do form de edição
  const [savingEdit, setSavingEdit] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setE = (k, v) => setEditForm(f => ({ ...f, [k]: v }))

  const nomeCompleto = [form.nome, form.sobrenome].filter(Boolean).join(' ')
  const emailGerado  = nomeCompleto.length > 1 ? nomeParaEmail(nomeCompleto) : ''

  useEffect(() => { loadCondutores() }, [])

  async function loadCondutores() {
    const { data } = await supabase.from('condutores').select('*').order('nome')
    setCondutores(data || [])
  }

  async function handleSave() {
    if (!form.nome || !form.sobrenome) { toast.error('Preencha nome e sobrenome'); return }
    if (!form.senha || form.senha.length < 6) { toast.error('Senha mínima de 6 caracteres'); return }
    if (!form.marca_veiculo || !form.placa) { toast.error('Preencha marca e placa do veículo'); return }

    setSaving(true)
    try {
      const { error: authErr } = await supabase.auth.admin.createUser({
        email: emailGerado,
        password: form.senha,
        email_confirm: true,
      })
      if (authErr) throw authErr

      const { error: dbErr } = await supabase.from('condutores').insert({
        nome:             nomeCompleto,
        email:            emailGerado,
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

      toast.success(`Condutor ${nomeCompleto} cadastrado!`)
      setForm({ nome: '', sobrenome: '', senha: '', tipo_veiculo: 'Moto', marca_veiculo: '', placa: '', cor_veiculo: '', km_inicial: '', data_entrega: '', situacao_veiculo: 'Novo', observacoes: '' })
      loadCondutores()
    } catch (err) {
      toast.error('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function abrirEdicao(c) {
    setEditId(c.id)
    setEditForm({
      nome:             c.nome,
      tipo_veiculo:     c.tipo_veiculo,
      marca_veiculo:    c.marca_veiculo,
      placa:            c.placa,
      cor_veiculo:      c.cor_veiculo || '',
      km_inicial:       c.km_inicial ?? '',
      data_entrega:     c.data_entrega || '',
      situacao_veiculo: c.situacao_veiculo || 'Novo',
      observacoes:      c.observacoes || '',
      nova_senha:       '',
    })
  }

  function cancelarEdicao() {
    setEditId(null)
    setEditForm({})
  }

  async function salvarEdicao() {
    if (!editForm.nome)          { toast.error('Nome é obrigatório'); return }
    if (!editForm.marca_veiculo) { toast.error('Marca/modelo é obrigatório'); return }
    if (!editForm.placa)         { toast.error('Placa é obrigatória'); return }

    setSavingEdit(true)
    try {
      const { error } = await supabase.from('condutores').update({
        nome:             editForm.nome,
        tipo_veiculo:     editForm.tipo_veiculo,
        marca_veiculo:    editForm.marca_veiculo,
        placa:            editForm.placa.toUpperCase(),
        cor_veiculo:      editForm.cor_veiculo || null,
        km_inicial:       editForm.km_inicial ? parseInt(editForm.km_inicial) : 0,
        data_entrega:     editForm.data_entrega || null,
        situacao_veiculo: editForm.situacao_veiculo,
        observacoes:      editForm.observacoes || null,
      }).eq('id', editId)
      if (error) throw error

      toast.success('Dados atualizados!')
      cancelarEdicao()
      loadCondutores()
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div>
      {/* ── FORMULÁRIO DE CADASTRO ── */}
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
            <label>Nome</label>
            <input type="text" placeholder="Ex: João" value={form.nome} onChange={e => set('nome', e.target.value)} autoCapitalize="words" />
          </div>
          <div className="fg">
            <label>Sobrenome</label>
            <input type="text" placeholder="Ex: Silva" value={form.sobrenome} onChange={e => set('sobrenome', e.target.value)} autoCapitalize="words" />
          </div>
        </div>

        {emailGerado && (
          <div style={{ background: 'var(--blbg)', border: '1px solid rgba(74,158,255,.2)', borderRadius: 7, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--bltx)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-info-circle" aria-hidden="true" />
            Login: <strong>{nomeCompleto}</strong> com a senha abaixo
          </div>
        )}

        <div className="fg">
          <label>Senha de acesso</label>
          <input type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => set('senha', e.target.value)} />
          <span className="hint">O condutor entrará com o nome completo e esta senha</span>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Tipo de veículo</label>
            <select value={form.tipo_veiculo} onChange={e => set('tipo_veiculo', e.target.value)}>
              <option>Moto</option>
              <option>Carro</option>
            </select>
          </div>
          <div className="fg">
            <label>{form.tipo_veiculo === 'Moto' ? 'Marca/modelo da moto' : 'Marca/modelo do carro'}</label>
            <input type="text" placeholder={form.tipo_veiculo === 'Moto' ? 'Ex: Honda NXR 160' : 'Ex: Fiat Strada 1.3'} value={form.marca_veiculo} onChange={e => set('marca_veiculo', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Placa</label>
            <input type="text" placeholder="MNB-3310" value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }} />
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
            <div className={`chip ${form.situacao_veiculo === 'Novo' ? 'active-blue' : ''}`} onClick={() => set('situacao_veiculo', 'Novo')}>
              <i className="ti ti-sparkles" aria-hidden="true" /> Novo
            </div>
            <div className={`chip ${form.situacao_veiculo === 'Semi-novo' ? 'active-amber' : ''}`} onClick={() => set('situacao_veiculo', 'Semi-novo')}>
              <i className="ti ti-refresh" aria-hidden="true" /> Semi-novo
            </div>
          </div>
        </div>

        <div className="fg">
          <label>Observações</label>
          <textarea placeholder="Anotações sobre o veículo ou condutor..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} style={{ minHeight: 52 }} />
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

      {/* ── LISTA DE CONDUTORES ── */}
      <div className="card">
        <div className="section-title"><i className="ti ti-users" aria-hidden="true" />Condutores cadastrados</div>

        {condutores.filter(c => !c.is_admin).length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '12px 0' }}>Nenhum condutor cadastrado</div>
        ) : (
          condutores.filter(c => !c.is_admin).map(c => (
            <div key={c.id}>
              {/* ── Linha normal ── */}
              {editId !== c.id && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '.5px solid var(--bd)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                      {c.marca_veiculo} · <span style={{ fontFamily: 'var(--mono)' }}>{c.placa}</span> · {c.tipo_veiculo}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${c.situacao_veiculo === 'Novo' ? 'badge-ok' : 'badge-warn'}`}>{c.situacao_veiculo}</span>
                    <button
                      className="btn"
                      style={{ padding: '5px 10px', fontSize: 11 }}
                      onClick={() => abrirEdicao(c)}
                    >
                      <i className="ti ti-edit" aria-hidden="true" /> Editar
                    </button>
                  </div>
                </div>
              )}

              {/* ── Formulário de edição inline ── */}
              {editId === c.id && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 14, margin: '8px 0' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bltx)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-edit" aria-hidden="true" />
                    Editando: {c.nome}
                  </div>

                  <div className="fg">
                    <label>Nome completo</label>
                    <input type="text" value={editForm.nome} onChange={e => setE('nome', e.target.value)} />
                  </div>

                  <div className="g2">
                    <div className="fg">
                      <label>Tipo de veículo</label>
                      <select value={editForm.tipo_veiculo} onChange={e => setE('tipo_veiculo', e.target.value)}>
                        <option>Moto</option>
                        <option>Carro</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label>Marca/modelo</label>
                      <input type="text" value={editForm.marca_veiculo} onChange={e => setE('marca_veiculo', e.target.value)} />
                    </div>
                  </div>

                  <div className="g2">
                    <div className="fg">
                      <label>Placa</label>
                      <input type="text" value={editForm.placa} onChange={e => setE('placa', e.target.value.toUpperCase())} style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }} />
                    </div>
                    <div className="fg">
                      <label>Cor</label>
                      <input type="text" value={editForm.cor_veiculo} onChange={e => setE('cor_veiculo', e.target.value)} />
                    </div>
                  </div>

                  <div className="g2">
                    <div className="fg">
                      <label>Km inicial</label>
                      <input type="number" value={editForm.km_inicial} onChange={e => setE('km_inicial', e.target.value)} />
                    </div>
                    <div className="fg">
                      <label>Data de entrega</label>
                      <input type="date" value={editForm.data_entrega} onChange={e => setE('data_entrega', e.target.value)} />
                    </div>
                  </div>

                  <div className="fg">
                    <label>Situação</label>
                    <div className="chips" style={{ marginTop: 4 }}>
                      <div className={`chip ${editForm.situacao_veiculo === 'Novo' ? 'active-blue' : ''}`} onClick={() => setE('situacao_veiculo', 'Novo')}>
                        <i className="ti ti-sparkles" aria-hidden="true" /> Novo
                      </div>
                      <div className={`chip ${editForm.situacao_veiculo === 'Semi-novo' ? 'active-amber' : ''}`} onClick={() => setE('situacao_veiculo', 'Semi-novo')}>
                        <i className="ti ti-refresh" aria-hidden="true" /> Semi-novo
                      </div>
                    </div>
                  </div>

                  <div className="fg">
                    <label>Observações</label>
                    <textarea value={editForm.observacoes} onChange={e => setE('observacoes', e.target.value)} style={{ minHeight: 48 }} />
                  </div>

                  <div className="btn-row">
                    <button className="btn" onClick={cancelarEdicao} style={{ fontSize: 12 }}>
                      <i className="ti ti-x" aria-hidden="true" /> Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={salvarEdicao} disabled={savingEdit} style={{ fontSize: 12 }}>
                      {savingEdit
                        ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Salvando...</>
                        : <><i className="ti ti-check" aria-hidden="true" /> Salvar alterações</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
