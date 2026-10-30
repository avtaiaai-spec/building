import { useState } from "react";
import { ImageOff } from "lucide-react";
import landAtlas from "./assets/land-plots.webp";
import houseAtlas from "./assets/house-projects.webp";
import type { HouseProject, Plot } from "./data";

const plotImages: Record<string, number> = {
  "68948960": 0,
  "81902117": 1,
  "81799021": 2,
  "81812455": 3,
  "81877340": 5,
  "81901288": 4,
  "81901289": 3,
  "81901290": 5,
  "81901291": 4,
  "81901292": 2,
  "81901293": 1,
};
export function GeneratedVisual({
  kind,
  index,
  label,
  compact = false,
}: {
  kind: "plot" | "house";
  index: number;
  label: string;
  compact?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = kind === "plot" ? landAtlas : houseAtlas;
  const cellHeight = kind === "plot" ? 512 : 384;
  const column = index % 2,
    row = Math.floor(index / 2);
  return (
    <div
      className={`generated-visual ${compact ? "generated-visual-compact" : ""}`}
      data-ready={loaded && !failed}
    >
      {failed ? (
        <div className="generated-unavailable">
          <ImageOff size={22} />
          <span>Иллюстрация недоступна</span>
        </div>
      ) : (
        <svg
          role="img"
          aria-label={label}
          viewBox={`${column * 512} ${row * cellHeight} 512 ${cellHeight}`}
          preserveAspectRatio="xMidYMid slice"
        >
          <image
            href={source}
            width="1024"
            height="1536"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </svg>
      )}
      <span
        className="generated-label"
        title="Изображение создано ИИ для прототипа; не является фотографией реального объекта"
      >
        ИИ · иллюстрация
      </span>
    </div>
  );
}
export function PlotVisual({
  plot,
  compact = false,
}: {
  plot: Plot;
  compact?: boolean;
}) {
  return (
    <GeneratedVisual
      kind={plot.category === "Дом с участком" ? "house" : "plot"}
      index={
        plot.category === "Дом с участком" ? 7 : (plotImages[plot.id] ?? 0)
      }
      compact={compact}
      label={`Сгенерированная иллюстрация: ${plot.category.toLowerCase()}, ${plot.area} сот., ${plot.address}`}
    />
  );
}
export function ProjectVisual({
  project,
  compact = false,
}: {
  project: HouseProject;
  compact?: boolean;
}) {
  const row = Math.max(
    0,
    ["Каркас", "Кирпич", "Газобетон", "Брус"].indexOf(project.wallMaterial),
  );
  return (
    <GeneratedVisual
      kind="house"
      index={row * 2 + (project.floors > 1 ? 1 : 0)}
      compact={compact}
      label={`Сгенерированная иллюстрация проекта «${project.name}»: ${project.wallMaterial.toLowerCase()}, ${project.floors} эт.`}
    />
  );
}
