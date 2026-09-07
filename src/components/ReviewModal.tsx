import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
  applicationId: string;
  reviewerId: string;
  revieweeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ applicationId, reviewerId, revieweeId, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Seleziona almeno una stella.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use a consistent ID format: applicationId_reviewerId to ensure one review per application per reviewer
      const reviewId = `${applicationId}_${reviewerId}`;
      
      await setDoc(doc(db, 'reviews', reviewId), {
        applicationId,
        reviewerId,
        revieweeId,
        rating,
        comment,
        createdAt: Date.now()
      });
      
      onSuccess();
    } catch (error) {
      console.error("Errore salvataggio recensione", error);
      alert("Si è verificato un errore durante l'invio della recensione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[#F1F5F9]">
          <h3 className="font-bold text-lg text-[#0F172A]">Lascia una Recensione</h3>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-[#1E293B] mb-2">Commento (Opzionale)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border-[#E2E8F0] py-2 px-3 text-sm focus:ring-[#2563EB] h-24 resize-none border shadow-sm"
              placeholder="Scrivi qui la tua esperienza..."
              maxLength={1000}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] text-sm font-bold rounded-lg text-[#64748B] hover:bg-[#F8FAFC]"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {isSubmitting ? 'Invio...' : 'Invia Recensione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
