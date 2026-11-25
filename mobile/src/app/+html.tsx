import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function RootHtml({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  return <html {...htmlAttributes} lang="pt-BR"><head>
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <ScrollViewStyleReset />
    {headNodes}
  </head><body {...bodyAttributes}>
    {children}
    <div {...({ vw: '' } as object)} className="enabled">
      <div {...({ 'vw-access-button': '' } as object)} className="active" />
      <div {...({ 'vw-plugin-wrapper': '' } as object)}><div className="vw-plugin-top-wrapper" /></div>
    </div>
    <script src="https://vlibras.gov.br/app/vlibras-plugin.js" />
    <script dangerouslySetInnerHTML={{ __html: 'if (window.VLibras && !window.__eciVLibras) { window.__eciVLibras = new window.VLibras.Widget("https://vlibras.gov.br/app"); }' }} />
    {bodyNodes}
  </body></html>;
}
