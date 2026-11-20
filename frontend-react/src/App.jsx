import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from './app/RouteGuards.jsx';

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const ConversationPage = lazy(() => import('./pages/ChatPages.jsx').then(module => ({
  default: module.ConversationPage
})));
const ConversationsPage = lazy(() => import('./pages/ChatPages.jsx').then(module => ({
  default: module.ConversationsPage
})));
const LoginPage = lazy(() => import('./pages/AuthPages.jsx').then(module => ({
  default: module.LoginPage
})));
const PasswordRecoveryPage = lazy(() => import('./pages/AuthPages.jsx').then(module => ({
  default: module.PasswordRecoveryPage
})));
const RegisterPage = lazy(() => import('./pages/AuthPages.jsx').then(module => ({
  default: module.RegisterPage
})));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const SafetyTipsPage = lazy(() => import('./pages/SafetyTipsPage.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const MyListingsPage = lazy(() => import('./pages/ProductPages.jsx').then(module => ({
  default: module.MyListingsPage
})));
const ProductDetailPage = lazy(() => import('./pages/ProductPages.jsx').then(module => ({
  default: module.ProductDetailPage
})));
const ProductFormPage = lazy(() => import('./pages/ProductPages.jsx').then(module => ({
  default: module.ProductFormPage
})));
const ProductsPage = lazy(() => import('./pages/ProductPages.jsx').then(module => ({
  default: module.ProductsPage
})));

function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}

export default function App() {
  return (
    <Suspense fallback={<main className="container py-5 text-center" role="status">Cargando página…</main>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/consejos-trueque" element={<SafetyTipsPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/recuperar-password" element={<PasswordRecoveryPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/productos/:id" element={<ProductDetailPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/mensajes" element={<ConversationsPage />} />
          <Route path="/mensajes/:id" element={<ConversationPage />} />
          <Route path="/mis-publicaciones" element={<MyListingsPage />} />
          <Route path="/publicar" element={<ProductFormPage />} />
          <Route path="/publicar/:id/editar" element={<ProductFormPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
