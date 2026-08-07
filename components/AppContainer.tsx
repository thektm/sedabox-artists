import React from "react";
import { NavigationProvider } from "../contexts/NavigationContext";
import { AuthProvider } from "../contexts/AuthContext";
import { LiveListenersProvider } from "../contexts/LiveListenersContext";
import AppRouter from "./AppRouter";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ImageCropperProvider } from "../contexts/ImageCropperContext";

// Stub providers
const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
const ResponsiveLayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const AppContainer: React.FC = () => {
  return (
    <AuthProvider>
      <LiveListenersProvider>
        <PlayerProvider>
          <ResponsiveLayoutProvider>
            <ToastProvider>
              <ImageCropperProvider>
                <NotificationProvider>
                  <NavigationProvider>
                    <AppRouter />
                  </NavigationProvider>
                </NotificationProvider>
              </ImageCropperProvider>
            </ToastProvider>
          </ResponsiveLayoutProvider>
        </PlayerProvider>
      </LiveListenersProvider>
    </AuthProvider>
  );
};

export default AppContainer;
