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
              The Humans First Series is an initiative associated with the book{" "}
              <em>Humans First, Machines Second</em> by Vineet Nayar, published by Penguin Business. This
              policy explains how we collect, use, and protect your personal information when you register
              for a Humans First Series event or interact with our website at{" "}
              <a
                href="https://hfmsbook.com"
                className="font-medium text-zinc-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                hfmsbook.com
              </a>
              .
            </p>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">1. Who We Are</h2>
              <p className="mt-3">
                For the purposes of this policy, the data controller is Vineet Nayar, operating under The
                Humans First Series event brand. Any questions about your data should be directed to us at{" "}
                <ContactLink />.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">2. What We Collect</h2>
              <p className="mt-3">We collect information through three channels:</p>

              <h3 className="mt-5 font-semibold text-zinc-900">a) Event Registration</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Your name and email address</li>
                <li>
                  Your mobile number (optional, shared only if you wish to be part of the community)
                </li>
                <li>Whether you have worked with Vineet Nayar previously</li>
                <li>A question you would like to ask at the event</li>
              </ul>

              <h3 className="mt-5 font-semibold text-zinc-900">b) Email Communications</h3>
              <p className="mt-3">
                When you receive and interact with our event emails (confirmation, reminders, post-event
                follow-ups), we may collect data on email opens and link clicks. This is used solely to
                manage your registration and communications.
              </p>

              <h3 className="mt-5 font-semibold text-zinc-900">c) Website Analytics (Google Analytics)</h3>
              <p className="mt-3">
                Our website at hfmsbook.com uses Google Analytics to understand how visitors interact with
                our site. Google Analytics collects anonymised data such as pages visited, time spent on the
                site, device type, and approximate geographic location. This data is aggregated and does not
                identify you personally.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">3. Why We Collect It</h2>
              <p className="mt-3">We collect this information solely to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Confirm and manage your event registration</li>
                <li>Send you your event pass and communications related to the event</li>
                <li>Understand our attendee community better</li>
                <li>Facilitate a more meaningful conversation at the event</li>
                <li>Improve our website experience (Google Analytics)</li>
              </ul>
              <p className="mt-3">
                We do not use your information for advertising. We do not sell or share your personal data
                with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">4. How Long We Keep It</h2>
              <p className="mt-3">
                We retain your information until you request deletion. To request that your data be removed,
                write to us at <ContactLink /> and we will delete it within 7 working days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">5. Communications You May Receive</h2>
              <p className="mt-3">
                By registering, you agree to receive event-related emails, including your confirmation,
                reminders, and a post-event follow-up from The Humans First Series. You can opt out at any
                time by replying to any of these emails.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">6. Your Rights</h2>
              <p className="mt-3">You have the right to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Access the information we hold about you</li>
                <li>Request corrections to any inaccurate information</li>
                <li>Ask us to delete your data entirely</li>
              </ul>
              <p className="mt-3">
                Write to us at <ContactLink /> and we will respond within 7 working days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">7. Contact</h2>
              <p className="mt-3">
                For any questions about this policy or your data, reach us at <ContactLink />.
              </p>
            </section>

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
