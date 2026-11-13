import { SiteLayout } from '../components/SiteLayout.jsx';

const contactEmail = 'manuel.trujillo02@inacapmail.cl';
const whatsappNumber = '+56974475963';
const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;

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
            <dl className="row mt-4 mb-0">
              <dt className="col-sm-3">Correo</dt>
              <dd className="col-sm-9">
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </dd>
              <dt className="col-sm-3">WhatsApp</dt>
              <dd className="col-sm-9">
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  {whatsappNumber}
                </a>
              </dd>
            </dl>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
