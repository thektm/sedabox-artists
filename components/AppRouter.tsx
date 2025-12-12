import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Verify from "./Verify";
import ForgotPassword from "./ForgotPassword";
import Songs from "./Songs";
import Albums from "./Albums";
import Analytics from "./Analytics";
import Financial from "./Financial";
import Settings from "./Settings";
import AppShell from "./AppShell";
import SplashScreen from "./SplashScreen";
import ArtistVerificationModal from "./verification/ArtistVerificationModal";
import PendingVerificationModal from "./verification/PendingVerificationModal";
import SongDetail from "./SongDetail";
import AlbumDetail from "./AlbumDetail";

const AppRouter: React.FC = () => {
  const { currentPage, currentParams, navigateTo } = useNavigation();
  const {
    isLoggedIn,
    isInitializing,
    verificationStatus,
    showVerificationModal,
    submitVerification,
    user,
  } = useAuth();

  // Determine active page (handle fallback to home if on auth page but logged in)
  const activePage =
    isLoggedIn &&
    ["login", "register", "verify", "forgot-password"].includes(currentPage)
      ? "home"
      : currentPage;

  // Sync NavigationContext with activePage if they differ (e.g. redirecting from login to home)
  useEffect(() => {
    if (activePage !== currentPage) {
      navigateTo(activePage, currentParams);
    }
  }, [activePage, currentPage, currentParams, navigateTo]);

  // Keep track of visited pages to lazy load them
  const [visitedPages, setVisitedPages] = useState<Set<string>>(new Set());

  // Keep track of last details params to keep the page alive in background
  const lastDetailsParams = useRef<any>(null);

  useEffect(() => {
    setVisitedPages((prev) => {
      if (prev.has(activePage)) return prev;
      const newSet = new Set(prev);
      newSet.add(activePage);
      return newSet;
    });

    if (activePage === "details" && currentParams) {
      lastDetailsParams.current = currentParams;
    }
  }, [activePage, currentParams]);

  // Show splash screen while determining auth status
  if (isInitializing) {
    return <SplashScreen />;
  }

  // Auth screens - always accessible (no AppShell)
  if (!isLoggedIn) {
    switch (currentPage) {
      case "login":
        return <Login />;
      case "register":
        return <Register />;
      case "verify":
        return <Verify />;
      case "forgot-password":
        return <ForgotPassword />;
      default:
        return <Login />; // Default to login
    }
  }

  const renderPageContainer = (pageId: string, content: React.ReactNode) => {
    // If the page has never been visited and is not current, don't render it yet
    if (!visitedPages.has(pageId) && activePage !== pageId) {
      return null;
    }

    const isActive = activePage === pageId;

    return (
      <div
        key={pageId}
        style={{
          display: isActive ? "block" : "none",
          height: "100%",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {content}
      </div>
    );
  };

  const getDetailsContent = () => {
    const params =
      activePage === "details" ? currentParams : lastDetailsParams.current;
    if (!params) return null;

    if (params.type === "song") {
      return <SongDetail songId={params.id} />;
    }
    if (params.type === "album") {
      return <AlbumDetail albumId={params.id} />;
    }
    return (
      <div>
        Details Screen for {params.type} id: {params.id}
      </div>
    );
  };

  return (
    <>
      <AppShell>
        {renderPageContainer("home", <Home />)}
        {renderPageContainer("songs", <Songs />)}
        {renderPageContainer("albums", <Albums />)}
        {renderPageContainer("analytics", <Analytics />)}
        {renderPageContainer("financial", <Financial />)}
        {renderPageContainer("settings", <Settings />)}
        {renderPageContainer("search", <div>Search Screen</div>)}
        {renderPageContainer("playlists", <div>Playlists Screen</div>)}
        {renderPageContainer("profile", <div>Profile Screen</div>)}
        {renderPageContainer("details", getDetailsContent())}
        {renderPageContainer("lists", <div>Lists Screen</div>)}
        {renderPageContainer("payments", <div>Payments Screen</div>)}
      </AppShell>

      {/* Artist Verification Modal - Non-skippable for first-time users */}
      {showVerificationModal && verificationStatus === "none" && (
        <ArtistVerificationModal onSubmit={submitVerification} />
      )}

      {/* Pending Verification Modal - Non-skippable */}
      {verificationStatus === "pending" && (
        <PendingVerificationModal
          verificationType={user?.verificationType || "new"}
          artistName={user?.verificationData?.artistName}
        />
      )}
    </>
  );
};

export default AppRouter;
