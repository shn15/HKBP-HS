import React, { useEffect, useState } from 'react';
import { Loader2, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { isFirestoreMediaUrl, resolveTentangMediaUrl } from '../services/mediaStorage';

export function useResolvedTentangMediaUrl(src?: string) {
  const needsAsync = isFirestoreMediaUrl(src);
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => (needsAsync ? '' : src || ''));
  const [loading, setLoading] = useState<boolean>(needsAsync);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolvedUrl('');
      setLoading(false);
      setError(false);
      return;
    }

    if (!isFirestoreMediaUrl(src)) {
      setResolvedUrl(src);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    resolveTentangMediaUrl(src)
      .then((url) => {
        if (active) {
          setResolvedUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [src]);

  return { resolvedUrl, loading, error };
}

interface ResolvedTentangImageProps {
  src?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const ResolvedTentangImage: React.FC<ResolvedTentangImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  onClick,
}) => {
  const { resolvedUrl, loading, error } = useResolvedTentangMediaUrl(src);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-[#0F2447] gap-1.5">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-[10px] font-semibold text-black">Memuat foto...</span>
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-1">
        <ImageIcon className="w-5 h-5" />
        <span className="text-[10px] font-medium text-black">Foto tidak tersedia</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onClick={onClick}
    />
  );
};

interface ResolvedTentangVideoProps {
  src?: string;
  className?: string;
  title?: string;
}

export const ResolvedTentangVideo: React.FC<ResolvedTentangVideoProps> = ({
  src,
  className = 'w-full h-full object-contain bg-black',
  title,
}) => {
  const { resolvedUrl, loading, error } = useResolvedTentangMediaUrl(src);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center bg-slate-900 text-white gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-[11px] font-semibold">Memuat video dokumentasi...</span>
      </div>
    );
  }

  if (error || !resolvedUrl) {
    return (
      <div className="w-full h-full min-h-[180px] flex flex-col items-center justify-center bg-slate-900 text-white/70 gap-1.5">
        <VideoIcon className="w-6 h-6" />
        <span className="text-[11px] font-medium">Video tidak dapat dimuat</span>
      </div>
    );
  }

  return (
    <video
      src={resolvedUrl}
      controls
      playsInline
      preload="metadata"
      title={title}
      className={className}
    />
  );
};
