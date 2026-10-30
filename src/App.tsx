import { useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  FileText,
  Hexagon,
  Home,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { Contractor, Plot } from "./data";
import {
  contractors,
  dateTime,
  houseProjects,
  money,
  plots,
  title,
} from "./data";
import { ProjectInfo, ProjectPicker } from "./ProjectPicker";
import { useDemo } from "./store";
import type { SentOffer } from "./store";
import { Avatar, Empty, IconButton, Modal, PlotPhoto } from "./ui";

type View = "objects" | "selection" | "preview" | "analytics" | "sent";
type Confirm = {
  title: string;
  text: string;
  label: string;
  action: () => void;
};
type Notice = { id: number; text: string; undo?: () => void };

export default function App() {
  const {
    state,
    setState,
    log,
    has,
    remove,
    addPlot,
    addProjects,
    removeProjects,
    reset,
    storageError,
  } = useDemo();
  const [view, setView] = useState<View>("objects");
  const [plotId, setPlotId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [projectPicker, setProjectPicker] = useState<{
    contractor: Contractor;
    plot: Plot;
  } | null>(null);
  const [details, setDetails] = useState<Contractor | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [info, setInfo] = useState<{ title: string; text: string } | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const activePlot = plots.find((p) => p.id === plotId);
  const selectedPlot = plots.find((p) =>
    state.items.some((i) => i.kind === "plot" && i.id === p.id),
  );
  const selectedProjects = houseProjects.filter((p) => has("project", p.id));
  const legacyContractors = contractors.filter((c) => has("contractor", c.id));
  const projectCount = (id: string) =>
    selectedProjects.filter((p) => p.contractorId === id).length;
  const hasContractor = (id: string) => projectCount(id) > 0;
  const available = contractors
    .filter((c) => c.office === state.office)
    .sort((a, b) => b.rating - a.rating);
  const count = state.items.filter((i) => i.kind !== "contractor").length;
  const notify = (text: string, undo?: () => void) =>
    setNotice({ id: Date.now(), text, undo });
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8500);
    return () => clearTimeout(timer);
  }, [notice]);
  const overlay = !!activePlot && view === "objects";
  useEffect(() => {
    document.body.style.overflow =
      overlay || !!confirm || sending || !!details || !!info || !!projectPicker
        ? "hidden"
        : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlay, confirm, sending, details, info, projectPicker]);
  const modalOpen =
    !!confirm || sending || !!details || !!info || !!projectPicker;
  useEffect(() => {
    if (!overlay) return;
    const panel = document.querySelector<HTMLElement>(
      drawer ? ".contractors-drawer" : ".property-panel",
    );
    panel?.querySelector<HTMLElement>("button")?.focus();
  }, [overlay, drawer]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab" && overlay && !modalOpen) {
        const panel = document.querySelector<HTMLElement>(
          drawer ? ".contractors-drawer" : ".property-panel",
        );
        const buttons = Array.from(
          panel?.querySelectorAll<HTMLElement>("button:not(:disabled)") || [],
        );
        const target = e.shiftKey ? buttons.at(-1) : buttons[0];
        if (
          !panel?.contains(document.activeElement) ||
          (e.shiftKey && document.activeElement === buttons[0]) ||
          (!e.shiftKey && document.activeElement === buttons.at(-1))
        ) {
          e.preventDefault();
          target?.focus();
        }
      }
      if (e.key === "Escape" && !modalOpen) {
        if (drawer) setDrawer(false);
        else setPlotId(null);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [drawer, modalOpen, overlay]);
  function openPlot(p: Plot) {
    setPlotId(p.id);
    setDrawer(false);
    setExpanded(false);
    log("Показ блока «Построить дом на участке»", p.id);
  }
  function openDrawer() {
    if (!activePlot) return;
    log("Нажатие «Все подрядчики»", activePlot.id);
    log("Открытие дровера подрядчиков", activePlot.id);
    setDrawer(true);
  }
  function openDetails(c: Contractor) {
    setDetails(c);
    log(
      "Переход в карточку подрядчика",
      activePlot?.id || selectedPlot?.id,
      c.id,
    );
  }
  function openSelection() {
    setView("selection");
    log("Открытие подборки", activePlot?.id || selectedPlot?.id);
  }
  function goToObjects() {
    setPlotId(null);
    setDrawer(false);
    setView("objects");
  }
  function addLand(p: Plot) {
    if (has("plot", p.id)) return;
    const foreignItems = state.items.some(
      (i) =>
        (i.kind === "plot" && i.id !== p.id) ||
        (i.kind !== "plot" && i.plotId !== p.id),
    );
    if (foreignItems) {
      setConfirm({
        title: "Заменить участок в подборке?",
        text: "Демонстрационная комплексная подборка содержит один участок. При замене текущий участок и связанные с ним подрядчики будут удалены.",
        label: "Заменить участок",
        action: () => {
          addPlot(p.id, true);
          notify(
            "Участок заменён. Выберите подрядчиков для нового предложения.",
          );
        },
      });
      return;
    }
    addPlot(p.id);
    notify("Участок добавлен в подборку", () => remove("plot", p.id));
  }
  function addBuilder(c: Contractor) {
    const p =
      view === "objects"
        ? activePlot
        : selectedPlot ||
          plots.find((p) => state.items.some((i) => i.plotId === p.id));
    log("Нажатие «+ В подборку»", p?.id, c.id);
    if (!p) {
      setInfo({
        title: "Сначала выберите участок",
        text: "Откройте участок, чтобы выбрать проекты для комплексного предложения.",
      });
      return;
    }
    setProjectPicker({ contractor: c, plot: p });
    log("Открытие выбора проектов", p.id, c.id);
  }
  function commitProjects(ids: string[]) {
    if (!projectPicker) return;
    const { contractor: c, plot: p } = projectPicker;
    const newIds = ids.filter(
      (id) =>
        !has("project", id) &&
        houseProjects.some(
          (project) => project.id === id && project.contractorId === c.id,
        ),
    );
    if (!newIds.length) return;
    const replacing = state.items.some((i) =>
      i.kind === "plot" ? i.id !== p.id : i.plotId !== p.id,
    );
    const finish = () => {
      addProjects(newIds, c.id, p.id, replacing);
      for (const id of newIds)
        log("Успешное добавление проекта", p.id, c.id, id);
      setProjectPicker(null);
      notify(`Проекты добавлены в подборку: ${newIds.length}`, () =>
        removeProjects(newIds),
      );
    };
    if (!has("plot", p.id)) {
      setConfirm({
        title: replacing
          ? "Заменить участок и добавить проекты?"
          : "Добавить участок в подборку?",
        text: replacing
          ? "Текущий участок и связанные варианты строительства будут заменены новым участком и отмеченными проектами."
          : `Вместе с выбранными проектами добавим ${title(p).toLowerCase()}.`,
        label: replacing ? "Заменить и добавить" : "Добавить участок и проекты",
        action: finish,
      });
    } else finish();
  }
  function chooseMore() {
    const p = selectedPlot || activePlot;
    if (p) {
      setView("objects");
      openPlot(p);
      setDrawer(true);
      log("Открытие дровера подрядчиков", p.id);
    } else {
      setView("objects");
      setPlotId(null);
      setDrawer(false);
    }
  }
  function deleteLand(p: Plot) {
    setConfirm({
      title: "Удалить земельный участок?",
      text: "Комплексное предложение требует участка. Проекты останутся в подборке, но отправка будет доступна после добавления участка.",
      label: "Удалить участок",
      action: () => {
        remove("plot", p.id);
        notify("Участок удалён. Подборка неполная.");
      },
    });
  }
  const complete =
    !!selectedPlot &&
    selectedProjects.length > 0 &&
    legacyContractors.length === 0 &&
    state.items
      .filter((i) => i.kind === "project")
      .every((i) => i.plotId === selectedPlot.id);
  const latestSent =
    state.sent.find((s) => s.id === sentId) || state.sent.at(-1);
  function sendDone(client: string, contact: string, comment: string) {
    if (!complete) {
      setSending(false);
      notify(
        "Подборка изменилась. Проверьте участок и выбранные проекты перед отправкой.",
      );
      return;
    }
    const sent: SentOffer = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      client: client.trim(),
      contact: contact.trim(),
      comment: comment.trim(),
      items: state.items
        .filter((i) => i.kind !== "contractor")
        .map((i) => ({ ...i })),
      status: "Отправлено (демо)",
    };
    setState((s) => ({ ...s, client: sent.client, sent: [...s.sent, sent] }));
    log("Отправка предложения клиенту", selectedPlot?.id);
    setSentId(sent.id);
    setSending(false);
    setView("sent");
  }
  const builderButton = (c: Contractor, compact = false) => (
    <button
      className={`btn ${compact ? "btn-mini" : "btn-secondary"} ${hasContractor(c.id) ? "is-selected" : ""}`}
      onClick={() => addBuilder(c)}
    >
      {hasContractor(c.id) ? (
        <>
          <Check size={13} /> Проекты ({projectCount(c.id)})
        </>
      ) : (
        <>
          <Plus size={13} /> {compact ? "В подборку" : "Выбрать проекты"}
        </>
      )}
    </button>
  );
  function contractorCard(c: Contractor, mini = false) {
    return (
      <article
        key={c.id}
        className={`${mini ? "contractor-mini" : "contractor-row"} ${hasContractor(c.id) ? "selected-card" : ""}`}
        data-contractor={c.id}
      >
        <div className="contractor-top">
          <Avatar initials={c.initials} />
          <div className="min-w-0">
            <button
              className="text-link company-name"
              onClick={() => openDetails(c)}
            >
              {c.name}
            </button>
            <div className="contractor-meta">
              <span className="rating">
                <Star size={12} fill="currentColor" />
                {c.rating.toFixed(1).replace(".", ",")}
              </span>
              <span>· {c.deals} сделок</span>
            </div>
          </div>
          {!mini && builderButton(c, true)}
        </div>
        {mini ? (
          <>
            <p>
              {c.projects} проектов · от {money(c.price)}
            </p>
            {builderButton(c, true)}
          </>
        ) : (
          <>
            <p className="contractor-description">
              Офис-партнёр: {c.office} · {c.projects} проектов · от{" "}
              {money(c.price)}
            </p>
            <div className="tags">
              {c.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </>
        )}
      </article>
    );
  }
  return (
    <div className="app-shell">
      <aside
        className="sidebar"
        aria-label="Главная навигация"
        inert={overlay || modalOpen}
      >
        <button
          className="brand-icon"
          title="Космос — объекты"
          onClick={() => {
            setView("objects");
            setPlotId(null);
            setDrawer(false);
          }}
        >
          <Hexagon size={27} />
        </button>
        <nav>
          <button
            className={view === "objects" ? "nav-icon active" : "nav-icon"}
            title="Объекты"
            aria-label="Объекты"
            onClick={() => {
              setView("objects");
              setPlotId(null);
            }}
          >
            <Home size={21} />
          </button>
          <button
            className={
              ["selection", "preview", "sent"].includes(view)
                ? "nav-icon active"
                : "nav-icon"
            }
            title="Подборка"
            aria-label="Открыть подборку клиента"
            onClick={openSelection}
          >
            <Bookmark size={20} />
            {count > 0 && <i>{count}</i>}
          </button>
          <button
            className={view === "analytics" ? "nav-icon active" : "nav-icon"}
            title="Аналитика пилота"
            aria-label="Аналитика пилота"
            onClick={() => setView("analytics")}
          >
            <BarChart3 size={20} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-icon"
            title="О прототипе"
            aria-label="О прототипе"
            onClick={() =>
              setInfo({
                title: "CRM «Космос» · демонстрационный прототип",
                text: "Сценарий «Участок + подряд». Все объекты, подрядчики и клиент — тестовые записи. Данные сохраняются только в этом браузере. Отправка имитируется, сообщения не уходят. Офисы демонстрационные. Время отображается по Екатеринбургу (UTC+5).",
              })
            }
          >
            <CircleHelp size={21} />
          </button>
          <span className="user-initials" title="Риелтор · демо">
            АК
          </span>
        </div>
      </aside>
      <div className="workspace" inert={overlay || modalOpen}>
        <header className="topbar">
          <span className="workspace-label">Рабочее пространство риелтора</span>
          <div className="topbar-right">
            <label className="office-select">
              <MapPin size={14} />
              <span>Офис</span>
              <select
                aria-label="Офис риелтора"
                value={state.office}
                onChange={(e) => {
                  setState((s) => ({ ...s, office: e.target.value }));
                  setExpanded(false);
                }}
              >
                <option>Тюмень</option>
                <option>Новосибирск</option>
                <option value="Без подрядчиков">Демо: без подрядчиков</option>
              </select>
            </label>
            <span className="demo-label">Демо</span>
            <button
              className="reset-link"
              onClick={() =>
                setConfirm({
                  title: "Сбросить демо?",
                  text: "Подборка, имя клиента, история отправок и локальная аналитика будут очищены.",
                  label: "Сбросить демо",
                  action: () => {
                    reset();
                    setPlotId(null);
                    setDrawer(false);
                    setDetails(null);
                    setProjectPicker(null);
                    setView("objects");
                    setNotice(null);
                  },
                })
              }
            >
              <RotateCcw size={13} />
              Сбросить демо
            </button>
          </div>
        </header>
        {storageError && (
          <div role="alert" className="warning-banner">
            Не удалось сохранить данные в браузере. Освободите место или
            разрешите localStorage. После перезагрузки последние изменения могут
            быть потеряны.
          </div>
        )}
        {view === "objects" && (
          <PropertyListing
            onOpen={openPlot}
            onSelection={openSelection}
            count={count}
          />
        )}
        {view === "selection" && (
          <main className="page-content">
            <div className="breadcrumbs">
              <button onClick={goToObjects}>Объекты</button>
              <span>/</span>Подборка
            </div>
            <div className="page-heading">
              <div>
                <h1>
                  Подборка <span className="count-bubble">{count}</span>
                </h1>
                <p>Участок и выбранные проекты домов в одном предложении</p>
              </div>
              <button className="btn btn-secondary" onClick={goToObjects}>
                <ArrowLeft size={15} />К объектам
              </button>
            </div>
            <div className="client-strip">
              <span className="client-avatar">КК</span>
              <label>
                Клиент · тестовая запись
                <input
                  aria-label="Имя клиента в подборке"
                  value={state.client}
                  onChange={(e) =>
                    setState((s) => ({ ...s, client: e.target.value }))
                  }
                  maxLength={100}
                />
              </label>
              <div className="client-strip-right">
                <span className="status-dot" />
                Активная подборка
              </div>
            </div>
            {!complete && (
              <div className="warning-banner">
                {!selectedPlot
                  ? "Добавьте земельный участок — без него комплексное предложение неполное."
                  : "Выберите проекты домов, чтобы сформировать комплексное предложение."}
              </div>
            )}
            <section className="selection-section">
              <div className="section-title">
                <h2>Земельный участок</h2>
                <span>{selectedPlot ? 1 : 0} объект</span>
              </div>
              {selectedPlot ? (
                <article className="selection-plot">
                  <PlotPhoto small />
                  <div className="selection-plot-info">
                    <span className="tag">{selectedPlot.purpose}</span>
                    <button
                      className="text-link"
                      onClick={() => {
                        setView("objects");
                        openPlot(selectedPlot);
                      }}
                    >
                      {title(selectedPlot)}
                    </button>
                    <p>
                      <MapPin size={13} />
                      {selectedPlot.address}
                    </p>
                    <small>Код объекта: {selectedPlot.id}</small>
                  </div>
                  <strong>{money(selectedPlot.price)}</strong>
                  <IconButton
                    label="Удалить участок"
                    onClick={() => deleteLand(selectedPlot)}
                  >
                    <Trash2 size={17} />
                  </IconButton>
                </article>
              ) : (
                <Empty
                  title="Участок ещё не выбран"
                  description="Начните с поиска земельного участка"
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setView("objects");
                      setPlotId(null);
                    }}
                  >
                    Выбрать участок
                  </button>
                </Empty>
              )}
            </section>
            <section className="selection-section">
              <div className="section-title">
                <h2>Проекты домов</h2>
                <span>{selectedProjects.length}</span>
                <button className="text-link" onClick={chooseMore}>
                  <Plus size={14} />
                  Выбрать подрядчиков
                </button>
              </div>
              <div className="info-banner selection-privacy-note">
                Клиент получит только выбранные проекты. Названия строительных
                компаний видны только риелтору.
              </div>
              {legacyContractors.length > 0 && (
                <div className="legacy-projects warning-banner">
                  <strong>Уточните ранее сохранённую подборку</strong>
                  <p>
                    Для этих подрядчиков ещё не выбраны проекты. Выберите
                    конкретные варианты или удалите запись, чтобы отправить
                    предложение.
                  </p>
                  {legacyContractors.map((c) => (
                    <div key={c.id}>
                      <span>{c.name}</span>
                      <button
                        className="text-link"
                        onClick={() => addBuilder(c)}
                      >
                        Выбрать проекты
                      </button>
                      <IconButton
                        label={`Удалить ранее выбранного подрядчика ${c.name}`}
                        onClick={() => remove("contractor", c.id)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
              {selectedProjects.length ? (
                selectedProjects.map((project) => {
                  const c = contractors.find(
                    (c) => c.id === project.contractorId,
                  )!;
                  return (
                    <article
                      className="selection-project"
                      key={project.id}
                      data-project={project.id}
                    >
                      <ProjectInfo project={project} />
                      <div className="project-realtor-meta">
                        <span>
                          {c.name} <small>· только для риелтора</small>
                        </span>
                        <button
                          className="text-link"
                          onClick={() => addBuilder(c)}
                        >
                          Ещё проекты
                        </button>
                        <IconButton
                          label={`Удалить проект ${project.name}`}
                          onClick={() => {
                            remove("project", project.id);
                            notify("Проект удалён из подборки");
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </article>
                  );
                })
              ) : (
                <Empty
                  title="Выберите проекты домов"
                  description="Откройте подрядчика и отметьте подходящие проекты — весь каталог клиенту не отправляется"
                >
                  <button className="btn btn-secondary" onClick={chooseMore}>
                    Перейти к выбору
                  </button>
                </Empty>
              )}
            </section>
            <p className="price-note">
              Стоимость строительства указана «от». Итоговая стоимость участка и
              дома не рассчитывается.
            </p>
            <div className="selection-actions">
              <span>
                {selectedPlot ? 1 : 0} участок · {selectedProjects.length}{" "}
                проектов
              </span>
              <button
                className="btn btn-secondary"
                disabled={!complete}
                onClick={() => setView("preview")}
              >
                <FileText size={15} />
                Предпросмотр для клиента
              </button>
              <button
                className="btn btn-primary"
                disabled={!complete}
                onClick={() => setSending(true)}
              >
                <Send size={15} />
                Отправить клиенту
              </button>
            </div>
            {state.sent.length > 0 && (
              <section className="send-history">
                <h2>
                  История отправок <span className="muted">· демо</span>
                </h2>
                {[...state.sent].reverse().map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSentId(s.id);
                      setView("sent");
                    }}
                  >
                    <CheckCheck size={16} />
                    <span>{s.client}</span>
                    <span>{dateTime(s.date)}</span>
                    <span>{s.items.length} элемента</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </section>
            )}
          </main>
        )}
        {view === "preview" && (
          <main className="offer-page">
            <div className="offer-toolbar">
              <button className="text-link" onClick={openSelection}>
                <ArrowLeft size={16} />
                Вернуться к подборке
              </button>
              <span className="demo-label">Демонстрационный предпросмотр</span>
            </div>
            <div className="offer-document">
              <div className="offer-brand">
                ЭТАЖИ <span>недвижимость и строительство</span>
              </div>
              <div className="eyebrow">ИНДИВИДУАЛЬНОЕ ПРЕДЛОЖЕНИЕ</div>
              <h1>
                Предложение по покупке участка
                <br />и строительству дома
              </h1>
              <p className="offer-intro">
                Для {state.client || "клиента"}{" "}
                <span className="tag">Тестовый клиент</span>
              </p>
              {selectedPlot && (
                <article className="offer-plot">
                  <PlotPhoto />
                  <div>
                    <span className="eyebrow">ЗЕМЕЛЬНЫЙ УЧАСТОК</span>
                    <h2>{title(selectedPlot)}</h2>
                    <p>{selectedPlot.address}</p>
                    <strong>{money(selectedPlot.price)}</strong>
                    <div className="tags">
                      <span>{selectedPlot.area} соток</span>
                      <span>{selectedPlot.purpose}</span>
                      <span>Свет {selectedPlot.electricity}</span>
                    </div>
                  </div>
                </article>
              )}
              <h2 className="offer-subheading">
                Проекты домов для вашего участка
              </h2>
              <p className="muted">
                Отобранные варианты строительства. Подробности и комплектацию
                уточните у риелтора.
              </p>
              <div className="offer-projects">
                {selectedProjects.map((project) => (
                  <article className="house-project" key={project.id}>
                    <ProjectInfo project={project} />
                  </article>
                ))}
              </div>
              <div className="info-banner">
                Стоимость строительства ориентировочная и требует
                индивидуального расчёта подрядчика
              </div>
              <small className="muted">
                Демонстрационный предпросмотр. Не является публичной офертой или
                утверждённой доработкой личного кабинета клиента.
              </small>
            </div>
            <div className="offer-footer">
              <button className="btn btn-secondary" onClick={openSelection}>
                Вернуться к подборке
              </button>
              <button
                className="btn btn-primary"
                disabled={!complete}
                onClick={() => setSending(true)}
              >
                <Send size={15} />
                Отправить клиенту
              </button>
            </div>
          </main>
        )}
        {view === "analytics" && <Analytics onBack={goToObjects} />}
        {view === "sent" && latestSent && (
          <main className="sent-page">
            <div className="success-icon">
              <CheckCheck size={30} />
            </div>
            <span className="demo-label">Демонстрационная отправка</span>
            <h1>Предложение отправлено</h1>
            <p>Отправка имитируется. Письма и сообщения не отправлялись.</p>
            <div className="sent-summary">
              <div>
                <span>Клиент · тестовая запись</span>
                <strong>{latestSent.client}</strong>
              </div>
              <div>
                <span>Контакт</span>
                <strong>{latestSent.contact}</strong>
              </div>
              <div>
                <span>Дата · UTC+5</span>
                <strong>{dateTime(latestSent.date)}</strong>
              </div>
              <div>
                <span>Статус</span>
                <strong className="success-text">{latestSent.status}</strong>
              </div>
              {latestSent.comment && (
                <div className="sent-comment">
                  <span>Комментарий риелтора</span>
                  <p>{latestSent.comment}</p>
                </div>
              )}
            </div>
            <section className="sent-items">
              <h2>Состав отправленного предложения</h2>
              <p className="muted">
                Сохранённый снимок · {latestSent.items.length} элемента
              </p>
              {latestSent.items.map((i) => {
                const p = plots.find((p) => p.id === i.id);
                const project = houseProjects.find(
                  (project) => project.id === i.id,
                );
                return (
                  <div key={i.kind + i.id}>
                    <span>
                      {i.kind === "plot" ? (
                        <Home size={18} />
                      ) : (
                        <Bookmark size={18} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {i.kind === "plot" && p
                          ? title(p)
                          : project?.name ||
                            "Вариант строительства из предыдущей версии"}
                      </strong>
                      <small>
                        {i.kind === "plot" && p
                          ? p.address
                          : project
                            ? `${project.area} м² · ${project.wallMaterial} · ${project.floors} эт.`
                            : "Ранее отправленное предложение · проект не был выбран"}
                      </small>
                    </div>
                    <b>
                      {i.kind === "plot" && p
                        ? money(p.price)
                        : project
                          ? `от ${money(project.price)}`
                          : ""}
                    </b>
                  </div>
                );
              })}
            </section>
            <button className="btn btn-primary" onClick={openSelection}>
              Вернуться к подборке
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setView("objects");
                setPlotId(null);
              }}
            >
              К объектам
            </button>
          </main>
        )}
        <footer className="app-footer">
          <span>Космос · Участок + подряд</span>
          <span>Прототип · все записи тестовые</span>
        </footer>
      </div>
      {overlay && activePlot && (
        <div
          className="property-backdrop"
          onClick={() => {
            setPlotId(null);
            setDrawer(false);
          }}
        >
          <section
            role="dialog"
            aria-modal={!drawer && !modalOpen}
            aria-label="Карточка земельного участка"
            className={`property-panel ${drawer ? "under-drawer" : ""}`}
            inert={drawer || modalOpen}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="property-heading">
              <div>
                <div className="eyebrow">
                  ОБЪЕКТ № {activePlot.id} <span>· ТЕСТОВАЯ ЗАПИСЬ</span>
                </div>
                <h2>{title(activePlot)}</h2>
                <p>{activePlot.address}</p>
              </div>
              <IconButton
                label="Закрыть карточку участка"
                onClick={() => {
                  setPlotId(null);
                  setDrawer(false);
                }}
              >
                <X size={21} />
              </IconButton>
            </header>
            <div className="property-scroll">
              <div className="property-main">
                <PlotPhoto />
                <aside className="property-price">
                  <div className="price-box">
                    <strong>{money(activePlot.price)}</strong>
                    <p>
                      {money(Math.round(activePlot.price / activePlot.area))} за
                      сотку
                    </p>
                    <span
                      className={`status-tag ${activePlot.status === "Активный" ? "status-active" : ""}`}
                    >
                      {activePlot.status}
                    </span>
                  </div>
                  <button
                    className={`btn btn-primary ${has("plot", activePlot.id) ? "land-selected" : ""}`}
                    onClick={() => addLand(activePlot)}
                    disabled={has("plot", activePlot.id)}
                  >
                    {has("plot", activePlot.id) ? (
                      <>
                        <Check size={15} />В подборке
                      </>
                    ) : (
                      "В подборку"
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setInfo({
                        title: "Подать объявление",
                        text: "Демонстрационное действие: объект подготовлен к размещению. В этом прототипе публикация на внешних площадках не выполняется.",
                      })
                    }
                  >
                    Подать объявление
                  </button>
                  <div className="agent-card">
                    <span className="agent-avatar">{activePlot.agent[0]}</span>
                    <div>
                      <strong>{activePlot.agent}</strong>
                      <small>Риелтор · тестовая запись</small>
                    </div>
                  </div>
                  <button
                    className="text-link selection-shortcut"
                    onClick={openSelection}
                  >
                    <Bookmark size={14} />
                    Подборка ({count})<ArrowRight size={14} />
                  </button>
                </aside>
              </div>
              <section className="build-house">
                <div className="build-heading">
                  <div>
                    <h3>Построить дом на участке</h3>
                    <p>
                      Подрядчики, работающие с офисом {state.office} · по
                      рейтингу
                    </p>
                  </div>
                  {available.length > 0 && (
                    <button className="text-link" onClick={openDrawer}>
                      Все подрядчики ({available.length}){" "}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
                {available.length ? (
                  <div className="mini-grid">
                    {available.slice(0, 3).map((c) => contractorCard(c, true))}
                  </div>
                ) : (
                  <div className="contractors-empty">
                    К вашему офису пока не привязаны подрядчики
                  </div>
                )}
              </section>
              <section className="parameters">
                <h3>Параметры</h3>
                <div className="parameter-grid">
                  <dl>
                    <div>
                      <dt>Площадь земли</dt>
                      <dd>{activePlot.area} сот.</dd>
                    </div>
                    <div>
                      <dt>Категория</dt>
                      <dd>{activePlot.category}</dd>
                    </div>
                    <div>
                      <dt>Разрешённое использование</dt>
                      <dd>{activePlot.purpose}</dd>
                    </div>
                    <div>
                      <dt>Межевание</dt>
                      <dd>Да</dd>
                    </div>
                  </dl>
                  <dl>
                    <div>
                      <dt>Электроснабжение</dt>
                      <dd>Есть, {activePlot.electricity}</dd>
                    </div>
                    <div>
                      <dt>Газ</dt>
                      <dd>{activePlot.gas}</dd>
                    </div>
                    <div>
                      <dt>Подъезд к объекту</dt>
                      <dd>Асфальт</dd>
                    </div>
                    <div>
                      <dt>Дом на участке</dt>
                      <dd>
                        {activePlot.category === "Дом с участком"
                          ? "Есть"
                          : "Нет"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
              <section className="plot-description">
                <h3>Описание</h3>
                <p>
                  Ровный участок в спокойном районе. Удобный подъезд, рядом
                  природа и необходимая инфраструктура. Параметры объекта
                  приведены для демонстрации сценария CRM.
                </p>
              </section>
            </div>
          </section>
          {drawer && (
            <>
              <div
                className="drawer-shade"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawer(false);
                }}
              />
              <section
                className="contractors-drawer"
                inert={modalOpen}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal={!modalOpen}
                aria-label="Подрядчики для участка"
              >
                <header className="drawer-heading">
                  <IconButton
                    label="Назад к участку"
                    onClick={() => setDrawer(false)}
                  >
                    <ArrowLeft size={20} />
                  </IconButton>
                  <div>
                    <h2>Подрядчики для участка</h2>
                    <p>
                      Участок {activePlot.area} сот., {activePlot.purpose} ·
                      Тюмень
                    </p>
                  </div>
                  <IconButton
                    label="Закрыть список подрядчиков"
                    onClick={() => setDrawer(false)}
                  >
                    <X size={19} />
                  </IconButton>
                </header>
                <div className="drawer-content">
                  <div className="info-banner">
                    Подрядчик добавится в ту же подборку клиента, где находится
                    участок
                  </div>
                  <div className="drawer-controls">
                    <span className="filter-chip">Офис: {state.office}</span>
                    <span>
                      <ArrowDownUp size={12} />
                      По рейтингу
                    </span>
                  </div>
                  <p className="found-contractors">
                    Найдено {available.length} подрядчиков, работающих с вашим
                    офисом
                  </p>
                  {available.length ? (
                    (expanded ? available : available.slice(0, 4)).map((c) =>
                      contractorCard(c),
                    )
                  ) : (
                    <Empty
                      title="К вашему офису пока не привязаны подрядчики"
                      description="Для демонстрации выберите другой офис в верхней панели"
                    />
                  )}
                  {!expanded && available.length > 4 && (
                    <button
                      className="text-link show-more"
                      onClick={() => setExpanded(true)}
                    >
                      Показать ещё {available.length - 4}
                      <ChevronDown size={14} />
                    </button>
                  )}
                  <p className="drawer-demo-note">
                    Все подрядчики — демонстрационные записи
                  </p>
                </div>
                <footer className="drawer-footer">
                  <span>
                    В подборке: {selectedPlot ? 1 : 0} участок +{" "}
                    {selectedProjects.length} проектов
                  </span>
                  <button className="btn btn-primary" onClick={openSelection}>
                    Открыть подборку
                  </button>
                </footer>
              </section>
            </>
          )}
        </div>
      )}
      {details && (
        <Modal title="Информация о подрядчике" onClose={() => setDetails(null)}>
          <div className="contractor-detail">
            <div className="contractor-top">
              <Avatar initials={details.initials} />
              <div>
                <h2>{details.name}</h2>
                <p>
                  {details.office} ·{" "}
                  <span className="tag">Тестовая запись</span>
                </p>
              </div>
            </div>
            <div className="detail-stats">
              <div>
                <span className="rating">
                  <Star size={15} fill="currentColor" />
                  {details.rating.toFixed(1).replace(".", ",")}
                </span>
                <small>Рейтинг</small>
              </div>
              <div>
                <strong>{details.projects}</strong>
                <small>Проектов</small>
              </div>
              <div>
                <strong>от {money(details.price)}</strong>
                <small>Стоимость строительства</small>
              </div>
            </div>
            <h3>О компании</h3>
            <p>{details.description}</p>
            <h3>Технологии строительства</h3>
            <div className="tags">
              {details.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="info-banner">
              Стоимость ориентировочная. Точный расчёт подготовит подрядчик.
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDetails(null)}
              >
                Вернуться
              </button>
              {builderButton(details)}
            </div>
          </div>
        </Modal>
      )}
      {projectPicker && (
        <ProjectPicker
          key={`${projectPicker.contractor.id}-${projectPicker.plot.id}`}
          contractor={projectPicker.contractor}
          selectedIds={selectedProjects.map((p) => p.id)}
          onClose={() => setProjectPicker(null)}
          onAdd={commitProjects}
        />
      )}
      {info && (
        <Modal title={info.title} onClose={() => setInfo(null)}>
          <div className="modal-body">
            <p>{info.text}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setInfo(null)}>
                Понятно
              </button>
            </div>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <div className="modal-body">
            <p>{confirm.text}</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirm(null)}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
              >
                {confirm.label}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {sending && (
        <SendOfferModal
          client={state.client}
          onClose={() => setSending(false)}
          onSend={sendDone}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{notice.text}</span>
          {notice.undo && (
            <button
              onClick={() => {
                notice.undo?.();
                setNotice(null);
              }}
            >
              Отменить
            </button>
          )}
          <IconButton
            label="Закрыть уведомление"
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function PropertyListing({
  onOpen,
  onSelection,
  count,
}: {
  onOpen: (p: Plot) => void;
  onSelection: () => void;
  count: number;
}) {
  const [tab, setTab] = useState("Загородная");
  const [operation, setOperation] = useState("Продажа");
  const [type, setType] = useState("Земельный участок");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const { has } = useDemo();
  const [page, setPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);
  const shown = plots
    .filter(
      (p) =>
        (tab === "Загородная" || tab === "Мои объекты") &&
        p.operation === operation &&
        (!type || p.category === type) &&
        (!minPrice || p.price >= Number(minPrice)) &&
        (!maxPrice || p.price <= Number(maxPrice)) &&
        (!minArea || p.area >= Number(minArea)) &&
        (!maxArea || p.area <= Number(maxArea)) &&
        (!district || p.district === district) &&
        (!search ||
          `${p.id} ${p.address} ${title(p)}`
            .toLowerCase()
            .includes(search.toLowerCase())),
    )
    .sort((a, b) =>
      sort === "cheap"
        ? a.price - b.price
        : sort === "expensive"
          ? b.price - a.price
          : 0,
    );
  const clear = () => {
    setOperation("Продажа");
    setType("Земельный участок");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setDistrict("");
    setSearch("");
    setTab("Загородная");
    setPage(1);
  };
  const filtered = !!(
    minPrice ||
    maxPrice ||
    minArea ||
    maxArea ||
    district ||
    search ||
    type !== "Земельный участок" ||
    operation !== "Продажа"
  );
  useEffect(
    () => setPage(1),
    [
      operation,
      type,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      district,
      search,
      tab,
    ],
  );
  const invalidRange = !!(
    (minPrice && maxPrice && +minPrice > +maxPrice) ||
    (minArea && maxArea && +minArea > +maxArea)
  );
  return (
    <main className="listing">
      <div className="listing-heading">
        <h1>Объекты</h1>
        <label className="object-search">
          <Search size={15} />
          <input
            aria-label="Поиск объектов"
            placeholder="Код объекта или адрес"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className="text-link filters-link"
          onClick={() => filterRef.current?.querySelector("select")?.focus()}
        >
          <Menu size={15} />
          Фильтры
        </button>
        <button
          className="btn btn-primary collection-button"
          onClick={onSelection}
        >
          <Bookmark size={15} />
          Подборка<span>{count}</span>
        </button>
      </div>
      <nav className="tabs" aria-label="Категории объектов">
        {[
          "Мои объекты",
          "Квартиры",
          "Новостройки",
          "Загородная",
          "Коттеджные посёлки",
          "Подряды",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Мои объекты" && <span>12</span>}
          </button>
        ))}
      </nav>
      <div className="filter-bar" ref={filterRef}>
        <div>
          <span className="filter-label">Операция</span>
          <div className="segmented">
            {["Продажа", "Аренда"].map((o) => (
              <button
                key={o}
                className={operation === o ? "active" : ""}
                onClick={() => setOperation(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>Тип объекта</span>
          <select
            aria-label="Тип объекта"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Все типы</option>
            <option>Земельный участок</option>
            <option>Дом с участком</option>
          </select>
        </label>
        <div>
          <span className="filter-label">Стоимость, ₽</span>
          <div className="range-input">
            <input
              aria-label="Стоимость от"
              type="number"
              min="0"
              placeholder="От"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Стоимость до"
              type="number"
              min="0"
              placeholder="До"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
        <div>
          <span className="filter-label">Площадь участка, сот.</span>
          <div className="range-input">
            <input
              aria-label="Площадь от"
              type="number"
              min="0"
              step="0.5"
              placeholder="От"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
            <span>—</span>
            <input
              aria-label="Площадь до"
              type="number"
              min="0"
              step="0.5"
              placeholder="До"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
        </div>
        <label>
          <span>Район</span>
          <select
            aria-label="Район"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">Все районы</option>
            {["Тюменский", "Исетский", "Ялуторовский"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      {invalidRange && (
        <div role="alert" className="range-error">
          Значение «От» не должно превышать значение «До».
        </div>
      )}
      <div className="listing-body">
        <div className="results-bar">
          <span>
            Найдено объектов: <strong>{shown.length}</strong>
          </span>
          {filtered && (
            <button className="text-link" onClick={clear}>
              <X size={13} />
              Сбросить фильтры
            </button>
          )}
          <label className="sort-select">
            <ArrowDownUp size={14} />
            <select
              aria-label="Сортировка объектов"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">По умолчанию</option>
              <option value="cheap">Сначала дешевле</option>
              <option value="expensive">Сначала дороже</option>
            </select>
          </label>
        </div>
        {shown.length ? (
          <>
            <div className="table-scroll">
              <table className="property-table">
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Цена</th>
                    <th>Информация</th>
                    <th>Риелтор</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.slice((page - 1) * 6, page * 6).map((p) => (
                    <tr key={p.id} onClick={() => onOpen(p)}>
                      <td>
                        <div className="property-cell">
                          <PlotPhoto small />
                          <div>
                            <div className="listing-tags">
                              <span className="tag">
                                {p.category === "Дом с участком"
                                  ? "Дом"
                                  : "Участок"}
                              </span>
                              <span className="tag">{p.operation}</span>
                              <span
                                className={`status-tag ${p.status === "Активный" ? "status-active" : ""}`}
                              >
                                {p.status}
                              </span>
                              {has("plot", p.id) && (
                                <span className="in-selection">
                                  <Check size={11} />В подборке
                                </span>
                              )}
                            </div>
                            <small className="object-code">{p.id}</small>
                            <button
                              className="text-link property-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen(p);
                              }}
                            >
                              {title(p)}
                            </button>
                            <p>{p.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="price-cell">
                        <strong>{money(p.price)}</strong>
                        <small>
                          {money(Math.round(p.price / p.area))}/сот.
                        </small>
                      </td>
                      <td>
                        <div className="property-features">
                          <span>Газ {p.gas.toLowerCase()}</span>
                          <span>Свет {p.electricity}</span>
                          <span>Площадь {p.area} сот.</span>
                          <span>Подъезд асфальт</span>
                          <span>Рельеф ровный</span>
                          <span>Межевание есть</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-agent">
                          <span>{p.agent[0]}</span>
                          <div>
                            {p.agent}
                            <small>Тестовая запись</small>
                          </div>
                        </div>
                      </td>
                      <td className="date-cell">
                        <span>Обновлён</span>
                        <p>30 окт 2026</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Показано {(page - 1) * 6 + 1}–{Math.min(page * 6, shown.length)}{" "}
                из {shown.length}
              </span>
              <div>
                {Array.from({ length: Math.ceil(shown.length / 6) }, (_, i) => (
                  <button
                    key={i}
                    className={page === i + 1 ? "active" : ""}
                    onClick={() => setPage(i + 1)}
                    aria-label={`Страница ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <span>По 6 объектов</span>
            </div>
          </>
        ) : (
          <Empty
            title="Объекты не найдены"
            description={
              ["Загородная", "Мои объекты"].includes(tab)
                ? "Попробуйте изменить параметры поиска"
                : "В прототипе представлены загородные объекты. Перейдите во вкладку «Загородная», чтобы начать сценарий."
            }
          >
            <button className="btn btn-secondary" onClick={clear}>
              Показать земельные участки
            </button>
          </Empty>
        )}
        <div className="listing-note">
          <span className="demo-label">Демо</span>Тестовая база объектов ·
          выберите участок, чтобы предложить клиенту строительство
        </div>
      </div>
    </main>
  );
}
function SendOfferModal({
  client,
  onClose,
  onSend,
}: {
  client: string;
  onClose: () => void;
  onSend: (client: string, contact: string, comment: string) => void;
}) {
  const [name, setName] = useState(client);
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Укажите имя клиента");
      return;
    }
    if (
      !(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim()) ||
        (/^\+?[\d\s()\-]+$/.test(contact.trim()) &&
          contact.replace(/\D/g, "").length >= 10 &&
          contact.replace(/\D/g, "").length <= 15)
      )
    ) {
      setError("Введите корректный email или телефон (10–15 цифр)");
      return;
    }
    onSend(name, contact, comment);
  }
  return (
    <Modal title="Отправить предложение клиенту" onClose={onClose}>
      <form className="send-form" onSubmit={submit} noValidate>
        <div className="info-banner">
          Демонстрационная отправка. SMS, письма и сообщения не отправляются.
          Используйте тестовые контакты.
        </div>
        <label>
          Имя клиента <span>*</span>
          <input
            aria-label="Имя клиента"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
          />
        </label>
        <label>
          Телефон или email <span>*</span>
          <input
            aria-label="Телефон или email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="client@example.com"
            maxLength={150}
            autoComplete="off"
          />
        </label>
        <label>
          Комментарий риелтора
          <textarea
            aria-label="Комментарий риелтора"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Подобрала участок и компании для строительства вашего дома"
            maxLength={1000}
            rows={3}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" type="submit">
            <Send size={15} />
            Отправить предложение
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Analytics({ onBack }: { onBack: () => void }) {
  const { state } = useDemo();
  const types = [
    "Показ блока «Построить дом на участке»",
    "Нажатие «Все подрядчики»",
    "Открытие дровера подрядчиков",
    "Нажатие «+ В подборку»",
    "Открытие выбора проектов",
    "Успешное добавление проекта",
    "Переход в карточку подрядчика",
    "Открытие подборки",
    "Отправка предложения клиенту",
  ];
  return (
    <main className="page-content analytics">
      <div className="breadcrumbs">
        <button onClick={onBack}>Объекты</button>
        <span>/</span>Деморежим
      </div>
      <div className="page-heading">
        <div>
          <h1>Аналитика пилота</h1>
          <p>
            Локальная демонстрационная аналитика · не реальные показатели пилота
          </p>
        </div>
        <span className="demo-label">Только этот браузер</span>
      </div>
      <div className="analytics-stats">
        {types.map((t, i) => (
          <article key={t}>
            <span>0{i + 1}</span>
            <strong>{state.events.filter((e) => e.type === t).length}</strong>
            <p>{t}</p>
          </article>
        ))}
      </div>
      <section className="events-panel">
        <h2>
          Последовательность действий{" "}
          <span className="count-bubble">{state.events.length}</span>
        </h2>
        <p className="muted">
          Последние 500 событий · время Екатеринбурга (UTC+5)
        </p>
        {state.events.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Событие</th>
                  <th>ID участка</th>
                  <th>ID подрядчика</th>
                  <th>ID проекта</th>
                  <th>Офис</th>
                </tr>
              </thead>
              <tbody>
                {[...state.events].reverse().map((e) => (
                  <tr key={e.id}>
                    <td>{dateTime(e.date)}</td>
                    <td>{e.type}</td>
                    <td>{e.plotId || "—"}</td>
                    <td>{e.contractorId || "—"}</td>
                    <td>{e.projectId || "—"}</td>
                    <td>{e.office}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Событий пока нет"
            description="Откройте участок и пройдите сценарий — здесь появится история действий"
          >
            <button className="btn btn-secondary" onClick={onBack}>
              Перейти к объектам
            </button>
          </Empty>
        )}
      </section>
    </main>
  );
}
