import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Head from 'expo-router/head';
import { getSession, login } from '../lib/session';
import WebAccessibility from '../components/WebAccessibility';

export default function WebLogin() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    document.body.classList.add('login-page');
    void getSession().then(session => { if (session) window.location.replace('/admin.html'); }).catch(cause => setError(cause.message));
    return () => document.body.classList.remove('login-page');
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuario.trim() || !senha) { setError('Informe o usuário e a senha.'); return; }
    setBusy(true); setError('');
    try {
      if (await login(usuario.trim(), senha, remember)) window.location.assign('/admin.html');
      else { setSenha(''); setError('Usuário ou senha incorretos. Verifique os dados e tente novamente.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a sessão.'); }
    finally { setBusy(false); }
  };
  return <>
    <Head>
      <meta charSet="utf-8" />
      <title>Entrar — Esporte Clube Itapetininga</title><meta name="robots" content="noindex,nofollow" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="/login.css" /><link rel="stylesheet" href="/site-react.css" />
    </Head>
    <a className="skip-link" href="#login-form">Ir para o formulário de acesso</a>
    <main className="login-layout">
      <aside className="login-brand">
        <a className="login-brand__home" href="/index.html"><img src="/img/eci.png" alt="" width="64" height="64" /><span className="login-brand__name">EC Itapetininga</span><span className="login-brand__since">Desde 1950</span></a>
        <p className="login-brand__text">Área restrita à comissão administrativa do clube.</p>
        <a className="login-brand__back" href="/index.html">Voltar ao site do clube</a>
      </aside>
      <section className="login-panel" aria-labelledby="login-title">
        <h1 className="login-panel__title" id="login-title">Entrar</h1>
        <p className="login-panel__subtitle">Informe suas credenciais para acessar o painel administrativo.</p>
        {error && <div className="login-alert" role="alert" aria-live="assertive">{error}</div>}
        <form className="login-form" id="login-form" noValidate onSubmit={submit}>
          <div className="login-field"><label className="login-field__label" htmlFor="usuario">Usuário</label><input className="login-field__input" type="text" id="usuario" name="usuario" autoComplete="username" required value={usuario} onChange={event => setUsuario(event.target.value)} /></div>
          <div className="login-field"><label className="login-field__label" htmlFor="senha">Senha</label><div className="login-field__wrap"><input className="login-field__input" type={visible ? 'text' : 'password'} id="senha" name="senha" autoComplete="current-password" required value={senha} onChange={event => setSenha(event.target.value)} /><button className="login-field__toggle" type="button" aria-pressed={visible} onClick={() => setVisible(value => !value)}><span className="login-field__toggle-text">{visible ? 'Ocultar senha' : 'Mostrar senha'}</span></button></div></div>
          <div className="login-options"><label className="login-check"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Manter conectado neste dispositivo</span></label></div>
          <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar no painel'}</button>
        </form>
        <p className="login-help">Esqueceu a senha? Procure a comissão administrativa do clube.</p>
      </section>
    </main>
    <WebAccessibility />
  </>;
}
