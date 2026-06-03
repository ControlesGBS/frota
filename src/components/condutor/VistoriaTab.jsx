import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function VistoriaTab({ condutor }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    data_vistoria: today, vistoriador: '', km_vistoria: '',
    resultado: 'Aprovado', observacoes: '', proxima_vistoria: '',
  })
  const [files, setFiles]   = useState([])
  const [previews, setPreviews] = useState([])
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleFiles(newFiles) {
    const arr = Array.from(newFiles)
    setFiles(prev => [...prev, ...arr])
    setPreviews(prev => [
      ...prev,
      ...arr.map(f => ({ name: f.name, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null, type: f.type }))
    ])
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!form.data_vistoria) { toast.error('Informe a data da vistoria'); return }
    setSaving(true)
    try {
      let arquivo_url = null

      // Upload do primeiro arquivo para o Storage
      if (files.length > 0) {
        const file = files[0]
        const ext  = file.name.split('.').pop()
        const path = `${condutor.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('laudos').upload(path, file)
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('laudos').getPublicUrl(path)
        arquivo_url = urlData.publicUrl
      }

      const { error } = await supabase.from('vistorias').insert({
        condutor_id:     condutor.id,
        data_vistoria:   form.data_vistoria,
        vistoriador:     form.vistoriador || null,
        km_vistoria:     form.km_vistoria ? parseInt(form.km_vistoria) : null,
        resultado:       form.resultado,
        observacoes:     form.observacoes || null,
        proxima_vistoria: form.proxima_vistoria || null,
        arquivo_url,
      })
      if (error) throw error

      toast.success('Laudo de vistoria salvo!')
      setForm({ data_vistoria: today, vistoriador: '', km_vistoria: '', resultado: 'Aprovado', observacoes: '', proxima_vistoria: '' })
      setFiles([]); setPreviews([])
    } catch (err) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#FAECE7', color: '#993C1D' }}>
            <i className="ti ti-clipboard-check" aria-hidden="true" />
          </div>
          <div>
            <div className="card-title">Laudo de vistoria</div>
            <div className="card-sub">Registre e envie o laudo do veículo</div>
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Data da vistoria</label>
            <input type="date" value={form.data_vistoria} onChange={e => set('data_vistoria', e.target.value)} />
          </div>
          <div className="fg">
            <label>Vistoriador / empresa</label>
            <input type="text" placeholder="Ex: Oficina tal..." value={form.vistoriador} onChange={e => set('vistoriador', e.target.value)} />
          </div>
        </div>

        <div className="g2">
          <div className="fg">
            <label>Km na vistoria</label>
            <input type="number" placeholder="Ex: 48320" value={form.km_vistoria} onChange={e => set('km_vistoria', e.target.value)} />
          </div>
          <div className="fg">
            <label>Resultado</label>
            <select value={form.resultado} onChange={e => set('resultado', e.target.value)}>
              <option>Aprovado</option>
              <option>Aprovado com ressalvas</option>
              <option>Reprovado</option>
            </select>
          </div>
        </div>

        <div className="fg">
          <label>Observações / pendências apontadas</label>
          <textarea placeholder="Itens apontados no laudo..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </div>

        <div className="fg">
          <label>Próxima vistoria</label>
          <input type="date" value={form.proxima_vistoria} onChange={e => set('proxima_vistoria', e.target.value)} />
          <span className="hint">Preencha para gerar alerta automático</span>
        </div>

        <div className="fg">
          <label>Upload do laudo</label>
          <div
            className="upload-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          >
            <input type="file" accept="image/*,application/pdf" multiple onChange={e => handleFiles(e.target.files)} />
            <i className="ti ti-cloud-upload" style={{ fontSize: 28, color: 'var(--t3)' }} aria-hidden="true" />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginTop: 6 }}>Arraste ou clique para selecionar</div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>PDF, JPG, PNG · máx 10 MB</div>
            {previews.length > 0 && (
              <div className="upload-preview">
                {previews.map((p, i) => (
                  <div key={i} className="thumb">
                    {p.url
                      ? <img src={p.url} alt={p.name} />
                      : <div style={{ textAlign: 'center', padding: 4 }}>
                          <i className="ti ti-file-type-pdf" style={{ fontSize: 20, color: 'var(--red)' }} aria-hidden="true" />
                          <div style={{ fontSize: 9, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 56 }}>{p.name}</div>
                        </div>
                    }
                    <button className="thumb-remove" onClick={() => removeFile(i)} aria-label="Remover arquivo">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5 }} /> Salvando...</>
              : <><i className="ti ti-check" aria-hidden="true" /> Salvar laudo</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
