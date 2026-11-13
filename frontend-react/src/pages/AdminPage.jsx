import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiDelete, apiRequest } from '../services/api.js';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import { getProductCategory } from '../utils/categories.js';
import { Link } from 'react-router-dom';

const publicationStatuses = ['aprobada', 'pendiente', 'rechazada', 'pausada'];

function isWithinRange(value, start, end) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) &&
    date >= new Date(`${start}T00:00:00`) &&
    date <= new Date(`${end}T23:59:59.999`);
}

function getPublicationStatus(product) {
  return publicationStatuses.includes(product.estado) ? product.estado : 'aprobada';
}

function formatPercent(value, total) {
  return total
    ? `${((value / total) * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`
    : 'Sin total actual';
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getActivityPeriod(start, end) {
  const firstDay = new Date(`${start}T00:00:00`);
  const lastDay = new Date(`${end}T00:00:00`);
  const dayCount = Math.floor((lastDay - firstDay) / 86400000) + 1;
  if (dayCount <= 31) return 'day';
  if (dayCount <= 366) return 'month';
  if (dayCount <= 1096) return 'quarter';
  return 'year';
}

function activityBucket(value, period) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  if (period === 'day') {
    return {
      key: `${year}-${month}-${String(date.getDate()).padStart(2, '0')}`,
      label: date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    };
  }
  if (period === 'month') {
    return {
      key: `${year}-${month}`,
      label: date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
    };
  }
  if (period === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return { key: `${year}-T${quarter}`, label: `T${quarter} ${year}` };
  }
  return { key: String(year), label: String(year) };
}

