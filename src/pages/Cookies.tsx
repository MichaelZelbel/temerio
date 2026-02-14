import { LegalLayout } from "@/components/legal/LegalLayout";

const toc = [
  { id: "what-are-cookies", label: "What Are Cookies" },
  { id: "types", label: "Types of Cookies We Use" },
  { id: "manage", label: "How to Manage Cookies" },
  { id: "third-party", label: "Third-Party Cookies" },
];

const Cookies = () => (
  <LegalLayout title="Cookie Policy" lastUpdated="February 14, 2026" toc={toc}>
    <section>
      <p>
        This Cookie Policy explains how [Company Name] uses cookies and similar technologies when you visit our platform.
      </p>
    </section>

    <section>
      <h2 id="what-are-cookies">1. What Are Cookies</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you signed in, and understand how you interact with the site. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain until they expire or you delete them).</p>
    </section>

    <section>
      <h2 id="types">2. Types of Cookies We Use</h2>
      <h3>Essential Cookies</h3>
      <p>These cookies are necessary for the Service to function. They enable core features like authentication, session management, and security. You cannot opt out of essential cookies as the Service will not work without them.</p>
      <ul>
        <li><strong>Authentication tokens</strong> — Keep you signed in securely</li>
        <li><strong>CSRF tokens</strong> — Protect against cross-site request forgery</li>
        <li><strong>Cookie consent</strong> — Remember your cookie preferences</li>
      </ul>

      <h3>Analytics Cookies</h3>
      <p>These cookies help us understand how visitors interact with our Service by collecting anonymous usage data. This information helps us improve performance and user experience.</p>
      <ul>
        <li><strong>Page views and navigation patterns</strong></li>
        <li><strong>Feature usage metrics</strong></li>
        <li><strong>Performance and error tracking</strong></li>
      </ul>

      <h3>Preference Cookies</h3>
      <p>These cookies remember your settings and preferences, such as theme selection (light/dark mode), language preferences, and layout options.</p>
    </section>

    <section>
      <h2 id="manage">3. How to Manage Cookies</h2>
      <p>You can manage your cookie preferences through:</p>
      <ul>
        <li><strong>Our cookie consent banner</strong> — Customize your preferences when first visiting the site</li>
        <li><strong>Browser settings</strong> — Most browsers allow you to block or delete cookies via their settings menu</li>
        <li><strong>Device settings</strong> — Mobile devices typically offer cookie controls in their privacy settings</li>
      </ul>
      <p>Please note that blocking certain cookies may affect the functionality of our Service.</p>
    </section>

    <section>
      <h2 id="third-party">4. Third-Party Cookies</h2>
      <p>Some cookies are placed by third-party services that appear on our pages. We use:</p>
      <ul>
        <li><strong>Supabase</strong> — Authentication and session management</li>
        <li><strong>Stripe</strong> — Payment processing (only on checkout pages)</li>
        <li><strong>Analytics providers</strong> — Anonymous usage analytics</li>
      </ul>
      <p>We do not control third-party cookies. Please refer to each provider's cookie policy for more information.</p>
      <p>If you have questions about our use of cookies, contact us at privacy@[companyname].com.</p>
    </section>
  </LegalLayout>
);

export default Cookies;
