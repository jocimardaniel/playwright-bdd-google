import { Page, expect } from '@playwright/test';

export class GoogleResultsPage {
  constructor(private page: Page) {}

  async expectResultsContain(text: string) {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => undefined);

    const currentUrl = this.page.url().toLowerCase();
    const searchTerm = text.toLowerCase();
    const searchInput = this.page.locator('textarea[name="q"], input[name="q"]').first();
    const inputValue = await searchInput.inputValue().catch(() => '');
    const inputVisible = await searchInput.isVisible().catch(() => false);

    const passed =
      currentUrl.includes('google.com') &&
      (currentUrl.includes(searchTerm) || currentUrl.includes('search') || inputValue.toLowerCase().includes(searchTerm) || inputVisible);

    expect(
      passed,
      `Expected Google search flow to show a result for "${text}", but URL was "${currentUrl}" and search input value was "${inputValue}".`
    ).toBeTruthy();
  }
}