function buildActivityBuckets(start, end, users, products) {
  const period = getActivityPeriod(start, end);
  const buckets = new Map();
  const addRecords = (records, field) => {
    records.forEach(record => {
      if (!isWithinRange(record.createdAt, start, end)) return;
      const { key, label } = activityBucket(record.createdAt, period);
      const bucket = buckets.get(key) || { key, label, users: 0, products: 0 };
      bucket[field] += 1;
      buckets.set(key, bucket);
    });
  };

  addRecords(users, 'users');
  addRecords(products, 'products');
  return [...buckets.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function ReportBar({ label, value, total, color }) {
  const percent = total ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div className="admin-report-bar-row">
      <div className="d-flex justify-content-between gap-3 small">
        <span>{label}</span>
        <strong>{value.toLocaleString('es-CL')} / {total.toLocaleString('es-CL')} · {formatPercent(value, total)}</strong>
      </div>
      <div className="admin-report-track" role="img" aria-label={`${label}: ${value} de ${total}, ${formatPercent(value, total)}`}>
        <span className={`admin-report-fill ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActivityChart({ title, field, color, buckets }) {
  const maxValue = Math.max(0, ...buckets.map(bucket => bucket[field]));
  return (
    <div className="admin-report-activity">
      <h3>{title}</h3>
      {buckets.length ? buckets.map(bucket => (
        <div className="admin-report-activity-row" key={`${field}-${bucket.key}`}>
          <span>{bucket.label}</span>
          <div className="admin-report-track" role="img" aria-label={`${title}, ${bucket.label}: ${bucket[field]}`}>
            <span
              className={`admin-report-fill ${color}`}
              style={{ width: `${maxValue ? (bucket[field] / maxValue) * 100 : 0}%` }}
            />
          </div>
          <strong>{bucket[field].toLocaleString('es-CL')}</strong>
        </div>
      )) : (
        <p className="admin-report-empty">No se registraron datos en este período.</p>
      )}
    </div>
  );
}

function AdminReport({ report }) {
  const statusLabels = {
    aprobada: 'Aprobadas',
    pendiente: 'Pendientes',
    rechazada: 'Rechazadas',
    pausada: 'Pausadas'
  };
  const statusColors = {
    aprobada: 'green',
    pendiente: 'amber',
    rechazada: 'red',
    pausada: 'blue'
  };

  return (
    <article className="admin-report-print">
      <header className="admin-report-header">
        <div className="admin-report-brand"><span>Inacap</span><strong>Tech</strong><b>Market</b></div>
        <p>Informe estadístico de la plataforma</p>
        <h1>Actividad y publicaciones</h1>
        <div className="admin-report-period">
          Período analizado: {formatDate(report.start)} – {formatDate(report.end)}
        </div>
      </header>

      <section className="admin-report-section">
        <h2>Resumen general</h2>
        <div className="admin-report-summary-grid">
          <div className="admin-report-summary-card purple">
            <span>Cuentas activas</span>
            <strong>{report.activeUserTotal.toLocaleString('es-CL')}</strong>
            <small>{report.inactiveUserTotal.toLocaleString('es-CL')} desactivadas · {report.usersInRange.toLocaleString('es-CL')} nuevas en el período</small>
          </div>
          <div className="admin-report-summary-card blue">
            <span>Publicaciones registradas</span>
            <strong>{report.productTotal.toLocaleString('es-CL')}</strong>
            <small>{report.productsInRange.toLocaleString('es-CL')} creadas en el período</small>
          </div>
          <div className="admin-report-summary-card green">
            <span>Promedio de publicaciones por cuenta activa</span>
            <strong>{report.averageProductsPerActiveUser.toLocaleString('es-CL', { maximumFractionDigits: 1 })}</strong>
            <small>Indicador general de actividad de la plataforma</small>
          </div>
        </div>
      </section>

      <section className="admin-report-section">
        <h2>Registros del período frente al total actual</h2>
        <p className="admin-report-intro">
          El porcentaje compara los registros del período con las cuentas o publicaciones existentes actualmente.
        </p>
        <ReportBar label="Cuentas registradas" value={report.usersInRange} total={report.userTotal} color="purple" />
        <ReportBar label="Publicaciones creadas" value={report.productsInRange} total={report.productTotal} color="blue" />
        <p className="admin-report-note mt-2">
          El informe considera los registros que siguen almacenados; las cuentas o publicaciones eliminadas no están disponibles para este cálculo.
        </p>
      </section>

      <section className="admin-report-section">
        <h2>Publicaciones por estado</h2>
        <p className="admin-report-intro">
          Se muestra cuántas publicaciones actuales hay en cada estado y cuántas de ellas se crearon durante el período seleccionado.
        </p>
        {publicationStatuses.map(status => (
          <ReportBar
            key={status}
            label={`${statusLabels[status]} (creadas en el período)`}
            value={report.rangeStatuses[status]}
            total={report.currentStatuses[status]}
            color={statusColors[status]}
          />
        ))}
      </section>

      <section className="admin-report-section">
        <h2>Publicaciones por categoría</h2>
        <p className="admin-report-intro">
          Comparación entre el total actual de cada categoría y las publicaciones de esa categoría creadas durante el período.
        </p>
        {report.categories.length ? report.categories.map(category => (
          <ReportBar
            key={category.name}
            label={category.name}
            value={category.inRange}
            total={category.total}
            color="blue"
          />
        )) : (
          <p className="admin-report-empty">No hay publicaciones registradas.</p>
        )}
      </section>

      <section className="admin-report-section">
        <h2>Actividad a través del tiempo</h2>
        <p className="admin-report-intro">
          Altas de cuentas y publicaciones agrupadas por {report.activityPeriodLabel}. Los intervalos sin actividad no se muestran.
        </p>
        <div className="admin-report-activity-grid">
          <ActivityChart title="Cuentas registradas" field="users" color="purple" buckets={report.activityBuckets} />
          <ActivityChart title="Publicaciones creadas" field="products" color="blue" buckets={report.activityBuckets} />
        </div>
      </section>

      <section className="admin-report-section">
        <h2>Última revisión registrada en el período</h2>
        <div className="admin-report-review-grid">
          <div className="admin-report-review-card green">
            <span>Aprobadas</span>
            <strong>{report.reviewedApproved.toLocaleString('es-CL')}</strong>
            <small>{formatPercent(report.reviewedApproved, report.currentStatuses.aprobada)} del total aprobado actual</small>
          </div>
          <div className="admin-report-review-card red">
            <span>Rechazadas</span>
            <strong>{report.reviewedRejected.toLocaleString('es-CL')}</strong>
            <small>{formatPercent(report.reviewedRejected, report.currentStatuses.rechazada)} del total rechazado actual</small>
          </div>
        </div>
        <p className="admin-report-note">
          Las revisiones se cuentan según la fecha de la última revisión registrada y el estado actual. Si una publicación se editó o revisó nuevamente después, el historial anterior no está disponible.
        </p>
      </section>

      <footer className="admin-report-footer">
        Este informe refleja los datos actualmente almacenados y no incluye compras ni transacciones.
        <br />
        Informe generado el {new Date(report.generatedAt).toLocaleString('es-CL')}
      </footer>
    </article>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [reportStart, setReportStart] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [reportEnd, setReportEnd] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );
  const [report, setReport] = useState(null);

  async function load() {
    setError('');
    try {
      const [userData, productData] = await Promise.all([
        apiRequest('/api/admin/usuarios'),
        apiRequest('/api/admin/productos')
      ]);
      setUsers(userData);
      setProducts(productData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!report) return undefined;

    document.body.classList.add('printing-admin-report');
    const timer = window.setTimeout(() => window.print(), 150);
    const clearPrintMode = () => document.body.classList.remove('printing-admin-report');
    window.addEventListener('afterprint', clearPrintMode);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', clearPrintMode);
      clearPrintMode();
    };
  }, [report]);

  function generateReport(event) {
    event.preventDefault();
    setError('');
    if (!reportStart || !reportEnd || reportStart > reportEnd) {
      setError('Selecciona un rango de fechas válido.');
      return;
    }

    const rangeUsers = users.filter(user => isWithinRange(user.createdAt, reportStart, reportEnd));
    const rangeProducts = products.filter(product => isWithinRange(product.createdAt, reportStart, reportEnd));
    const reviewedProducts = products.filter(product =>
      isWithinRange(product.revisadoEn, reportStart, reportEnd)
    );
    const currentStatuses = Object.fromEntries(publicationStatuses.map(status => [
      status,
      products.filter(product => getPublicationStatus(product) === status).length
    ]));
    const rangeStatuses = Object.fromEntries(publicationStatuses.map(status => [
      status,
      rangeProducts.filter(product => getPublicationStatus(product) === status).length
    ]));
    const currentCategoryCounts = products.reduce((result, product) => {
      const { categoria } = getProductCategory(product);
      result[categoria] = (result[categoria] || 0) + 1;
      return result;
    }, {});
    const rangeCategoryCounts = rangeProducts.reduce((result, product) => {
      const { categoria } = getProductCategory(product);
      result[categoria] = (result[categoria] || 0) + 1;
      return result;
    }, {});
    const activeUserTotal = users.filter(user => user.activo !== false).length;
    const categories = Object.keys(currentCategoryCounts)
      .sort((left, right) => left.localeCompare(right, 'es'))
      .map(name => ({
        name,
        total: currentCategoryCounts[name],
        inRange: rangeCategoryCounts[name] || 0
      }));
    const activityPeriod = getActivityPeriod(reportStart, reportEnd);
    const activityPeriodLabels = {
      day: 'día',
      month: 'mes',
      quarter: 'trimestre',
      year: 'año'
    };

    setReport({
      start: reportStart,
      end: reportEnd,
      generatedAt: new Date().toISOString(),
      userTotal: users.length,
      activeUserTotal,
      inactiveUserTotal: users.length - activeUserTotal,
      usersInRange: rangeUsers.length,
      productTotal: products.length,
      productsInRange: rangeProducts.length,
      averageProductsPerActiveUser: activeUserTotal
        ? products.length / activeUserTotal
        : 0,
      currentStatuses,
      rangeStatuses,
      categories,
      activityBuckets: buildActivityBuckets(reportStart, reportEnd, users, products),
      activityPeriodLabel: activityPeriodLabels[activityPeriod],
      reviewedApproved: reviewedProducts.filter(product => product.estado === 'aprobada').length,
      reviewedRejected: reviewedProducts.filter(product => product.estado === 'rechazada').length
    });
  }

  async function remove(path, label) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${label}?`)) return;
    try {
      await apiDelete(path);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function reviewProduct(product, estado) {
    const motivoRechazo = estado === 'rechazada'
      ? window.prompt('Indica el motivo del rechazo (máximo 500 caracteres):')
      : '';
    if (estado === 'rechazada' && motivoRechazo === null) return;

    try {
      await apiRequest(`/api/admin/producto/${encodeURIComponent(product._id)}/revision`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivoRechazo })
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function reactivateUser(user) {
    if (!window.confirm(`¿Reactivar la cuenta de ${user.nombre}?`)) return;
    try {
      await apiRequest(`/api/admin/usuario/${encodeURIComponent(user._id)}/reactivar`, {
        method: 'PATCH'
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const categoryCounts = products.reduce((result, product) => {
    const { categoria } = getProductCategory(product);
    result[categoria] = (result[categoria] || 0) + 1;
    return result;
  }, {});
  const adminCount = users.filter(user => user.rol === 'admin').length;

  return (
    <SiteLayout>
      <main className="container mt-4 admin-dashboard">
        <h1 className="mb-4">Panel Administrador</h1>
        <Feedback error={error} />
        {loading && <p role="status">Cargando panel…</p>}
        {!loading && !error && (
          <>
            <section className="card admin-section admin-report-controls mb-4">
              <div className="card-header admin-section-header">
                <h2 className="h4 mb-0">Informe PDF por período</h2>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Compara cuentas y publicaciones del rango con los totales actuales. Se incluirán gráficos y estados de publicación.
                </p>
                <form className="row g-3 align-items-end" onSubmit={generateReport}>
                  <div className="col-sm-5 col-lg-4">
                    <label className="form-label fw-semibold" htmlFor="report-start">Desde</label>
                    <input
                      className="form-control"
                      id="report-start"
                      type="date"
                      value={reportStart}
                      max={reportEnd}
                      onChange={event => setReportStart(event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-sm-5 col-lg-4">
                    <label className="form-label fw-semibold" htmlFor="report-end">Hasta</label>
                    <input
                      className="form-control"
                      id="report-end"
                      type="date"
                      value={reportEnd}
                      min={reportStart}
                      max={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`}
                      onChange={event => setReportEnd(event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-sm-2">
                    <button className="btn btn-primary w-100" type="submit">Generar PDF</button>
                  </div>
                </form>
                <small className="d-block text-muted mt-2">
                  Se abrirá la impresión del navegador; selecciona «Guardar como PDF».
                </small>
              </div>
            </section>
            <div className="row g-3 mb-4">
              {[
                ['Total Usuarios', users.length, 'purple'],
                ['Publicaciones', products.length, 'blue'],
                ['Pendientes de revisión', products.filter(product => product.estado === 'pendiente').length, 'amber'],
                ['Administradores', adminCount, 'green'],
                ['Categorías', Object.keys(categoryCounts).length, 'pink']
              ].map(([label, value, color]) => (
                <div className="col-6 col-lg-4" key={label}>
                  <div className={`card admin-stat-card admin-stat-${color} text-center`}>
                    <div className="card-body">
                      <h2 className="h6 text-muted mb-0">{label}</h2>
                      <p className="h2 admin-stat-value mb-0">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <section className="card admin-section mb-4">
              <div className="card-header admin-section-header"><h2 className="h4 mb-0">Reporte de Categorías</h2></div>
              <div className="card-body">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div className="d-flex justify-content-between align-items-center admin-list-row border-bottom py-2" key={category}>
                    <strong>{category}</strong><span className="admin-category-count">{count}</span>
                  </div>
                ))}
                {!Object.keys(categoryCounts).length && <p className="mb-0">Sin productos registrados.</p>}
              </div>
            </section>
            <section className="card admin-section mb-4">
              <div className="card-header admin-section-header"><h2 className="h4 mb-0">Usuarios</h2></div>
              <div className="card-body">
                {users.map(user => (
                  <div className="d-flex justify-content-between align-items-center admin-user-row admin-list-row border-bottom py-2 gap-3" key={user._id}>
                    <div className="admin-user-details">
                      <strong>{user.nombre}</strong><br />
                      {user.correo}<span className="badge admin-user-role ms-2">{user.rol}</span>
                      {user.activo === false && (
                        <span className="badge bg-secondary ms-2">Cuenta desactivada</span>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      {user.activo === false && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => reactivateUser(user)}
                        >
                          Reactivar
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm admin-user-delete" onClick={() => remove(`/api/admin/usuario/${encodeURIComponent(user._id)}`, 'este usuario')}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {!users.length && <p className="mb-0">No hay usuarios.</p>}
              </div>
            </section>
            <section className="card admin-section">
              <div className="card-header admin-section-header"><h2 className="h4 mb-0">Publicaciones</h2></div>
              <div className="card-body">
                {products.map(product => (
                  <div className="d-flex justify-content-between align-items-center admin-product-row admin-list-row border-bottom py-2 gap-3" key={product._id}>
                    <div className="admin-product-details">
                      <strong>{product.nombre}</strong>
                      <div className="small text-muted d-flex align-items-center gap-2 mt-1 admin-product-meta">
                        {product.categoria}
                        {product.condicion && (
                          <span className="badge bg-light text-dark">
                            {product.condicion === 'nuevo' ? 'Nuevo'
                              : product.condicion === 'usado-excelente' ? 'Usado: excelente estado'
                                : product.condicion === 'usado-buen-estado' ? 'Usado: buen estado'
                                  : product.condicion === 'usado-aceptable' ? 'Usado: aceptable'
                                    : product.condicion}
                          </span>
                        )}
                        <span className={`badge admin-product-status status-${product.estado || 'aprobada'}`}>
                          {product.estado || 'Aprobada'}
                        </span>
                      </div>
                      {product.estado === 'rechazada' && product.motivoRechazo && (
                        <div className="small text-danger">Motivo: {product.motivoRechazo}</div>
                      )}
                    </div>
                    <div className="admin-product-actions">
                      <Link className="btn btn-outline-primary btn-sm" to={`/productos/${product._id}?origen=admin`}>
                        Ver publicación
                      </Link>
                      {product.estado === 'pendiente' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => reviewProduct(product, 'aprobada')}>
                            Aprobar
                          </button>
                          <button className="btn btn-warning btn-sm" onClick={() => reviewProduct(product, 'rechazada')}>
                            Rechazar
                          </button>
                        </>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(`/api/admin/producto/${encodeURIComponent(product._id)}`, 'esta publicación')}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {!products.length && <p className="mb-0">No hay publicaciones.</p>}
              </div>
            </section>
            {report && createPortal(<AdminReport report={report} />, document.body)}
          </>
        )}
      </main>
    </SiteLayout>
  );
}
