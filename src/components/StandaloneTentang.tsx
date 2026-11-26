import { useState } from 'react';
import { BookOpen, MapPin, Globe, ArrowLeft, Calendar, ExternalLink, Navigation, Image as ImageIcon, Video, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TentangGerejaItem, TentangMediaItem } from '../types';
import { getTentangMediaList } from '../services/mediaStorage';
import { ResolvedTentangImage, ResolvedTentangVideo } from './TentangMediaRenderer';

interface StandaloneTentangProps {
  tentangGerejaList: TentangGerejaItem[];
  onBackToMain: () => void;
}

export default function StandaloneTentang({ tentangGerejaList, onBackToMain }: StandaloneTentangProps) {
  const [lightbox, setLightbox] = useState<{ photos: TentangMediaItem[]; index: number; itemTitle: string } | null>(null);

  return (
    <div className="bg-[#F4F6FA] min-h-screen font-sans flex flex-col selection:bg-[#0F2447]/15 text-black">
      
      {/* Top Editorial Header */}
      <header className="bg-[#0F2447] text-white border-b border-[#1D3B6E] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 py-8 md:py-10 relative z-10 space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition cursor-pointer border border-white/15"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Portal Utama</span>
            </button>
            
            <span className="text-[11px] text-white/75 font-semibold tracking-widest uppercase">
              Sejarah Gereja
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4.5 pt-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white p-2 shrink-0 border border-white/25 flex items-center justify-center shadow-xs">
              <img
                src="/hkbp.png"
                alt="HKBP Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-white">
                Tentang HKBP Hinalang Silalahi
              </h1>
              <p className="text-xs text-white/75 font-medium tracking-wide">
                Resort Hinalang Silalahi · Distrik XI Toba Hasundutan
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto px-5 py-8 md:py-10 flex-1 space-y-6">
        
        {/* Intro Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 md:max-w-xl">
            <h2 className="text-sm font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0F2447]" />
              <span>Informasi Umum & Dokumentasi</span>
            </h2>
            <p className="text-xs text-black leading-relaxed font-medium">
              Selamat datang di portal informasi resmi HKBP Hinalang Silalahi. Di sini Anda dapat menemukan sejarah pendirian gereja, visi dan misi pelayanan, profil jemaat, serta foto dan video dokumentasi kegiatan pelayanan kami.
            </p>
          </div>
          <div className="flex items-center space-x-4 shrink-0 bg-[#F4F6FA] border border-slate-200 px-5 py-3 rounded-xl">
            <div className="text-center">
              <p className="text-sm font-extrabold text-black leading-none font-mono">{tentangGerejaList.length}</p>
              <p className="text-[10px] text-black font-semibold uppercase tracking-wider mt-1">Konten Aktif</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="text-center">
              <p className="text-xs font-extrabold text-black leading-none">Terpadu</p>
              <p className="text-[10px] text-black font-semibold uppercase tracking-wider mt-1">Sinkronisasi</p>
            </div>
          </div>
        </section>

        {/* Content Stream */}
        <div className="space-y-6">
          {tentangGerejaList.map((item) => {
            const mediaList = getTentangMediaList(item);
            const photoList = mediaList.filter((m) => m.type === 'image');
            const videoList = mediaList.filter((m) => m.type === 'video');

            return (
              <article 
                key={item.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-shadow duration-200 group flex flex-col"
              >
                {/* Featured Image Block */}
                {photoList.length > 0 && (
                  <div
                    onClick={() => setLightbox({ photos: photoList, index: 0, itemTitle: item.judul })}
                    className="relative w-full aspect-[21/9] bg-slate-100 overflow-hidden border-b border-slate-200 cursor-zoom-in"
                  >
                    <ResolvedTentangImage
                      src={photoList[0].url}
                      alt={photoList[0].judul || item.judul}
                      className="w-full h-full object-cover"
                    />
                    {photoList[0].judul && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#091731]/85 via-[#091731]/40 to-transparent p-4 text-white">
                        <p className="text-xs font-bold tracking-wide leading-tight">
                          {photoList[0].judul}
                        </p>
                        {photoList[0].keterangan && (
                          <p className="text-[10px] text-white/80 font-medium leading-normal mt-0.5 max-w-2xl">
                            {photoList[0].keterangan}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Text + Additional Media Block */}
                <div className="p-6 md:p-8 space-y-5">
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base md:text-lg font-extrabold text-black tracking-tight">
                        {item.judul}
                      </h3>
                      
                      {item.tanggalUpdate && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-black font-medium font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#0F2447]" />
                          <span>Update: {item.tanggalUpdate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {item.isi.split('\n\n').map((paragraph, index) => (
                      <p 
                        key={index} 
                        className="text-black leading-relaxed text-xs md:text-sm font-medium text-justify"
                        style={{ textIndent: paragraph.trim().length > 40 ? '2rem' : '0' }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Additional Photos Gallery */}
                  {photoList.length > 1 && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-extrabold text-[#0F2447] uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>Galeri Foto Dokumentasi ({photoList.length} Foto)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {photoList.map((photo, pIdx) => (
                          <div key={photo.id} className="bg-[#F4F6FA] border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                            <div
                              onClick={() => setLightbox({ photos: photoList, index: pIdx, itemTitle: item.judul })}
                              className="w-full aspect-[16/10] bg-slate-100 overflow-hidden relative cursor-zoom-in"
                            >
                              <ResolvedTentangImage
                                src={photo.url}
                                alt={photo.judul || `${item.judul} - Foto ${pIdx + 1}`}
                                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                              />
                              <span className="absolute top-2 left-2 bg-[#0F2447]/85 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                                {pIdx + 1} / {photoList.length}
                              </span>
                            </div>
                            {(photo.judul || photo.keterangan) && (
                              <div className="p-3 bg-white border-t border-slate-200 space-y-0.5">
                                {photo.judul && (
                                  <p className="text-xs font-extrabold text-black">{photo.judul}</p>
                                )}
                                {photo.keterangan && (
                                  <p className="text-[11px] text-black font-medium leading-relaxed">{photo.keterangan}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Documentation */}
                  {videoList.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-extrabold text-[#0F2447] uppercase tracking-wider flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        <span>Video Dokumentasi ({videoList.length})</span>
                      </h4>
                      <div className="space-y-4">
                        {videoList.map((video, vIdx) => (
                          <div key={video.id} className="bg-[#F4F6FA] border border-slate-200 rounded-xl overflow-hidden">
                            <div className="w-full aspect-video bg-black">
                              <ResolvedTentangVideo
                                src={video.url}
                                title={video.judul || `${item.judul} - Video ${vIdx + 1}`}
                                className="w-full h-full object-contain bg-black"
                              />
                            </div>
                            {(video.judul || video.keterangan) && (
                              <div className="p-3.5 bg-white border-t border-slate-200 space-y-0.5">
                                {video.judul && (
                                  <p className="text-xs font-extrabold text-black">{video.judul}</p>
                                )}
                                {video.keterangan && (
                                  <p className="text-[11px] text-black font-medium leading-relaxed">{video.keterangan}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {tentangGerejaList.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-black text-xs italic">
                Belum ada konten informasi tentang gereja yang dimasukkan oleh Administrator.
              </p>
            </div>
          )}
        </div>

        {/* Lightbox Foto Dokumentasi */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#0F2447] text-white px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-extrabold truncate">
                    {lightbox.photos[lightbox.index]?.judul || lightbox.itemTitle}
                  </p>
                  <p className="text-[10px] text-white/75">
                    Foto {lightbox.index + 1} dari {lightbox.photos.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative bg-black flex items-center justify-center max-h-[70vh] min-h-[260px]">
                <ResolvedTentangImage
                  src={lightbox.photos[lightbox.index]?.url}
                  alt={lightbox.photos[lightbox.index]?.judul || 'Foto Dokumentasi'}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
                {lightbox.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((prev) =>
                          prev ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length } : null
                        )
                      }
                      className="absolute left-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox((prev) =>
                          prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null
                        )
                      }
                      className="absolute right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {lightbox.photos[lightbox.index]?.keterangan && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <p className="text-xs text-black font-medium leading-relaxed">
                    {lightbox.photos[lightbox.index].keterangan}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section: Lokasi & Peta Google Maps */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-5 shadow-xs">
          <div className="space-y-1.5 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base md:text-lg font-extrabold text-black tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0F2447]" />
                <span>Lokasi Gereja HKBP Hinalang Silalahi</span>
              </h3>
              <span className="text-[11px] font-semibold text-black">
                Titik Koordinat Akurat
              </span>
            </div>
            <p className="text-xs text-black font-medium">
              Desa Hinalang Bagasan, Kecamatan Balige, Kabupaten Toba, Sumatera Utara 22312, Indonesia. (Plus Code: 897R+VP Hinalang Bagasan)
            </p>
          </div>

          <div className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1994.57!2d99.0417933!3d2.3346565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x302e04937513a287%3A0xd841b081a75a68d9!2sHKBP%20Hinalang%20Silalahi%20Lutheran%20Church!5e0!3m2!1sid!2sid!4v1720000000000!5m2!1sid!2sid"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Location - HKBP Hinalang Silalahi Lutheran Church"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <a
              href="https://maps.app.goo.gl/MsdAzCJwb64EB8eP6"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#0F2447] hover:bg-[#173361] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Buka di Google Maps</span>
            </a>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=2.3346565,99.0417933"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-[#EDF2F9] text-black border border-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>Petunjuk Arah</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-10">
        <div className="max-w-4xl mx-auto px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-black font-semibold uppercase tracking-wider">
            © {new Date().getFullYear()} HKBP Hinalang Silalahi. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToMain}
              className="text-[11px] font-bold text-black hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>Portal Jemaat</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
