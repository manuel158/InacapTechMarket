import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../services/api.js';
import { useAuth } from '../app/AuthContext.jsx';
import { AuthLayout, Feedback } from '../components/SiteLayout.jsx';

function AuthCard({ eyebrow, title, children }) {
  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6 col-xl-5">
        <section className="card shadow-lg">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <p className="text-uppercase text-danger fw-bold mb-2">{eyebrow}</p>
              <h1 className="h2 card-title">{title}</h1>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiPost('/api/auth/login', {
        correo: form.get('correo').trim(),
        password: form.get('password')
      });
      signIn(data);
      navigate(location.state?.from?.pathname || '/productos', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard eyebrow="Nos alegra verte" title="Iniciar sesión">
        <p className="text-center text-muted">Accede para publicar y administrar tus productos.</p>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="login-email">Correo institucional</label>
            <input className="form-control" id="login-email" name="correo" type="email" autoComplete="email" required />
          </div>
          <div className="mb-4">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input className="form-control" id="login-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary btn-lg w-100" disabled={busy}>
            {busy ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
        <Feedback error={error} />
        <p className="text-center mt-3 mb-0">
          <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-center text-muted mt-3 mb-0">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const today = new Date();
  const maxBirthDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  async function register(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiPost('/api/auth/registro', {
        nombre: form.get('nombre').trim(),
        correo: form.get('correo').trim(),
        password: form.get('password'),
        whatsapp: form.get('whatsapp').trim(),
        tipoIntegrante: form.get('tipoIntegrante'),
        sede: form.get('sede'),
        sexo: form.get('sexo'),
        fechaNacimiento: form.get('fechaNacimiento')
      });
      setPending(true);
      setSuccess(data.mensaje);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiPost('/api/auth/verificar', { codigo: form.get('codigo').trim() });
      setPending(false);
      setSuccess(data.mensaje || 'Usuario creado correctamente. Ya puedes iniciar sesión.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard eyebrow="Únete a la comunidad" title="Crear cuenta">
        <p className="text-center text-muted">Regístrate para publicar y conectar con la comunidad INACAP.</p>
        {!pending && (
          <form onSubmit={register}>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-name">Nombre</label>
              <input className="form-control" id="register-name" name="nombre" autoComplete="name" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-email">Correo institucional</label>
              <input className="form-control" id="register-email" name="correo" type="email" placeholder="usuario@inacapmail.cl" autoComplete="email" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-whatsapp">WhatsApp (opcional)</label>
              <input className="form-control" id="register-whatsapp" name="whatsapp" type="tel" autoComplete="tel" />
              <div className="form-text">Tu número se mantendrá privado y no aparecerá en tu perfil público.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-member-type">Tipo de integrante</label>
              <select className="form-select" id="register-member-type" name="tipoIntegrante" required defaultValue="">
                <option value="">Seleccione</option>
                <option value="estudiante">Estudiante</option>
                <option value="profesor">Profesor</option>
                <option value="funcionario">Funcionario</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-campus">Sede</label>
              <select className="form-select" id="register-campus" name="sede" required defaultValue="">
                <option value="">Seleccione</option>
                <option value="Valdivia">Valdivia</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-sex">Sexo (opcional)</label>
              <select className="form-select" id="register-sex" name="sexo" defaultValue="">
                <option value="">Seleccione / prefiero no decirlo</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-birth-date">Fecha de nacimiento</label>
              <input className="form-control" id="register-birth-date" name="fechaNacimiento" type="date" autoComplete="bday" max={maxBirthDate} required />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="register-password">Contraseña</label>
              <input className="form-control" id="register-password" name="password" type="password" autoComplete="new-password" required />
            </div>
            <button className="btn btn-primary btn-lg w-100" disabled={busy}>
              {busy ? 'Enviando…' : 'Registrarse'}
            </button>
          </form>
        )}
        {pending && (
          <form onSubmit={verify}>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-code">Código de verificación</label>
              <input className="form-control" id="register-code" name="codigo" autoComplete="one-time-code" required />
            </div>
            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Verificando…' : 'Verificar cuenta'}
            </button>
          </form>
        )}
        <Feedback error={error} success={success} />
        <p className="text-center text-muted mt-4 mb-0">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}

export function PasswordRecoveryPage() {
  const [params, setParams] = useSearchParams();
  const [token] = useState(() => params.get('token'));
  const [resetToken, setResetToken] = useState(token);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const queryToken = params.get('token');
    if (queryToken) {
      setResetToken(queryToken);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (resetToken && form.get('password') !== form.get('confirmPassword')) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setBusy(true);
    try {
      const data = resetToken
        ? await apiPost('/api/auth/restablecer-password', {
            token: resetToken,
            password: form.get('password')
          })
        : await apiPost('/api/auth/recuperar-password', {
            correo: form.get('correo').trim()
          });
      setSuccess(data.mensaje);
      if (resetToken) formElement.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        eyebrow="Recuperación de cuenta"
        title={resetToken ? 'Crear nueva contraseña' : 'Recuperar contraseña'}
      >
        <p className="text-center text-muted">
          {resetToken ? 'Elige una contraseña nueva para tu cuenta.' : 'Ingresa tu correo y te enviaremos un enlace para cambiarla.'}
        </p>
        <form onSubmit={submit}>
          {!resetToken && (
            <div className="mb-3">
              <label className="form-label" htmlFor="recovery-email">Correo institucional</label>
              <input className="form-control" id="recovery-email" name="correo" type="email" autoComplete="email" required />
            </div>
          )}
          {resetToken && (
            <>
              <div className="mb-3">
                <label className="form-label" htmlFor="new-password">Nueva contraseña</label>
                <input className="form-control" id="new-password" name="password" type="password" minLength={8} autoComplete="new-password" required />
                <div className="form-text">Debe tener al menos 8 caracteres.</div>
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="confirm-password">Confirmar contraseña</label>
                <input className="form-control" id="confirm-password" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
              </div>
            </>
          )}
          <button className="btn btn-primary btn-lg w-100" disabled={busy}>
            {busy ? 'Procesando…' : resetToken ? 'Cambiar contraseña' : 'Enviar enlace'}
          </button>
        </form>
        <Feedback error={error} success={success} />
        <p className="text-center mt-4 mb-0"><Link to="/login">Volver a iniciar sesión</Link></p>
      </AuthCard>
    </AuthLayout>
  );
}
