const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '..', 'reports');
const inputPath = path.join(reportsDir, 'cucumber-report.json');
const outputPath = path.join(reportsDir, 'cucumber-report.html');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const timestampedPath = path.join(reportsDir, `cucumber-report-${timestamp}.html`);

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
const overallStatus = failed > 0 ? 'failed' : 'passed';

const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatório BDD</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 24px;
        background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
        color: #1f2937;
      }
      .container {
        max-width: 1100px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.08);
      }
      h1 { margin-top: 0; color: #111827; }
      .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }
      .card {
        border-radius: 12px;
        padding: 14px 18px;
        min-width: 120px;
        font-weight: 600;
        color: white;
      }
      .card.passed { background: #16a34a; }
      .card.failed { background: #dc2626; }
      .card.skipped { background: #d97706; }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
      th { background: #f3f4f6; }
      .status { text-transform: capitalize; font-weight: 700; }
      .status.passed { color: #15803d; }
      .status.failed { color: #b91c1c; }
      .status.skipped { color: #b45309; }
      .meta { color: #6b7280; margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Relatório BDD</h1>
      <div class="meta">Execução: ${new Date().toLocaleString('pt-BR')}</div>
      <div class="summary">
        <div class="card passed"><strong>Passou</strong><br />${passed}</div>
        <div class="card failed"><strong>Falhou</strong><br />${failed}</div>
        <div class="card skipped"><strong>Pulado</strong><br />${skipped}</div>
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
              <td class="status ${scenario.status}">${scenario.status}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </body>
</html>`;

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outputPath, html);
fs.writeFileSync(timestampedPath, html);
console.log(`Relatório HTML gerado em ${outputPath}`);
console.log(`Relatório com timestamp gerado em ${timestampedPath}`);
console.log(`overall_status=${overallStatus}`);
