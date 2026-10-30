import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
// Legacy contractor entries are retained until the realtor explicitly chooses projects.
export type Item = {
  kind: "plot" | "contractor" | "project";
  id: string;
  plotId?: string;
  contractorId?: string;
};
export type DemoEvent = {
  id: string;
  type: string;
  date: string;
  plotId?: string;
  contractorId?: string;
  projectId?: string;
  office: string;
};
export type SentOffer = {
  id: string;
  date: string;
  client: string;
  contact: string;
  comment: string;
  items: Item[];
  status: "Отправлено (демо)";
};
type State = {
  items: Item[];
  office: string;
  client: string;
  events: DemoEvent[];
  sent: SentOffer[];
};
const initial: State = {
  items: [],
  office: "Тюмень",
  client: "Константинов И. К.",
  events: [],
  sent: [],
};
const KEY = "kosmos-demo-v1";
function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      !s ||
      !Array.isArray(s.items) ||
      !Array.isArray(s.events) ||
      !Array.isArray(s.sent) ||
      typeof s.client !== "string" ||
      typeof s.office !== "string"
    )
      return initial;
    return {
      ...s,
      items: s.items.filter(
        (x: Item, i: number, a: Item[]) =>
          x &&
          ["plot", "contractor", "project"].includes(x.kind) &&
          typeof x.id === "string" &&
          a.findIndex((y) => y && y.kind === x.kind && y.id === x.id) === i,
      ),
    };
  } catch {
    return initial;
  }
}
function useStoreValue() {
  const [state, setState] = useState<State>(load);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  const log = (
    type: string,
    plotId?: string,
    contractorId?: string,
    projectId?: string,
  ) =>
    setState((s) => ({
      ...s,
      events: [
        ...s.events,
        {
          id: crypto.randomUUID(),
          type,
          date: new Date().toISOString(),
          plotId,
          contractorId,
          projectId,
          office: s.office,
        },
      ].slice(-500),
    }));
  const has = (kind: Item["kind"], id: string) =>
    state.items.some((i) => i.kind === kind && i.id === id);
  const remove = (kind: Item["kind"], id: string) =>
    setState((s) => ({
      ...s,
      items: s.items.filter((i) => i.kind !== kind || i.id !== id),
    }));
  const addPlot = (id: string, replace = false) =>
    setState((s) => ({
      ...s,
      items: replace
        ? [{ kind: "plot", id }]
        : s.items.some((i) => i.kind === "plot" && i.id === id)
          ? s.items
          : [...s.items, { kind: "plot", id }],
    }));
  const addProjects = (
    projectIds: string[],
    contractorId: string,
    plotId: string,
    replacePlot = false,
  ) =>
    setState((s) => {
      let items: Item[] = replacePlot
        ? [{ kind: "plot", id: plotId }]
        : [...s.items];
      if (!items.some((i) => i.kind === "plot" && i.id === plotId))
        items.push({ kind: "plot", id: plotId });
      items = items.filter(
        (i) => !(i.kind === "contractor" && i.id === contractorId),
      );
      for (const id of projectIds) {
        if (!items.some((i) => i.kind === "project" && i.id === id))
          items.push({ kind: "project", id, contractorId, plotId });
      }
      return { ...s, items };
    });
  const removeProjects = (ids: string[]) =>
    setState((s) => ({
      ...s,
      items: s.items.filter((i) => i.kind !== "project" || !ids.includes(i.id)),
    }));
  const reset = () => setState({ ...initial });
  return {
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
  };
}
const Context = createContext<ReturnType<typeof useStoreValue> | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDemo() {
  const v = useContext(Context);
  if (!v) throw new Error("DemoProvider missing");
  return v;
}
