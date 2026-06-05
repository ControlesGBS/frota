import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [nome, setNome]         = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
    } catch {
      toast.error('Nome ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">

        {/* Logo GBS */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logotipo_gbs.png" alt="GBS" style={{ width: 80, height: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Ícone moto + título */}
        <div className="login-logo">
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--blbg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="ti ti-motorbike" style={{ fontSize: 24, color: 'var(--blue)' }} aria-hidden="true" />
          </div>
          <div>
            <div className="login-title">Gestão de Frotas</div>
            <div className="login-subtitle">GBS Serviços Empresariais</div>
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
            <div className="input-eye-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 8 }}
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
