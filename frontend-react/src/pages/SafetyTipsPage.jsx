import { SiteLayout } from '../components/SiteLayout.jsx';

const safetyTips = [
  'Coordina el encuentro en un lugar público, concurrido y seguro, idealmente durante el día.',
  'Si es posible, avisa a alguien de confianza dónde y cuándo será el intercambio.',
  'Revisa el artículo y confirma que corresponda a lo descrito antes de cerrar el trueque.',
  'Acuerda claramente qué ofrece cada parte y las condiciones del intercambio antes de reunirse.',
  'No compartas contraseñas, códigos de verificación, datos bancarios ni información personal innecesaria.',
  'No envíes dinero como condición para recibir un artículo ofrecido como trueque.',
  'Si algo parece sospechoso o te sientes en riesgo, cancela el encuentro y contacta a administración.'
];

export default function SafetyTipsPage() {
  return (
    <SiteLayout>
      <main className="container py-5">
        <div className="mx-auto" style={{ maxWidth: '850px' }}>
          <p className="text-uppercase text-danger fw-bold">Uso responsable</p>
          <h1>Recomendaciones para un trueque seguro</h1>
          <p className="text-muted">
            Estos consejos son informativos y buscan ayudar a la comunidad a coordinar intercambios con mayor cuidado.
          </p>
          <ol className="list-group list-group-numbered shadow-sm mt-4">
            {safetyTips.map(tip => (
              <li className="list-group-item py-3" key={tip}>{tip}</li>
            ))}
          </ol>
        </div>
      </main>
    </SiteLayout>
  );
}
