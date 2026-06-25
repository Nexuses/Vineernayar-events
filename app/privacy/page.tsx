import Link from "next/link";
import { Footer } from "@/app/components/Footer";

const CONTACT_EMAIL = "contact@hfmsbook.com";

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
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">What we collect</h2>
              <p className="mt-3">
                When you register for a Humans First Series event, we collect the following information:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Your name and email address</li>
                <li>
                  Your mobile number (optional — shared only if you wish to be part of the community later)
                </li>
                <li>Whether you have worked with Vineet Nayar previously</li>
                <li>A question you would like to ask at the event</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Why we collect it</h2>
              <p className="mt-3">We collect this information solely to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Confirm and manage your event registration</li>
                <li>Send you your event pass and communications related to the event</li>
                <li>Understand our attendee community better</li>
                <li>Facilitate a more meaningful conversation at the event</li>
              </ul>
              <p className="mt-3">
                We do not use your information for advertising. We do not sell or share your data with third
                parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">How long we keep it</h2>
              <p className="mt-3">
                We retain your information until you request deletion. To request that your data be removed,
                write to us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-zinc-900 underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                and we will delete it within 7 working days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Communications you may receive</h2>
              <p className="mt-3">
                By registering, you agree to receive event-related emails, including your confirmation,
                reminders, and a post-event follow-up from The Humans First Series. You can opt out at any
                time by replying to any of these emails.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Your rights</h2>
              <p className="mt-3">
                You have the right to access the information we hold about you, request corrections, or ask us
                to delete it entirely. Write to us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-zinc-900 underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                and we will respond within 7 working days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">Contact</h2>
              <p className="mt-3">
                For any questions about this policy or your data, reach us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-zinc-900 underline">
                  {CONTACT_EMAIL}
                </a>
                .
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
