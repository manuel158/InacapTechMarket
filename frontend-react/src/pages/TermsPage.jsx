import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/SiteLayout.jsx';
import terms from '../../../shared/terms.json';

export default function TermsPage() {
  return (
    <AuthLayout>
      <article className="mx-auto" style={{ maxWidth: '900px' }}>
        <header className="mb-4">
          <h1 className="h2">Términos y Condiciones</h1>
          <p className="text-muted mb-0">
            Versión {terms.version} · Última actualización: {terms.lastUpdated}
          </p>
        </header>
        {terms.sections.map(section => (
          <section className="mb-4" key={section.title}>
            <h2 className="h4">{section.title}</h2>
            {section.paragraphs?.map((paragraph, index) => (
              <p key={`${section.title}-paragraph-${index}`}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.title}-bullet-${index}`}>{bullet}</li>
                ))}
              </ul>
            )}
            {section.moreParagraphs?.map((paragraph, index) => (
              <p key={`${section.title}-more-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
        <p className="mt-4">
          <Link to="/registro">Volver al registro</Link>
        </p>
      </article>
    </AuthLayout>
  );
}
