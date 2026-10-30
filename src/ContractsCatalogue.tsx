import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Search,
  Star,
  X,
} from "lucide-react";
import type { Contractor, HouseProject } from "./data";
import { contractors, houseProjects, money } from "./data";
import { ProjectInfo } from "./ProjectPicker";
import { Avatar, Empty, IconButton } from "./ui";
import { useDemo } from "./store";

type Filters = {
  material: string;
  minPrice: string;
  maxPrice: string;
  minMonths: string;
  maxMonths: string;
  search: string;
  office: string;
};
const blank: Filters = {
  material: "",
  minPrice: "",
  maxPrice: "",
  minMonths: "",
  maxMonths: "",
  search: "",
  office: "",
};
const materials = ["Каркас", "Кирпич", "Газобетон", "Брус"];
function matches(project: HouseProject, filters: Filters) {
  const owner = contractors.find((c) => c.id === project.contractorId)!;
  return (
    (!filters.material || project.wallMaterial === filters.material) &&
    (!filters.minPrice || project.price >= Number(filters.minPrice)) &&
    (!filters.maxPrice || project.price <= Number(filters.maxPrice)) &&
    (!filters.minMonths || project.buildMonths >= Number(filters.minMonths)) &&
    (!filters.maxMonths || project.buildMonths <= Number(filters.maxMonths)) &&
    (!filters.office || owner.office === filters.office) &&
    (!filters.search ||
      `${project.name} ${project.id} ${owner.name}`
        .toLowerCase()
        .includes(filters.search.trim().toLowerCase()))
  );
}
function duration(projects: HouseProject[]) {
  const min = Math.min(...projects.map((p) => p.buildMonths));
  const max = Math.max(...projects.map((p) => p.buildMonths));
  return min === max ? `${min} мес.` : `${min}–${max} мес.`;
}
function CatalogueFilters({
  filters,
  onChange,
  label = "Фильтры подрядов",
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  label?: string;
}) {
  const change = (name: keyof Filters, value: string) =>
    onChange({ ...filters, [name]: value });
  const invalid = !!(
    (filters.minPrice &&
      filters.maxPrice &&
      +filters.minPrice > +filters.maxPrice) ||
    (filters.minMonths &&
      filters.maxMonths &&
      +filters.minMonths > +filters.maxMonths)
  );
  return (
    <>
      <fieldset className="contracts-filters" aria-label={label}>
        <label className="catalogue-search-label">
          <span>Поиск</span>
          <div className="catalogue-search">
            <Search size={14} />
            <input
              aria-label="Поиск подрядчиков и проектов"
              placeholder="Название проекта или компании"
              value={filters.search}
              onChange={(e) => change("search", e.target.value)}
            />
          </div>
        </label>
        <label>
          <span>Материал стен</span>
          <select
            aria-label="Материал стен в каталоге"
            value={filters.material}
            onChange={(e) => change("material", e.target.value)}
          >
            <option value="">Любой материал</option>
            {materials.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <div>
          <span className="filter-label">Стоимость строительства, ₽</span>
          <div className="range-input">
            <input
              aria-label="Цена проекта от"
              type="number"
              min="0"
              placeholder="От"
              value={filters.minPrice}
              onChange={(e) => change("minPrice", e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Цена проекта до"
              type="number"
              min="0"
              placeholder="До"
              value={filters.maxPrice}
              onChange={(e) => change("maxPrice", e.target.value)}
            />
          </div>
        </div>
        <div>
          <span className="filter-label">Срок строительства, мес.</span>
          <div className="range-input">
            <input
              aria-label="Срок строительства от"
              type="number"
              min="1"
              step="1"
              placeholder="От"
              value={filters.minMonths}
              onChange={(e) => change("minMonths", e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Срок строительства до"
              type="number"
              min="1"
              step="1"
              placeholder="До"
              value={filters.maxMonths}
              onChange={(e) => change("maxMonths", e.target.value)}
            />
          </div>
        </div>
        <button
          className="text-link catalogue-reset"
          onClick={() => onChange({ ...blank })}
        >
          <X size={13} />
          Сбросить фильтры подрядов
        </button>
      </fieldset>
      {invalid && (
        <div className="range-error" role="alert">
          Значение «От» не должно превышать значение «До» в цене или сроке
          строительства.
        </div>
      )}
    </>
  );
}
function CatalogueProjectCard({
  project,
  onOpenContractor,
  onAddProject,
  showOwner = true,
}: {
  project: HouseProject;
  onOpenContractor: (c: Contractor) => void;
  onAddProject: (p: HouseProject) => void;
  showOwner?: boolean;
}) {
  const { has } = useDemo();
  const owner = contractors.find((c) => c.id === project.contractorId)!;
  return (
    <article
      className="house-project catalogue-project"
      data-catalogue-project={project.id}
    >
      <ProjectInfo project={project} />
      {showOwner && (
        <div className="catalogue-project-owner">
          <Avatar initials={owner.initials} />
          <div>
            <small>Подрядчик · {owner.office}</small>
            <button
              className="text-link"
              onClick={() => onOpenContractor(owner)}
            >
              {owner.name}
            </button>
          </div>
        </div>
      )}
      <footer className="catalogue-card-footer">
        <span>Тестовый проект</span>
        <button
          className={`btn ${has("project", project.id) ? "btn-secondary" : "btn-primary"}`}
          disabled={has("project", project.id)}
          onClick={() => onAddProject(project)}
        >
          {has("project", project.id) ? (
            <>
              <Check size={13} />В подборке
            </>
          ) : (
            "В подборку"
          )}
        </button>
      </footer>
    </article>
  );
}
export function ContractsCatalogue({
  onOpenContractor,
  onAddProject,
}: {
  onOpenContractor: (c: Contractor) => void;
  onAddProject: (p: HouseProject) => void;
}) {
  const [mode, setMode] = useState<"contractors" | "projects">("contractors");
  const [filters, setFilters] = useState<Filters>({ ...blank });
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const projects = houseProjects.filter((p) => matches(p, filters));
  const companies = contractors.filter((c) =>
    projects.some((p) => p.contractorId === c.id),
  );
  const sortedProjects = [...projects].sort((a, b) =>
    sort === "cheap"
      ? a.price - b.price
      : sort === "fast"
        ? a.buildMonths - b.buildMonths
        : sort === "rating"
          ? contractors.find((c) => c.id === b.contractorId)!.rating -
            contractors.find((c) => c.id === a.contractorId)!.rating
          : 0,
  );
  const sortedCompanies = [...companies].sort((a, b) =>
    sort === "cheap"
      ? Math.min(
          ...projects
            .filter((p) => p.contractorId === a.id)
            .map((p) => p.price),
        ) -
        Math.min(
          ...projects
            .filter((p) => p.contractorId === b.id)
            .map((p) => p.price),
        )
      : sort === "fast"
        ? Math.min(
            ...projects
              .filter((p) => p.contractorId === a.id)
              .map((p) => p.buildMonths),
          ) -
          Math.min(
            ...projects
              .filter((p) => p.contractorId === b.id)
              .map((p) => p.buildMonths),
          )
        : b.rating - a.rating,
  );
  const total = mode === "contractors" ? companies.length : projects.length;
  const pageSize = 12;
  const pages = Math.ceil(total / pageSize);
  useEffect(() => setPage(1), [mode, filters, sort]);
  const from = (page - 1) * pageSize;
  return (
    <section className="contracts-catalogue" aria-label="Каталог подрядов">
      <div className="contracts-toolbar">
        <div
          className="catalogue-view-toggle"
          aria-label="Вид отображения подрядов"
        >
          <button
            aria-pressed={mode === "contractors"}
            className={mode === "contractors" ? "active" : ""}
            onClick={() => setMode("contractors")}
          >
            По подрядчикам
          </button>
          <button
            aria-pressed={mode === "projects"}
            className={mode === "projects" ? "active" : ""}
            onClick={() => setMode("projects")}
          >
            По проектам
          </button>
        </div>
        <span className="catalogue-total">
          {contractors.length} подрядчиков · {houseProjects.length} проектов
        </span>
        <label className="catalogue-office">
          Офис
          <select
            aria-label="Офис в каталоге"
            value={filters.office}
            onChange={(e) =>
              setFilters((f) => ({ ...f, office: e.target.value }))
            }
          >
            <option value="">Все офисы</option>
            <option>Тюмень</option>
            <option>Новосибирск</option>
          </select>
        </label>
      </div>
      <CatalogueFilters filters={filters} onChange={setFilters} />
      <div className="catalogue-results">
        <div>
          <span>
            {mode === "contractors"
              ? "Найдено подрядчиков"
              : "Найдено проектов"}
            : <strong>{total}</strong>
          </span>
          {mode === "contractors" && (
            <small>
              У каждой компании есть проект, подходящий под все выбранные
              фильтры
            </small>
          )}
        </div>
        <label className="sort-select">
          <ArrowDownUp size={13} />
          <select
            aria-label="Сортировка подрядов"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">По умолчанию</option>
            <option value="cheap">Сначала дешевле</option>
            <option value="fast">Сначала быстрее</option>
            <option value="rating">По рейтингу подрядчика</option>
          </select>
        </label>
      </div>
      {total ? (
        <>
          <div
            className={`catalogue-grid ${mode === "contractors" ? "catalogue-company-grid" : ""}`}
          >
            {mode === "projects"
              ? sortedProjects
                  .slice(from, from + pageSize)
                  .map((project) => (
                    <CatalogueProjectCard
                      key={project.id}
                      project={project}
                      onOpenContractor={onOpenContractor}
                      onAddProject={onAddProject}
                    />
                  ))
              : sortedCompanies.slice(from, from + pageSize).map((company) => {
                  const matching = projects.filter(
                    (p) => p.contractorId === company.id,
                  );
                  const all = houseProjects.filter(
                    (p) => p.contractorId === company.id,
                  );
                  return (
                    <article
                      className="catalogue-company"
                      key={company.id}
                      data-catalogue-contractor={company.id}
                    >
                      <div className="contractor-top">
                        <Avatar initials={company.initials} />
                        <div>
                          <button
                            className="text-link company-name"
                            onClick={() => onOpenContractor(company)}
                          >
                            {company.name}
                          </button>
                          <p>
                            <span className="rating">
                              <Star size={12} fill="currentColor" />
                              {company.rating.toFixed(1).replace(".", ",")}
                            </span>
                            <span className="muted">
                              {" "}
                              · {company.office} · {company.deals} сделок
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="catalogue-company-description">
                        {company.description}
                      </p>
                      <div className="tags">
                        {[...new Set(matching.map((p) => p.wallMaterial))].map(
                          (m) => (
                            <span key={m}>{m}</span>
                          ),
                        )}
                      </div>
                      <dl className="catalogue-company-stats">
                        <div>
                          <dt>Стоимость от</dt>
                          <dd>
                            {money(Math.min(...matching.map((p) => p.price)))}
                          </dd>
                        </div>
                        <div>
                          <dt>Строительство</dt>
                          <dd>
                            <Clock size={12} />
                            {duration(matching)}
                          </dd>
                        </div>
                      </dl>
                      <div className="catalogue-matching">
                        Подходит проектов: <strong>{matching.length}</strong> из{" "}
                        {all.length}
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => onOpenContractor(company)}
                      >
                        Открыть карточку
                        <ArrowRight size={14} />
                      </button>
                    </article>
                  );
                })}
          </div>
          <div className="pagination catalogue-pagination">
            <span>
              Показано {from + 1}–{Math.min(from + pageSize, total)} из {total}
            </span>
            <div>
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  className={page === i + 1 ? "active" : ""}
                  aria-label={`Страница каталога ${i + 1}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <span>По {pageSize}</span>
          </div>
        </>
      ) : (
        <Empty
          title="Ничего не найдено в подрядах"
          description="Измените материал стен, стоимость или срок строительства"
        >
          <button
            className="btn btn-secondary"
            onClick={() => setFilters({ ...blank })}
          >
            Показать все подряды
          </button>
        </Empty>
      )}
      <p className="catalogue-demo-note">
        Все записи тестовые. Цены указаны «от», сроки строительства
        ориентировочные. Название компании отображается только риелтору.
      </p>
    </section>
  );
}
export function ContractorProfile({
  contractor,
  onClose,
  onPickProjects,
  onAddProject,
  onSelection,
  selectionCount,
  modalOpen,
}: {
  contractor: Contractor;
  onClose: () => void;
  onPickProjects: (c: Contractor) => void;
  onAddProject: (p: HouseProject) => void;
  onSelection: () => void;
  selectionCount: number;
  modalOpen: boolean;
}) {
  const [filters, setFilters] = useState<Filters>({ ...blank });
  const all = houseProjects.filter((p) => p.contractorId === contractor.id);
  const shown = all.filter((p) => matches(p, filters));
  return (
    <div
      className="property-backdrop contractor-profile-backdrop"
      onClick={onClose}
    >
      <section
        className="property-panel contractor-profile"
        role="dialog"
        aria-modal={!modalOpen}
        aria-label="Карточка подрядчика"
        inert={modalOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="property-heading">
          <div>
            <div className="eyebrow">
              СТРОИТЕЛЬНЫЙ ПОДРЯДЧИК · ТЕСТОВАЯ ЗАПИСЬ
            </div>
            <h2>{contractor.name}</h2>
            <p>
              Офис {contractor.office} · {all.length} проектов в каталоге
            </p>
          </div>
          <IconButton label="Закрыть карточку подрядчика" onClick={onClose}>
            <X size={21} />
          </IconButton>
        </header>
        <div className="property-scroll">
          <div className="contractor-profile-summary">
            <Avatar initials={contractor.initials} />
            <div>
              <h3>О компании</h3>
              <p>{contractor.description}</p>
              <div className="tags">
                {contractor.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div className="profile-rating">
              <span className="rating">
                <Star size={16} fill="currentColor" />
                {contractor.rating.toFixed(1).replace(".", ",")}
              </span>
              <small>{contractor.deals} сделок</small>
            </div>
          </div>
          <dl className="profile-statistics">
            <div>
              <dt>Стоимость строительства</dt>
              <dd>от {money(Math.min(...all.map((p) => p.price)))}</dd>
            </div>
            <div>
              <dt>Срок строительства</dt>
              <dd>{duration(all)}</dd>
            </div>
            <div>
              <dt>Проектов в портфолио</dt>
              <dd>{contractor.projects}</dd>
            </div>
            <div>
              <dt>Офис-партнёр</dt>
              <dd>{contractor.office}</dd>
            </div>
          </dl>
          <div className="section-title profile-project-heading">
            <h3>Проекты подрядчика</h3>
            <span>{all.length}</span>
          </div>
          <CatalogueFilters
            filters={filters}
            onChange={setFilters}
            label="Фильтры проектов подрядчика"
          />
          <p className="profile-found">
            Найдено проектов: {shown.length} из {all.length}
          </p>
          {shown.length ? (
            <div className="catalogue-grid profile-project-grid">
              {shown.map((project) => (
                <CatalogueProjectCard
                  key={project.id}
                  project={project}
                  onOpenContractor={() => {}}
                  onAddProject={onAddProject}
                  showOwner={false}
                />
              ))}
            </div>
          ) : (
            <Empty
              title="Нет подходящих проектов"
              description="Измените параметры фильтров"
            >
              <button
                className="btn btn-secondary"
                onClick={() => setFilters({ ...blank })}
              >
                Сбросить фильтры проектов подрядчика
              </button>
            </Empty>
          )}
          <p className="catalogue-demo-note">
            Цены и сроки демонстрационные и требуют индивидуального
            согласования. В клиентском предложении название компании скрыто.
          </p>
        </div>
        <footer className="contractor-profile-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Вернуться к выдаче
          </button>
          <button className="text-link" onClick={onSelection}>
            <Bookmark size={14} />
            Подборка ({selectionCount})
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onPickProjects(contractor)}
          >
            Выбрать проекты
          </button>
        </footer>
      </section>
    </div>
  );
}
