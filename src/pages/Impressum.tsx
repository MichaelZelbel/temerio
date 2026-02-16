import { LegalLayout } from "@/components/legal/LegalLayout";
import { useSeo } from "@/hooks/useSeo";

const toc = [
  { id: "company-info", label: "Company Information" },
  { id: "contact", label: "Contact Details" },
  { id: "registration", label: "Registration" },
  { id: "vat", label: "VAT Information" },
  { id: "responsible", label: "Responsible Person" },
  { id: "dispute", label: "Dispute Resolution" },
];

const Impressum = () => {
  useSeo({ title: "Impressum", description: "Legal information and company details for Temerio.", path: "/impressum" });
  return (
  <LegalLayout title="Impressum" lastUpdated="February 14, 2026" toc={toc}>
    <section>
      <p>Information in accordance with Section 5 TMG (German Telemedia Act) and Article 13 of the EU E-Commerce Directive.</p>
    </section>

    <section>
      <h2 id="company-info">Company Information</h2>
      <p>
        <strong>[Company Name] GmbH</strong><br />
        [Street Address]<br />
        [Postal Code] [City]<br />
        [Country]
      </p>
    </section>

    <section>
      <h2 id="contact">Contact Details</h2>
      <ul>
        <li><strong>Phone:</strong> +49 [XXX] [XXXXXXX]</li>
        <li><strong>Email:</strong> info@[companyname].com</li>
        <li><strong>Website:</strong> https://[companyname].com</li>
      </ul>
    </section>

    <section>
      <h2 id="registration">Registration Information</h2>
      <ul>
        <li><strong>Register Court:</strong> [Amtsgericht City]</li>
        <li><strong>Registration Number:</strong> HRB [XXXXX]</li>
      </ul>
    </section>

    <section>
      <h2 id="vat">VAT Information</h2>
      <p>VAT Identification Number in accordance with Section 27a of the German Value Added Tax Act:</p>
      <p><strong>DE [XXXXXXXXX]</strong></p>
    </section>

    <section>
      <h2 id="responsible">Responsible Person</h2>
      <p>Person responsible for content in accordance with Section 55(2) RStV:</p>
      <p>
        <strong>[Full Name]</strong><br />
        [Title / Position]<br />
        [Company Name] GmbH<br />
        [Address]
      </p>
    </section>

    <section>
      <h2 id="dispute">Dispute Resolution</h2>
      <p>The European Commission provides a platform for online dispute resolution (ODR):</p>
      <p><a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
      <p>We are not obligated and not willing to participate in dispute resolution proceedings before a consumer arbitration board.</p>
    </section>
  </LegalLayout>
  );
};

export default Impressum;
