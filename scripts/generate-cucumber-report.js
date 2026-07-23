const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');
const inputPath = path.join(reportsDir, 'cucumber-report.json');
const outputPath = path.join(reportsDir, 'cucumber-report.html');

if (!fs.existsSync(inputPath)) {
  console.error(`Relatório JSON não encontrado em ${inputPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const results = JSON.parse(raw);

const scenarios = [];
for (const feature of results) {
  for (const element of feature.elements || []) {
    const status = element.steps?.some((step) => step.result.status === 'failed')
      ? 'failed'
      : element.steps?.every((step) => step.result.status === 'passed')
        ? 'passed'
        : 'skipped';

    scenarios.push({
      feature: feature.name,
      name: element.name,
      status,
      duration: element.steps?.reduce((total, step) => total + (step.result.duration || 0), 0) || 0,
    });
  }
}

const passed = scenarios.filter((scenario) => scenario.status === 'passed').length;
const failed = scenarios.filter((scenario) => scenario.status === 'failed').length;
const skipped = scenarios.filter((scenario) => scenario.status === 'skipped').length;

const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatório BDD</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
      .summary { display: flex; gap: 16px; margin-bottom: 20px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; min-width: 120px; }
      .passed { color: green; }
      .failed { color: red; }
      .skipped { color: orange; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
    </style>
  </head>
  <body>
    <h1>Relatório BDD</h1>
    <div class="summary">
      <div class="card"><strong>Passou</strong><br />${passed}</div>
      <div class="card"><strong>Falhou</strong><br />${failed}</div>
      <div class="card"><strong>Pulado</strong><br />${skipped}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Cenário</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${scenarios.map((scenario) => `
          <tr>
            <td>${scenario.feature}</td>
            <td>${scenario.name}</td>
            <td class="${scenario.status}">${scenario.status}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </body>
</html>`;

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outputPath, html);
console.log(`Relatório HTML gerado em ${outputPath}`);
