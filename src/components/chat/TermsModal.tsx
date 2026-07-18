"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function TermsModal({ isOpen, onAccept }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Terms of Service">
      <div className="space-y-4 max-h-60 overflow-y-auto text-sm text-white/60">
        <p>By using BearTV, you agree to the following:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must be at least 18 years old to use this service.</li>
          <li>You will not share inappropriate, offensive, or illegal content.</li>
          <li>You will not harass, bully, or threaten other users.</li>
          <li>You understand that conversations are with random strangers.</li>
          <li>
            You agree to our{" "}
            <Link href="/privacy" className="text-bear-gold hover:underline" target="_blank">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/terms" className="text-bear-gold hover:underline" target="_blank">
              Terms of Service
            </Link>
            , and{" "}
            <Link href="/guidelines" className="text-bear-gold hover:underline" target="_blank">
              Community Guidelines
            </Link>
            .
          </li>
          <li>Violations may result in temporary or permanent bans.</li>
        </ul>
      </div>

      <label className="flex items-center gap-3 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="accent-bear-brown w-4 h-4"
        />
        <span className="text-sm text-white/70">I agree to the Terms of Service</span>
      </label>

      <Button
        variant="gold"
        onClick={onAccept}
        disabled={!accepted}
        className="w-full mt-4"
      >
        Continue
      </Button>
    </Modal>
  );
}
