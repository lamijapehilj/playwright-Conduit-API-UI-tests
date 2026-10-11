import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'



test('has title', async ({ page }) => {

  await page.route('*/**/api/tags', async route => {
   
await route.fulfill({
  json: tags
})
  })

  await page.route('*/**/api/articles*', async route => {
    const response = await route.fetch()
    const responseJSON = await response.json()
    responseJSON.articles[0].title = 'This is a MOCK title for the article'
    responseJSON.articles[0].description = 'This is a MOCK description for the article'
    responseJSON.articles[0].favoritesCount = 100000000

    await route.fulfill({
      response,
      json: responseJSON
    });

});

  
  await page.goto('https://conduit.bondaracademy.com/');
  await expect(page.locator('.navbar-brand')).toHaveText(/conduit/);
  await expect(page.locator('.sidebar .tag-pill')).toContainText(['Automation', 'Playwright'])
  await expect(page.locator('.preview-link h1').first()).toContainText('This is a MOCK title for the article')
  await expect(page.locator('.preview-link p').first()).toContainText('This is a MOCK description for the article')
  await expect(page.locator('app-favorite-button button').first()).toContainText('100000000');
});


//
test('Delete article', async({page, request})=> {
  const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
    "user": {
        "email": process.env.USER_EMAIL,
        "password": process.env.USER_PASSWORD
    }
}});
  
expect(loginResponse.status()).toEqual(200)
const responseLoginJSON = await loginResponse.json()
const token = responseLoginJSON.user.token

const newArticleResponse = await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
  data: 
    {
    "article": {
        "title": "Testttt",
        "description": "eerr",
        "body": "rere",
        "tagList": []
    }
  },
  headers: {
  Authorization: `Token ${token}`
  }
})

expect(newArticleResponse.status()).toEqual(201)

await page.goto('https://conduit.bondaracademy.com/');

await expect(page.locator('.preview-link h1').first()).toContainText('Testttt')
await page.getByText('Testttt').click()
await page.getByRole('button', {name: 'Delete Article'}).first().click()
await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0')
await expect(page.locator('.preview-link h1').first()).not.toContainText('Testttt')


})

test('Create article', async ({ page, request }) => {
  const articleTitle = `Playwright is awesome ${Date.now()}`;

  //Go to page
  await page.goto('https://conduit.bondaracademy.com/');

  //Sign in
  await expect(page.locator('.nav-link', { hasText: 'Your Feed' })).toBeVisible();

 //fill the article
  await page.getByText('New Article').click();
  await page.getByRole('textbox', { name: 'Article Title' }).fill(articleTitle);
  await page.getByRole('textbox', { name: "What's this article about?" }).fill('We can use APIs in Playwright');
  await page.getByRole('textbox', { name: 'Write your article (in markdown)' }).fill('Automate any web application in Playwright');


  // Publish
  await page.getByRole('button', { name: 'Publish Article' }).click();

 
  const createArticleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
  const articleResponseJSON = await createArticleResponse.json();
  const slugId = articleResponseJSON.article.slug;

  // asert the page
  await expect(page.locator('.article-page h1')).toContainText(articleTitle);


  await page.getByText('Home').click();
  await expect(page.locator('.article-preview h1').first()).toContainText(articleTitle);

  const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
    data: {
      user: {
        email: process.env.USER_PASSWORD,
        password: process.env.USER_EMAIL
      }
    }
  });
  expect(loginResponse.status()).toEqual(200);
  const responseLoginJSON = await loginResponse.json();
  const token = responseLoginJSON.user.token;

  // delete article
  const deleteResponse = await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugId}`, {
    headers: {
      Authorization: `Token ${token}`
    }
  });
  expect(deleteResponse.status()).toEqual(204);
});