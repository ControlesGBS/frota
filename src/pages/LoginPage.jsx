import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [nome, setNome]         = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!nome.trim() || !password) { toast.error('Preencha o nome e a senha'); return }
    setLoading(true)
    try {
      const nomeLimpo = nome.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')
      const email = `${nomeLimpo}@frota.interno`
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      toast.error('Nome ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">

        {/* Logo GBS pequeno no topo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src="/logotipo_gbs.png"
            alt="GBS Serviços"
            style={{ width: 80, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div className="login-logo">
          <div className="logo-icon">
            <i className="ti ti-truck" aria-hidden="true" />
          </div>
          <div>
            <div className="login-title">FrotaApp</div>
            <div className="login-subtitle">Gestão de frotas · GBS Serviços</div>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="fg">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoComplete="username"
              autoCapitalize="words"
            />
            <span className="hint">Digite seu nome completo como cadastrado</span>
          </div>
          <div className="fg">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 4 }}
            disabled={loading}
          >
            {loading
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} /> Entrando...</>
              : <><i className="ti ti-login" aria-hidden="true" /> Entrar</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
