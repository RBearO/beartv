import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-6xl mb-4">🐻</div>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-white/50 mb-8">This page wandered off into the woods.</p>
      <Link href="/">
        <Button variant="gold">Back to Home</Button>
      </Link>
    </div>
  );
}
