import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const catalogue = (page: Page) =>
  page.getByRole("region", { name: "Каталог подрядов", exact: true });
const profile = (page: Page) =>
  page.getByRole("dialog", { name: "Карточка подрядчика", exact: true });
const picker = (page: Page) =>
  page.getByRole("dialog", {
    name: "Выберите проекты для клиента",
    exact: true,
  });
async function enter(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Подряды", exact: true }).click();
}
async function narrow(page: Page) {
  const c = catalogue(page);
  await c
    .getByRole("combobox", { name: "Материал стен в каталоге" })
    .selectOption("Кирпич");
  await c
    .getByRole("spinbutton", { name: "Цена проекта от", exact: true })
    .fill("3200000");
  await c
    .getByRole("spinbutton", { name: "Цена проекта до", exact: true })
    .fill("3500000");
  await c
    .getByRole("spinbutton", { name: "Срок строительства от", exact: true })
    .fill("4");
  await c
    .getByRole("spinbutton", { name: "Срок строительства до", exact: true })
    .fill("4");
}

test("два вида показывают все 15 компаний и 90 проектов с реальной пагинацией", async ({
  page,
}) => {
  await enter(page);
  const c = catalogue(page);
  await expect(c).toContainText("Найдено подрядчиков: 15");
  await expect(c.locator(".catalogue-company")).toHaveCount(12);
  await c
    .getByRole("button", { name: "Страница каталога 2", exact: true })
    .click();
  await expect(c.locator(".catalogue-company")).toHaveCount(3);
  await c.getByRole("button", { name: "По проектам", exact: true }).click();
  await expect(c).toContainText("Найдено проектов: 90");
  await expect(c.locator("[data-catalogue-project]")).toHaveCount(12);
  await c
    .getByRole("button", { name: "Страница каталога 8", exact: true })
    .click();
  await expect(c.locator("[data-catalogue-project]")).toHaveCount(6);
  await expect(c.locator(".catalogue-project-owner")).toHaveCount(6);
  await expect(c.locator(".catalogue-project-owner").first()).toContainText(
    "Дом на Оби",
  );
  await c.getByRole("button", { name: "По подрядчикам", exact: true }).click();
  await expect(
    c.getByRole("button", { name: "Страница каталога 1", exact: true }),
  ).toHaveClass("active");
});

test("совместные фильтры относятся к одному проекту и сохраняются между видами", async ({
  page,
}) => {
  await enter(page);
  await narrow(page);
  const c = catalogue(page);
  await expect(c).toContainText("Найдено подрядчиков: 1");
  await expect(c.locator(".catalogue-company")).toHaveCount(1);
  await expect(c.locator(".catalogue-company")).toContainText(
    "ГК «Сибирский дом»",
  );
  await expect(c.locator('[data-catalogue-contractor="t1"]')).toHaveCount(0);
  await c.getByRole("button", { name: "По проектам", exact: true }).click();
  await expect(c).toContainText("Найдено проектов: 1");
  await expect(c.locator('[data-catalogue-project="t2-p2"]')).toBeVisible();
  await expect(c.locator(".catalogue-project")).toContainText("Кирпич");
  await expect(c.locator(".catalogue-project")).toContainText("4 мес.");
  await expect(c.locator(".catalogue-project")).toContainText("3 350 000 ₽");
  await c.getByRole("button", { name: "По подрядчикам", exact: true }).click();
  await expect(c.locator(".catalogue-company")).toHaveCount(1);
});

test("карточка компании открывается поверх выдачи, показывает все её проекты и собственные фильтры", async ({
  page,
}) => {
  await enter(page);
  await narrow(page);
  await catalogue(page)
    .getByRole("button", { name: "Открыть карточку", exact: true })
    .click();
  await expect(profile(page)).toBeVisible();
  await expect(
    profile(page).getByRole("heading", {
      name: "ГК «Сибирский дом»",
      exact: true,
    }),
  ).toBeVisible();
  await expect(profile(page).locator("[data-catalogue-project]")).toHaveCount(
    6,
  );
  await profile(page)
    .getByRole("combobox", { name: "Материал стен в каталоге" })
    .selectOption("Кирпич");
  await profile(page)
    .getByRole("spinbutton", { name: "Цена проекта до", exact: true })
    .fill("3500000");
  await profile(page)
    .getByRole("spinbutton", { name: "Срок строительства до", exact: true })
    .fill("4");
  await expect(profile(page).locator("[data-catalogue-project]")).toHaveCount(
    1,
  );
  await page.screenshot({ path: "test-results/11-contractor-profile.png" });
  await page.keyboard.press("Escape");
  await expect(profile(page)).toHaveCount(0);
  await expect(catalogue(page)).toContainText("Найдено подрядчиков: 1");
  await expect(
    catalogue(page).getByRole("spinbutton", {
      name: "Цена проекта до",
      exact: true,
    }),
  ).toHaveValue("3500000");
});

