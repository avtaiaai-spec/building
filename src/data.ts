export type Plot = {
  id: string;
  area: number;
  purpose: string;
  address: string;
  district: string;
  price: number;
  electricity: string;
  gas: string;
  status: string;
  agent: string;
  operation: string;
  category: string;
};
export const plots: Plot[] = [
  {
    id: "68948960",
    area: 10,
    purpose: "ИЖС",
    address: "Тюмень, СНТ «Ромашка», ул. Луговая, 12",
    district: "Тюменский",
    price: 1850000,
    electricity: "15 кВт",
    gas: "По границе участка",
    status: "Активный",
    agent: "Карпова Л.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81902117",
    area: 12,
    purpose: "ИЖС",
    address: "Тюменский р-н, с. Каменка, ул. Луговая",
    district: "Тюменский",
    price: 2400000,
    electricity: "15 кВт",
    gas: "Подведён",
    status: "Активный",
    agent: "Соколов А.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81799021",
    area: 8,
    purpose: "СНТ",
    address: "Тюменский р-н, СНТ «Рассвет», 4-я линия",
    district: "Тюменский",
    price: 650000,
    electricity: "Есть",
    gas: "Нет",
    status: "Активный",
    agent: "Петрова Е.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81812455",
    area: 15,
    purpose: "ЛПХ",
    address: "Исетский р-н, с. Исетское, ул. Полевая, 8",
    district: "Исетский",
    price: 1200000,
    electricity: "15 кВт",
    gas: "По границе участка",
    status: "Активный",
    agent: "Казеева С.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81877340",
    area: 6,
    purpose: "СНТ",
    address: "Тюмень, СНТ «Липовый остров», ул. Садовая, 6",
    district: "Тюменский",
    price: 980000,
    electricity: "10 кВт",
    gas: "Нет",
    status: "Активный",
    agent: "Карпова Л.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901288",
    area: 20,
    purpose: "ИЖС",
    address: "Ялуторовский р-н, с. Памятное, ул. Центральная, 4",
    district: "Ялуторовский",
    price: 3100000,
    electricity: "15 кВт",
    gas: "Подведён",
    status: "Активный",
    agent: "Соколов А.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901289",
    area: 9,
    purpose: "ЛПХ",
    address: "Исетский р-н, д. Красново, ул. Новая, 19",
    district: "Исетский",
    price: 780000,
    electricity: "15 кВт",
    gas: "Нет",
    status: "На паузе",
    agent: "Петрова Е.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901290",
    area: 11,
    purpose: "ИЖС",
    address: "Тюменский р-н, д. Кулига, ул. Сосновая, 14",
    district: "Тюменский",
    price: 2150000,
    electricity: "15 кВт",
    gas: "По границе участка",
    status: "Активный",
    agent: "Казеева С.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901291",
    area: 25,
    purpose: "КФХ",
    address: "Ялуторовский р-н, с. Зиново, ул. Заречная, 2",
    district: "Ялуторовский",
    price: 1600000,
    electricity: "Есть",
    gas: "Нет",
    status: "Активный",
    agent: "Карпова Л.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901292",
    area: 7.5,
    purpose: "СНТ",
    address: "Тюмень, СНТ «Берёзка», ул. Вишнёвая, 21",
    district: "Тюменский",
    price: 890000,
    electricity: "10 кВт",
    gas: "Нет",
    status: "Активный",
    agent: "Петрова Е.",
    operation: "Продажа",
    category: "Земельный участок",
  },
  {
    id: "81901293",
    area: 10,
    purpose: "ИЖС",
    address: "Тюмень, с. Перевалово, ул. Лесная, 5",
    district: "Тюменский",
    price: 35000,
    electricity: "15 кВт",
    gas: "Подведён",
    status: "Активный",
    agent: "Соколов А.",
    operation: "Аренда",
    category: "Земельный участок",
  },
  {
    id: "81901294",
    area: 10,
    purpose: "ИЖС",
    address: "Тюменский р-н, д. Кулига, ул. Берёзовая, 9",
    district: "Тюменский",
    price: 9800000,
    electricity: "15 кВт",
    gas: "Подведён",
    status: "Активный",
    agent: "Соколов А.",
    operation: "Продажа",
    category: "Дом с участком",
  },
];
export type Contractor = {
  id: string;
  name: string;
  initials: string;
  office: string;
  rating: number;
  projects: number;
  deals: number;
  price: number;
  tags: string[];
  description: string;
};
const seed: [string, string, number, number, number, number, string[]][] = [
  [
    "ООО «Строим проекты»",
    "СП",
    4.8,
    24,
    37,
    3300000,
    ["Каркас", "Кирпич", "Под ключ"],
  ],
  [
    "ГК «Сибирский дом»",
    "СД",
    4.6,
    18,
    21,
    2900000,
    ["Каркас", "Кирпич", "Под ключ"],
  ],
  ["«Брусника. Загород»", "БЗ", 4.5, 9, 12, 4100000, ["Газобетон", "Под ключ"]],
  [
    "ИП Карпов — каркасные дома",
    "КД",
    4.2,
    5,
    6,
    2100000,
    ["Каркас", "Под ключ"],
  ],
  ["ООО «Тёплый контур»", "ТК", 4.1, 16, 19, 3600000, ["Кирпич", "Газобетон"]],
  ["СК «Лес и дом»", "ЛД", 4.1, 13, 15, 2800000, ["Брус", "Под ключ"]],
  ["«Новая усадьба»", "НУ", 4.0, 11, 14, 3900000, ["Газобетон", "Кирпич"]],
  ["СК «Основа»", "ОС", 3.9, 8, 10, 3100000, ["Каркас", "Под ключ"]],
  ["«Дом у озера»", "ДО", 3.9, 7, 9, 4200000, ["Кирпич", "Под ключ"]],
  ["ООО «Свой двор»", "СД", 3.8, 12, 14, 2700000, ["Брус", "Каркас"]],
  ["«Северный дом»", "СД", 3.7, 6, 8, 3500000, ["Газобетон", "Под ключ"]],
  ["СК «Добрый дом»", "ДД", 3.6, 4, 5, 2400000, ["Каркас", "Брус"]],
];
export const contractors: Contractor[] = [
  ...seed.map(([name, initials, rating, projects, deals, price, tags], i) => ({
    id: `t${i + 1}`,
    name,
    initials,
    rating,
    projects,
    deals,
    price,
    tags,
    office: "Тюмень",
    description:
      "Строительство загородных домов от фундамента до отделки. Помогаем выбрать технологию, согласовать этапы работ и подготовить индивидуальное предложение. Условия и сроки определяются после консультации.",
  })),
  ...[
    ["СК «Обской дом»", "ОД"],
    ["«Сибирские мастера»", "СМ"],
    ["«Дом на Оби»", "ДО"],
  ].map(([name, initials], i) => ({
    id: `n${i + 1}`,
    name,
    initials,
    rating: 4.7 - i * 0.2,
    projects: 20 - i * 3,
    deals: 25 - i * 4,
    price: 3100000 + i * 500000,
    tags: ["Газобетон", "Под ключ"],
    office: "Новосибирск",
    description:
      "Демонстрационный подрядчик офиса Новосибирск. Строим индивидуальные дома, сопровождаем проект на всех этапах. Стоимость уточняется при обращении.",
  })),
];
export const money = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";
export const title = (p: Plot) => `${p.category}, ${p.area} сот., ${p.purpose}`;
export const dateTime = (s: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(new Date(s));
