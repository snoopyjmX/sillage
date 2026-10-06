// Localização do aparelho, só por clique (ou se a permissão já estiver "granted").
// As coordenadas ficam apenas em estado de memória, arredondadas: nunca em storage, banco, rede
// nossa ou chave persistida (docs/SECURITY.md).
import { useCallback, useEffect, useRef, useState } from 'react';
import { roundCoordinate } from '@/lib/location';
import type { Coordinates, GeolocationStatus } from '@/types/weather';

const POSITION_OPTIONS: PositionOptions = { maximumAge: 10 * 60_000, timeout: 10_000 };

export const useGeolocation = () => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const request = useCallback(() => {
    if (!supported) {
      setStatus('denied');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted.current) return;
        setCoords({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
        });
        setStatus('idle');
      },
      () => {
        if (mounted.current) setStatus('denied');
      },
      POSITION_OPTIONS
    );
  }, [supported]);

  // Permissão já concedida antes: pode usar direto, sem novo clique
  useEffect(() => {
    if (!supported || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (!cancelled && result.state === 'granted') request();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [supported, request]);

  const clear = useCallback(() => setCoords(null), []);

  return { coords, status, supported, request, clear };
};
