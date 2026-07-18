import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "Terms of Service — BearTV" };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
          <div className="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <h2 className="text-lg font-semibold text-white mt-8">1. Acceptance of Terms</h2>
            <p>By accessing BearTV, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            <h2 className="text-lg font-semibold text-white mt-8">2. Eligibility</h2>
            <p>You must be at least 18 years old to use BearTV. By using our service, you represent that you meet this requirement.</p>
            <h2 className="text-lg font-semibold text-white mt-8">3. Acceptable Use</h2>
            <p>You agree not to share inappropriate content, harass other users, spam, impersonate others, or engage in any illegal activity on the platform.</p>
            <h2 className="text-lg font-semibold text-white mt-8">4. Moderation</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. Reports are reviewed by our moderation team.</p>
            <h2 className="text-lg font-semibold text-white mt-8">5. Disclaimer</h2>
            <p>BearTV is provided &quot;as is&quot; without warranties. We are not responsible for user-generated content or interactions between users.</p>
            <h2 className="text-lg font-semibold text-white mt-8">6. Contact</h2>
            <p>Questions about these terms? Contact legal@beartv.com.</p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
