import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FundingCatalogue from "./pages/FundingCatalogue";
import OpportunityDetail from "./pages/OpportunityDetail";
import EligibilityWizard from "./pages/EligibilityWizard";
import UserDashboard from "./pages/UserDashboard";
import Applications from "./pages/Applications";
import ApplicationWorkspace from "./pages/ApplicationWorkspace";
import Admin from "./pages/Admin";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/funding"} component={FundingCatalogue} />
      <Route path={"/funding/:slug/assessment"} component={EligibilityWizard} />
      <Route path={"/funding/:slug"} component={OpportunityDetail} />
      <Route path={"/dashboard"} component={UserDashboard} />
      <Route path={"/applications"} component={Applications} />
      <Route path={"/applications/:id"} component={ApplicationWorkspace} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
