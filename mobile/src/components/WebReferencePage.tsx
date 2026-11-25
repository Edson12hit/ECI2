import { createElement, useEffect, useState } from 'react';
import type { FormEvent, MouseEvent, ReactNode } from 'react';
import Head from 'expo-router/head';
import webPages from '../data/webPages.json';
import { absoluteUrl, OG_IMAGE, organizationJsonLd, pageSeo, SITE_NAME } from '../data/seo';
import WebAccessibility from './WebAccessibility';

type Node = string | { tag: string; props: Record<string, unknown>; children: Node[] };
type Page = { title: string; bodyClass: string; body: Node[]; styles: string[] };
const pages = webPages as Record<string, Page>;
const textOf = (node: Node): string => typeof node === 'string' ? node : node.children.map(textOf).join('');
const hasClass = (node: Node, name: string) => typeof node !== 'string' && String(node.props.className || '').split(' ').includes(name);
const homeHeader = pages.index.body.find(node => hasClass(node, 'site-header'))!;
const homeSupport = pages.index.body.find(node => typeof node !== 'string' && node.props.id === 'apoie-modal')!;

export function webSlugs() { return Object.keys(pages).filter(slug => !['index', 'login', 'admin'].includes(slug)); }

export function WebReferencePage({ slug = 'index' }: { slug?: string }) {
  const page = pages[slug] || pages['404'];
  const seo = pageSeo(pages[slug] ? slug : '404');
  const title = seo.title ?? page.title;
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState('');
  const [accessOpen, setAccessOpen] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [largeCursor, setLargeCursor] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [category, setCategory] = useState('sub15');
  const [contactStatus, setContactStatus] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    document.body.className = page.bodyClass;
    document.body.dataset.eciHydrated = 'true';
    return () => { document.body.className = ''; delete document.body.dataset.eciHydrated; };
  }, [page]);

  useEffect(() => {
    document.body.classList.toggle('ativo', contrast);
    document.body.classList.toggle('cursor-grande', largeCursor);
    document.body.classList.toggle('modal-open', modalOpen);
    document.body.classList.toggle('mobile-menu-open', menuOpen);
    document.documentElement.style.fontSize = `${fontSize}%`;
    return () => {
      document.body.classList.remove('ativo', 'cursor-grande', 'modal-open', 'mobile-menu-open');
      document.documentElement.style.fontSize = '';
    };
  }, [contrast, largeCursor, modalOpen, menuOpen, fontSize]);

  useEffect(() => {
    if (!window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 100);
  }, [slug]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setModalOpen(false); setDropdown(''); setMenuOpen(false); setAccessOpen(false); }
    };
    const handleOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.site-nav .group')) setDropdown('');
      if (!target.closest('.accessibility-panel')) setAccessOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleOutside);
    return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('click', handleOutside); };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const offset = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + 16;
      let current = 'hero';
      for (const id of ['hero', 'history', 'categories', 'pilar-iniciacao', 'pilar-rendimento', 'contact']) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= offset) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  const speak = (selected: boolean) => {
    const phrase = selected ? window.getSelection()?.toString() : document.querySelector('main')?.textContent;
    if (!phrase?.trim()) { window.alert(selected ? 'Selecione um texto primeiro.' : 'Nenhum texto disponível.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.slice(0, 12000));
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText('01.077.813/0001-42');
      setPixCopied(true);
    } catch { setPixCopied(false); }
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactSending(true);
    setContactStatus('');
    const form = event.currentTarget;
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Falha no envio');
      form.reset();
      setContactStatus('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    } catch {
      setContactStatus('Erro ao enviar. Verifique sua conexão e tente novamente.');
    } finally {
      setContactSending(false);
    }
  };

  const handleAction = (action: string) => {
    if (action.includes('alternarCores')) setContrast(value => !value);
    else if (action.includes('aumentarFonte')) setFontSize(value => Math.min(150, value + 10));
    else if (action.includes('diminuirFonte')) setFontSize(value => Math.max(70, value - 10));
    else if (action.includes('cursorGrande')) setLargeCursor(value => !value);
    else if (action.includes('lerSelecao')) speak(true);
    else if (action.includes('lerPagina')) speak(false);
    else if (action.includes('pararLeitura')) window.speechSynthesis.cancel();
    else if (action.includes('filtrarCategoria')) {
      const match = action.match(/filtrarCategoria\(['"](sub\d+)['"]/);
      if (match) setCategory(match[1]);
    } else if (action.includes('toggleDropdown')) {
      const match = action.match(/toggleDropdown\(['"]([^'"]+)['"]\)/);
      if (match) setDropdown(value => value === match[1] ? '' : match[1]);
    } else if (action.includes('navigator.share')) {
      if (navigator.share) void navigator.share({ title: page.title, url: window.location.href });
      else void navigator.clipboard?.writeText(window.location.href);
    }
  };

  const render = (node: Node, key: string, sharedHeader = false): ReactNode => {
    if (typeof node === 'string') return node;
    let { tag } = node;
    const { children } = node;
    const props: Record<string, unknown> = { ...node.props, key };
    const action = String(props.legacyAction || '');
    delete props.legacyAction;
    const id = String(props.id || '');
    const className = String(props.className || '');
    if (sharedHeader && tag === 'a' && !props.href && action.includes('toggleDropdown')) {
      const target = action.match(/toggleDropdown\(['"]([^'"]+)['"]\)/)?.[1];
      tag = 'button';
      props.type = 'button';
      props['aria-expanded'] = dropdown === target;
      props['aria-controls'] = target;
    }
    if (sharedHeader && slug !== 'index' && typeof props.href === 'string' && props.href.startsWith('#') && props.href !== '#apoie-modal') {
      props.href = `/index.html${props.href}`;
    }

    if (className.includes('accessibility-panel')) return null;

    if (className.split(' ').includes('site-header')) props.className = `${className}${scrolled ? ' header-scrolled' : ''}`;
    if (slug === 'index' && props['data-nav-link'] !== undefined && typeof props.href === 'string') {
      const target = activeSection === 'pilar-rendimento' ? 'categories' : activeSection;
      if (props.href === `#${target}` || props.href === `/index.html#${target}`) props.className = `${props.className || ''} is-active`;
    }
    if (className.includes('menu-cascata') && dropdown === id) props.className = `${className} ativo`;
    if (className.includes('mobile-menu') && props['data-mobile-menu'] !== undefined) props.className = `${className}${menuOpen ? ' is-open' : ''}`;
    if (className.includes('accessibility-content')) props.className = `${className}${accessOpen ? ' active' : ''}`;
    if (className.includes('btn-filtro')) props.className = `${className.replace(/\bativo\b/g, '').trim()}${action.includes(category) ? ' ativo' : ''}`;
    if (className.includes('elenco-categoria') && ['sub15', 'sub17', 'sub20'].includes(id)) props.style = { ...(props.style as object || {}), display: id === category ? 'block' : 'none' };
    if (props['data-modal'] !== undefined) {
      props.className = `${className}${modalOpen ? ' is-open' : ''}`;
      props['aria-hidden'] = !modalOpen;
      props.onClick = (event: MouseEvent<HTMLElement>) => { if (event.currentTarget === event.target) setModalOpen(false); };
    }
    if (props['data-mobile-menu-button'] !== undefined) {
      props['aria-expanded'] = menuOpen;
      props.onClick = () => setMenuOpen(value => !value);
    }
    if (props['data-mobile-menu-icon'] !== undefined) return createElement(tag, props, menuOpen ? 'close' : 'menu');
    if (className.includes('accessibility-trigger')) {
      props['aria-expanded'] = accessOpen;
      props.onClick = () => setAccessOpen(value => !value);
    }
    if (props['data-modal-open'] !== undefined) props.onClick = (event: MouseEvent<HTMLElement>) => { event.preventDefault(); setMenuOpen(false); setModalOpen(true); };
    if (props['data-modal-close'] !== undefined) props.onClick = () => setModalOpen(false);
    if (action) props.onClick = (event: MouseEvent<HTMLElement>) => {
      if (tag === 'a' && props.href && action.includes('toggleDropdown')) { setDropdown(''); return; }
      event.preventDefault(); handleAction(action);
    };
    if (tag === 'a' && typeof props.href === 'string') {
      const href = props.href;
      if (href === '#apoie-modal') props.onClick = (event: MouseEvent<HTMLElement>) => { event.preventDefault(); setMenuOpen(false); setModalOpen(true); };
      else if (href.startsWith('#')) props.onClick = () => { setMenuOpen(false); setDropdown(''); };
    }
    if (props['data-mobile-menu-link'] !== undefined && !props.onClick) props.onClick = () => setMenuOpen(false);
    if (id === 'contact-form') props.onSubmit = submitContact;
    if (id === 'contact-form-message') {
      props.style = { ...(props.style as object || {}), display: contactStatus ? 'block' : 'none', color: contactStatus.startsWith('Mensagem') ? '#059669' : '#ef4444' };
      return createElement(tag, props, contactStatus);
    }
    if (id === 'contact-form' && contactSending) props['aria-busy'] = true;
    if (tag === 'button' && className.includes('btn-filtro')) props['aria-pressed'] = action.includes(category);
    if (className.includes('select-all') && textOf(node).includes('01.077.813/0001-42')) {
      props.role = 'button';
      props.tabIndex = 0;
      props.title = 'Copiar chave PIX';
      props.onClick = () => { void copyPix(); };
      props.onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void copyPix(); } };
    }

    const renderedChildren = children.map((child, index) => render(child, `${key}-${index}`, sharedHeader));
    if (className.includes('site-header-main')) {
      renderedChildren.push(createElement('a', { key: `${key}-admin`, href: '/login.html', className: 'react-admin-entry', title: 'Entrar na área administrativa' }, 'Área administrativa'));
    }
    if (className.includes('mobile-menu-inner')) {
      renderedChildren.push(createElement('a', { key: `${key}-admin`, href: '/login.html', className: 'mobile-menu-link' }, 'Área administrativa'));
    }
    if (className.includes('select-all') && pixCopied) renderedChildren.push(createElement('span', { key: `${key}-copied`, role: 'status', style: { marginLeft: '0.5rem', color: '#059669' } }, 'Copiado!'));
    // Sem loading="lazy", o React gera um <link rel="preload"> para cada <img> no HTML estático.
    if (tag === 'img' && !/\b(site-brand-logo|hero-image)\b/.test(className)) { props.loading = 'lazy'; props.decoding = 'async'; }
    if (tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr' || tag === 'meta' || tag === 'link') return createElement(tag, props);
    return createElement(tag, props, ...renderedChildren);
  };

  return <>
    <Head>
      <meta charSet="utf-8" />
      <title>{title}</title>
      {seo.description && <meta name="description" content={seo.description} />}
      {!seo.index && <meta name="robots" content="noindex,follow" />}
      {seo.index && seo.path && <link rel="canonical" href={absoluteUrl(seo.path)} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:title" content={title} />
      {seo.description && <meta property="og:description" content={seo.description} />}
      {seo.path && <meta property="og:url" content={absoluteUrl(seo.path)} />}
      <meta property="og:image" content={OG_IMAGE.url} />
      <meta property="og:image:width" content={String(OG_IMAGE.width)} />
      <meta property="og:image:height" content={String(OG_IMAGE.height)} />
      <meta property="og:image:alt" content={OG_IMAGE.alt} />
      <meta name="twitter:card" content="summary_large_image" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      {!page.styles.includes('/styles.css') && <link rel="stylesheet" href="/styles.css" />}
      {page.styles.map(href => <link key={href} rel="stylesheet" href={href} />)}
      <link rel="stylesheet" href="/site-react.css" />
    </Head>
    {render(homeHeader, 'shared-header', true)}
    {page.body.map((node, index) => hasClass(node, 'site-header') ? null : render(node, `root-${index}`))}
    {!page.body.some(node => typeof node !== 'string' && node.props.id === 'apoie-modal') && render(homeSupport, 'shared-support')}
    {page === pages.index && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c') }} />}
    <WebAccessibility />
  </>;
}
