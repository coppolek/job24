import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Banner } from '../types';

export function BannerDisplay() {
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const q = query(collection(db, 'banners'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        setActiveBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
      } catch (error) {
        console.error("Error fetching banners", error);
      }
    }
    fetchBanners();
  }, []);

  if (activeBanners.length === 0) return null;

  return (
    <div className="w-full bg-[#1E293B] flex flex-col items-center">
      {activeBanners.map((banner, index) => (
        <a 
          key={banner.id} 
          href={banner.linkUrl || '#'} 
          target={banner.linkUrl ? "_blank" : "_self"}
          rel="noreferrer"
          className={`block w-full text-center py-3 px-4 ${index > 0 ? 'border-t border-[#334155]' : ''} hover:bg-[#334155] transition-colors`}
        >
          {banner.imageUrl && (
            <img src={banner.imageUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />
          )}
          <span className="text-white text-sm font-bold tracking-wide">{banner.title}</span>
        </a>
      ))}
    </div>
  );
}
