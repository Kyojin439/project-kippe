import { useRef, useState, type PointerEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const ROUTES = ["/map", "/", "/help"];
const SWIPE_THRESHOLD = 60;
const TRANSITION_MS = 180;

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragValue = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isModeratorView = pathname === "/moderation";

  const movePage = (value: number) => {
    dragValue.current = value;
    setDragX(value);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      isAnimating ||
      isModeratorView ||
      (event.target as Element).closest(".leaflet-container")
    ) {
      dragStart.current = null;
      return;
    }
    dragStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = dragStart.current;
    if (!start || isAnimating) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const currentIndex = ROUTES.indexOf(pathname);
    const pointsOutside =
      (deltaX > 0 && currentIndex === 0) ||
      (deltaX < 0 && currentIndex === ROUTES.length - 1);
    movePage(pointsOutside ? deltaX * 0.18 : deltaX);
  };

  const settlePage = () => {
    setIsAnimating(true);
    movePage(0);
    window.setTimeout(() => setIsAnimating(false), TRANSITION_MS);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start || isAnimating) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
      movePage(0);
      return;
    }
    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) < Math.abs(deltaY) * 1.4
    ) {
      settlePage();
      return;
    }

    const currentIndex = ROUTES.indexOf(pathname);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextRoute = ROUTES[nextIndex];
    if (!nextRoute) {
      settlePage();
      return;
    }

    const direction = deltaX < 0 ? -1 : 1;
    const width = mainRef.current?.clientWidth ?? window.innerWidth;
    setIsAnimating(true);
    movePage(direction * width);

    window.setTimeout(() => {
      navigate(nextRoute);
      setIsAnimating(false);
      movePage(-direction * width);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsAnimating(true);
          movePage(0);
          window.setTimeout(() => setIsAnimating(false), TRANSITION_MS);
        });
      });
    }, TRANSITION_MS);
  };

  return (
    <div className="phone">
      <header className="topbar">
        <span className="logo-lockup">
          <strong className="logo">Kippe</strong>
          <small>Powered by Kippenstummel</small>
        </span>
        <span className="badge">Unofficial prototype</span>
      </header>
      <main
        ref={mainRef}
        className={isAnimating ? "main page-animating" : "main"}
        style={{ transform: `translate3d(${dragX}px, 0, 0)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={settlePage}
      >
        <Outlet />
      </main>
      {!isModeratorView ? (
        <nav className="tabbar" aria-label="Main navigation">
          <NavLink to="/map">
            <span aria-hidden="true">⌖</span>
            Map
          </NavLink>
          <NavLink to="/" end>
            <span aria-hidden="true">⌂</span>
            Home
          </NavLink>
          <NavLink to="/help">
            <span aria-hidden="true">?</span>
            Help
          </NavLink>
        </nav>
      ) : null}
    </div>
  );
}
