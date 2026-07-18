import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = { title: "Privacy Policy — BearTV" };

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <article className="max-w-3xl mx-auto prose prose-invert">
          <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
          <div className="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <h2 className="text-lg font-semibold text-white mt-8">Information We Collect</h2>
            <p>We collect information you provide directly, including your email address, display name, profile settings, and chat reports. We do not record or store video conversations.</p>
            <h2 className="text-lg font-semibold text-white mt-8">How We Use Information</h2>
            <p>Your information is used to provide and improve BearTV services, maintain community safety through moderation, and communicate important updates.</p>
            <h2 className="text-lg font-semibold text-white mt-8">Data Security</h2>
            <p>Video chats use peer-to-peer WebRTC encryption. We implement industry-standard security measures including rate limiting, CAPTCHA verification, and encrypted connections.</p>
            <h2 className="text-lg font-semibold text-white mt-8">Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting us at privacy@beartv.com.</p>
            <h2 className="text-lg font-semibold text-white mt-8">Contact</h2>
            <p>For privacy-related inquiries, email privacy@beartv.com.</p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
