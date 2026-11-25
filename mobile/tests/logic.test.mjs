import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validContact, contactForm, localTarget } from '../src/lib/logic.ts';
import { emptyAdminData, recordMovement, kardex, createLesson, setAttendance, attendanceCounts } from '../src/lib/adminData.ts';
import { seoPages, SITE_URL, organizationJsonLd, OG_IMAGE } from '../src/data/seo.ts';

const pages = JSON.parse(readFileSync(new URL('../src/data/webPages.json', import.meta.url), 'utf8'));
const originalPlaceholders = new Set(['SUA_IMAGEM_AQUI.png', 'camisa-titular.png', 'camisa-reserva.png', 'caneca.png']);
function nodes(page) {
  const found = [];
  const walk = node => {
    if (typeof node === 'string') return;
    found.push(node);
    node.children.forEach(walk);
  };
  page.body.forEach(walk);
  return found;
}

test('contato valida e serializa os campos enviados ao FormSubmit', () => {
  const values = { name: ' Aurelio ', email: 'aurelio@example.com', subject: 'Inscrição na base', message: 'Olá!' };
  assert.equal(validContact(values), true);
  assert.equal(validContact({ ...values, email: 'inválido' }), false);
  assert.equal(validContact({ ...values, message: ' ' }), false);
  const form = contactForm(values);
  assert.equal(form.get('Nome'), 'Aurelio');
  assert.equal(form.get('Assunto'), 'Inscrição na base');
  assert.equal(form.get('Mensagem'), 'Olá!');
  assert.equal(form.get('_captcha'), 'false');
});

test('rotas antigas mantêm o destino e a âncora', () => {
  assert.deepEqual(localTarget('index.html#contact'), { slug: 'index', section: 'contact' });
  assert.deepEqual(localTarget('diretoria.html'), { slug: 'diretoria', section: undefined });
  assert.deepEqual(localTarget('#topo', 'elenco'), { slug: 'elenco', section: 'topo' });
});

test('filtro do elenco troca a categoria sem misturar atletas', () => {
  const categories = nodes(pages.elenco).filter(node => node.props.className?.includes('elenco-categoria'));
  assert.deepEqual(categories.map(node => node.props.id), ['sub15', 'sub17', 'sub20']);
  assert.ok(categories[0].children.length > 0);
  assert.ok(categories[1].children.length > 0);
});

test('Kardex calcula saldo cronológico e bloqueia saída sem estoque', () => {
  let data = { ...emptyAdminData(), materials: [{ id: 'bola', name: 'Bola de campo', code: 'ECI-01', unit: 'un', minimum: 3 }] };
  const movement = (id, date, kind, quantity) => ({ id, materialId: 'bola', date, kind, quantity, reference: 'Treino da base', note: '', createdAt: `2026-11-18T12:00:0${id}Z` });
  data = recordMovement(data, movement('1', '2026-11-17', 'entrada', 10));
  data = recordMovement(data, movement('2', '2026-11-18', 'saida', 4));
  assert.deepEqual(kardex('bola', data.movements).map(row => row.balance), [10, 6]);
  assert.throws(() => recordMovement(data, { ...movement('5', '2026-11-18', 'entrada', 1), reference: '' }), /referência/);
  assert.throws(() => recordMovement(data, movement('3', '2026-11-16', 'saida', 1)), /saldo negativo/);
  assert.throws(() => recordMovement(data, movement('4', '2026-11-18', 'saida', 7)), /saldo negativo/);
});

test('aula exige descrição e alunos da categoria e preserva frequência individual', () => {
  const students = [
    { id: 'a', name: 'Atleta A', category: 'Sub-15', active: true },
    { id: 'b', name: 'Atleta B', category: 'Sub-15', active: true },
    { id: 'c', name: 'Atleta C', category: 'Sub-17', active: true },
  ];
  const data = { ...emptyAdminData(), students };
  const input = { id: 'aula', date: '2026-11-18', title: 'Passe e domínio', description: 'Circuito com condução e passe.', category: 'Sub-15', instructorId: '' };
  assert.throws(() => createLesson(data, { ...input, description: '' }), /descrição/);
  assert.throws(() => createLesson(data, { ...input, category: 'Sub-20' }), /Cadastre ao menos um aluno/);
  const lesson = createLesson(data, input);
  assert.deepEqual(lesson.roster.map(student => student.id), ['a', 'b']);
  const updated = setAttendance({ ...data, lessons: [lesson] }, 'aula', 'a', 'presente');
  assert.deepEqual(attendanceCounts(updated.lessons[0]), { pendente: 1, presente: 1, ausente: 0, justificada: 0 });
  assert.equal(updated.lessons[0].attendance.b, 'pendente');
});

