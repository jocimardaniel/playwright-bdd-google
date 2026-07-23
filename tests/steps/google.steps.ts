import { Given, When, Then } from '@cucumber/cucumber';
import { SearchWorld } from '../support/hooks';

Given('I open Google', async function (this: SearchWorld) {
  await this.homePage.open();
});

When('I search for {string}', async function (this: SearchWorld, term: string) {
  await this.homePage.search(term);
});

Then('I should see search results containing {string}', async function (this: SearchWorld, text: string) {
  await this.resultsPage.expectResultsContain(text);
});