test("из проекта открывается его компания, добавление требует явного выбора участка и сохраняет единый сценарий", async ({
  page,
}) => {
  await enter(page);
  await narrow(page);
  const c = catalogue(page);
  await c.getByRole("button", { name: "По проектам", exact: true }).click();
  await c
    .locator(".catalogue-project-owner")
    .getByRole("button", { name: "ГК «Сибирский дом»", exact: true })
    .click();
  await profile(page)
    .locator('[data-catalogue-project="t2-p2"]')
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await expect(
    picker(page).locator('[data-project="t2-p2"] input'),
  ).toBeChecked();
  await picker(page)
    .getByRole("button", { name: "Добавить проекты (1)", exact: true })
    .click();
  const chooser = page.getByRole("dialog", {
    name: "Выберите участок для проектов",
    exact: true,
  });
  await expect(chooser).toBeVisible();
  await expect(
    chooser.getByRole("button", { name: "Добавить к участку", exact: true }),
  ).toBeDisabled();
  await chooser.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(
    picker(page).locator('[data-project="t2-p2"] input'),
  ).toBeChecked();
  await picker(page)
    .getByRole("button", { name: "Добавить проекты (1)", exact: true })
    .click();
  await chooser
    .getByRole("combobox", { name: "Участок для выбранных проектов" })
    .selectOption("68948960");
  await chooser
    .getByRole("button", { name: "Добавить к участку", exact: true })
    .click();
  await expect(picker(page)).toHaveCount(0);
  await expect(
    profile(page)
      .locator('[data-catalogue-project="t2-p2"]')
      .getByRole("button", { name: "В подборке", exact: true }),
  ).toBeDisabled();
  await profile(page)
    .getByRole("button", { name: "Подборка (2)", exact: true })
    .click();
  await expect(page.locator(".selection-project")).toHaveCount(1);
  await expect(page.locator(".selection-project")).toContainText(
    "ГК «Сибирский дом»",
  );
  await page
    .getByRole("button", { name: "Предпросмотр для клиента", exact: true })
    .click();
  await expect(page.locator(".offer-page")).toContainText("Уютный 96");
  await expect(page.locator(".offer-page")).not.toContainText("Сибирский дом");
  await page
    .locator(".offer-toolbar")
    .getByRole("button", { name: "Вернуться к подборке", exact: true })
    .click();
  await page.getByRole("button", { name: "К объектам", exact: true }).click();
  await expect(c).toBeVisible();
  await expect(c).toContainText("Найдено проектов: 1");
  await expect(
    c
      .locator('[data-catalogue-project="t2-p2"]')
      .getByRole("button", { name: "В подборке", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".selection-project")).toHaveCount(1);
});

test("каталог использует выбранный участок, отмена не меняет подборку", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "Земельный участок, 10 сот., ИЖС",
      exact: true,
    })
    .click();
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await page.getByRole("button", { name: "Закрыть карточку участка" }).click();
  await page.getByRole("button", { name: "Подряды", exact: true }).click();
  await narrow(page);
  await catalogue(page)
    .getByRole("button", { name: "По проектам", exact: true })
    .click();
  await catalogue(page)
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await picker(page)
    .getByRole("button", { name: "Отмена", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kosmos-demo-v1")!).items.length,
    ),
  ).toBe(1);
  await catalogue(page)
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await picker(page)
    .getByRole("button", { name: "Добавить проекты (1)", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: "Выберите участок для проектов",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kosmos-demo-v1")!).items.length,
    ),
  ).toBe(2);
});

test("поиск, офисы, ошибки диапазонов, пустая выдача и планшет", async ({
  page,
}) => {
  await enter(page);
  const c = catalogue(page);
  await c.getByRole("button", { name: "По проектам", exact: true }).click();
  await c
    .getByRole("combobox", { name: "Офис в каталоге" })
    .selectOption("Новосибирск");
  await expect(c).toContainText("Найдено проектов: 18");
  await c
    .getByRole("textbox", { name: "Поиск подрядчиков и проектов" })
    .fill("Обской дом");
  await expect(c).toContainText("Найдено проектов: 6");
  await c
    .getByRole("combobox", { name: "Материал стен в каталоге" })
    .selectOption("Брус");
  await expect(
    c.getByRole("heading", { name: "Ничего не найдено в подрядах" }),
  ).toBeVisible();
  await c
    .getByRole("button", { name: "Показать все подряды", exact: true })
    .click();
  await expect(c).toContainText("Найдено проектов: 90");
  await c
    .getByRole("spinbutton", { name: "Срок строительства от", exact: true })
    .fill("9");
  await c
    .getByRole("spinbutton", { name: "Срок строительства до", exact: true })
    .fill("3");
  await expect(c.getByRole("alert")).toContainText("не должно превышать");
  await c
    .getByRole("button", { name: "Сбросить фильтры подрядов", exact: true })
    .click();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    c.getByRole("button", { name: "По подрядчикам", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/10-contracts-catalogue-tablet.png",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBeFalsy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await c.getByRole("button", { name: "По подрядчикам", exact: true }).click();
  await page.screenshot({ path: "test-results/10-contractors-catalogue.png" });
});
