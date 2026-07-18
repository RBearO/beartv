import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-bear-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-bear-brown flex items-center justify-center text-sm">
                🐻
              </div>
              <span className="text-lg font-bold text-white">
                Bear<span className="text-bear-gold">TV</span>
              </span>
            </div>
            <p className="text-sm text-white/40">
              Connect with people around the world through random video chat. Safe, fun, and free.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/chat" className="text-sm text-white/40 hover:text-white transition-colors">Start Chatting</Link></li>
              <li><Link href="/#features" className="text-sm text-white/40 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/#faq" className="text-sm text-white/40 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/guidelines" className="text-sm text-white/40 hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link href="/contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/profile" className="text-sm text-white/40 hover:text-white transition-colors">Settings</Link></li>
              <li><Link href="/report" className="text-sm text-white/40 hover:text-white transition-colors">Report History</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} BearTV. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
