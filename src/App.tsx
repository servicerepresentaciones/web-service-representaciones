import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Index from "./pages/Index";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import Nosotros from "./pages/Nosotros";
import Contacto from "./pages/Contacto";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminSliders from "./pages/AdminSliders";
import AdminCategories from "./pages/AdminCategories";
import AdminBrands from "./pages/AdminBrands";
import AdminProducts from "./pages/AdminProducts";
import AdminServices from "./pages/AdminServices";
import AdminCTA from "./pages/AdminCTA";
import AdminContact from "./pages/AdminContact";
import AdminLeads from "./pages/AdminLeads";
import AdminFooter from "./pages/AdminFooter";
import AdminSocial from "./pages/AdminSocial";
import AdminSEO from "./pages/AdminSEO";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import ProductDetail from "./pages/ProductDetail";
import ServiceDetail from "./pages/ServiceDetail";
import NotFound from "./pages/NotFound";
import SEOManager from "./components/SEOManager";
import PageLoading from "./components/PageLoading";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const App = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('logo_url_dark')
          .single();

        if (data?.logo_url_dark) {
          // Precargar la imagen antes de establecer el estado
          const img = new Image();
          img.onload = () => {
            setLogoUrl(data.logo_url_dark);
          };
          img.onerror = () => {
            console.error('Error loading logo');
            setLogoUrl(null);
          };
          img.src = data.logo_url_dark;
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchSettings();

    const handleSeoReady = () => {
      // Small delay for better UX
      setTimeout(() => setIsAppLoading(false), 800);
    };
    window.addEventListener('seo-ready', handleSeoReady);
    return () => window.removeEventListener('seo-ready', handleSeoReady);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {isAppLoading && <PageLoading key="page-loader" logoUrl={logoUrl} />}
        </AnimatePresence>
        <SEOManager />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/servicios/:id" element={<ServiceDetail />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/productos/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute>
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute>
                  <AdminServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/brands"
              element={
                <ProtectedRoute>
                  <AdminBrands />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sliders"
              element={
                <ProtectedRoute>
                  <AdminSliders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cta"
              element={
                <ProtectedRoute>
                  <AdminCTA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contact-info"
              element={
                <ProtectedRoute>
                  <AdminContact />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute>
                  <AdminLeads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/footer"
              element={
                <ProtectedRoute>
                  <AdminFooter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/social"
              element={
                <ProtectedRoute>
                  <AdminSocial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/seo"
              element={
                <ProtectedRoute>
                  <AdminSEO />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
