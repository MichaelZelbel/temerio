import { LegalLayout } from "@/components/legal/LegalLayout";
import { useSeo } from "@/hooks/useSeo";

const toc = [
  { id: "info-collect", label: "Information We Collect" },
  { id: "how-use", label: "How We Use Your Information" },
  { id: "data-storage", label: "Data Storage and Security" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "your-rights", label: "Your Rights" },
  { id: "cookies", label: "Cookies" },
  { id: "contact", label: "Contact Information" },
];

const Privacy = () => {
  useSeo({ title: "Privacy Policy", description: "Read the Temerio Privacy Policy.", path: "/privacy" });
  return (
  <LegalLayout title="Privacy Policy" lastUpdated="February 14, 2026" toc={toc}>
    <section>
      <p>
        [Company Name] ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
      </p>
    </section>

    <section>
      <h2 id="info-collect">1. Information We Collect</h2>
      <h3>Personal Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Name and display name</li>
        <li>Email address</li>
        <li>Profile picture (if uploaded)</li>
        <li>Password (stored securely using industry-standard hashing)</li>
      </ul>
      <h3>Usage Information</h3>
      <p>We automatically collect information about how you interact with our services, including pages visited, features used, timestamps, and device information such as browser type, operating system, and IP address.</p>
      <h3>Payment Information</h3>
      <p>Payment data is processed directly by Stripe and is never stored on our servers. We receive only a transaction reference and subscription status.</p>
    </section>

    <section>
      <h2 id="how-use">2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and manage subscriptions</li>
        <li>Send transactional emails (account verification, password resets)</li>
        <li>Provide customer support</li>
        <li>Analyze usage patterns to improve user experience</li>
        <li>Detect, prevent, and address technical issues and fraud</li>
      </ul>
    </section>

    <section>
      <h2 id="data-storage">3. Data Storage and Security</h2>
      <p>Your data is stored on secure servers provided by Supabase, which employs encryption at rest and in transit. We implement industry-standard security measures including:</p>
      <ul>
        <li>TLS/SSL encryption for all data transmission</li>
        <li>Row-level security policies for database access</li>
        <li>Regular security audits and vulnerability assessments</li>
        <li>Access controls and authentication for all internal systems</li>
      </ul>
      <p>While we strive to use commercially acceptable means to protect your data, no method of transmission over the Internet is 100% secure.</p>
    </section>

    <section>
      <h2 id="third-party">4. Third-Party Services</h2>
      <p>We use the following third-party services that may collect or process your data:</p>
      <ul>
        <li><strong>Supabase</strong> — Database hosting, authentication, and file storage</li>
        <li><strong>Stripe</strong> — Payment processing and subscription management</li>
        <li><strong>Analytics providers</strong> — Anonymous usage analytics to improve our product</li>
      </ul>
      <p>Each third-party service operates under their own privacy policy. We encourage you to review their policies.</p>
    </section>

    <section>
      <h2 id="your-rights">5. Your Rights</h2>
      <h3>Under GDPR (EU/EEA residents)</h3>
      <p>You have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data. You may also withdraw consent at any time.</p>
      <h3>Under CCPA (California residents)</h3>
      <p>You have the right to know what personal information is collected, request deletion of your data, opt out of the sale of personal information (we do not sell your data), and non-discrimination for exercising your rights.</p>
      <p>To exercise any of these rights, please contact us using the information below.</p>
    </section>

    <section>
      <h2 id="cookies">6. Cookies</h2>
      <p>We use cookies and similar tracking technologies to enhance your experience. For detailed information about our cookie practices, please see our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.</p>
    </section>

    <section>
      <h2 id="contact">7. Contact Information</h2>
      <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at:</p>
      <ul>
        <li>Email: privacy@[companyname].com</li>
        <li>Address: [Company Address]</li>
        <li>Data Protection Officer: dpo@[companyname].com</li>
      </ul>
    </section>
  </LegalLayout>
  );
};

export default Privacy;
