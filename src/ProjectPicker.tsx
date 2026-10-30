import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Contractor, HouseProject } from "./data";
import { houseProjects, money } from "./data";
import { Empty, Modal } from "./ui";
import { ProjectVisual } from "./GeneratedVisual";

export function ProjectInfo({ project }: { project: HouseProject }) {
  return (
    <>
      <div className="house-project-photo">
        <ProjectVisual project={project} />
      </div>
      <div className="house-project-info">
        <h3>{project.name}</h3>
        <div className="tags">
          <span>{project.area} м²</span>
          <span>{project.wallMaterial}</span>
          <span>{project.floors} эт.</span>
          <span>{project.bedrooms} сп.</span>
          <span>{project.buildMonths} мес.</span>
        </div>
        <p>{project.description}</p>
        <strong>от {money(project.price)}</strong>
        <small>
          Цена и срок ориентировочные · требуется индивидуальный расчёт
        </small>
      </div>
    </>
  );
}
export function ProjectPicker({
  contractor,
  selectedIds,
  onClose,
  onAdd,
  initialIds = [],
}: {
  contractor: Contractor;
  selectedIds: string[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  initialIds?: string[];
}) {
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [material, setMaterial] = useState("");
  const [chosen, setChosen] = useState<string[]>(() =>
    initialIds.filter((id) => !selectedIds.includes(id)),
  );
  const all = houseProjects.filter((p) => p.contractorId === contractor.id);
  const materials = [...new Set(all.map((p) => p.wallMaterial))];
  const invalid = !!(minArea && maxArea && Number(minArea) > Number(maxArea));
  const shown = all.filter(
    (p) =>
      (!minArea || p.area >= Number(minArea)) &&
      (!maxArea || p.area <= Number(maxArea)) &&
      (!material || p.wallMaterial === material),
  );
  const hiddenCount = chosen.filter(
    (id) => !shown.some((p) => p.id === id),
  ).length;
  const reset = () => {
    setMinArea("");
    setMaxArea("");
    setMaterial("");
  };
  return (
    <Modal title="Выберите проекты для клиента" wide onClose={onClose}>
      <div className="project-picker">
        <div className="project-picker-intro">
          <strong>{contractor.name}</strong>
          <span className="tag">Только для риелтора</span>
          <p>
            Клиент увидит выбранные проекты домов. Название строительной
            компании в предложении скрыто.
          </p>
        </div>
        <div className="project-filters">
          <div>
            <span className="filter-label">Площадь дома, м²</span>
            <div className="range-input">
              <input
                type="number"
                min="0"
                aria-label="Площадь дома от"
                placeholder="От"
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                min="0"
                aria-label="Площадь дома до"
                placeholder="До"
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
              />
            </div>
          </div>
          <label>
            <span className="filter-label">Материал стен</span>
            <select
              aria-label="Материал стен"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            >
              <option value="">Любой материал</option>
              {materials.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <button className="text-link" onClick={reset}>
            <X size={12} />
            Сбросить
          </button>
        </div>
        {invalid && (
          <div className="form-error" role="alert">
            Площадь «От» не должна превышать площадь «До».
          </div>
        )}
        <div className="project-results">
          <span>
            Найдено проектов: <b>{shown.length}</b>
          </span>
          <small>
            Тестовый каталог · без автоматического подбора по участку
          </small>
        </div>
        <div className="project-picker-scroll">
          {shown.length ? (
            <div className="project-catalogue">
              {shown.map((p) => {
                const existing = selectedIds.includes(p.id);
                const checked = existing || chosen.includes(p.id);
                return (
                  <article
                    className={`house-project ${checked ? "selected-card" : ""}`}
                    key={p.id}
                    data-project={p.id}
                  >
                    <ProjectInfo project={p} />
                    <label
                      className={`project-checkbox ${existing ? "already-added" : ""}`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Выбрать проект ${p.name}`}
                        checked={checked}
                        disabled={existing}
                        onChange={() =>
                          setChosen((ids) =>
                            ids.includes(p.id)
                              ? ids.filter((id) => id !== p.id)
                              : [...ids, p.id],
                          )
                        }
                      />
                      {existing ? (
                        <>
                          <Check size={13} />
                          Уже в подборке
                        </>
                      ) : (
                        "Выбрать проект"
                      )}
                    </label>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Нет проектов с такими параметрами"
              description="Измените площадь или материал стен"
            >
              <button className="btn btn-secondary" onClick={reset}>
                Сбросить фильтры проектов
              </button>
            </Empty>
          )}
        </div>
        <footer className="project-picker-footer">
          <div>
            <strong>Выбрано новых проектов: {chosen.length}</strong>
            {hiddenCount > 0 && (
              <small>
                Скрыто фильтрами: {hiddenCount}. Они также будут добавлены.
              </small>
            )}
            <small>Добавятся только отмеченные проекты</small>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            disabled={!chosen.length}
            onClick={() => onAdd(chosen)}
          >
            Добавить проекты ({chosen.length})
          </button>
        </footer>
      </div>
    </Modal>
  );
}
