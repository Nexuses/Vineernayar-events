import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="public-light min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-zinc-600 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900">
          Privacy Policy
        </h1>
        <p className="mt-4 text-zinc-600">
          This is a placeholder. Add your privacy policy content here.
        </p>
      </div>
    </div>
  );
}
