# Playwright Conduit – API & UI Tests

Test automation project built with **Playwright** and **TypeScript** against
[Conduit](https://conduit.bondaracademy.com/), a demo blogging application with a REST API.

## What is covered

### API tests (`tests/api.spec.ts`)
- **Authentication** – successful login returns a valid token and the correct user
- **Article list** – response structure and data validation
- **Full CRUD flow** – create, read, update and delete an article, verifying after
  each step that the change was actually persisted (not only that the response was successful)
- **Negative scenarios**
  - login with a wrong password is rejected and returns no user data
  - creating an article without a token is rejected, and the article is not created
  - requesting a non-existent article returns 404 with a clear error message

### UI tests (`tests/working-with-apis.spec.ts`)
- **API mocking** – intercepting and modifying API responses to test the UI in isolation
- **API + UI combination** – test data is created and cleaned up via the API,
  while the behaviour is verified in the browser

## Tech stack
- Playwright Test (TypeScript)
- GitHub Actions (CI)
- dotenv for local configuration

## Project setup

```bash
npm ci
```

Create a `.env` file in the project root:


## Running the tests

```bash
npx playwright test --project=api       # API tests only (no browser needed)
npx playwright test --project=chromium  # UI tests in Chromium
npx playwright show-report              # open the HTML report
```

## CI

API tests run automatically on every push and pull request to `master`
via GitHub Actions. Credentials are stored as GitHub Secrets and are never
committed to the repository.