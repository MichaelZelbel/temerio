import { LegalLayout } from "@/components/legal/LegalLayout";
import { useSeo } from "@/hooks/useSeo";

const toc = [
  { id: "info-collect", label: "Information We Collect" },
  { id: "how-use", label: "How We Use Your Information" },
  { id: "data-storage", label: "Data Storage and Security" },
  { id: "third-party", label: "Data Processors" },
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
      <h2 id="third-party">4. Third-Party Data Processing / Data Processors</h2>
      <p>
        In accordance with Article 28 of the General Data Protection Regulation (GDPR), we engage
        carefully selected third-party service providers ("data processors") to help us operate our
        platform and deliver our services. Each processor is contractually bound by a Data Processing
        Agreement (DPA) that ensures an adequate level of data protection consistent with applicable
        EU/EEA data protection law.
      </p>
      <p>The following processors currently process personal data on our behalf:</p>

      <h3>Microsoft Azure (incl. Azure OpenAI)</h3>
      <p>
        <strong>Role:</strong> Cloud infrastructure, hosting, and AI inference services.
        Microsoft Azure provides the primary compute, storage, and networking infrastructure on which
        parts of our platform operate, including Azure OpenAI deployments used for AI-powered features.
        Microsoft acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Data Protection Addendum (DPA)</a>
      </p>

      <h3>Supabase</h3>
      <p>
        <strong>Role:</strong> Database hosting, authentication, and backend-as-a-service infrastructure.
        Supabase provides our primary database, user authentication services, and file storage.
        Supabase acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://supabase.com/downloads/docs/Supabase%2BDPA%2B250314.pdf" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Supabase GDPR Data Processing Addendum (DPA)</a>
      </p>

      <h3>Lovable</h3>
      <p>
        <strong>Role:</strong> Website hosting and deployment platform.
        Lovable provides the hosting infrastructure and deployment pipeline for our web application.
        Lovable acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://lovable.dev/data-processing-agreement" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Lovable Data Processing Agreement (DPA)</a>
      </p>

      <h3>Hostinger</h3>
      <p>
        <strong>Role:</strong> Website hosting and domain infrastructure.
        Hostinger provides supplementary hosting and domain management services.
        Hostinger acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://www.hostinger.com/legal/dpa" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Hostinger Data Processing Agreement (DPA)</a>
      </p>

      <h3>Resend</h3>
      <p>
        <strong>Role:</strong> Transactional email delivery service.
        Resend handles the delivery of transactional emails such as account verification, password
        resets, and system notifications on our behalf.
        Resend acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://resend.com/legal/dpa" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Resend Data Processing Agreement (DPA)</a>
      </p>

      <h3>OpenAI</h3>
      <p>
        <strong>Role:</strong> AI inference provider (fallback).
        OpenAI is used as an alternative AI inference provider for certain AI-powered features
        when the primary provider is unavailable.
        OpenAI acts as a data processor under GDPR Article 28.
      </p>
      <p>
        <a href="https://openai.com/policies/data-processing-addendum/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">OpenAI Data Processing Addendum (DPA)</a>
      </p>

      <p>
        We regularly review and update our list of data processors. If we engage new processors or
        discontinue existing ones, we will update this section accordingly. You may contact us at any
        time to request further information about the processors we use or the safeguards we have in place.
      </p>
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
