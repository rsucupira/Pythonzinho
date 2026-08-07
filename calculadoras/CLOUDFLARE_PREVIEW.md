# Cloudflare Pages — publicar o MVP atual

Este projeto é estático e não precisa de framework ou etapa de build.

## Configuração recomendada agora

Objetivo: colocar o estado atual de `mvp-calculadoras` online sem alterar a `master`.

No Cloudflare Dashboard:

1. Abra **Workers & Pages**.
2. Crie um projeto em **Pages** e conecte o GitHub.
3. Selecione o repositório `rsucupira/Pythonzinho`.
4. Use, temporariamente, `mvp-calculadoras` como **Production branch**.
5. Nome sugerido do projeto: `pythonzinho-calcula` (se disponível).
6. Framework preset: **None**.
7. Build command: `exit 0`.
8. Build output directory: `calculadoras`.
9. Root directory: deixe o repositório como raiz (`/`).
10. Inicie o deploy.

Após o primeiro deploy, o Cloudflare fornecerá um endereço no formato:

```text
https://<nome-do-projeto>.pages.dev
```

Se o nome `pythonzinho-calcula` estiver disponível, o endereço esperado será:

```text
https://pythonzinho-calcula.pages.dev
```

## Depois do merge

Quando `mvp-calculadoras` for incorporada à `master`:

1. Abra o projeto Pages.
2. Vá a **Settings > Builds** / **Branch control**.
3. Troque a Production branch de `mvp-calculadoras` para `master`.
4. Mantenha as demais branches como preview deployments.

O Cloudflare Pages gera URLs de preview por branch/PR sem afetar a produção.

## Domínio próprio depois

Somente depois de validar o MVP no `*.pages.dev`, conectar um domínio como `calc.uebey.com` e então ativar o `sitemap.xml` definitivo.

## Observação

O site usa caminhos absolutos (`/styles.css`, `/app.js`, etc.), portanto `calculadoras` precisa ser tratada como a raiz publicada do site. A configuração `Build output directory = calculadoras` faz exatamente isso.
