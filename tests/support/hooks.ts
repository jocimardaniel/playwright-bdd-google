import { Before, After, setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { chromium, Browser, Page } from 'playwright';
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
  this.browser = await chromium.launch({ headless: true });
  this.page = await this.browser.newPage();
  this.homePage = new GoogleHomePage(this.page);
  this.resultsPage = new GoogleResultsPage(this.page);
});

After(async function (this: SearchWorld) {
  await this.browser.close();
});
