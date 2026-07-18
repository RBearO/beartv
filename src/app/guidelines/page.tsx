import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "Community Guidelines — BearTV" };

export default function GuidelinesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Community Guidelines</h1>
          <div className="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              BearTV is for respectful, consensual conversations between adults.
              You must be at least 18 years old to use the service.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">Be respectful</h2>
            <p>
              Treat others the way you want to be treated. Harassment, hate speech,
              threats, and bullying are not allowed.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">Keep it appropriate</h2>
            <p>
              Do not share sexual content with unwilling partners, expose yourself,
              or pressure others. Nudity and sexual activity that violates our
              Terms may result in an immediate ban.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">No illegal activity</h2>
            <p>
              Do not use BearTV for scams, spam, phishing, or any illegal purpose.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">Privacy</h2>
            <p>
              Do not record or share someone else&apos;s video or personal information
              without their clear consent. We do not store video or audio streams.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">Report problems</h2>
            <p>
              Use the in-chat Report button when someone breaks these rules.
              Moderators review reports and may ban accounts that violate them.
            </p>
            <h2 className="text-lg font-semibold text-white mt-8">Age requirement</h2>
            <p>
              BearTV is 18+. Accounts belonging to minors will be removed when discovered.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
