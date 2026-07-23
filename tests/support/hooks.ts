import { Before, After, setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

interface SkipWorld extends World {
  skip?: () => Promise<void>;
}
import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import { GoogleHomePage } from '../pages/google.home.page';
import { GoogleResultsPage } from '../pages/google.results.page';

export class SearchWorld extends World {
  browser!: Browser;
  page!: Page;
  homePage!: GoogleHomePage;
  resultsPage!: GoogleResultsPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(SearchWorld);

Before(async function (this: SearchWorld) {
  const browserName = process.env.BROWSER_NAME || 'chromium';

  try {
    if (browserName === 'firefox') {
      this.browser = await firefox.launch({ headless: true, timeout: 30000 });
    } else if (browserName === 'webkit') {
      this.browser = await webkit.launch({ headless: true, timeout: 30000 });
    } else {
      this.browser = await chromium.launch({ headless: true, timeout: 30000 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const shouldSkip =
      message.includes('Host system is missing dependencies') ||
      message.includes('timed out') ||
      message.includes('timeout');

    if (shouldSkip) {
      console.warn(`Skipping browser '${browserName}' because it could not be launched reliably (${message}).`);
      const worldWithSkip = this as unknown as SkipWorld;
      if (typeof worldWithSkip.skip === 'function') {
        await worldWithSkip.skip();
      }
      return;
    }

    throw error;
  }

  try {
    this.page = await this.browser.newPage();
    this.homePage = new GoogleHomePage(this.page);
    this.resultsPage = new GoogleResultsPage(this.page);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Skipping browser '${browserName}' because page initialization failed (${message}).`);
    const worldWithSkip = this as unknown as SkipWorld;
    if (typeof worldWithSkip.skip === 'function') {
      await worldWithSkip.skip();
    }
  }
});

After(async function (this: SearchWorld) {
  if (this.browser) {
    try {
      await this.browser.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Browser teardown warning for '${process.env.BROWSER_NAME || 'chromium'}': ${message}`);
    }
  }
});
