import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
export type Item = { kind: "plot" | "contractor"; id: string; plotId?: string };
export type DemoEvent = {
  id: string;
  type: string;
  date: string;
  plotId?: string;
  contractorId?: string;
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
          ["plot", "contractor"].includes(x.kind) &&
          typeof x.id === "string" &&
          a.findIndex((y) => y.kind === x.kind && y.id === x.id) === i,
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
  const log = (type: string, plotId?: string, contractorId?: string) =>
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
  const addContractor = (id: string, plotId: string) =>
    setState((s) =>
      s.items.some((i) => i.kind === "contractor" && i.id === id)
        ? s
        : { ...s, items: [...s.items, { kind: "contractor", id, plotId }] },
    );
  const reset = () => setState({ ...initial });
  return {
    state,
    setState,
    log,
    has,
    remove,
    addPlot,
    addContractor,
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