test('todas as páginas públicas, imagens e links locais foram migrados', () => {
  for (const name of ['index', 'diretoria', 'governanca', 'infraestrutura', 'etica', 'transparencia', 'comissao', 'metodologia', 'peneiras', 'privacidade', 'elenco', 'loja', '404', 'index2', 'index3']) {
    assert.ok(pages[name]?.body.length > 0, `${name} sem conteúdo`);
  }
  for (const [slug, page] of Object.entries(pages)) {
    const tree = nodes(page);
    for (const node of tree) {
      const src = node.props.src;
      if (node.tag === 'img' && src?.startsWith('/img/') && !originalPlaceholders.has(src.split('/').pop())) assert.ok(existsSync(resolve('assets/images', src.slice(5))), `${slug}: ${src}`);
      const href = node.props.href;
      if (node.tag !== 'a' || !href || /^(https?:|mailto:|tel:|#)/.test(href)) continue;
      if (href.startsWith('/img/')) assert.ok(existsSync(resolve('assets/images', href.slice(5))));
      else if (href.endsWith('.pdf') || href.endsWith('.docx')) assert.ok(existsSync(resolve('assets/documents', decodeURIComponent(href.slice(1)))));
      else {
        const target = localTarget(href.replace(/^\//, ''), slug);
        assert.ok(pages[target.slug], `${slug}: rota ${href} ausente`);
        if (target.section) assert.ok(nodes(pages[target.slug]).some(n => n.props.id === target.section), `${slug}: âncora ${href} ausente`);
      }
    }
  }
  assert.ok(!JSON.stringify(pages.index.body).includes('BOTÕES COM O MESMO TAMANHO E MAIORES'));
});

test('metadados de SEO cobrem todas as páginas web', () => {
  const webPages = Object.keys(pages).filter(slug => !['login', 'admin'].includes(slug));
  assert.deepEqual(Object.keys(seoPages).sort(), webPages.sort());
  assert.deepEqual(Object.keys(seoPages).filter(slug => !seoPages[slug].index).sort(), ['404', 'comissao', 'elenco', 'index2', 'index3', 'loja']);
  const paths = new Set();
  for (const [slug, seo] of Object.entries(seoPages)) {
    if (seo.description) assert.ok(seo.description.length <= 155, `${slug}: descrição com ${seo.description.length} caracteres`);
    if (seo.index) assert.ok(seo.path && seo.description, `${slug}: página indexável sem caminho ou descrição`);
    if (!seo.path) continue;
    assert.equal(seo.path, slug === 'index' ? '/' : `/${slug}.html`, `${slug}: caminho inesperado`);
    assert.ok(!paths.has(seo.path), `${slug}: caminho repetido`);
    paths.add(seo.path);
  }
  assert.match(SITE_URL, /^https:\/\/www\.ecitapetininga\.com\.br$/);
});

test('imagem de Open Graph existe, tem 1200×630 e menos de 200 KB', () => {
  const file = resolve('public', OG_IMAGE.url.replace(`${SITE_URL}/`, ''));
  const jpeg = readFileSync(file);
  assert.ok(jpeg.length < 200 * 1024, `imagem com ${Math.round(jpeg.length / 1024)} KB`);
  let offset = 2;
  while (offset < jpeg.length && !(jpeg[offset + 1] >= 0xc0 && jpeg[offset + 1] <= 0xc2)) offset += 2 + jpeg.readUInt16BE(offset + 2);
  assert.deepEqual([jpeg.readUInt16BE(offset + 7), jpeg.readUInt16BE(offset + 5)], [OG_IMAGE.width, OG_IMAGE.height]);
  assert.deepEqual([OG_IMAGE.width, OG_IMAGE.height], [1200, 630]);
});

test('sitemap.xml lista exatamente as páginas indexáveis e o robots.txt aponta para ele', () => {
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort();
  const indexable = Object.values(seoPages).filter(seo => seo.index).map(seo => `${SITE_URL}${seo.path}`).sort();
  assert.deepEqual(listed, indexable);
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, new RegExp(`^Sitemap: ${SITE_URL.replace(/\./g, '\\.')}/sitemap\\.xml$`, 'm'));
  // As páginas com noindex precisam continuar rastreáveis para o robô ler a tag.
  for (const line of robots.split('\n').filter(entry => entry.startsWith('Disallow:'))) assert.equal(line.trim(), 'Disallow: /_sitemap');
});

test('JSON-LD da home usa apenas dados publicados no site', () => {
  const site = JSON.stringify(pages.index.body);
  const { address, email, taxID, sameAs, logo } = organizationJsonLd;
  assert.equal(organizationJsonLd['@type'], 'SportsOrganization');
  assert.ok(!('foundingDate' in organizationJsonLd), 'a data de 1950 se refere ao DERAC');
  for (const value of [email, taxID, ...sameAs, address.postalCode, 'R. Ana Maria Ferreira Baltazar, 705', 'Jardim Shangri-La', 'Itapetininga - SP']) {
    assert.ok(site.includes(value), `${value} não aparece na home`);
  }
  assert.ok(existsSync(resolve('public', logo.replace(`${SITE_URL}/`, ''))), 'logo do JSON-LD ausente em public/');
});
