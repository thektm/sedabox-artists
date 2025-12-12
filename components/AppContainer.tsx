import React from "react";
import { NavigationProvider } from "../contexts/NavigationContext";
import { AuthProvider } from "../contexts/AuthContext";
import AppRouter from "./AppRouter";

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
      <PlayerProvider>
        <ResponsiveLayoutProvider>
          <NavigationProvider>
            <AppRouter />
          </NavigationProvider>
        </ResponsiveLayoutProvider>
      </PlayerProvider>
    </AuthProvider>
  );
};

export default AppContainer;
