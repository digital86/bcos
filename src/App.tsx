import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import { VisualEditorProvider } from "./components/admin/VisualEditorContext";
import { ChatBot } from "./components/ChatBot";
import ProtectedRoute from "./components/admin/ProtectedRoute";

// Lazy load all pages to improve initial JS execution time
const Index = lazy(() => import("./pages/Index"));
const OurTrainer = lazy(() => import("./pages/OurTrainer"));
const Consultation = lazy(() => import("./pages/Consultation"));
const IntraEnterprise = lazy(() => import("./pages/IntraEnterprise"));
const Formations = lazy(() => import("./pages/Formations"));
const Blog = lazy(() => import("./pages/Blog"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Users = lazy(() => import("./pages/admin/Users"));
const CoursesFixed = lazy(() => import("./pages/admin/CoursesFixed"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const References = lazy(() => import("./pages/admin/References"));
const EnrollmentsCRM = lazy(() => import("./pages/admin/EnrollmentsCRM"));
const EventRequests = lazy(() => import("./pages/admin/EventRequests"));
const TrainerManagement = lazy(() => import("./pages/admin/TrainerManagement"));
const Login = lazy(() => import("./pages/admin/Login"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Calendar = lazy(() => import("./pages/admin/Calendar"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Facturation = lazy(() => import("./pages/admin/Facturation"));
const MediaManagement = lazy(() => import("./pages/admin/MediaManagement"));
const AgendaManagement = lazy(() => import("./pages/admin/AgendaManagement"));
const BilingualCourseDetail = lazy(() => import("./pages/BilingualCourseDetail"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Evenements = lazy(() => import("./pages/Evenements"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const BlogArticleDetail = lazy(() => import("./pages/BlogArticleDetail"));
const BlogAI = lazy(() => import("./pages/admin/BlogAI"));
const BlogAutomation = lazy(() => import("./pages/admin/BlogAutomation"));
const Actualite = lazy(() => import("./pages/Actualite"));
const ActualiteManagement = lazy(() => import("./pages/admin/ActualiteManagement"));
const ActualiteDetail = lazy(() => import("./pages/ActualiteDetail"));
const About = lazy(() => import("./pages/About"));
const CategoryFormations = lazy(() => import("./pages/CategoryFormations"));
const ProjectAccelerator = lazy(() => import("./pages/ProjectAccelerator"));

const queryClient = new QueryClient();

// Helper to render page with Header and Footer
const Page = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <PageLoader />
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
    <Footer />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChatBot />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PageLoader />
        <VisualEditorProvider>
          <ScrollToTop />
          <Routes>
            {["", "/editor"].map((prefix) => (
              <Route key={prefix} path={prefix}>
                <Route index element={<Page><Index /></Page>} />
                
                {/* French Routes */}
                <Route path="fr" element={<Page><Index /></Page>} />
                <Route path="fr/our-trainer" element={<Page><OurTrainer /></Page>} />
                <Route path="fr/consultation" element={<Page><Consultation /></Page>} />
                <Route path="fr/consultation-et-accompagnement-sur-le-terrain" element={<Page><Consultation /></Page>} />
                <Route path="fr/formations-intra" element={<Page><IntraEnterprise /></Page>} />
                <Route path="fr/formations" element={<Page><Formations /></Page>} />
                <Route path="fr/nos-formations" element={<Page><Formations /></Page>} />
                <Route path="fr/formations/category/:slug" element={<Page><CategoryFormations /></Page>} />
                <Route path="fr/blog" element={<Page><Blog /></Page>} />
                <Route path="fr/blog/:slug" element={<Page><BlogArticleDetail /></Page>} />
                <Route path="fr/agenda" element={<Page><Agenda /></Page>} />
                <Route path="fr/evenements" element={<Page><Evenements /></Page>} />
                <Route path="fr/organisation-devenements-et-de-demonstrations" element={<Page><Evenements /></Page>} />
                <Route path="fr/actualite" element={<Page><Actualite /></Page>} />
                <Route path="fr/actualite/:id" element={<Page><ActualiteDetail /></Page>} />
                <Route path="fr/qui-sommes-nous" element={<Page><About /></Page>} />
                <Route path="fr/formation/:slug" element={<Page><BilingualCourseDetail /></Page>} />
                <Route path="fr/accelerateur-de-projets" element={<Page><ProjectAccelerator /></Page>} />

                {/* Arabic Routes */}
                <Route path="ar" element={<Page><Index /></Page>} />
                <Route path="ar/our-trainer" element={<Page><OurTrainer /></Page>} />
                <Route path="ar/consultation" element={<Page><Consultation /></Page>} />
                <Route path="ar/consultation-et-accompagnement-sur-le-terrain" element={<Page><Consultation /></Page>} />
                <Route path="ar/formations-intra" element={<Page><IntraEnterprise /></Page>} />
                <Route path="ar/formations" element={<Page><Formations /></Page>} />
                <Route path="ar/nos-formations" element={<Page><Formations /></Page>} />
                <Route path="ar/formations/category/:slug" element={<Page><CategoryFormations /></Page>} />
                <Route path="ar/blog" element={<Page><Blog /></Page>} />
                <Route path="ar/blog/:slug" element={<Page><BlogArticleDetail /></Page>} />
                <Route path="ar/agenda" element={<Page><Agenda /></Page>} />
                <Route path="ar/evenements" element={<Page><Evenements /></Page>} />
                <Route path="ar/organisation-devenements-et-de-demonstrations" element={<Page><Evenements /></Page>} />
                <Route path="ar/actualite" element={<Page><Actualite /></Page>} />
                <Route path="ar/actualite/:id" element={<Page><ActualiteDetail /></Page>} />
                <Route path="ar/qui-sommes-nous" element={<Page><About /></Page>} />
                <Route path="ar/formation/:slug" element={<Page><BilingualCourseDetail /></Page>} />
                <Route path="ar/accelerateur-de-projets" element={<Page><ProjectAccelerator /></Page>} />

                {/* Common paths */}
                <Route path="consultation" element={<Page><Consultation /></Page>} />
                <Route path="formations-intra" element={<Page><IntraEnterprise /></Page>} />
                <Route path="formations" element={<Page><Formations /></Page>} />
                <Route path="blog" element={<Page><Blog /></Page>} />
                <Route path="agenda" element={<Page><Agenda /></Page>} />
                <Route path="evenements" element={<Page><Evenements /></Page>} />
                <Route path="actualite" element={<Page><Actualite /></Page>} />
                <Route path="formation/:slug" element={<Page><BilingualCourseDetail /></Page>} />
                <Route path="accelerateur-de-projets" element={<Page><ProjectAccelerator /></Page>} />
              </Route>
            ))}

            {/* Admin routes */}
            <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Users /></Suspense></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><CoursesFixed /></Suspense></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Categories /></Suspense></ProtectedRoute>} />
            <Route path="/admin/references" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><References /></Suspense></ProtectedRoute>} />
            <Route path="/admin/enrollments" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><EnrollmentsCRM /></Suspense></ProtectedRoute>} />
            <Route path="/admin/media" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><MediaManagement /></Suspense></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Settings /></Suspense></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Messages /></Suspense></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Analytics /></Suspense></ProtectedRoute>} />
            <Route path="/admin/facturation" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><Facturation /></Suspense></ProtectedRoute>} />
            <Route path="/admin/event-requests" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><EventRequests /></Suspense></ProtectedRoute>} />
            <Route path="/admin/blog-ai" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><BlogAI /></Suspense></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><BlogManagement /></Suspense></ProtectedRoute>} />
            <Route path="/admin/actualite" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><ActualiteManagement /></Suspense></ProtectedRoute>} />
            <Route path="/admin/agenda" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><AgendaManagement /></Suspense></ProtectedRoute>} />
            
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
        </VisualEditorProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
