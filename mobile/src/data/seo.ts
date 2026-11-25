// Metadados de SEO das páginas web renderizadas por WebReferencePage.
// As descrições foram escritas a partir do conteúdo de cada página em reference/.
// webPages.json é gerado pelo script Python; os metadados ficam aqui para não depender dele.

export const SITE_URL = 'https://www.ecitapetininga.com.br';
export const SITE_NAME = 'Esporte Clube Itapetininga';

/** Imagem de compartilhamento (Open Graph e Twitter Card): escudo sobre o azul #061a4b. */
export const OG_IMAGE = {
  url: `${SITE_URL}/img/og-ecitapetininga.jpg`,
  width: 1200,
  height: 630,
  alt: 'Escudo do Esporte Clube Itapetininga sobre fundo azul',
};

export type PageSeo = {
  /** Caminho publicado no build estático: "/" para a home e "/pagina.html" para as demais. */
  path?: string;
  /** Substitui o <title> que vem da referência. */
  title?: string;
  /** Até 155 caracteres. */
  description?: string;
  /** false gera <meta name="robots" content="noindex,follow"> e deixa a página fora do sitemap. */
  index: boolean;
};

export const seoPages: Record<string, PageSeo> = {
  index: {
    path: '/',
    title: 'Esporte Clube Itapetininga | Clube de futebol de Itapetininga-SP',
    index: true,
    description: 'Herdeiro do DERAC, fundado em 1950, o EC Itapetininga é filiado à Federação Paulista de Futebol e forma atletas nas categorias de base.',
  },
  transparencia: {
    path: '/transparencia.html',
    index: true,
    description: 'Prestação de contas do EC Itapetininga: balancetes patrimoniais, demonstrações financeiras e cotações de cada período contábil, em PDF.',
  },
  diretoria: {
    path: '/diretoria.html',
    index: true,
    description: 'Diretoria executiva do EC Itapetininga, presidida por Adilson Ramos, com a mensagem do presidente sobre inclusão social e alto rendimento.',
  },
  governanca: {
    path: '/governanca.html',
    index: true,
    description: 'Garantias do EC Itapetininga a patrocinadores e investidores: profissionais com CREF e Licença CBF, conformidade com o ECA e prestação de contas.',
  },
  infraestrutura: {
    path: '/infraestrutura.html',
    index: true,
    description: 'Campo, quadra poliesportiva, academia, escritório e cozinha: as instalações do EC Itapetininga, mantidas em parceria com a ADFMI e em reforma.',
  },
  etica: {
    path: '/etica.html',
    index: true,
    description: 'Código de Ética e Conduta do EC Itapetininga: respeito e inclusão, fair play, proteção aos jovens conforme o ECA e transparência. Íntegra em PDF.',
  },
  metodologia: {
    path: '/metodologia.html',
    index: true,
    description: 'Metodologia de formação do EC Itapetininga: iniciação e inclusão gratuitas dos 10 aos 15 anos e alto rendimento nas categorias Sub-15 e Sub-17.',
  },
  peneiras: {
    path: '/peneiras.html',
    index: true,
    description: 'Como entrar no EC Itapetininga: inscrição por ordem para 10 a 15 anos e seletivas para Sub-15, Sub-17 e Sub-20. O clube não cobra taxa de avaliação.',
  },
  privacidade: {
    path: '/privacidade.html',
    index: true,
    description: 'Política de privacidade do site do EC Itapetininga: dados do formulário de contato, finalidade do uso, proteção de dados de menores e direitos na LGPD.',
  },
  // Fora do índice até entrarem os nomes reais: hoje o conteúdo é provisório ("Atleta 1", "Nome do Treinador").
  elenco: { path: '/elenco.html', index: false },
  comissao: { path: '/comissao.html', index: false },
  // Fora da entrega.
  loja: { path: '/loja.html', index: false },
  index2: { path: '/index2.html', index: false },
  index3: { path: '/index3.html', index: false },
  // A página 404 é servida em qualquer endereço inexistente, então não tem endereço canônico.
  '404': { index: false },
};

export function pageSeo(slug: string): PageSeo { return seoPages[slug] ?? seoPages['404']; }

export function absoluteUrl(path: string) { return `${SITE_URL}${path}`; }

/** Dados estruturados da home. Só usa informações publicadas no próprio site (contato e rodapé). */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: 'Esporte Clube Itapetininga',
  alternateName: 'EC Itapetininga',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/img/eci.png`,
  sport: 'Futebol',
  email: 'contato@ecitapetininga.com.br',
  taxID: '01.077.813/0001-42',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'R. Ana Maria Ferreira Baltazar, 705 - Jardim Shangri-La',
    addressLocality: 'Itapetininga',
    addressRegion: 'SP',
    postalCode: '18208-580',
    addressCountry: 'BR',
  },
  sameAs: ['https://www.instagram.com/ecitape_oficial/'],
};
