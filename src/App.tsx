import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import { ModerationPage } from "./pages/ModerationPage";
import { AppStateProvider } from "./state/store";

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter
        basename={
          import.meta.env.BASE_URL.replace(/\/$/, "") || undefined
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="moderation" element={<ModerationPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
