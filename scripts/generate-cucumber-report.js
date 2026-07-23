const fs = require('fs');
const path = require('path');

function buildCucumberReport({ reportsDir = path.join(__dirname, '..', 'reports') } = {}) {
  const outputPath = path.join(reportsDir, 'cucumber-report.html');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedPath = path.join(reportsDir, `cucumber-report-${timestamp}.html`);

  const reportFiles = [];
  
  // Primeiro, procurar por relatórios de navegadores específicos
  if (fs.existsSync(reportsDir)) {
    const specificBrowserReports = fs.readdirSync(reportsDir)
      .filter((file) => /^cucumber-report-(chromium|firefox|webkit)\.json$/.test(file))
      .sort()
      .map((file) => path.join(reportsDir, file));
    
    if (specificBrowserReports.length > 0) {
      reportFiles.push(...specificBrowserReports);
    } else {
      // Se não houver relatórios específicos de navegadores, usar o geral
      const generalReport = path.join(reportsDir, 'cucumber-report.json');
      if (fs.existsSync(generalReport)) {
        reportFiles.push(generalReport);
      }
    }
  }

  const results = [];
  for (const filePath of reportFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const fileName = path.basename(filePath);
        const browserName = fileName.replace('cucumber-report-', '').replace('.json', '') || 'default';
        results.push(...parsed.map((feature) => ({ ...feature, browser: browserName })));
      }
    } catch (error) {
      console.warn(`Ignorando relatório inválido em ${filePath}: ${error.message}`);
    }
  }

  // Extrair histórico das últimas 5 execuções
  const executionMetadataPath = path.join(reportsDir, 'executions.json');
  
  // Ler arquivo de metadata existente
  let existingMetadata = [];
  if (fs.existsSync(executionMetadataPath)) {
    try {
      const raw = fs.readFileSync(executionMetadataPath, 'utf8');
      existingMetadata = JSON.parse(raw);
    } catch (error) {
      console.warn(`Erro ao ler metadata de execuções: ${error.message}`);
    }
  }

  if (results.length === 0) {
    console.error('Nenhum relatório JSON válido encontrado para gerar o HTML.');
    process.exit(1);
  }

  const scenarios = [];
  for (const feature of results) {
    for (const element of feature.elements || []) {
      const status = element.steps?.some((step) => step.result?.status === 'failed')
        ? 'failed'
        : element.steps?.every((step) => step.result?.status === 'passed')
          ? 'passed'
          : 'skipped';

      scenarios.push({
        feature: feature.name,
        name: element.name,
        status,
        browser: feature.browser || 'default',
        duration: element.steps?.reduce((total, step) => total + (step.result?.duration || 0), 0) || 0,
      });
    }
  }

  // Adicionar execução atual ao histórico
  const currentExecution = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Calcular estatísticas da execução atual
  for (const scenario of scenarios) {
    if (scenario.status === 'passed') currentExecution.passed++;
    else if (scenario.status === 'failed') currentExecution.failed++;
    else if (scenario.status === 'skipped') currentExecution.skipped++;
  }

  // Adicionar execução atual e manter apenas as últimas 5
  existingMetadata.push(currentExecution);
  const latestExecutions = existingMetadata.slice(-5).reverse();

  // Salvar metadata atualizada
  fs.writeFileSync(executionMetadataPath, JSON.stringify(existingMetadata, null, 2));

  // Construir histórico formatado
  const executionHistory = [];
  for (const exec of latestExecutions) {
    const execDate = new Date(exec.timestamp);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(execDate) + ' BRT';

    executionHistory.push({
      timestamp: formattedDate,
      passed: exec.passed,
      failed: exec.failed,
      skipped: exec.skipped,
      total: exec.passed + exec.failed + exec.skipped,
      status: exec.failed > 0 ? 'failed' : 'passed'
    });
  }

  const passed = scenarios.filter((scenario) => scenario.status === 'passed').length;
  const failed = scenarios.filter((scenario) => scenario.status === 'failed').length;
  const skipped = scenarios.filter((scenario) => scenario.status === 'skipped').length;
  const overallStatus = failed > 0 ? 'failed' : 'passed';
  const workflowStatus = process.env.GITHUB_WORKFLOW_STATUS || overallStatus;
  const workflowUrl = process.env.GITHUB_RUN_URL || '';
  const workflowName = process.env.GITHUB_WORKFLOW || 'Playwright BDD';
  const runNumber = process.env.GITHUB_RUN_NUMBER || 'local';
  const executionTimestamp = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date()) + ' BRT';

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
      .status-banner {
        padding: 16px 18px;
        border-radius: 12px;
        margin: 16px 0 20px;
        font-weight: 700;
        color: white;
      }
      .status-banner.passed { background: #15803d; }
      .status-banner.failed { background: #b91c1c; }
      .badge {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-right: 8px;
      }
      .badge.success { background: #dcfce7; color: #166534; }
      .badge.failure { background: #fee2e2; color: #991b1b; }
      .header-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 8px 0 12px;
        color: #4b5563;
        font-size: 14px;
      }
      table { border-collapse: collapse; width: 100%; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
      th { background: #f3f4f6; }
      .status { text-transform: capitalize; font-weight: 700; }
      .status.passed { color: #15803d; }
      .status.failed { color: #b91c1c; }
      .status.skipped { color: #b45309; }
      .meta { color: #6b7280; margin-bottom: 12px; }
      .section-title {
        font-size: 18px;
        font-weight: 700;
        margin: 24px 0 12px;
        color: #111827;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
      }
      .history-table {
        font-size: 14px;
      }
      .history-table td {
        padding: 8px 10px;
      }
      .history-row {
        background: #f9fafb;
      }
      .history-row:hover {
        background: #f3f4f6;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Relatório BDD</h1>
      <div class="header-meta">
        <span class="badge ${workflowStatus === 'passed' || workflowStatus === 'success' ? 'success' : 'failure'}">${workflowStatus.toUpperCase()}</span>
        <span>Workflow: ${workflowName}</span>
        <span>Execução: ${executionTimestamp}</span>
        <span>Run: ${runNumber}</span>
      </div>
      <div class="status-banner ${workflowStatus}">Status final da execução: ${workflowStatus.toUpperCase()}</div>
      <div class="summary">
        <div class="card passed"><strong>Passou</strong><br />${passed}</div>
        <div class="card failed"><strong>Falhou</strong><br />${failed}</div>
        <div class="card skipped"><strong>Pulado</strong><br />${skipped}</div>
      </div>
      ${workflowUrl ? `<p><a href="${workflowUrl}" target="_blank" rel="noreferrer">Abrir execução no GitHub Actions</a></p>` : ''}
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Cenário</th>
            <th>Navegador</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${scenarios.map((scenario) => `
            <tr>
              <td>${scenario.feature}</td>
              <td>${scenario.name}</td>
              <td>${scenario.browser}</td>
              <td class="status ${scenario.status}">${scenario.status}</td>
            </tr>`).join('')}
        </tbody>
      </table>

      ${executionHistory.length > 0 ? `
      <div class="section-title">Histórico das Últimas Execuções</div>
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Data/Hora</th>
            <th>Passou</th>
            <th>Falhou</th>
            <th>Pulado</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${executionHistory.map((exec, index) => {
            return `
            <tr class="history-row">
              <td><strong>${index + 1}</strong></td>
              <td>${exec.timestamp}</td>
              <td style="color: #15803d; font-weight: 600;">${exec.passed}</td>
              <td style="color: #b91c1c; font-weight: 600;">${exec.failed}</td>
              <td style="color: #b45309; font-weight: 600;">${exec.skipped}</td>
              <td><strong>${exec.total}</strong></td>
              <td class="status ${exec.status}">${exec.status.toUpperCase()}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ` : ''}
    </div>
  </body>
</html>`;

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(outputPath, html);
  fs.writeFileSync(timestampedPath, html);

  return {
    outputPath,
    timestampedPath,
    overallStatus,
    scenarios,
    summary: { passed, failed, skipped },
  };
}

if (require.main === module) {
  const result = buildCucumberReport();
  console.log(`Relatório HTML gerado em ${result.outputPath}`);
  console.log(`Relatório com timestamp gerado em ${result.timestampedPath}`);
  console.log(`overall_status=${result.overallStatus}`);
}

module.exports = { buildCucumberReport };