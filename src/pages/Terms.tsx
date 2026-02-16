import { LegalLayout } from "@/components/legal/LegalLayout";
import { useSeo } from "@/hooks/useSeo";

const toc = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "description", label: "Description of Service" },
  { id: "accounts", label: "User Accounts" },
  { id: "billing", label: "Subscription and Billing" },
  { id: "acceptable-use", label: "Acceptable Use Policy" },
  { id: "ip", label: "Intellectual Property" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "termination", label: "Termination" },
  { id: "changes", label: "Changes to Terms" },
  { id: "governing-law", label: "Governing Law" },
];

const Terms = () => {
  useSeo({ title: "Terms of Service", description: "Read the Temerio Terms of Service.", path: "/terms" });
  return (
  <LegalLayout title="Terms of Service" lastUpdated="February 14, 2026" toc={toc}>
    <section>
      <p>
        Please read these Terms of Service ("Terms") carefully before using the [Company Name] platform ("Service"). By accessing or using the Service, you agree to be bound by these Terms.
      </p>
    </section>

    <section>
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>By creating an account or using our Service, you agree to these Terms and our Privacy Policy. If you do not agree, you may not use the Service. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
    </section>

    <section>
      <h2 id="description">2. Description of Service</h2>
      <p>[Company Name] provides a cloud-based platform for AI-powered insights, team collaboration, and data analytics. The Service includes web applications, APIs, integrations, and related documentation. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.</p>
    </section>

    <section>
      <h2 id="accounts">3. User Accounts</h2>
      <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must notify us immediately of any unauthorized access. We reserve the right to suspend accounts that violate these Terms.</p>
    </section>

    <section>
      <h2 id="billing">4. Subscription and Billing</h2>
      <p>Some features require a paid subscription. By subscribing, you agree to pay the applicable fees. Subscriptions auto-renew unless cancelled before the renewal date. Price changes will be communicated with at least 30 days' notice. Refunds are available within 30 days of purchase in accordance with our refund policy.</p>
    </section>

    <section>
      <h2 id="acceptable-use">5. Acceptable Use Policy</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to gain unauthorized access to any part of the Service</li>
        <li>Upload malicious code or interfere with the Service's operation</li>
        <li>Impersonate another person or entity</li>
        <li>Use the Service to send spam or unsolicited communications</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
        <li>Resell or redistribute the Service without authorization</li>
      </ul>
    </section>

    <section>
      <h2 id="ip">6. Intellectual Property</h2>
      <p>The Service and its original content, features, and functionality are owned by [Company Name] and are protected by international copyright, trademark, and other intellectual property laws. Your content remains yours — by uploading content, you grant us a limited license to host, display, and process it solely for providing the Service.</p>
    </section>

    <section>
      <h2 id="liability">7. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, [Company Name] shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount you paid for the Service in the twelve months preceding the claim.</p>
    </section>

    <section>
      <h2 id="termination">8. Termination</h2>
      <p>We may terminate or suspend your account at any time for violation of these Terms, with or without notice. Upon termination, your right to use the Service ceases immediately. You may request a copy of your data within 30 days of termination. We will delete your data in accordance with our data retention policy.</p>
    </section>

    <section>
      <h2 id="changes">9. Changes to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or an in-app notification at least 30 days before they take effect. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
    </section>

    <section>
      <h2 id="governing-law">10. Governing Law</h2>
      <p>These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of [Jurisdiction]. For EU residents, this does not affect your rights under mandatory consumer protection laws.</p>
    </section>
  </LegalLayout>
  );
};

export default Terms;
