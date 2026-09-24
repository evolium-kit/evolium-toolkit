# Informação em falta

O que só o humano resolve: credenciais, decisões de negócio, acessos. Nada
disto é um problema de código — é trabalho ou decisão que precisa de alguém
com autoridade ou acesso que um agente não tem.

Convenção de estado: 🔴 bloqueia trabalho a jusante · 🟡 tem um valor
provisório em uso, decisão real ainda pendente · 🟢 resolvido, mantido como
registo.

---

## 🟢 Publicação — resolvido

`0.1.0` publicado em 2026-09-23, `0.1.1` em 2026-09-24. O repositório remoto
está ligado e o `release.yml` corre normalmente por tag `v*.*.*`.

---

## 🔴 Não existe backend real — só o mock do playground

**Bloqueia:** qualquer teste de integração real do plugin de autenticação ou
de qualquer plugin de recurso.

Todo o desenvolvimento corre contra `src/app/demo-api.interceptor.ts`, que
simula `/auth/login`, `/auth/refresh`, etc. em memória, sem rede. O contrato
exacto que o plugin de autenticação espera está documentado no
`INSTALL.md` (passo 10) e em `docs/plugins.md`, mas **nunca foi validado
contra uma API real**.

**Quem resolve:** a equipa de backend, confirmando:

- o URL base de produção/staging da API de autenticação;
- se o formato de resposta (`access_token`, `expires_in`,
  `user.full_name`, `user.roles`) corresponde exactamente ao que a toolkit
  espera, ou se os mappers em `auth.mappers.ts` precisam de ajuste;
- a política real de expiração de sessão (ver item de negócio abaixo).

---

## 🟡 Token do GitHub Packages — cada programador novo precisa do seu

**Bloqueia:** esse programador em concreto instalar a toolkit.

Não é uma credencial partilhada — o `INSTALL.md` já documenta o processo
completo (passos 2 e 3). O que falta, por programador que entra de novo na
equipa:

1. confirmar que a conta GitHub dele está na organização `evolium-kit`;
2. confirmar se essa organização exige SSO (o passo 2.3 do `INSTALL.md` é
   condicional a isto, e **não está confirmado** se o SSO está activo).

**Quem resolve:** quem administra a organização `evolium-kit` no GitHub —
confirma o estado do SSO uma vez, e isso actualiza o `INSTALL.md` para
deixar de dizer "se aplicável".

---

## 🔴 `environment: release` não existe no GitHub — precisa de ser criado

**Bloqueia:** a aprovação manual antes de publicar (o workflow corre à mesma
sem isto, só que sem o portão de aprovação).

O `.github/workflows/release.yml` referencia `environment: release`, que
tem de ser criado manualmente em **Settings → Environments** no
repositório GitHub. Sem ele, o workflow não falha — mas também não pede
aprovação a ninguém antes de publicar.

**Quem resolve:** quem administra o repositório. Decisão associada: quem
deve ser o aprovador designado desse environment?

---

## 🟡 Paleta de cores — escolha técnica, sem validação de marca

**Não bloqueia, mas devia ser confirmado antes de um rollout largo.**

A paleta "flat design" em `theme/src/lib/default-theme.ts` foi escolhida
tecnicamente (contraste WCAG AA verificado, documentado em
`docs/theming.md`), **não** por decisão de marca/design da Evolium. As cores
primárias (`#2563eb` claro / `#60a5fa` escuro) são um azul genérico, não
necessariamente a cor institucional da Evolium.

**Quem resolve:** a equipa de design/marketing da Evolium — confirma se
esta paleta serve como omissão, ou se deve ser substituída antes de qualquer
projecto cliente-facing a usar. Substituir é uma alteração isolada a
`default-theme.ts` e `styles/evolium-theme.css`; não afecta a arquitectura.

---

## 🟡 Política de expiração de sessão — usa omissões, não uma decisão

**Não bloqueia o desenvolvimento actual, mas afecta produção.**

`EvoAuthConfig.refreshSkewSeconds` tem omissão `0` (sem margem de segurança
antes de considerar o token expirado). Não há nenhuma decisão de produto
registada sobre:

- duração da sessão (`expires_in`, controlado pelo backend);
- margem de segurança antes de renovar (`refreshSkewSeconds`, controlado
  pelo consumidor);
- se sessões devem expirar por inactividade, e não só por tempo absoluto.

**Quem resolve:** quem for dono do produto do projecto consumidor — cada
projecto configura isto no seu próprio `withPlugin(authPlugin(), { … })`, não
é uma decisão da toolkit em si, mas vale a pena ter uma recomendação por
omissão da Evolium.

---

## 🟡 Licença do pacote: `UNLICENSED`

**Não bloqueia, é uma escolha implícita que ninguém confirmou
explicitamente.**

`projects/toolkit/package.json` tem `"license": "UNLICENSED"`, o que impede
legalmente redistribuição fora da Evolium. Isto está coerente com ser
publicado num registry privado (GitHub Packages, `access: restricted`), mas
ninguém da Evolium confirmou explicitamente que esta é a intenção — foi a
opção técnica mais segura por omissão.

**Quem resolve:** jurídico/direcção da Evolium, se algum dia se considerar
tornar a toolkit pública ou partilhá-la com terceiros.
