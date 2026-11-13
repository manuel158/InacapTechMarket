import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext.jsx';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import { apiRequest } from '../services/api.js';

const profileFields = [
  ['Nombre', 'nombre'],
  ['Correo', 'correo'],
  ['Tipo de integrante', 'tipoIntegrante'],
  ['Sede', 'sede'],
  ['Sexo', 'sexo'],
  ['WhatsApp', 'whatsapp']
];

export default function ProfilePage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest('/api/auth/perfil')
      .then(setProfile)
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function deactivateAccount(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await apiRequest('/api/auth/cuenta', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      signOut();
      navigate('/login', {
        replace: true,
        state: { notice: result.mensaje }
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <main className="container py-4">
        <h1 className="mb-4">Mi perfil</h1>
        {loading && <p role="status">Cargando perfil…</p>}
        <Feedback error={error} />
        {!loading && profile && (
          <>
            <section className="card shadow-sm mb-4">
              <div className="card-header">
                <h2 className="h5 mb-0">Datos de la cuenta</h2>
              </div>
              <dl className="card-body row mb-0">
                {profileFields.map(([label, field]) => (
                  <div className="col-md-6 mb-3" key={field}>
                    <dt>{label}</dt>
                    <dd className="mb-0">
                      {profile[field] || (field === 'whatsapp' ? 'No informado' : 'No especificado')}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="card-footer text-muted">
                Por privacidad, la fecha de nacimiento no se muestra y el número de WhatsApp aparece parcialmente oculto.
              </div>
            </section>

            <section className="card border-danger">
              <div className="card-header text-danger">
                <h2 className="h5 mb-0">Dar de baja mi cuenta</h2>
              </div>
              <div className="card-body">
                <p>
                  La cuenta quedará desactivada y no podrás iniciar sesión. Tus publicaciones se ocultarán y el historial de conversaciones se conservará mostrando «Usuario eliminado». Para solicitar la reactivación, contacta a administración.
                </p>
                <form onSubmit={deactivateAccount}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="deactivate-password">
                      Confirma tu contraseña
                    </label>
                    <input
                      className="form-control"
                      id="deactivate-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      id="deactivate-confirm"
                      type="checkbox"
                      checked={confirmed}
                      onChange={event => setConfirmed(event.target.checked)}
                      required
                    />
                    <label className="form-check-label" htmlFor="deactivate-confirm">
                      Entiendo que mi cuenta se desactivará y mis publicaciones dejarán de estar visibles.
                    </label>
                  </div>
                  <button className="btn btn-danger" type="submit" disabled={busy || !confirmed}>
                    {busy ? 'Desactivando…' : 'Desactivar cuenta'}
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>
    </SiteLayout>
  );
}
