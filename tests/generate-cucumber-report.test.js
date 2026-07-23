const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildCucumberReport } = require('../scripts/generate-cucumber-report');

test('buildCucumberReport aggregates multiple browser report files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cucumber-report-'));
  const reportsDir = path.join(tempDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(path.join(reportsDir, 'cucumber-report-chromium.json'), JSON.stringify([
    {
      name: 'Feature A',
      elements: [
        {
          name: 'Scenario 1',
          steps: [{ result: { status: 'passed', duration: 100 } }],
        },
      ],
    },
  ]));

  fs.writeFileSync(path.join(reportsDir, 'cucumber-report-firefox.json'), JSON.stringify([
    {
      name: 'Feature A',
      elements: [
        {
          name: 'Scenario 2',
          steps: [{ result: { status: 'failed', duration: 200 } }],
        },
      ],
    },
  ]));

  const result = buildCucumberReport({ reportsDir });

  assert.equal(result.overallStatus, 'failed');
  assert.equal(result.scenarios.length, 2);
  assert.equal(result.summary.passed, 1);
  assert.equal(result.summary.failed, 1);
  assert.equal(fs.existsSync(path.join(reportsDir, 'cucumber-report.html')), true);
});
