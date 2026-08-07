import React, { useEffect } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Verify from "./Verify";
import ForgotPassword from "./ForgotPassword";
import Songs from "./Songs";
import Albums from "./Albums";
import Releases from "./Releases";
import ReleaseComposer from "./ReleaseComposer";
import Analytics from "./Analytics";
import Financial from "./Financial";
import Settings from "./Settings";
import AppShell from "./AppShell";
import SplashScreen from "./SplashScreen";
import ArtistVerificationModal from "./verification/ArtistVerificationModal";
import PendingVerificationModal from "./verification/PendingVerificationModal";
import SongDetail from "./SongDetail";
import AlbumDetail from "./AlbumDetail";
import TermsAndConditions from "./TermsAndConditions";

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

  // Always unmount inactive pages so they remount from scratch on navigation
  const renderPageContainer = (pageId: string, content: React.ReactNode) => {
    if (activePage !== pageId) return null;

    return (
      <div
        key={pageId}
        style={{
          display: "block",
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
    if (activePage !== "details" || !currentParams) return null;
    const params = currentParams;
    if (params.type === "song") {
      return <SongDetail key={`song-${params.id}-${params.edit ? "edit" : "view"}`} songId={params.id} initialEdit={Boolean(params.edit)} />;
    }
    if (params.type === "album") {
      return <AlbumDetail albumId={params.id} initialEdit={params.edit} />;
    }
    return (
      <div>
        صفحه جزئیات {params.type} شناسه: {params.id}
      </div>
    );
  };

  return (
    <>
      <AppShell>
        {renderPageContainer("home", <Home />)}
        {renderPageContainer("songs", <Songs />)}
        {renderPageContainer("releases", <Releases />)}
        {renderPageContainer(
          "release-composer",
          currentParams?.id ? <ReleaseComposer key={`release-${currentParams.id}-${currentParams.trackId || "root"}`} releaseId={String(currentParams.id)} focusTrackId={currentParams.trackId ? Number(currentParams.trackId) : undefined} /> : <Releases />,
        )}
        {renderPageContainer("albums", <Albums />)}
        {renderPageContainer("analytics", <Analytics />)}
        {renderPageContainer("financial", <Financial />)}
        {renderPageContainer("settings", <Settings />)}
        {renderPageContainer("terms", <TermsAndConditions />)}
        {renderPageContainer("search", <div>صفحه جست‌وجو</div>)}
        {renderPageContainer("playlists", <div>صفحه فهرست‌های پخش</div>)}
        {renderPageContainer("profile", <div>صفحه پروفایل</div>)}
        {renderPageContainer("details", getDetailsContent())}
        {renderPageContainer("lists", <div>صفحه فهرست‌ها</div>)}
        {renderPageContainer("payments", <div>صفحه پرداخت‌ها</div>)}
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
