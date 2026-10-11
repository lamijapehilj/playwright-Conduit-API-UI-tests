import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, request }) => {
  if (fs.existsSync(authFile)) {
    // fajl postoji: samo osvježi token preko API-ja
    const loginResponse = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
      data: {
        user: {
          email: process.env.USER_EMAIL,
          password: process.env.USER_PASSWORD
        }
      }
    });
    expect(loginResponse.status()).toEqual(200);
    const responseLoginJSON = await loginResponse.json();
    const token = responseLoginJSON.user.token;

    const storageStateFile = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    storageStateFile.origins[0].localStorage[0].value = token;
    fs.writeFileSync(authFile, JSON.stringify(storageStateFile, null, 2));
  } else {
    // fajl ne postoji: prijavi se preko UI-ja i sačuvaj stanje
    await page.goto('https://conduit.bondaracademy.com/');
    await page.getByText('Sign in').click();
    await page.getByRole('textbox', { name: 'Email' }).fill(process.env.USER_EMAIL!);
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.USER_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();

    await page.context().storageState({ path: authFile });
  }
});