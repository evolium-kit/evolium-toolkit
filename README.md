# Evolium Toolkit

Workspace da **`@evolium-kit/toolkit`**: componentes temáveis, layouts, páginas
prontas e um kernel de serviços baseado em plugins para aplicações Angular.

A aplicação em `src/` é o playground onde tudo é desenvolvido e verificado antes
de publicar.

```
projects/toolkit/   a library publicada
src/                playground e demonstração
tools/              verificação do artefacto e da instalação
```

## Desenvolver

```bash
npm ci

# dois terminais
npm run watch:lib     # reconstrói a library
npm start             # serve o playground em :4200
```

O `tsconfig.json` aponta `@evolium-kit/toolkit/*` para `dist/toolkit/*`, pelo
que é preciso um build da library antes do primeiro `ng serve`.

Depois de alterar a library, **reiniciar o `ng serve`**: o Vite mantém as
dependências em cache e não apanha um `dist` reconstruído.

| Rota          | O quê                                |
| ------------- | ------------------------------------ |
| `/`           | playground dos componentes e do tema |
| `/auth/login` | página de login da toolkit           |
| `/painel`     | dashboard, protegido por guard       |
| `/_evo/theme` | Theme Studio (só em desenvolvimento) |

Credenciais da API de demonstração: `ana@evolium.ao` / `1234`.

## Verificar

```bash
npm run build:lib          # library + schematics
npm run test:lib           # 62 testes
npm run test:schematics    # 23 testes, em Node
node tools/verify-dist.mjs # o artefacto está publicável?
node tools/verify-install.mjs  # pack + ng add + build num projecto virgem
```

O `verify-install` é lento mas é o único que exercita o pacote como um
consumidor o vive — foi ele que apanhou o `ng add` a falhar por causa do
`type: module` e as folhas de estilo fora do `exports`.

## Documentação

Cada entry point tem o seu README, com uma metade sobre **usar** e outra sobre
**estender**:

- [core](projects/toolkit/core/README.md) ·
  [theme](projects/toolkit/theme/README.md) ·
  [components](projects/toolkit/components/README.md)
- [layouts](projects/toolkit/layouts/README.md) ·
  [pages](projects/toolkit/pages/README.md) ·
  [services](projects/toolkit/services/README.md)

## Publicar

A publicação é feita **apenas** pelo GitHub Actions, nunca da máquina local.

```bash
# actualizar a versão em projects/toolkit/package.json e o CHANGELOG
git tag v0.1.0
git push origin v0.1.0
```

O workflow verifica que a tag corresponde à versão, corre os testes e a
instalação limpa, e só então publica no GitHub Packages.

Para consumir noutro projecto, ver [`.npmrc.example`](.npmrc.example).
