import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import AdminScripts from "./pages/AdminScripts";
import AdminNosotros from "./pages/AdminNosotros";
import AdminBlog from "./pages/AdminBlog";
import AdminCallCenter from "./pages/AdminCallCenter";
import AdminLegal from "./pages/AdminLegal";
import AdminComplaints from "./pages/AdminComplaints";
import AdminEmailSettings from "./pages/AdminEmailSettings";
import Blog from "./pages/Blog";
import LibroReclamaciones from "./pages/LibroReclamaciones";
import BlogPost from "./pages/BlogPost";
import Legal from "./pages/Legal";
import ThankYou from "./pages/ThankYou";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import ProductDetail from "./pages/ProductDetail";
import ServiceDetail from "./pages/ServiceDetail";
import NotFound from "./pages/NotFound";
import SEOManager from "./components/SEOManager";
import ScriptManager from "./components/ScriptManager";
import PageLoading from "./components/PageLoading";
import FloatingCallCenter from "./components/FloatingCallCenter";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const NavigationLoader = ({ logoUrl }: { logoUrl: string | null }) => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(!window.location.pathname.startsWith('/admin'));

  useEffect(() => {
    // Si es una ruta de administración, no mostramos el loader
    if (location.pathname.startsWith('/admin')) {
      setIsNavigating(false);
      window.scrollTo(0, 0);
      return;
    }

    setIsNavigating(true);
    window.scrollTo(0, 0); // Scroll to top immediately on route change
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {isNavigating && !location.pathname.startsWith('/admin') && (
        <PageLoading key="page-loader" logoUrl={logoUrl} />
      )}
    </AnimatePresence>
  );
};

const App = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('logo_url_dark')
          .single();

        if (data?.logo_url_dark) {
          setLogoUrl(data.logo_url_dark);
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <NavigationLoader logoUrl={logoUrl} />
          <SEOManager />
          <ScriptManager />
          <FloatingCallCenter />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/servicios/:slug" element={<ServiceDetail />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/libro-de-reclamaciones" element={<LibroReclamaciones />} />
            <Route path="/gracias" element={<ThankYou />} />
            <Route path="/productos/:slug" element={<ProductDetail />} />
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
            <Route
              path="/admin/scripts"
              element={
                <ProtectedRoute>
                  <AdminScripts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/nosotros"
              element={
                <ProtectedRoute>
                  <AdminNosotros />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blog"
              element={
                <ProtectedRoute>
                  <AdminBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/call-center"
              element={
                <ProtectedRoute>
                  <AdminCallCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/legal"
              element={
                <ProtectedRoute>
                  <AdminLegal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute>
                  <AdminComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-settings"
              element={
                <ProtectedRoute>
                  <AdminEmailSettings />
                </ProtectedRoute>
              }
            />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
