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

Após a execução da workflow na branch main, o relatório HTML fica disponível no GitHub Pages em:

https://SEU_USUARIO.github.io/playwright-bdd-google/
