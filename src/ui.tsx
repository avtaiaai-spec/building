import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, Image as ImageIcon } from "lucide-react";
export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className="icon-button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const root = ref.current!;
    root.querySelector<HTMLElement>("button,input")?.focus();
    const key = (e: KeyboardEvent) => {
      if (
        root.closest(".modal-backdrop") !==
        Array.from(document.querySelectorAll(".modal-backdrop")).at(-1)
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const all = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input,textarea,select,[tabindex="0"]',
          ),
        );
        const first = all[0],
          last = all.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-heading">
          <h2>{title}</h2>
          <IconButton label="Закрыть окно" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </header>
        {children}
      </div>
    </div>
  );
}
export function PlotPhoto({ small = false }: { small?: boolean }) {
  return (
    <div
      className={small ? "plot-thumbnail" : "plot-photo"}
      aria-label="Фото участка — демонстрационный плейсхолдер"
    >
      {small ? (
        <>
          <span className="land-hill" />
          <span className="photo-count">1 / 8</span>
        </>
      ) : (
        <>
          <ImageIcon size={26} strokeWidth={1} />
          <span>Фото участка</span>
          <small>Демонстрационный объект</small>
        </>
      )}
    </div>
  );
}
export function Avatar({ initials }: { initials: string }) {
  return <span className="contractor-avatar">{initials}</span>;
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <ImageIcon size={30} strokeWidth={1} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
