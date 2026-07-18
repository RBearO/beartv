"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Nudity or sexual content",
  "Harassment or bullying",
  "Spam or advertising",
  "Underage user",
  "Other",
];

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, description);
    setReason("");
    setDescription("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report User">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/70 mb-2">Reason</label>
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  reason === r ? "bg-bear-brown/20 border border-bear-brown/50" : "bg-white/5 border border-transparent hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-bear-brown"
                />
                <span className="text-sm text-white/80">{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Additional details (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-bear-brown/50 resize-none"
            placeholder="Describe what happened..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={!reason} className="flex-1">
            Submit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
