import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/app/components/Footer";

const CONTACT_EMAIL = "contact@hfmsbook.com";

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-zinc-900 underline">
      {CONTACT_EMAIL}
    </a>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="public-light flex min-h-screen flex-col bg-white">
      <div className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:underline">
            ← Back
          </Link>

          <h1 className="mt-6 text-2xl font-bold text-zinc-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-zinc-500">The Humans First Series</p>
          <p className="mt-1 text-sm text-zinc-500">Last updated: June 2026</p>

          <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-zinc-700">
            <p>
              This Privacy Policy explains how HFMS, operating as The Humans First Series associated with
              the book <em>Humans First, Machines Second</em> by Vineet Nayar, published by Penguin
              Business (referred to as &ldquo;HFMS&rdquo;, &ldquo;The Humans First Series&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), collect, use, store, share,
              protect, and delete personal data when individuals visit the HFMS website (
              <a
                href="https://hfmsbook.com"
                className="font-medium text-zinc-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                hfmsbook.com
              </a>
              ), register for a Humans First Series event, interact with email communications, or engage
              with the platform through conversations, enquiries, or other interactions.
            </p>

            <Section title="1. Who this Policy Applies To">
              <p>This Privacy Policy applies to:</p>
              <BulletList
                items={[
                  "visitors to hfmsbook.com;",
                  "users who register for a Humans First Series event;",
                  "individuals who submit enquiries, questions for the event, feedback, or other materials;",
                  "persons who interact with HFMS through email communications, website forms, or conversation features; and",
                  "any individual whose personal data is processed in connection with Humans First Series events, website activity, community engagement, or related lawful activities.",
                ]}
              />
              <p>
                Where required by applicable law, this Privacy Policy also applies to processing carried
                out outside India when connected with offering services to individuals in India.
              </p>
            </Section>

            <Section title="2. Nature and Purpose of HFMS">
              <p>
                HFMS (The Humans First Series) is an initiative associated with the book{" "}
                <em>Humans First, Machines Second</em> by Vineet Nayar, published by Penguin Business. It
                hosts information, tools, content, user accounts, discussion features, interactive engagement
                channels, contact forms, registration journeys, event pages, and related digital services.
              </p>
              <p>
                Depending on how the website and events operate from time to time, HFMS may process
                personal data for one or more of the following purposes:
              </p>
              <BulletList
                items={[
                  "creating and managing user accounts and event registrations;",
                  "verifying user identity and maintaining account and event security;",
                  "enabling users to communicate with HFMS or through website-enabled conversation features;",
                  "responding to enquiries, requests, complaints, and support needs;",
                  "providing access to website content, event features, events, communities, resources, or services;",
                  "personalising user experience and improving site functionality;",
                  "sending event-related communications (confirmation, reminders, post-event follow-ups) and, where permitted, other outreach;",
                  "conducting moderation, safety review, fraud prevention, misuse detection, and platform integrity checks;",
                  "maintaining records, logs, and audit trails;",
                  "complying with legal obligations, law enforcement requests, court orders, and regulatory requirements; and",
                  "any other lawful purpose specifically disclosed at the point of data collection or otherwise consented to by the user.",
                ]}
              />
              <p>
                HFMS will process personal data only for lawful purposes and only to the extent reasonably
                necessary for the relevant specified purpose.
              </p>
            </Section>

            <Section title="3. Personal Data We Collect">
              <p>The categories of personal data HFMS may collect include:</p>
              <BulletList
                items={[
                  "Full Name;",
                  "Email Address;",
                  "Mobile Number (optional; shared only if you wish to be part of the community);",
                  "A question you would like to ask at the event (optional);",
                  "communications data such as messages, chat records, conversation content, support requests, attachments, responses, feedback, and meeting or interaction notes;",
                  "professional, organisational, educational, or preference-related information voluntarily submitted by the user;",
                  "identity or verification details where required for security, trust, compliance, or participation in specific features;",
                  "technical data such as IP address, browser type, device information, operating system, timestamps, log files, cookies, pixel tags, session identifiers, and usage analytics;",
                  "email interaction data (opens, link clicks) for event-related communications;",
                  "Google Analytics data (pages visited, time spent on the site, device type, approximate geographic location) in an anonymised and aggregated form; and",
                  "any other personal data that the user chooses to provide through forms, uploads, conversations, surveys, registrations, or profile fields.",
                ]}
              />
              <p>
                HFMS may also receive personal data from lawful third-party sources such as analytics
                vendors, authentication partners, payment intermediaries, communication service providers,
                or publicly available sources, to the extent permitted by law.
              </p>
            </Section>

            <Section title="4. Sensitive Information and User Caution">
              <p>
                HFMS may permit users to voluntarily share information that they consider sensitive,
                confidential, financial, health-related, identity-linked, or otherwise private during
                registration or conversations. Users should provide only such information as is necessary
                for the relevant purpose and should avoid sharing unnecessary personal or third-party
                information.
              </p>
              <p>
                Where HFMS seeks information that may involve higher privacy risk, HFMS will endeavour to
                provide an appropriate notice and obtain consent where required. Consent under applicable
                data protection frameworks must be limited to personal data necessary for the specified
                purpose, and any withdrawal of consent must be as easy as giving it.
              </p>
            </Section>

            <Section title="5. Content and Conversations on the Website">
              <p>
                HFMS may host articles, explainers, user-generated submissions, interactive forms, community
                discussions, chat interfaces, support conversations, consultation requests, event-related
                interactions, or similar engagement mechanisms. When users communicate through these
                features, HFMS may process the information shared in order to deliver the service, maintain
                records, moderate content, ensure safety, investigate misuse, improve response quality, and
                comply with legal obligations.
              </p>
              <p>
                Users must not post, upload, transmit, or disclose personal data of another person without
                lawful authority. Users should also avoid sharing unlawful, defamatory, infringing,
                misleading, or harmful material through conversation or content features.
              </p>
            </Section>

            <Section title="6. Legal Basis and Consent">
              <p>
                HFMS processes personal data in accordance with applicable law, including on the basis of
                user consent and, where applicable, other lawful grounds recognised under data protection
                frameworks. By registering for an event, ticking a consent box, clicking &ldquo;I
                agree,&rdquo; submitting information, enabling a feature, or otherwise taking clear
                affirmative action after being presented with an appropriate notice, the user consents to the
                processing of personal data for the specified purposes described at the relevant point of
                collection and in this Privacy Policy.
              </p>
              <p>
                Users may withdraw consent at any time through the account/settings, privacy controls,
                unsubscribe option, deletion request process, or by contacting HFMS using the contact
                details provided below. Upon withdrawal of consent, HFMS will, within a reasonable time,
                cease processing the personal data unless continued processing is required or authorised by
                law, and prior lawful processing will remain valid up to the time of withdrawal.
              </p>
            </Section>

            <Section title="7. How We Use Personal Data">
              <p>HFMS may use personal data to:</p>
              <BulletList
                items={[
                  "register, authenticate, and administer user accounts and event registrations;",
                  "enable website access and account-based or event-based services;",
                  "facilitate and maintain conversations and user interactions;",
                  "provide requested information, services, responses, or engagement;",
                  "verify eligibility for features, communities, programmes, or events;",
                  "improve website content, functionality, safety, and user experience;",
                  "conduct analytics, troubleshooting, testing, and system administration;",
                  "protect against spam, abuse, fraud, unauthorised access, and legal risk;",
                  "communicate about service changes, policies, security issues, and support matters;",
                  "send event-related communications (confirmation, reminders, post-event follow-ups) and, where permitted, other outreach;",
                  "enforce website terms, community rules, and contractual rights;",
                  "maintain compliance records and internal governance documentation; and",
                  "comply with legal, regulatory, judicial, or governmental obligations.",
                ]}
              />
              <p>
                HFMS specifically uses personal data to confirm and manage event registrations, send event
                passes and event-related communications, understand the attendee community in an aggregated
                manner, facilitate meaningful conversations at events, improve website experience via Google
                Analytics, and respond to direct enquiries or feedback.
              </p>
              <p>
                Where personal data is likely to be used to make a decision that affects a user or is
                disclosed to another controller, HFMS will endeavour to ensure the completeness, accuracy,
                and consistency of the personal data being processed.
              </p>
            </Section>

            <Section title="8. Outreach and Nature of Engagement">
              <p>
                HFMS may engage with users through emails (confirmation, reminders, post-event follow-ups),
                SMS, calls, app or browser notifications, in-platform messages, newsletters, alerts,
                invitations, research requests, support interactions, feedback requests, and other
                communication channels linked to the website and events.
              </p>
              <p>Such outreach is used for:</p>
              <BulletList
                items={[
                  "onboarding and registration confirmation;",
                  "account and event verification and security alerts;",
                  "responding to user-initiated queries or conversation threads;",
                  "event updates, reminders, feature announcements, and administrative notices;",
                  "event, programme, or community participation communications;",
                  "reminders, follow-ups, and response management; and",
                  "informational outreach related to The Humans First Series, only where legally permitted or based on valid consent.",
                ]}
              />
              <p>
                Users may opt out of non-essential communications through unsubscribe tools, account
                settings, or by contacting HFMS. HFMS does not send marketing or advertising communications
                unrelated to the event or The Humans First Series.
              </p>
            </Section>

            <Section title="9. Sharing and Disclosure">
              <p>
                HFMS may share personal data only on a need-to-know basis and only to the extent reasonably
                necessary with:
              </p>
              <BulletList
                items={[
                  "event and technology service providers (for example, email platforms, analytics providers such as Google Analytics, hosting providers) who assist in delivering events and maintaining the website;",
                  "professional advisers, auditors, consultants, and lawful contractors bound by confidentiality and data processing obligations;",
                  "affiliates, partners, or programme collaborators where the sharing is disclosed, necessary, and lawful;",
                  "law enforcement agencies, regulators, courts, tribunals, government authorities, or other persons where disclosure is required by law, legal process, or lawful order; and",
                  "acquirers, successors, or counterparties in connection with restructuring, merger, acquisition, or transfer of business, subject to lawful safeguards.",
                ]}
              />
              <p>
                Under applicable data protection frameworks, a data controller remains responsible for
                compliance in respect of processing undertaken by it or on its behalf by a processor, and
                engagement of a processor must be under a valid contract.
              </p>
              <p>
                HFMS does not sell or share personal data with third parties for marketing purposes.
              </p>
            </Section>

            <Section title="10. Cookies and Similar Technologies">
              <p>HFMS website uses Google Analytics and may use cookies or similar technologies to:</p>
              <BulletList
                items={[
                  "understand how visitors interact with the site;",
                  "improve website performance and user experience; and",
                  "support event management and communication needs.",
                ]}
              />
              <p>
                Google Analytics collects anonymised data such as pages visited, time spent on the site,
                device type, and approximate geographic location. This data is aggregated and does not
                identify you personally.
              </p>
              <p>
                Users may manage certain cookie preferences through browser controls or website settings,
                although disabling some cookies may affect functionality.
              </p>
            </Section>

            <Section title="11. Data Retention">
              <p>
                HFMS will retain personal data only for as long as necessary for the specified purpose for
                which it was collected, or for longer where retention is necessary to comply with law,
                enforce legal rights, resolve disputes, maintain security records, or meet legitimate
                governance and audit requirements.
              </p>
              <p>Specifically:</p>
              <BulletList
                items={[
                  "Event-related data (name, email, mobile, question, etc.) is retained until you request deletion, or until a reasonable period after the event has concluded unless you indicate that you wish to remain part of the community;",
                  "Email interaction data (opens, clicks) is retained for as long as needed to manage event communications and improve the quality of outreach, and then deleted or anonymised;",
                  "Anonymised or aggregated analytics data may be retained for longer periods to support analysis and improvement of the website.",
                ]}
              />
            </Section>

            <Section title="12. User Rights">
              <p>Subject to applicable law, users may have the right to:</p>
              <BulletList
                items={[
                  "obtain a summary of personal data being processed and related processing activities;",
                  "seek information about categories of recipients with whom personal data has been shared;",
                  "request correction, completion, or updating of inaccurate or incomplete personal data;",
                  "request erasure of personal data, subject to lawful retention needs;",
                  "withdraw consent at any time where consent is the basis of processing;",
                  "seek grievance redressal;",
                  "nominate another individual to exercise rights in the event of death or incapacity, to the extent recognised by law; and",
                  "complain to the relevant supervisory authority after exhausting the grievance redressal mechanism made available by HFMS, where applicable.",
                ]}
              />
              <p>
                To exercise any of these rights, users may use in-platform controls where available or
                contact HFMS using the details stated below.
              </p>
            </Section>

            <Section title="13. Deletion and Erasure Requests">
              <p>
                HFMS will provide users with an option to request deletion or erasure of personal data from
                the site, subject to verification of identity and subject to any lawful requirement to
                retain part or all of the information. A deletion request may lead to closure or restriction
                of the relevant account, event access, conversation access, or related services.
              </p>
              <p>
                Where HFMS is required to retain certain information for legal compliance, fraud prevention,
                dispute resolution, security, accounting, taxation, or enforcement of rights, such
                information may be retained for that limited purpose and deleted or anonymised thereafter.
              </p>
              <p>
                To request that your personal data be removed, write to <ContactLink />. HFMS will delete
                your personal data within 15 working days of receiving your request, subject to verification
                of identity and any lawful requirement to retain certain information.
              </p>
            </Section>

            <Section title="14. Accuracy of Information">
              <p>
                Users are requested to provide accurate, complete, and up-to-date information and not to
                impersonate another person or suppress material information when submitting data through
                HFMS. Relevant data protection laws place duties on users not to impersonate others, not to
                suppress material information in certain contexts, and to furnish authentic information when
                exercising correction or erasure rights.
              </p>
              <p>
                HFMS may request updated information where necessary to maintain accurate records, provide
                services, or comply with legal obligations.
              </p>
            </Section>

            <Section title="15. Children’s Privacy">
              <p>
                HFMS (The Humans First Series events and website) are not intended for children. We do not
                knowingly collect personal data from children. If we become aware that we have received
                personal data from a child without appropriate consent, we will take steps to delete such
                data.
              </p>
              <p>
                HFMS will not knowingly undertake tracking, behavioural monitoring, or targeted advertising
                directed at children where prohibited by law.
              </p>
            </Section>

            <Section title="16. Security Measures">
              <p>
                HFMS implements reasonable technical, organisational, contractual, and administrative
                safeguards to protect personal data against unauthorised access, misuse, disclosure,
                alteration, loss, or destruction. These measures may include access controls, encryption,
                secure transmission, audit logging, contractual restrictions, staff confidentiality
                obligations, and incident response procedures.
              </p>
              <p>
                Data protection laws require controllers to take reasonable security safeguards to prevent
                personal data breach and to implement appropriate technical and organisational measures for
                compliance. No system can be guaranteed absolutely secure, and users should also exercise
                caution while sharing information online.
              </p>
            </Section>

            <Section title="17. Personal Data Breach">
              <p>
                In the event of a personal data breach, HFMS will take such steps as may be required under
                applicable law, including assessment, containment, remediation, internal escalation, and
                notification to affected individuals and the competent authority where required.
              </p>
              <p>
                Applicable data protection laws may require intimation of personal data breaches to the
                supervisory authority and each affected user in the prescribed form and manner.
              </p>
            </Section>

            <Section title="18. Cross-Border Processing">
              <p>
                HFMS may use infrastructure, vendors, or support services located outside India. Where
                personal data is transferred or accessed across borders (for example, through Google
                Analytics, email platforms, or hosting providers), HFMS will do so subject to applicable law
                and any restrictions or safeguards notified by the relevant government authority.
              </p>
            </Section>

            <Section title="19. Third-Party Links and Services">
              <p>
                The HFMS website may contain links to third-party websites, embedded services, payment
                gateways, social media features, or external tools. HFMS is not responsible for the privacy
                practices, content, or security of third-party platforms not controlled by HFMS.
              </p>
              <p>
                Users should review the relevant privacy policies of such third parties before sharing
                personal data with them.
              </p>
            </Section>

            <Section title="20. Grievance Redressal and Contact Details">
              <p>
                HFMS will maintain an effective grievance redressal mechanism and publish business contact
                details of the person authorised to answer questions and address privacy-related concerns,
                as contemplated by applicable law.
              </p>
              <p>
                For the purposes of this policy, the data controller is Vineet Nayar, operating under The
                Humans First Series event brand. Any questions about your data or this policy should be
                directed to:
              </p>
              <p className="font-medium text-zinc-900">
                Privacy / Grievance Contact: The Humans First Series
                <br />
                Email: <ContactLink />
              </p>
              <p>
                Users may contact HFMS for privacy concerns, consent withdrawal, correction requests,
                deletion requests, access requests, or grievances at the above details.
              </p>
              <p>
                A user should first use HFMS&rsquo;s grievance redressal mechanism before escalating the
                matter to the relevant supervisory authority, where applicable under law.
              </p>
            </Section>

            <Section title="21. Changes to this Policy">
              <p>
                HFMS may update this Privacy Policy from time to time to reflect changes in law, website
                functionality, data practices, or event operations. The updated version may be posted on the
                website with a revised effective date.
              </p>
              <p>
                Where required, HFMS may seek renewed or updated consent for materially changed processing
                activities.
              </p>
            </Section>

            <Section title="22. Consent for Registration Page">
              <p>
                By registering for a Humans First Series event on hfmsbook.com, the user acknowledges that
                she/he/they has/have read the Privacy Policy and consents to the collection and processing
                of personal data (including name, email, optional mobile number, and a question for the
                event) for event registration, event pass issuance, event-related communications
                (confirmation, reminders, post-event follow-ups), community participation (if opted),
                website analytics via Google Analytics, and the other specified purposes disclosed on the
                platform, subject to the right to withdraw consent, seek correction, and request erasure
                within 15 working days by contacting <ContactLink />.
              </p>
            </Section>

            <p className="border-t border-zinc-200 pt-6 text-sm text-zinc-600">
              The Humans First Series is an initiative associated with the book{" "}
              <em>Humans First, Machines Second</em> by Vineet Nayar, published by Penguin Business.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
