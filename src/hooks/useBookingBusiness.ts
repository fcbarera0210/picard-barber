import { useEffect, useState } from 'react';

type BusinessData = {
  businessName: string;
  whatsappBookingTemplate: string | null;
};

let cached: BusinessData | null = null;
let fetchPromise: Promise<BusinessData> | null = null;

async function fetchBusiness(): Promise<BusinessData> {
  if (cached) return cached;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/business')
    .then(async (res) => {
      const data = await res.json();
      const result: BusinessData = {
        businessName: data.business?.name ?? 'Picard Barber',
        whatsappBookingTemplate: data.business?.whatsappMessageTemplate ?? null,
      };
      cached = result;
      return result;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useBookingBusiness() {
  const [businessName, setBusinessName] = useState(cached?.businessName ?? 'Picard Barber');
  const [whatsappBookingTemplate, setWhatsappBookingTemplate] = useState<string | null>(
    cached?.whatsappBookingTemplate ?? null,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;

    fetchBusiness().then((data) => {
      if (cancelled) return;
      setBusinessName(data.businessName);
      setWhatsappBookingTemplate(data.whatsappBookingTemplate);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { businessName, whatsappBookingTemplate, loading };
}
