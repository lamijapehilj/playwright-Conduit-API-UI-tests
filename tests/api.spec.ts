import { test, expect, APIRequestContext } from "@playwright/test";

test.use({ baseURL: "https://conduit-api.bondaracademy.com" });

async function getToken(request: APIRequestContext) {
  const loginResponse = await request.post("/api/users/login", {
    data: {
      user: {
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASSWORD,
      },
    },
  });
  expect(loginResponse.status()).toEqual(200);
  const loginResponseJSON = await loginResponse.json();
  const token = loginResponseJSON.user.token;
  expect(token).toBeTruthy();
  return token;
}

test("Login via api", async ({ request }) => {
  const loginResponse = await request.post("/api/users/login", {
    data: {
      user: {
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASSWORD,
      },
    },
  });
  expect(loginResponse.status()).toEqual(200);
  const loginResponseJSON = await loginResponse.json();
  const token = loginResponseJSON.user.token;
  const email = loginResponseJSON.user.email;
  expect(token).toBeTruthy();

  expect(email).toBe(process.env.USER_EMAIL);
});

test("The list of articles is returned as expected", async ({ request }) => {
  const token = await getToken(request);

  const listOfArticlesResponse = await request.get("/api/articles", {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  expect(listOfArticlesResponse.status()).toEqual(200);

  const listOfArticlesJSON = await listOfArticlesResponse.json();

  const articlesCount = listOfArticlesJSON.articlesCount;
  const articles = listOfArticlesJSON.articles;
  expect(articlesCount).toBeGreaterThan(0);
  expect(Array.isArray(articles)).toBe(true);
  expect(articles.length).toBeGreaterThan(0);

  expect(articles[0]).toHaveProperty("title");
  expect(articles[0]).toHaveProperty("slug");
});

test("Article CRUD flow", async ({ request }) => {
  const token = await getToken(request);
  const newTitle = `Test article ${Date.now()}`;

  const createdArticle = await request.post("/api/articles", {
    data: {
      article: {
        title: newTitle,
        description: "eerr",
        body: "rere",
        tagList: [],
      },
    },
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  expect(createdArticle.status()).toEqual(201);
  const createdArticleJSON = await createdArticle.json();
  expect(createdArticleJSON.article.title).toBe(newTitle);
  const slug = createdArticleJSON.article.slug;
  expect(slug).toBeTruthy();

  //Check integration test if the article can be fetched, is it created
  const checkCreatedArticle = await request.get(`/api/articles/${slug}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  expect(checkCreatedArticle.status()).toEqual(200);
  const checkCreatedArticleJSON = await checkCreatedArticle.json();

  expect(checkCreatedArticleJSON.article.title).toBe(newTitle);
  expect(checkCreatedArticleJSON.article.description).toBe("eerr");

  //Update
  const updatedDescription = `Updated ${Date.now()}`;
  const updatedArticle = await request.put(`/api/articles/${slug}`, {
    data: {
      article: {
        description: updatedDescription,
      },
    },
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  expect(updatedArticle.status()).toEqual(200);
  const updatedArticleJSON = await updatedArticle.json();
  const newDescription = updatedArticleJSON.article.description;
  expect(newDescription).toBe(updatedDescription);
  expect(updatedArticleJSON.article.title).toBe(newTitle);

  const getUpdatedArticle = await request.get(`/api/articles/${slug}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  expect(getUpdatedArticle.status()).toEqual(200);
  const getUpdatedArticleJSON = await getUpdatedArticle.json();
  expect(getUpdatedArticleJSON.article.description).toBe(newDescription);

  //Delete
  const deletedArticle = await request.delete(`/api/articles/${slug}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  expect(deletedArticle.status()).toEqual(204);

  const getDeletedArticle = await request.get(`/api/articles/${slug}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  expect(getDeletedArticle.status()).toEqual(404);
});

test("Login with wrong password is rejected", async ({ request }) => {
  const wrongLogin = await request.post("/api/users/login", {
    data: {
      user: {
        email: process.env.USER_EMAIL,
        password: "Test1236!",
      },
    },
  });

  expect(wrongLogin.status()).toEqual(403);

  const wrongLoginJSON = await wrongLogin.json();
  expect(wrongLoginJSON).not.toHaveProperty("user");
  expect(wrongLoginJSON).toHaveProperty("errors");
});

test("Creating article without token is rejected", async ({ request }) => {
  const newTitle = `New title ${Date.now()}`;
  const createArticle = await request.post("/api/articles", {
    data: {
      article: {
        title: newTitle,
        description: "some description",
        body: "some body",
        tagList: [],
      },
    },
  });

  expect(createArticle.status()).toEqual(401);

  const articles = await request.get("/api/articles");
  expect(articles.status()).toEqual(200);
  const articlesJSON = await articles.json();

  const titles = articlesJSON.articles.map((a: any) => a.title);
  expect(titles).not.toContain(newTitle);
});

test("Getting non-existent article returns 404", async ({ request }) => {
  const nonExistentSlug = `Article ${Date.now()}`;
  const articles = await request.get(`/api/articles/${nonExistentSlug}`);
  expect(articles.status()).toEqual(404);
  const articlesJSON = await articles.json();
  expect(articlesJSON.errors).toEqual({ article: ["not found"] });
  expect(articlesJSON).not.toHaveProperty('article')
});
