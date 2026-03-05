import React from 'react';
import { Share2, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ url, title }) => {
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`Confira o cardápio da semana: ${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => navigator.clipboard.writeText(url).then(() => alert('Link copiado!'))}
        className="flex items-center gap-2 px-4 py-2 bg-neutral text-text-primary rounded-xl hover:bg-neutral-dark transition-colors"
      >
        <Share2 size={18} /> Copiar Link
      </button>
      <button
        onClick={handleWhatsAppShare}
        className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl hover:bg-success-dark transition-colors"
      >
        <MessageCircle size={18} /> Compartilhar no WhatsApp
      </button>
    </div>
  );
};
