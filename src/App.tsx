import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PresentationProvider } from "@/contexts/PresentationContext";
import { DemoProvider } from "@/contexts/DemoContext";

// Visitor Pages
import VisitorHome from "./pages/visitor/Home";
import QueuePage from "./pages/visitor/Queue";
import MapPage from "./pages/visitor/Map";
import FacilitiesPage from "./pages/visitor/Facilities";
import AlertsPage from "./pages/visitor/Alerts";
import OrderPage from "./pages/visitor/Order";
import RegisterPage from "./pages/visitor/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAlertsPage from "./pages/admin/Alerts";
import AdminAnalyticsPage from "./pages/admin/Analytics";
import AdminQueuesPage from "./pages/admin/Queues";
import AdminSettingsPage from "./pages/admin/Settings";
import AdminOrdersPage from "./pages/admin/Orders";
import AdminCCTVPage from "./pages/admin/CCTV";
import AdminUsersPage from "./pages/admin/Users";
import AdminMapEditorPage from "./pages/admin/MapEditor";
import AdminThreatLogsPage from "./pages/admin/ThreatLogs";
import AdminPASystemPage from "./pages/admin/PASystem";
import AdminDigitalTwinPage from "./pages/admin/DigitalTwin";
import AdminLostChildPage from "./pages/admin/LostChild";
import AdminQRCheckinPage from "./pages/admin/QRCheckin";
import AdminPresentationPage from "./pages/admin/Presentation";
// Auth Pages
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <PresentationProvider>
            <DemoProvider>
              <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Visitor Routes */}
                <Route path="/" element={<VisitorHome />} />
                <Route path="/queue" element={<QueuePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/facilities" element={<FacilitiesPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/order" element={<OrderPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/queues" element={<AdminQueuesPage />} />
                <Route path="/admin/alerts" element={<AdminAlertsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/cctv" element={<AdminCCTVPage />} />
                <Route path="/admin/map-editor" element={<AdminMapEditorPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/threat-logs" element={<AdminThreatLogsPage />} />
                <Route path="/admin/pa-system" element={<AdminPASystemPage />} />
                <Route path="/admin/digital-twin" element={<AdminDigitalTwinPage />} />
                <Route path="/admin/lost-child" element={<AdminLostChildPage />} />
                <Route path="/admin/qr-checkin" element={<AdminQRCheckinPage />} />
                <Route path="/admin/presentation" element={<AdminPresentationPage />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
              </TooltipProvider>
            </DemoProvider>
          </PresentationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
