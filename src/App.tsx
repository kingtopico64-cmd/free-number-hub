
import React from 'react';

const services = [
  {
    icon: '🌍',
    title: 'Countries',
    description: 'Explore countries where legitimate phone services may be available.',
  },
  {
    icon: '📱',
    title: 'SMS Services',
    description: 'Learn about SMS services for numbers you own or are authorized to use.',
  },
  {
    icon: '👤',
    title: 'My Account',
    description: 'Account information and service guidance.',
  },
  {
    icon: '💬',
    title: 'Help & Support',
    description: 'Get help with using Free Number Hub.',
  },
];

export default function App() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0b1220',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '28px 18px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', padding: '35px 10px' }}>
          <div style={{ fontSize: 48 }}>📲</div>
          <h1 style={{ fontSize: 30, marginBottom: 10 }}>
            Free Number Hub
          </h1>
          <p style={{ color: '#aab7cc', lineHeight: 1.6 }}>
            Explore phone number and SMS service information
            from different countries.
          </p>
        </header>

        <section style={{
          background: '#172338',
          borderRadius: 18,
          padding: 20,
          marginBottom: 22
        }}>
          <h2 style={{ marginTop: 0 }}>Welcome!</h2>
          <p style={{ color: '#c5d0df', lineHeight: 1.6 }}>
            Find information about legitimate SMS services
            and phone numbers you own or are authorized to manage.
          </p>
        </section>

        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 14
        }}>
          {services.map((service) => (
            <article key={service.title} style={{
              background: '#172338',
              border: '1px solid #293951',
              borderRadius: 16,
              padding: 19
            }}>
              <div style={{ fontSize: 27 }}>{service.icon}</div>
              <h3 style={{ margin: '12px 0 7px' }}>
                {service.title}
              </h3>
              <p style={{
                color: '#aab7cc',
                lineHeight: 1.5,
                margin: 0
              }}>
                {service.description}
              </p>
            </article>
          ))}
        </section>

        <footer style={{
          textAlign: 'center',
          color: '#8291a8',
          fontSize: 12,
          padding: '30px 8px'
        }}>
          Free Number Hub · Use phone numbers responsibly.
          Never share private verification codes.
        </footer>
      </div>
    </main>
  );
}
