# Playwright BDD Google

Projeto de automação com Playwright + Cucumber + Page Objects.

## Executar localmente

```bash
npm install
npx playwright install chromium
npm run test:bdd
npm run report:bdd
```

## GitHub Actions

A pipeline roda diariamente pelo cron definido em [.github/workflows/bdd.yml](.github/workflows/bdd.yml) e também pode ser acionada manualmente.
