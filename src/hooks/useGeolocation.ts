// Localização do aparelho: por clique, ou direto se a permissão já foi concedida.
// As coordenadas ficam apenas em estado de memória, arredondadas: nunca em storage, banco, rede
// nossa ou chave persistida. O único dado gravado é um aviso booleano (docs/SECURITY.md).
import { useCallback, useEffect, useRef, useState } from 'react';
import { GEO_PERMISSION_DENIED } from '@/constants/weather';
import { clearGeoHint, hasGeoHint, setGeoHint } from '@/lib/geoHint';
import { roundCoordinate } from '@/lib/location';
import type { Coordinates, GeolocationStatus } from '@/types/weather';

const POSITION_OPTIONS: PositionOptions = { maximumAge: 10 * 60_000, timeout: 10_000 };

// 'unknown': a Permissions API não existe ou não respondeu
type PermissionOutcome = PermissionState | 'unknown';

const queryPermission = async (): Promise<PermissionOutcome> => {
  if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown';
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'unknown';
  }
};

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
        // Concedida: guarda só o aviso; as coordenadas ficam em memória
        setGeoHint();
        if (!mounted.current) return;
        setCoords({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
        });
        setStatus('idle');
      },
      (error) => {
        // Só permissão negada apaga o aviso; timeout e sinal fraco não revogam nada
        const denied = error.code === GEO_PERMISSION_DENIED;
        if (denied) clearGeoHint();
        if (mounted.current) setStatus(denied ? 'denied' : 'failed');
      },
      POSITION_OPTIONS
    );
  }, [supported]);

  // Uma única checagem ao montar, sem clique: `granted` usa a localização direto; sem Permissions
  // API (ou sem resposta), o aviso booleano diz se já houve concessão (o navegador não pergunta
  // de novo). `prompt` e `denied` nunca disparam pedido, e o aviso velho é apagado.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void queryPermission().then((state) => {
      if (cancelled) return;
      if (state === 'granted' || (state === 'unknown' && hasGeoHint())) request();
      else clearGeoHint();
    });
    return () => {
      cancelled = true;
    };
  }, [supported, request]);

  return { coords, status, supported, request };
};
