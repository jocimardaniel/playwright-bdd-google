import { Page } from 'playwright';

export class GoogleHomePage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    await this.page.locator('textarea[name="q"]').waitFor({ state: 'visible' });
  }

  async search(term: string) {
    const input = this.page.locator('textarea[name="q"]');
    await input.fill(term);
    await input.press('Enter');
  }
}
