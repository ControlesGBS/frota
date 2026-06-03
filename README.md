# 🚛 FrotaApp — Sistema de Gestão de Frotas

Aplicação web completa para controle de frotas, construída com **React + Vite** no frontend e **Supabase** no backend. Hospedagem via **Locaweb**.

---

## 📋 O que o sistema faz

**Painel do Condutor** (login individual por veículo):
- Registro diário de hodômetro (km inicial/final)
- Abastecimento: tipo de combustível, litros, preço/L, cálculo automático do total, km
- Troca de óleo: tipo, quantidade, valor, km, próxima troca
- Manutenção: seleção de tipo (Pneu, Baú, Antena, Relação, Lâmpada, Pastilha, Outro), oficina, valor, forma de pagamento
- Vistoria: resultado, upload do laudo em foto/PDF

**Painel do Admin**:
- Dashboard geral: somas mensais de combustível, óleo, manutenção, gráficos, alertas de CNH e documentos
- Dashboard por condutor: histórico filtrado por mês, gráficos individuais, tabelas detalhadas
- Cadastros: criar condutores com login, senha, veículo, km inicial, situação

---

## 🚀 Passo a passo de instalação

### 1. Criar projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com) e crie uma conta gratuita
2. Clique em **New Project** → escolha um nome (ex: `frota-app`) e uma senha forte
3. Aguarde o projeto ser criado (~2 min)

### 2. Criar as tabelas no banco

1. No painel do Supabase, clique em **SQL Editor** → **New Query**
2. Cole todo o conteúdo do arquivo `supabase_schema.sql`
3. Clique em **Run** — todas as tabelas e políticas de segurança serão criadas

### 3. Criar o bucket de armazenamento (laudos)

1. No Supabase, vá em **Storage** → **New Bucket**
2. Nome: `laudos` | Marque como **Private**
3. Vá em **Storage → Policies** e adicione uma policy permitindo upload para usuários autenticados

### 4. Criar o usuário admin

1. No Supabase, vá em **Authentication → Users → Invite user**
2. Coloque o e-mail do admin (ex: `admin@suaempresa.com`)
3. Defina uma senha forte
4. Depois vá em **SQL Editor** e execute:

```sql
INSERT INTO condutores (nome, email, tipo_veiculo, marca_veiculo, placa, is_admin)
VALUES ('Administrador', 'admin@suaempresa.com', 'Carro', '—', 'ADM-0000', TRUE);
```

### 5. Configurar as variáveis de ambiente

1. No Supabase, vá em **Settings → API**
2. Copie a **Project URL** e a **anon/public key**
3. Duplique o arquivo `.env.example` como `.env`:

```
VITE_SUPABASE_URL=https://XXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Instalar dependências e rodar localmente

```bash
# Na pasta do projeto:
npm install
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### 7. Fazer o build para produção

```bash
npm run build
```

Isso gera a pasta `dist/` com todos os arquivos prontos para upload.

### 8. Publicar na Locaweb

1. Acesse o painel da Locaweb → **Gerenciador de Arquivos** (ou use FTP)
2. Navegue até a pasta raiz do seu domínio (normalmente `public_html/`)
3. Faça o upload de **todo o conteúdo** da pasta `dist/`
4. Crie um arquivo `.htaccess` na raiz com o conteúdo abaixo (necessário para o React Router funcionar):

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

5. Acesse seu domínio — o sistema estará no ar! ✅

---

## 📁 Estrutura de arquivos

```
frota/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── Dashboard1.jsx     ← Visão geral da frota
│   │   │   ├── Dashboard2.jsx     ← Dashboard por condutor
│   │   │   └── Cadastros.jsx      ← Cadastro de condutores
│   │   ├── condutor/
│   │   │   ├── KmTab.jsx          ← Registro de hodômetro
│   │   │   ├── CombustivelTab.jsx ← Abastecimento + óleo
│   │   │   ├── ManutencaoTab.jsx  ← Ordem de serviço
│   │   │   └── VistoriaTab.jsx    ← Laudo de vistoria
│   │   └── shared/
│   │       └── Topbar.jsx         ← Barra superior com dark mode
│   ├── hooks/
│   │   └── useDarkMode.js         ← Hook de tema claro/escuro
│   ├── lib/
│   │   ├── supabase.js            ← Conexão com Supabase
│   │   └── AuthContext.jsx        ← Contexto de autenticação
│   ├── pages/
│   │   ├── LoginPage.jsx          ← Tela de login
│   │   ├── CondutorApp.jsx        ← App do condutor
│   │   └── AdminApp.jsx           ← App do admin
│   ├── styles/
│   │   └── global.css             ← Estilos globais + dark mode
│   ├── App.jsx                    ← Roteamento principal
│   └── main.jsx                   ← Entrada do React
├── supabase_schema.sql            ← Script completo do banco
├── .env.example                   ← Modelo das variáveis de ambiente
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔒 Segurança

- Cada condutor só acessa os dados do próprio veículo (Row Level Security no Supabase)
- O admin vê todos os dados
- Senhas gerenciadas pelo Supabase Auth (criptografadas)
- Arquivos de laudo armazenados em bucket privado

---

## 📞 Próximos passos sugeridos

- [ ] Alertas por e-mail (Supabase Edge Functions + cron diário)
- [ ] Exportar relatório em PDF por condutor
- [ ] Notificação WhatsApp ao vencer CNH/documentos
- [ ] App mobile via PWA (adicionar manifest.json)
