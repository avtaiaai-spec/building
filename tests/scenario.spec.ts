import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { contractors } from "../src/data";
const plotTitle = "Земельный участок, 10 сот., ИЖС";
const picker = (page: Page) =>
  page.getByRole("dialog", {
    name: "Выберите проекты для клиента",
    exact: true,
  });
async function openPlot(page: Page) {
  await page.getByRole("button", { name: plotTitle, exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Карточка земельного участка" }),
  ).toBeVisible();
}
async function openDrawer(page: Page) {
  await page.getByRole("button", { name: "Все подрядчики (12)" }).click();
  await expect(
    page.getByRole("dialog", { name: "Подрядчики для участка", exact: true }),
  ).toBeVisible();
}
async function selectProject(page: Page, id: string) {
  await picker(page).locator(`[data-project="${id}"] input`).check();
}
async function addProjects(page: Page) {
  await picker(page)
    .getByRole("button", { name: /Добавить проекты \(/ })
    .click();
}
async function startPicker(page: Page, id = "t1") {
  await page
    .locator(`.contractors-drawer [data-contractor="${id}"]`)
    .getByRole("button", { name: /В подборку|Проекты \(/ })
    .click();
  await expect(picker(page)).toBeVisible();
}
async function fullSelection(page: Page) {
  await openPlot(page);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await openDrawer(page);
  await startPicker(page);
  await selectProject(page, "t1-p3");
  await addProjects(page);
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
}
async function stored(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("kosmos-demo-v1")!),
  );
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("путь с фильтрацией проектов, несколькими компаниями и обезличенным предложением", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openPlot(page);
  await expect(page.locator(".mini-grid .contractor-mini")).toHaveCount(3);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await openDrawer(page);
  await startPicker(page);
  await expect(picker(page).locator(".house-project")).toHaveCount(6);
  await page
    .getByRole("spinbutton", { name: "Площадь дома от", exact: true })
    .fill("100");
  await page
    .getByRole("spinbutton", { name: "Площадь дома до", exact: true })
    .fill("140");
  await page
    .getByRole("combobox", { name: "Материал стен", exact: true })
    .selectOption("Кирпич");
  await expect(picker(page).locator(".house-project")).toHaveCount(1);
  await expect(picker(page).locator(".house-project")).toContainText(
    "Горизонт 140",
  );
  await selectProject(page, "t1-p4");
  await page
    .getByRole("combobox", { name: "Материал стен", exact: true })
    .selectOption("");
  await selectProject(page, "t1-p3");
  await page
    .getByRole("spinbutton", { name: "Площадь дома от", exact: true })
    .fill("160");
  await page
    .getByRole("spinbutton", { name: "Площадь дома до", exact: true })
    .fill("200");
  await expect(picker(page)).toContainText("Скрыто фильтрами: 2");
  await addProjects(page);
  await expect(page.getByRole("status")).toContainText(
    "Проекты добавлены в подборку: 2",
  );
  await expect(page.locator(".drawer-footer")).toContainText(
    "1 участок + 2 проектов",
  );
  await startPicker(page, "t2");
  await selectProject(page, "t2-p2");
  await addProjects(page);
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
  await expect(page.locator(".selection-project")).toHaveCount(3);
  await expect(page.locator(".selection-project")).toContainText([
    "Строим проекты",
    "Строим проекты",
    "Сибирский дом",
  ]);
  await page
    .getByRole("button", { name: "Удалить проект Горизонт 140", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Выбрать подрядчиков", exact: true })
    .click();
  await startPicker(page);
  await expect(
    picker(page).locator('[data-project="t1-p3"] input'),
  ).toBeChecked();
  await expect(
    picker(page).locator('[data-project="t1-p3"] input'),
  ).toBeDisabled();
  await selectProject(page, "t1-p4");
  await addProjects(page);
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
  await page.getByRole("button", { name: "Предпросмотр для клиента" }).click();
  await expect(page.locator(".offer-projects article")).toHaveCount(3);
  for (const c of contractors)
    await expect(page.locator(".offer-page")).not.toContainText(c.name);
  await expect(page.locator(".offer-page")).not.toContainText(
    "только для риелтора",
  );
  await page.screenshot({
    path: "test-results/06-client-project-offer.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Отправить клиенту", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Телефон или email", exact: true })
    .fill("client@example.com");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено" }),
  ).toBeVisible();
  await expect(page.locator(".sent-items>div")).toHaveCount(4);
  for (const c of contractors)
    await expect(page.locator(".sent-page")).not.toContainText(c.name);
  const data = await stored(page);
  expect(
    data.sent[0].items.filter((i: { kind: string }) => i.kind === "project"),
  ).toHaveLength(3);
  expect(
    data.sent[0].items.some((i: { kind: string }) => i.kind === "contractor"),
  ).toBeFalsy();
  expect(
    data.events.some((e: { projectId?: string }) => e.projectId === "t1-p4"),
  ).toBeTruthy();
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".selection-project")).toHaveCount(3);
  await expect(page.locator(".send-history>button")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("отмена выбора не добавляет каталог, подтверждение участка сохраняет выбор, undo удаляет только новые проекты", async ({
  page,
}) => {
  await openPlot(page);
  await page
    .locator('.mini-grid [data-contractor="t1"]')
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await expect(
    picker(page).getByRole("button", {
      name: "Добавить проекты (0)",
      exact: true,
    }),
  ).toBeDisabled();
  await selectProject(page, "t1-p1");
  await picker(page)
    .getByRole("button", { name: "Отмена", exact: true })
    .click();
  expect((await stored(page)).items).toHaveLength(0);
  await page
    .locator('.mini-grid [data-contractor="t1"]')
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await selectProject(page, "t1-p1");
  await addProjects(page);
  const confirmation = page.getByRole("dialog", {
    name: "Добавить участок в подборку?",
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole("button", { name: "Отмена", exact: true })
    .click();
  await expect(
    picker(page).locator('[data-project="t1-p1"] input'),
  ).toBeChecked();
  expect((await stored(page)).items).toHaveLength(0);
  await addProjects(page);
  await confirmation
    .getByRole("button", { name: "Добавить участок и проекты", exact: true })
    .click();
  await expect(picker(page)).toHaveCount(0);
  expect((await stored(page)).items).toHaveLength(2);
  await page
    .getByRole("status")
    .getByRole("button", { name: "Отменить", exact: true })
    .click();
  expect((await stored(page)).items).toEqual([
    { kind: "plot", id: "68948960" },
  ]);
});

test("детали подрядчика ведут к проектам; повторный вход не создаёт дубликатов", async ({
  page,
}) => {
  await openPlot(page);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await openDrawer(page);
  await page
    .locator('.contractors-drawer [data-contractor="t1"]')
    .getByRole("button", { name: "ООО «Строим проекты»", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Выбрать проекты", exact: true })
    .click();
  await selectProject(page, "t1-p2");
  await addProjects(page);
  await page.getByRole("button", { name: "Вернуться", exact: true }).click();
  await startPicker(page);
  await expect(
    picker(page).locator('[data-project="t1-p2"] input'),
  ).toBeDisabled();
  await expect(
    picker(page).getByRole("button", {
      name: "Добавить проекты (0)",
      exact: true,
    }),
  ).toBeDisabled();
  await selectProject(page, "t1-p3");
  await addProjects(page);
  expect((await stored(page)).items).toHaveLength(3);
  await page.getByRole("button", { name: "Назад к участку" }).click();
  await expect(page.locator('.mini-grid [data-contractor="t1"]')).toContainText(
    "Проекты (2)",
  );
});

test("фильтры объектов, сортировка, пагинация и пустое состояние", async ({
  page,
}) => {
  await expect(page.locator(".property-table tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Страница 2", exact: true }).click();
  await expect(page.locator(".property-table tbody tr")).toHaveCount(4);
  await page
    .getByRole("spinbutton", { name: "Стоимость до", exact: true })
    .fill("1000000");
  await expect(page.locator(".property-table tbody tr")).toHaveCount(4);
  await page
    .getByRole("combobox", { name: "Сортировка объектов" })
    .selectOption("cheap");
  await expect(page.locator(".property-table tbody tr").first()).toContainText(
    "650 000 ₽",
  );
  await page
    .getByRole("combobox", { name: "Район", exact: true })
    .selectOption("Исетский");
  await expect(page.locator(".property-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("spinbutton", { name: "Площадь от", exact: true })
    .fill("30");
  await expect(
    page.getByRole("heading", { name: "Объекты не найдены" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Показать земельные участки", exact: true })
    .click();
  await page.getByRole("button", { name: "Аренда", exact: true }).click();
  await expect(page.locator(".property-table tbody tr")).toHaveCount(1);
});

test("офисы, полный список подрядчиков и пустые состояния проектов", async ({
  page,
}) => {
  await openPlot(page);
  await openDrawer(page);
  await expect(page.locator(".contractor-row")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Показать ещё 8", exact: true })
    .click();
  await expect(page.locator(".contractor-row")).toHaveCount(12);
  await startPicker(page);
  await page
    .getByRole("spinbutton", { name: "Площадь дома от", exact: true })
    .fill("500");
  await expect(
    page.getByRole("heading", { name: "Нет проектов с такими параметрами" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сбросить фильтры проектов", exact: true })
    .click();
  await expect(picker(page).locator(".house-project")).toHaveCount(6);
  await page
    .getByRole("spinbutton", { name: "Площадь дома от", exact: true })
    .fill("150");
  await page
    .getByRole("spinbutton", { name: "Площадь дома до", exact: true })
    .fill("100");
  await expect(page.getByRole("alert")).toContainText("не должна превышать");
  await picker(page)
    .getByRole("button", { name: "Отмена", exact: true })
    .click();
  await page.getByRole("button", { name: "Назад к участку" }).click();
  await page.getByRole("button", { name: "Закрыть карточку участка" }).click();
  await page
    .getByRole("combobox", { name: "Офис риелтора" })
    .selectOption("Новосибирск");
  await openPlot(page);
  await expect(page.locator(".mini-grid")).toContainText("Обской дом");
  await expect(page.locator(".mini-grid")).not.toContainText("Строим проекты");
  await page.getByRole("button", { name: "Закрыть карточку участка" }).click();
  await page
    .getByRole("combobox", { name: "Офис риелтора" })
    .selectOption("Без подрядчиков");
  await openPlot(page);
  await expect(
    page.getByText("К вашему офису пока не привязаны подрядчики", {
      exact: true,
    }),
  ).toBeVisible();
});

test("удаление участка, восстановление, независимость отправленного снимка и сброс", async ({
  page,
}) => {
  await fullSelection(page);
  await page
    .getByRole("button", { name: "Удалить участок", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Удалить участок", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Отправить клиенту", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".selection-project")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".selection-project")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Выбрать участок", exact: true })
    .click();
  await openPlot(page);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await page.locator(".selection-shortcut").click();
  await page
    .getByRole("textbox", { name: "Имя клиента в подборке" })
    .fill("Тестовый клиент");
  await page
    .getByRole("button", { name: "Отправить клиенту", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("корректный");
  await page
    .getByRole("textbox", { name: "Телефон или email" })
    .fill("+7 (999) 000-00-00");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Вернуться к подборке", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Удалить проект Семейный 120", exact: true })
    .click();
  await page.locator(".send-history>button").click();
  await expect(page.locator(".sent-items>div")).toHaveCount(2);
  await expect(page.locator(".sent-items")).toContainText("Семейный 120");
  await page
    .getByRole("button", { name: "Сбросить демо", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Сбросить демо", exact: true })
    .click();
  expect((await stored(page)).items).toHaveLength(0);
  expect((await stored(page)).sent).toHaveLength(0);
});

test("старая подборка не получает случайные проекты, история скрывает названия компаний", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "kosmos-demo-v1",
      JSON.stringify({
        items: [
          { kind: "plot", id: "68948960" },
          { kind: "contractor", id: "t1", plotId: "68948960" },
        ],
        office: "Тюмень",
        client: "Тестовый клиент",
        events: [],
        sent: [
          {
            id: "old",
            date: "2026-10-30T04:00:00Z",
            client: "Тестовый клиент",
            contact: "test@example.com",
            comment: "",
            items: [
              { kind: "plot", id: "68948960" },
              { kind: "contractor", id: "t1", plotId: "68948960" },
            ],
            status: "Отправлено (демо)",
          },
        ],
      }),
    ),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".legacy-projects")).toContainText(
    "ещё не выбраны проекты",
  );
  await expect(page.locator(".selection-project")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Отправить клиенту", exact: true }),
  ).toBeDisabled();
  await page.locator(".send-history>button").click();
  await expect(page.locator(".sent-page")).not.toContainText("Строим проекты");
  await page
    .getByRole("button", { name: "Вернуться к подборке", exact: true })
    .click();
  await page
    .locator(".legacy-projects")
    .getByRole("button", { name: "Выбрать проекты", exact: true })
    .click();
  await selectProject(page, "t1-p3");
  await addProjects(page);
  await expect(page.locator(".legacy-projects")).toHaveCount(0);
  await expect(page.locator(".selection-project")).toHaveCount(1);
  expect(
    (await stored(page)).items.some(
      (i: { kind: string }) => i.kind === "contractor",
    ),
  ).toBeFalsy();
  await expect(
    page.getByRole("button", { name: "Отправить клиенту", exact: true }),
  ).toBeEnabled();
});

test("замена участка и Escape закрывают только верхний уровень", async ({
  page,
}) => {
  await fullSelection(page);
  await page.getByRole("button", { name: "К объектам", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Земельный участок, 12 сот., ИЖС",
      exact: true,
    })
    .click();
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  expect((await stored(page)).items).toHaveLength(2);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Заменить участок", exact: true })
    .click();
  expect((await stored(page)).items).toEqual([
    { kind: "plot", id: "81902117" },
  ]);
  await openDrawer(page);
  await startPicker(page);
  await page.keyboard.press("Escape");
  await expect(picker(page)).toHaveCount(0);
  await expect(page.locator(".contractors-drawer")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".contractors-drawer")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("компактная компоновка выбора проектов на desktop и планшете", async ({
  page,
}) => {
  await openPlot(page);
  await page.screenshot({ path: "test-results/02-plot-desktop.png" });
  await openDrawer(page);
  await startPicker(page);
  await page.screenshot({ path: "test-results/05-project-picker-desktop.png" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    picker(page).getByRole("button", {
      name: "Добавить проекты (0)",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/05-project-picker-tablet.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBeFalsy();
});

test("иллюстрации загружаются в выдаче, карточке, проектах, предложении и подтверждении отправки", async ({
  page,
}) => {
  const brokenAssets: string[] = [];
  page.on("response", (response) => {
    if (/\.webp(?:\?|$)/.test(response.url()) && response.status() >= 400)
      brokenAssets.push(response.url());
  });
  const listingImage = page
    .locator(".property-table tbody tr")
    .first()
    .locator(".generated-visual");
  await expect(listingImage).toHaveAttribute("data-ready", "true");
  const plotSource = await listingImage.locator("image").getAttribute("href");
  await openPlot(page);
  await expect(
    page.locator(".property-main .generated-visual"),
  ).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".property-main image")).toHaveAttribute(
    "href",
    plotSource!,
  );
  await page.screenshot({ path: "test-results/07-generated-land.png" });
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await openDrawer(page);
  await startPicker(page);
  await expect(picker(page).locator('[data-ready="true"]')).toHaveCount(6);
  await page.screenshot({ path: "test-results/08-generated-projects.png" });
  await selectProject(page, "t1-p3");
  await addProjects(page);
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
  await expect(
    page.locator(".selection-project .generated-visual"),
  ).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Предпросмотр для клиента" }).click();
  await expect(page.locator('.offer-page [data-ready="true"]')).toHaveCount(2);
  await expect(page.locator(".offer-projects")).toContainText(
    "ИИ · иллюстрация",
  );
  await page.screenshot({
    path: "test-results/09-generated-client-offer.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Отправить клиенту", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Телефон или email" })
    .fill("client@example.com");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(page.locator('.sent-items [data-ready="true"]')).toHaveCount(2);
  expect(brokenAssets).toEqual([]);
});
