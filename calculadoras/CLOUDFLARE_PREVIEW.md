# Cloudflare Pages — publicar o MVP atual

Este projeto é estático e não precisa de framework nem etapa de build.

## Estado atual

A branch de produção do projeto Pages foi ajustada para `mvp-calculadoras` em 07/08/2026 para publicar o MVP sem alterar a `master`.

Configuração usada:

- Repositório: `rsucupira/Pythonzinho`
- Production branch: `mvp-calculadoras`
- Framework preset: `None`
- Build command: vazio
- Build output directory: `calculadoras`
- Root directory: vazio / raiz do repositório
- Automatic deployments: habilitado

Este commit existe também para disparar um novo deployment após a correção da branch de produção.

## Endereço

Após o deploy bem-sucedido, o Cloudflare fornecerá um endereço no formato:

```text
https://<nome-do-projeto>.pages.dev
```

O nome exato depende do nome escolhido para o projeto Pages.

## Depois do merge

Quando `mvp-calculadoras` for incorporada à `master`:

1. Abra o projeto Pages.
2. Vá a **Settings > Builds > Branch control**.
3. Troque a Production branch de `mvp-calculadoras` para `master`.
4. Mantenha as demais branches como preview deployments.

## Domínio próprio depois

Somente depois de validar o MVP no `*.pages.dev`, conectar um domínio como `calc.uebey.com` e então ativar o `sitemap.xml` definitivo.

## Observação

O site usa caminhos absolutos (`/styles.css`, `/app.js`, etc.), portanto `calculadoras` precisa ser tratada como a raiz publicada do site. `Build output directory = calculadoras` faz exatamente isso.
