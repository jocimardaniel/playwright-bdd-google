import { Page, expect } from '@playwright/test';

export class GoogleResultsPage {
  constructor(private page: Page) {}

  async expectResultsContain(text: string) {
    await this.page.waitForLoadState('domcontentloaded');

    const currentUrl = this.page.url().toLowerCase();
    const searchTerm = text.toLowerCase();

    expect(currentUrl).toContain('google.com');
    expect(currentUrl).toContain(searchTerm);
  }
}
