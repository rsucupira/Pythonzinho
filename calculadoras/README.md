# Pythonzinho Calcula — MVP

Hub estático de calculadoras online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- Busca por calculadora/assunto
- Interface responsiva para desktop e celular
- 8 calculadoras funcionais:
  - Juros compostos
  - Financiamento (Price)
  - Porcentagem
  - Desconto
  - Regra de três
  - ROI
  - Margem e markup
  - Custo de combustível
- URLs por hash para abrir uma calculadora diretamente, por exemplo: `#juros-compostos`
- Zero dependência de backend: HTML + CSS + JavaScript

## Rodar localmente

Abra `index.html` diretamente no navegador ou use qualquer servidor HTTP simples.

Exemplo com Python:

```bash
cd calculadoras
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Deploy

### Cloudflare Pages

Use o repositório `rsucupira/Pythonzinho` e configure:

- Branch de produção: a branch escolhida para publicação
- Framework preset: None
- Build command: vazio
- Build output directory: `calculadoras`

### GitHub Pages

Uma opção simples é publicar a pasta `calculadoras` via GitHub Actions ou mover a aplicação para a raiz de uma branch dedicada de Pages.

## Próximos passos sugeridos

1. Adicionar calculadora "à vista ou parcelado".
2. Adicionar "amortizar ou investir".
3. Criar páginas individuais por calculadora para SEO (`/juros-compostos/`, `/financiamento/` etc.).
4. Acrescentar gráficos nas simulações de longo prazo.
5. Salvar/sharear cenários por URL.
6. Adicionar testes automatizados das fórmulas.
7. Integrar APIs apenas para dados que realmente precisam ser atuais (CDI, inflação, cotações etc.).

## Aviso

Os resultados são estimativas educacionais. Cálculos financeiros reais podem envolver CET, impostos, tarifas, seguros, regras contratuais e outras variáveis não incluídas neste MVP.
