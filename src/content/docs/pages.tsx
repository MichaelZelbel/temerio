import { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";

export type DocPage = {
  headings: { id: string; label: string }[];
  content: ReactNode;
  searchText: string; // plain text for search
};

const pages: Record<string, DocPage> = {
  "quick-start": {
    headings: [
      { id: "prerequisites", label: "Prerequisites" },
      { id: "installation", label: "Installation" },
      { id: "first-project", label: "Your First Project" },
      { id: "next-steps", label: "Next Steps" },
    ],
    searchText: "quick start prerequisites installation node npm project create workspace dashboard",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Get up and running with Temerio in under 5 minutes.</p>

        <h2 id="prerequisites">Prerequisites</h2>
        <p>Before you begin, make sure you have:</p>
        <ul>
          <li>A modern web browser (Chrome, Firefox, Safari, or Edge)</li>
          <li>An email address for account creation</li>
        </ul>

        <h2 id="installation">Installation</h2>
        <p>Temerio is a cloud-based platform — no local installation required. Simply sign up and start using it from your browser.</p>
        <Callout variant="tip" title="Pro tip">
          Bookmark your dashboard URL for quick access. You can also install Temerio as a PWA from your browser.
        </Callout>

        <h2 id="first-project">Your First Project</h2>
        <p>After signing up, create your first project:</p>
        <CodeBlock language="bash" code={`# If using the CLI (optional)\nnpm install -g @temerio/cli\ntemerio init my-project\ntemerio open`} />
        <ol>
          <li>Navigate to your dashboard</li>
          <li>Click <strong>"New Project"</strong></li>
          <li>Choose a template or start from scratch</li>
          <li>Configure your workspace settings</li>
        </ol>

        <h2 id="next-steps">Next Steps</h2>
        <p>Now that you have a project set up, explore:</p>
        <ul>
          <li>Setting up your profile and preferences</li>
          <li>Inviting team members to collaborate</li>
          <li>Connecting your first integration</li>
        </ul>
      </>
    ),
  },

  "creating-account": {
    headings: [
      { id: "sign-up", label: "Sign Up" },
      { id: "verify-email", label: "Verify Email" },
      { id: "complete-profile", label: "Complete Profile" },
    ],
    searchText: "creating account sign up email verify profile OAuth Google GitHub",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Create your Temerio account and set up your profile.</p>

        <h2 id="sign-up">Sign Up</h2>
        <p>You can create an account using email/password or OAuth providers (Google, GitHub).</p>
        <CodeBlock language="text" code={`1. Go to /auth\n2. Click "Sign Up"\n3. Enter your email and password\n4. Or click "Continue with Google/GitHub"`} />

        <h2 id="verify-email">Verify Your Email</h2>
        <p>After signing up with email, check your inbox for a verification link. Click it to activate your account.</p>
        <Callout variant="info">OAuth sign-ups are automatically verified.</Callout>

        <h2 id="complete-profile">Complete Your Profile</h2>
        <p>Head to Settings to add your display name, avatar, bio, and website URL.</p>
      </>
    ),
  },

  "dashboard-overview": {
    headings: [
      { id: "layout", label: "Layout" },
      { id: "navigation", label: "Navigation" },
      { id: "widgets", label: "Widgets" },
    ],
    searchText: "dashboard overview layout navigation sidebar widgets analytics",
    content: (
      <>
        <p className="text-lg text-muted-foreground">A tour of your Temerio dashboard.</p>

        <h2 id="layout">Layout</h2>
        <p>The dashboard features a sidebar for navigation, a main content area, and contextual toolbars for each section.</p>

        <h2 id="navigation">Navigation</h2>
        <p>Use the left sidebar to navigate between Dashboard, Analytics, Customers, Reports, Settings, and Notifications.</p>

        <h2 id="widgets">Widgets</h2>
        <p>Your dashboard displays key metrics including active users, revenue, growth trends, and recent activity.</p>
        <Callout variant="tip">Widgets can be customized in a future update. Stay tuned!</Callout>
      </>
    ),
  },

  "ai-insights": {
    headings: [
      { id: "overview", label: "Overview" },
      { id: "how-it-works", label: "How It Works" },
      { id: "use-cases", label: "Use Cases" },
    ],
    searchText: "AI insights machine learning patterns predictions analytics intelligent",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Leverage AI to uncover patterns and opportunities.</p>
        <h2 id="overview">Overview</h2>
        <p>Temerio's AI engine analyzes your data to surface actionable insights, anomalies, and predictions.</p>
        <h2 id="how-it-works">How It Works</h2>
        <p>Our models run continuously in the background, processing your data and generating insights that appear in your dashboard.</p>
        <Callout variant="info">AI features are available on Pro and Enterprise plans.</Callout>
        <h2 id="use-cases">Use Cases</h2>
        <ul>
          <li>Churn prediction and prevention</li>
          <li>Revenue forecasting</li>
          <li>Anomaly detection in key metrics</li>
          <li>Automated report generation</li>
        </ul>
      </>
    ),
  },

  collaboration: {
    headings: [
      { id: "real-time", label: "Real-Time Editing" },
      { id: "comments", label: "Comments" },
      { id: "permissions", label: "Permissions" },
    ],
    searchText: "collaboration real-time editing comments permissions roles team sharing",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Work together seamlessly with your team.</p>
        <h2 id="real-time">Real-Time Editing</h2>
        <p>Multiple team members can view and edit dashboards simultaneously with live cursors and changes.</p>
        <h2 id="comments">Comments</h2>
        <p>Leave comments on any data point, chart, or report. Tag team members with @mentions.</p>
        <h2 id="permissions">Permissions</h2>
        <p>Role-based access control lets you define who can view, edit, or manage resources.</p>
        <Callout variant="warning">Changing permissions affects all team members immediately.</Callout>
      </>
    ),
  },

  integrations: {
    headings: [
      { id: "available", label: "Available Integrations" },
      { id: "setup", label: "Setup" },
      { id: "custom", label: "Custom Integrations" },
    ],
    searchText: "integrations Slack Jira Salesforce webhook API connect setup custom",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Connect Temerio to the tools you already use.</p>
        <h2 id="available">Available Integrations</h2>
        <p>We support 200+ integrations including Slack, Jira, Salesforce, HubSpot, GitHub, and more.</p>
        <h2 id="setup">Setup</h2>
        <p>Navigate to Settings → Integrations, select the tool you want to connect, and follow the OAuth flow.</p>
        <CodeBlock language="bash" code={`# Using the CLI\ntemerio integrations add slack\ntemerio integrations list`} />
        <h2 id="custom">Custom Integrations</h2>
        <p>Build custom integrations using our webhook system or REST API. Available on Enterprise plans.</p>
      </>
    ),
  },

  "profile-settings": {
    headings: [
      { id: "edit-profile", label: "Edit Profile" },
      { id: "avatar", label: "Avatar" },
      { id: "password", label: "Change Password" },
    ],
    searchText: "profile settings avatar display name bio website password change account",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Manage your personal profile and account settings.</p>
        <h2 id="edit-profile">Edit Profile</h2>
        <p>Update your display name, bio, and website from the Settings page.</p>
        <h2 id="avatar">Avatar</h2>
        <p>Upload a profile picture (JPG, PNG, GIF, or WebP, max 2MB). Click your avatar to change it.</p>
        <h2 id="password">Change Password</h2>
        <p>Enter your current password and choose a new one. We recommend using a strong, unique password.</p>
        <Callout variant="warning">If you signed up with OAuth, you may not have a password set. Use the "Set Password" option instead.</Callout>
      </>
    ),
  },

  subscription: {
    headings: [
      { id: "plans", label: "Plans" },
      { id: "upgrade", label: "Upgrading" },
      { id: "billing", label: "Billing" },
    ],
    searchText: "subscription plans free pro enterprise upgrade downgrade billing payment invoice",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Manage your subscription and billing.</p>
        <h2 id="plans">Plans</h2>
        <p>Temerio offers Free, Pro ($19/mo), and Enterprise (custom) plans. See our pricing page for details.</p>
        <h2 id="upgrade">Upgrading</h2>
        <p>Upgrade anytime from Settings → Subscription. Changes take effect immediately with prorated billing.</p>
        <h2 id="billing">Billing</h2>
        <p>We accept all major credit cards via Stripe. Enterprise customers can pay by invoice.</p>
        <Callout variant="info">All paid plans include a 30-day money-back guarantee.</Callout>
      </>
    ),
  },

  "team-members": {
    headings: [
      { id: "invite", label: "Inviting Members" },
      { id: "roles", label: "Roles" },
      { id: "remove", label: "Removing Members" },
    ],
    searchText: "team members invite roles admin editor viewer remove manage",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Manage your team and their access levels.</p>
        <h2 id="invite">Inviting Members</h2>
        <p>Invite team members by email from Settings → Team. They'll receive an invitation link.</p>
        <Callout variant="tip">Coming soon: bulk invitations via CSV upload.</Callout>
        <h2 id="roles">Roles</h2>
        <p>Assign roles to control access: Admin (full control), Editor (create/edit), Viewer (read-only).</p>
        <h2 id="remove">Removing Members</h2>
        <p>Admins can remove team members at any time. Their data and contributions remain intact.</p>
      </>
    ),
  },

  "api-auth": {
    headings: [
      { id: "api-keys", label: "API Keys" },
      { id: "oauth-flow", label: "OAuth Flow" },
      { id: "tokens", label: "Tokens" },
    ],
    searchText: "API authentication keys OAuth bearer token JWT authorization header",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Authenticate your API requests.</p>
        <h2 id="api-keys">API Keys</h2>
        <p>Generate API keys from Settings → API. Each key has configurable scopes and expiration.</p>
        <CodeBlock language="bash" code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://api.temerio.com/v1/projects`} />
        <h2 id="oauth-flow">OAuth Flow</h2>
        <p>For user-facing integrations, use our OAuth 2.0 flow with PKCE support.</p>
        <h2 id="tokens">Tokens</h2>
        <p>Access tokens expire after 1 hour. Use refresh tokens to obtain new access tokens without re-authentication.</p>
        <Callout variant="warning">Never expose API keys in client-side code. Use server-side calls or edge functions.</Callout>
      </>
    ),
  },

  "api-endpoints": {
    headings: [
      { id: "base-url", label: "Base URL" },
      { id: "resources", label: "Resources" },
      { id: "pagination", label: "Pagination" },
    ],
    searchText: "API endpoints REST resources CRUD pagination projects users data",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Explore the Temerio REST API.</p>
        <h2 id="base-url">Base URL</h2>
        <CodeBlock language="text" code="https://api.temerio.com/v1" />
        <h2 id="resources">Resources</h2>
        <p>Available resources:</p>
        <CodeBlock language="text" code={`GET    /projects          # List projects\nPOST   /projects          # Create project\nGET    /projects/:id       # Get project\nPUT    /projects/:id       # Update project\nDELETE /projects/:id       # Delete project\n\nGET    /users/me           # Get current user\nPUT    /users/me           # Update profile`} />
        <h2 id="pagination">Pagination</h2>
        <p>List endpoints support cursor-based pagination with <code>limit</code> and <code>cursor</code> query parameters.</p>
        <CodeBlock language="bash" code={`curl "https://api.temerio.com/v1/projects?limit=20&cursor=abc123"`} />
      </>
    ),
  },

  "api-rate-limits": {
    headings: [
      { id: "limits", label: "Rate Limits" },
      { id: "headers", label: "Response Headers" },
      { id: "best-practices", label: "Best Practices" },
    ],
    searchText: "API rate limits throttle 429 headers retry best practices",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Understand API rate limiting.</p>
        <h2 id="limits">Rate Limits</h2>
        <ul>
          <li><strong>Free:</strong> 100 requests/minute</li>
          <li><strong>Pro:</strong> 1,000 requests/minute</li>
          <li><strong>Enterprise:</strong> Custom limits</li>
        </ul>
        <h2 id="headers">Response Headers</h2>
        <CodeBlock language="text" code={`X-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 997\nX-RateLimit-Reset: 1709251200`} />
        <h2 id="best-practices">Best Practices</h2>
        <ul>
          <li>Implement exponential backoff on 429 responses</li>
          <li>Cache responses where possible</li>
          <li>Use webhooks instead of polling</li>
        </ul>
        <Callout variant="tip">Need higher limits? Contact sales for a custom Enterprise plan.</Callout>
      </>
    ),
  },

  importance: {
    headings: [
      { id: "what-it-means", label: "What Importance Means" },
      { id: "levels", label: "Levels 1–10" },
      { id: "rule-of-thumb", label: "Rule of Thumb" },
    ],
    searchText:
      "importance 1 2 3 4 5 6 7 8 9 10 confidence timeline event examples parents visit marriage turning point milestone",
    content: (
      <>
        <h2 id="what-it-means">What Importance Means</h2>
        <p>Importance answers one question:</p>
        <p><strong>How much does this event change the direction or structure of your life?</strong></p>
        <p>It is not about emotion.</p>
        <p>It is about <strong>structural impact</strong>.</p>

        <h2 id="levels">Levels 1–10</h2>

        <h3>1 — Almost no impact</h3>
        <p>Very small events.</p>
        <p>Examples:</p>
        <ul>
          <li>A short call</li>
          <li>A routine meeting</li>
          <li>Buying groceries</li>
          <li>A normal workday</li>
        </ul>
        <p>If it disappeared, nothing would change.</p>

        <h3>2 — Small moment</h3>
        <p>Slightly more noticeable, but still minor.</p>
        <p>Examples:</p>
        <ul>
          <li>A nice visit with your parents</li>
          <li>Meeting a friend for dinner</li>
          <li>Attending a webinar</li>
          <li>A short weekend trip</li>
        </ul>
        <p>Pleasant or useful, but not life-shaping.</p>

        <h3>3 — Minor milestone</h3>
        <p>A small achievement or event you might remember.</p>
        <p>Examples:</p>
        <ul>
          <li>Finishing a short course</li>
          <li>Publishing a blog post</li>
          <li>Completing a small project</li>
          <li>Giving a presentation</li>
        </ul>
        <p>It matters, but doesn't shift your life.</p>

        <h3>4 — Meaningful event</h3>
        <p>Something that adds noticeable structure.</p>
        <p>Examples:</p>
        <ul>
          <li>Starting a new hobby seriously</li>
          <li>A longer trip abroad</li>
          <li>A moderate financial decision</li>
          <li>Beginning a side project</li>
        </ul>
        <p>It adds weight to your current life chapter.</p>

        <h3>5 — Clearly significant</h3>
        <p>An event that shapes a phase of your life.</p>
        <p>Examples:</p>
        <ul>
          <li>Moving apartments</li>
          <li>Getting a promotion</li>
          <li>Starting a serious relationship</li>
          <li>Launching a real product</li>
        </ul>
        <p>It changes how your life feels, but not your overall direction.</p>

        <h3>6 — Major shift within a chapter</h3>
        <p>A strong change, but still inside your broader path.</p>
        <p>Examples:</p>
        <ul>
          <li>Changing jobs within the same field</li>
          <li>Moving to a new city</li>
          <li>Ending a long-term project</li>
          <li>A serious financial investment</li>
        </ul>
        <p>Life feels different afterward.</p>

        <h3>7 — Clear turning point</h3>
        <p>A "before and after" event.</p>
        <p>Examples:</p>
        <ul>
          <li>Marriage</li>
          <li>Founding a company</li>
          <li>Changing career direction</li>
          <li>Long-term relocation</li>
        </ul>
        <p>You can clearly see a new chapter starting here.</p>

        <h3>8 — Very rare structural change</h3>
        <p>An event that deeply reshapes your life.</p>
        <p>Examples:</p>
        <ul>
          <li>Immigration to another country</li>
          <li>Selling a company</li>
          <li>Becoming a parent</li>
          <li>Major personal transformation</li>
        </ul>
        <p>Your life structure is clearly different afterward.</p>

        <h3>9 — Life-defining</h3>
        <p>One of the most important events in your life.</p>
        <p>Examples:</p>
        <ul>
          <li>Birth of a child (if central to your life)</li>
          <li>A radical career reinvention</li>
          <li>A defining health event</li>
        </ul>
        <p>There are only a few of these.</p>

        <h3>10 — Foundational anchor</h3>
        <p>The core events your life is built around.</p>
        <p>Examples:</p>
        <ul>
          <li>Your birth</li>
          <li>A marriage that completely reshaped your life</li>
          <li>A decision that permanently changed everything</li>
        </ul>
        <p>There should be very few 10s.</p>

        <h2 id="rule-of-thumb">Rule of Thumb</h2>
        <p><strong>If this event had not happened, would my life look structurally different?</strong></p>
        <ul>
          <li><strong>No</strong> → 1–3</li>
          <li><strong>A little</strong> → 4–5</li>
          <li><strong>Clearly yes</strong> → 6–7</li>
          <li><strong>Fundamentally yes</strong> → 8–10</li>
        </ul>
      </>
    ),
  },

  faq: {
    headings: [
      { id: "general", label: "General" },
      { id: "billing-faq", label: "Billing" },
      { id: "technical", label: "Technical" },
    ],
    searchText: "FAQ frequently asked questions general billing technical support cancel data export",
    content: (
      <>
        <p className="text-lg text-muted-foreground">Answers to common questions.</p>
        <h2 id="general">General</h2>
        <p><strong>What is Temerio?</strong></p>
        <p>Temerio is an AI-powered platform for teams to collaborate, analyze data, and ship products faster.</p>
        <p><strong>Is there a free plan?</strong></p>
        <p>Yes! Our Free plan includes core features with up to 100 items and 1 workspace.</p>

        <h2 id="billing-faq">Billing</h2>
        <p><strong>Can I cancel anytime?</strong></p>
        <p>Yes. Cancel from Settings → Subscription. You'll retain access until the end of your billing period.</p>
        <p><strong>Do you offer refunds?</strong></p>
        <p>We offer a 30-day money-back guarantee on all paid plans.</p>

        <h2 id="technical">Technical</h2>
        <p><strong>Can I export my data?</strong></p>
        <p>Yes. Export your data in JSON or CSV format from Settings → Account → Export Data.</p>
        <p><strong>Is my data encrypted?</strong></p>
        <p>Yes. All data is encrypted at rest and in transit using industry-standard encryption.</p>
      </>
    ),
  },
};

export function getDocPage(slug: string): DocPage | null {
  return pages[slug] ?? null;
}

export function searchDocs(query: string): { slug: string; title: string }[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const { docNav } = require("./index");
  const results: { slug: string; title: string }[] = [];
  for (const group of docNav) {
    for (const item of group.items) {
      const page = pages[item.slug];
      if (
        item.title.toLowerCase().includes(q) ||
        (page && page.searchText.toLowerCase().includes(q))
      ) {
        results.push({ slug: item.slug, title: item.title });
      }
    }
  }
  return results;
}
