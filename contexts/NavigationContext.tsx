import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface NavigationContextType {
  currentPage: string;
  currentParams: Record<string, any>;
  previousPage: string;
  previousParams: Record<string, any>;
  visibilityMap: Record<string, boolean>;
  navigateTo: (page: string, params?: Record<string, any>) => void;
  goBack: () => void;
  setComponentVisibility: (component: string, visible: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState("login");
  const [currentParams, setCurrentParams] = useState<Record<string, any>>({});
  const [previousPage, setPreviousPage] = useState("");
  const [previousParams, setPreviousParams] = useState<Record<string, any>>({});
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({
    "bottom-navbar": true,
    sidebar: true,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});

  const navigateTo = (page: string, params: Record<string, any> = {}) => {
    // Save current scroll position
    if (scrollContainerRef.current) {
      const key = `${currentPage}-${JSON.stringify(currentParams)}`;
      scrollPositions.current[key] = scrollContainerRef.current.scrollTop;
    }

    setPreviousPage(currentPage);
    setPreviousParams(currentParams);
    setCurrentPage(page);
    setCurrentParams(params);

    // Restore scroll position after navigation
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const key = `${page}-${JSON.stringify(params)}`;
        const savedScroll = scrollPositions.current[key];
        if (savedScroll !== undefined) {
          scrollContainerRef.current.scrollTop = savedScroll;
        } else {
          scrollContainerRef.current.scrollTop = 0;
        }
      }
    }, 0);
  };

  const goBack = () => {
    if (previousPage) {
      navigateTo(previousPage, previousParams);
    }
  };

  const setComponentVisibility = (component: string, visible: boolean) => {
    setVisibilityMap((prev) => ({ ...prev, [component]: visible }));
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        currentParams,
        previousPage,
        previousParams,
        visibilityMap,
        navigateTo,
        goBack,
        setComponentVisibility,
        scrollContainerRef,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
