# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- Busca por calculadora/assunto
- Interface responsiva para desktop e celular
- 11 ferramentas funcionais:
  - Juros compostos
  - Financiamento (Price)
  - Porcentagem
  - Desconto
  - Regra de três
  - ROI
  - Margem e markup
  - Custo de combustível
  - À vista ou parcelado?
  - Amortizar ou investir?
  - Quando atinjo minha meta de patrimônio?
- Simuladores de decisão com comparação econômica entre alternativas
- URLs amigáveis para SEO e compartilhamento
- Metadados específicos por ferramenta (title, description, Open Graph e canonical)
- `robots.txt`, página 404 real, regras `_redirects` e `_headers` para Cloudflare Pages
- Zero dependência de backend: HTML + CSS + JavaScript

## URLs disponíveis

Após o deploy no Cloudflare Pages:

- `/juros-compostos`
- `/financiamento`
- `/porcentagem`
- `/desconto`
- `/regra-de-tres`
- `/roi`
- `/margem-e-markup`
- `/custo-de-combustivel`
- `/avista-ou-parcelado`
- `/amortizar-ou-investir`
- `/meta-de-patrimonio`

Os antigos links por hash continuam sendo aceitos pelo JavaScript quando usados na home, mas a navegação passa a gravar a URL amigável no navegador.

## Simuladores de decisão

### À vista ou parcelado?

Compara o preço à vista com o valor presente das parcelas usando uma taxa de retorno alternativa informada pelo usuário. Também exibe o total nominal parcelado e o ágio em relação ao preço à vista.

### Amortizar ou investir?

Compara, de forma simplificada, o benefício econômico de reduzir uma dívida com o valor futuro esperado de um investimento para o mesmo capital e horizonte.

### Quando atinjo minha meta?

Projeta o número de meses necessário para atingir um patrimônio-alvo a partir do patrimônio atual, aporte mensal e retorno anual esperado.

## Rodar localmente

Para testar a home e os cálculos:

```bash
cd calculadoras
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

As URLs amigáveis usam as regras do Cloudflare Pages. Um servidor HTTP local simples não interpreta `_redirects`; para testar essas rotas localmente, use o ambiente de preview/deploy do Pages ou uma ferramenta compatível com essas regras.

## Deploy no Cloudflare Pages

Conecte o repositório `rsucupira/Pythonzinho` e use:

- Branch de produção: `master` depois do merge do PR (ou `mvp-calculadoras` para um preview controlado)
- Framework preset: `None`
- Build command: vazio
- Build output directory: `calculadoras`

A pasta de saída já contém `_redirects` e `_headers`. As 11 URLs são encaminhadas internamente para o mesmo `index.html`, mantendo uma única implementação do motor das calculadoras.

O arquivo `404.html` evita que caminhos desconhecidos sejam tratados como páginas válidas.

## SEO

`routing.js` adapta, conforme a URL acessada:

- `<title>`
- meta description
- canonical absoluto usando o domínio atual
- Open Graph
- Twitter metadata
- título e introdução visual da página

O arquivo `_headers` também envia canonical por HTTP para as rotas conhecidas.

### Sitemap

Existe `sitemap.template.xml` com todas as 12 URLs (home + 11 ferramentas). Quando o domínio final estiver definido:

1. substitua `{{BASE_URL}}` pelo domínio, sem barra final;
2. renomeie/copiei o arquivo para `sitemap.xml`;
3. acrescente ao `robots.txt` a linha `Sitemap: https://SEU-DOMINIO/sitemap.xml`;
4. envie o sitemap ao Google Search Console e Bing Webmaster Tools.

O sitemap não é ativado antes do domínio final para evitar publicar URLs canônicas incorretas.

## Próximos passos sugeridos

1. Publicar o preview no Cloudflare Pages.
2. Conectar o domínio/subdomínio definitivo e ativar `sitemap.xml`.
3. Adicionar gráficos nas simulações de longo prazo.
4. Salvar e compartilhar os valores do cenário pela própria URL.
5. Adicionar testes automatizados das fórmulas.
6. Criar o simulador "comprar ou alugar".
7. Integrar APIs apenas para dados que realmente precisam ser atuais (CDI, inflação, cotações etc.).

## Aviso

Os resultados são estimativas educacionais. Cálculos financeiros reais podem envolver CET, impostos, tarifas, seguros, risco, liquidez, regras contratuais e outras variáveis não incluídas neste MVP.
