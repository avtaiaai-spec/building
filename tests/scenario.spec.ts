import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const plotTitle = "Земельный участок, 10 сот., ИЖС";
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
async function add(page: Page, id: string) {
  await page
    .locator(`.contractors-drawer [data-contractor="${id}"]`)
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
}
async function fullSelection(page: Page) {
  await openPlot(page);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await openDrawer(page);
  await add(page, "t1");
  await add(page, "t2");
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("весь сценарий из 20 шагов: участок, два подрядчика, удаление, возврат, отправка", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(
    page.getByRole("heading", { name: "Объекты", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 850 000 ₽", { exact: true })).toBeVisible();
  await openPlot(page);
  await page
    .locator(".property-price")
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await expect(page.locator(".mini-grid .contractor-mini")).toHaveCount(3);
  await openDrawer(page);
  await expect(page.locator(".property-panel")).toBeVisible();
  await add(page, "t1");
  await expect(page.getByRole("status")).toContainText(
    "добавлен в подборку к участку",
  );
  await expect(page.locator(".drawer-footer")).toContainText(
    "1 участок + 1 подрядчика",
  );
  await add(page, "t2");
  await expect(page.locator(".drawer-footer")).toContainText(
    "1 участок + 2 подрядчика",
  );
  await page
    .getByRole("button", { name: "Открыть подборку", exact: true })
    .click();
  await expect(page.locator(".selection-plot")).toHaveCount(1);
  await expect(page.locator(".selection-contractor")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Удалить ГК «Сибирский дом»", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Выбрать подрядчиков", exact: true })
    .click();
  await expect(
    page.locator('.contractors-drawer [data-contractor="t1"] button').last(),
  ).toBeDisabled();
  await expect(
    page.locator('.contractors-drawer [data-contractor="t2"] button').last(),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Назад к участку" }).click();
  await expect(
    page.locator('.mini-grid [data-contractor="t2"] button').last(),
  ).toBeEnabled();
  await page
    .locator('.mini-grid [data-contractor="t2"]')
    .getByRole("button", { name: "В подборку", exact: true })
    .click();
  await page.locator(".selection-shortcut").click();
  await page.getByRole("button", { name: "Предпросмотр для клиента" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Предложение по покупке участка и строительству дома",
    }),
  ).toBeVisible();
  await expect(page.locator(".offer-contractors article")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Отправить клиенту", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Телефон или email", exact: true })
    .fill("client@example.com");
  await page
    .getByRole("textbox", { name: "Комментарий риелтора" })
    .fill("Тестовое предложение для обсуждения");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено" }),
  ).toBeVisible();
  await expect(page.locator(".sent-items>div")).toHaveCount(3);
  await expect(page.locator(".sent-summary")).toContainText(
    "Отправлено (демо)",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".selection-contractor")).toHaveCount(2);
  await expect(page.locator(".send-history>button")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Аналитика пилота", exact: true })
    .click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kosmos-demo-v1")!),
  );
  for (const type of [
    "Показ блока «Построить дом на участке»",
    "Нажатие «Все подрядчики»",
    "Открытие дровера подрядчиков",
    "Нажатие «+ В подборку»",
    "Успешное добавление подрядчика",
    "Открытие подборки",
    "Отправка предложения клиенту",
  ])
    expect(
      state.events.some((e: { type: string }) => e.type === type),
    ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("подтверждение добавления участка, отмена, детали и отсутствие дублей", async ({
  page,
}) => {
  await openPlot(page);
  const first = page.locator('.mini-grid [data-contractor="t1"]');
  await first.getByRole("button", { name: "В подборку", exact: true }).click();
  await expect(
    page.getByRole("dialog", {
      name: "Добавить участок в подборку?",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kosmos-demo-v1")!).items,
    ),
  ).toHaveLength(0);
  await first.getByRole("button", { name: "В подборку", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить участок и подрядчика", exact: true })
    .click();
  await expect(
    first.getByRole("button", { name: "В подборке", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("status")
    .getByRole("button", { name: "Отменить", exact: true })
    .click();
  await expect(
    first.getByRole("button", { name: "В подборку", exact: true }),
  ).toBeEnabled();
  await first
    .getByRole("button", { name: "ООО «Строим проекты»", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Добавить в подборку", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "В подборке", exact: true }).last(),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Вернуться", exact: true }).click();
  await openDrawer(page);
  await expect(
    page.locator('.contractors-drawer [data-contractor="t1"] button').last(),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kosmos-demo-v1")!).items,
    ),
  ).toHaveLength(2);
  const events = await page.evaluate(
    () => JSON.parse(localStorage.getItem("kosmos-demo-v1")!).events,
  );
  expect(
    events.some(
      (e: { type: string }) => e.type === "Переход в карточку подрядчика",
    ),
  ).toBeTruthy();
});

test("фильтры, сортировка, пагинация и пустое состояние", async ({ page }) => {
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
  await expect(page.locator(".property-table tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Аренда", exact: true }).click();
  await expect(page.locator(".property-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".property-table tbody")).toContainText("35 000 ₽");
});

test("офисы, полный список и пустое состояние подрядчиков", async ({
  page,
}) => {
  await openPlot(page);
  await openDrawer(page);
  await expect(page.locator(".contractor-row")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Показать ещё 8", exact: true })
    .click();
  await expect(page.locator(".contractor-row")).toHaveCount(12);
  await page.getByRole("button", { name: "Назад к участку" }).click();
  // При открытой карточке управление офисом доступно мышью в верхней панели после закрытия.
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

test("удаление участка оставляет неполное предложение, восстановление и независимый снимок отправки", async ({
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
  await expect(page.locator(".selection-contractor")).toHaveCount(2);
  await page.reload();
  await page
    .getByRole("button", { name: "Открыть подборку клиента", exact: true })
    .click();
  await expect(page.locator(".selection-contractor")).toHaveCount(2);
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
    .getByRole("button", { name: "Удалить ООО «Строим проекты»", exact: true })
    .click();
  await page.locator(".send-history>button").click();
  await expect(page.locator(".sent-items>div")).toHaveCount(3);
  await expect(page.locator(".sent-summary")).toContainText("Тестовый клиент");
  await page
    .getByRole("button", { name: "Сбросить демо", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Сбросить демо", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Объекты", exact: true }),
  ).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kosmos-demo-v1")!),
  );
  expect(state.items).toHaveLength(0);
  expect(state.sent).toHaveLength(0);
  expect(state.events).toHaveLength(0);
});

test("планшет и скриншоты основных экранов", async ({ page }) => {
  await page.screenshot({
    path: "test-results/01-listing-desktop.png",
    fullPage: true,
  });
  await openPlot(page);
  await page.screenshot({
    path: "test-results/02-plot-desktop.png",
    fullPage: true,
  });
  await openDrawer(page);
  await page.screenshot({
    path: "test-results/03-drawer-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    page.getByRole("button", { name: "Открыть подборку", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/04-drawer-tablet.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBeFalsy();
});

test('замена участка требует подтверждения; Escape закрывает только верхний уровень', async ({ page }) => {
  await fullSelection(page);
  await page.getByRole('button', { name: 'К объектам', exact: true }).click();
  await page.getByRole('button', { name: 'Земельный участок, 12 сот., ИЖС', exact: true }).click();
  await page.locator('.property-price').getByRole('button', { name: 'В подборку', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Заменить участок в подборке?', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kosmos-demo-v1')!).items)).toHaveLength(3);
  await page.locator('.property-price').getByRole('button', { name: 'В подборку', exact: true }).click();
  await page.getByRole('button', { name: 'Заменить участок', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kosmos-demo-v1')!).items)).toEqual([{kind:'plot',id:'81902117'}]);
  await openDrawer(page);
  await page.locator('.contractors-drawer [data-contractor="t1"]').getByRole('button', {name:'ООО «Строим проекты»',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Информация о подрядчике', exact:true })).toHaveCount(0);
  await expect(page.locator('.contractors-drawer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.contractors-drawer')).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'Карточка земельного участка'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
