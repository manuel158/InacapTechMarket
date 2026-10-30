import { Link, Route, Routes } from 'react-router-dom';
import { RequireAdmin, RequireAuth } from './app/RouteGuards.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { ConversationPage, ConversationsPage } from './pages/ChatPages.jsx';
import {
  LoginPage,
  PasswordRecoveryPage,
  RegisterPage
} from './pages/AuthPages.jsx';
import HomePage from './pages/HomePage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import {
  MyListingsPage,
  ProductDetailPage,
  ProductFormPage,
  ProductsPage
} from './pages/ProductPages.jsx';

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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/terminos" element={<TermsPage />} />
      <Route path="/recuperar-password" element={<PasswordRecoveryPage />} />
      <Route path="/productos" element={<ProductsPage />} />
      <Route path="/productos/:id" element={<ProductDetailPage />} />
      <Route element={<RequireAuth />}>
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
  );
}
