import { createRoot } from "react-dom/client";
import { DemoProvider } from "./store";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <DemoProvider>
    <App />
  </DemoProvider>,
);
