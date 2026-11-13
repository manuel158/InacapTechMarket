import { SiteLayout } from '../components/SiteLayout.jsx';

const contacts = [
  {
    title: 'Administrador 1',
    email: 'manuel.trujillo02@inacapmail.cl',
    whatsapp: '+56974475963'
  },
  {
    title: 'Administrador 2',
    email: 'consuelo.flores04@inacapmail.cl',
    whatsapp: '+56942183968'
  }
];

export default function ContactPage() {
  return (
    <SiteLayout>
      <main className="container py-5">
        <section className="card shadow-sm mx-auto" style={{ maxWidth: '700px' }}>
          <div className="card-body p-4 p-md-5">
            <p className="text-uppercase text-danger fw-bold">Estamos para ayudarte</p>
            <h1>Contáctanos</h1>
            <p className="text-muted">
              Si tienes consultas o necesitas asistencia con la plataforma, puedes comunicarte por estos medios:
            </p>
            <div className="d-grid gap-3 mt-4">
              {contacts.map(({ title, email, whatsapp }) => {
                const whatsappLink = `https://wa.me/${whatsapp.replace(/\D/g, '')}`;

                return (
                  <section className="border rounded-3 p-3" key={email}>
                    <h2 className="h5 mb-3">{title}</h2>
                    <dl className="row mb-0">
                      <dt className="col-sm-3 d-flex align-items-center gap-2">
                        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                          <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.809-1.143L9.239 8.83 8 9.586zM10.197 8.243 16 11.801V4.697z" />
                        </svg>
                        Correo
                      </dt>
                      <dd className="col-sm-9">
                        <a href={`mailto:${email}`}>{email}</a>
                      </dd>
                      <dt className="col-sm-3 d-flex align-items-center gap-2">
                        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                          <path d="M8 0a8 8 0 0 0-6.864 12.11L0 16l4.002-1.05A8 8 0 1 0 8 0m0 14.5a6.48 6.48 0 0 1-3.304-.903l-.237-.14-2.376.623.634-2.315-.155-.244A6.5 6.5 0 1 1 8 14.5m3.57-4.87c-.196-.098-1.16-.572-1.34-.637-.18-.065-.31-.098-.44.098-.13.195-.506.637-.62.767-.114.13-.228.147-.424.049-.195-.098-.824-.304-1.57-.97-.58-.517-.972-1.156-1.086-1.352-.114-.195-.012-.3.086-.397.088-.088.195-.228.293-.342.098-.114.13-.195.195-.326.065-.13.033-.244-.016-.342-.049-.098-.44-1.06-.604-1.451-.159-.38-.32-.329-.44-.335l-.375-.007a.72.72 0 0 0-.522.244c-.18.196-.685.67-.685 1.63s.701 1.891.799 2.022c.098.13 1.38 2.107 3.343 2.954.467.202.832.323 1.116.414.469.149.896.128 1.234.078.376-.056 1.16-.474 1.323-.931.163-.456.163-.848.114-.93-.049-.081-.18-.13-.375-.228" />
                        </svg>
                        WhatsApp
                      </dt>
                      <dd className="col-sm-9 mb-0">
                        <a href={whatsappLink} target="_blank" rel="noreferrer">
                          {whatsapp}
                        </a>
                      </dd>
                    </dl>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
