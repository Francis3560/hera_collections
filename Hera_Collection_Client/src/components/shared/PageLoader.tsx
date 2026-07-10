import { OrbitProgress } from "react-loading-indicators";

// Suspense fallback shown while a lazy-loaded route chunk downloads. Mirrors
// the loading UI already used in ProtectedRoute for visual consistency.
export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop">
    <div className="text-center space-y-4">
      <OrbitProgress
        color="hsl(var(--primary))"
        size="medium"
        text=""
        textColor=""
      />
    </div>
  </div>
);
