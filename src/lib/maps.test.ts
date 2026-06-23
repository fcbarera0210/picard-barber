import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildGoogleMapsEmbedUrl,
  extractCoordsFromMapsUrl,
  isShortGoogleMapsUrl,
  resolveMapCoords,
  resolveMapEmbedUrl,
  resolveGoogleMapsUrl,
  toGoogleMapsLink,
} from './maps';

const PLACE_URL =
  'https://www.google.com/maps/place/Test/@-34.9686051,-71.226474,17z/data=!3m7!1e1!3m5!1sabc!8m2!3d-34.9886487!4d-71.240891';

describe('extractCoordsFromMapsUrl', () => {
  it('prefers precise !3d !4d coordinates', () => {
    expect(extractCoordsFromMapsUrl(PLACE_URL)).toEqual({
      lat: -34.9886487,
      lng: -71.240891,
    });
  });
});

describe('buildGoogleMapsEmbedUrl', () => {
  it('builds Google embed from coords', () => {
    const result = buildGoogleMapsEmbedUrl({ coords: { lat: -33.4, lng: -70.6 } });
    expect(result).toBe('https://maps.google.com/maps?q=-33.4,-70.6&z=16&hl=es&output=embed');
  });

  it('builds embed from address query', () => {
    const result = buildGoogleMapsEmbedUrl({ query: '2160 Volcán Antuco' });
    expect(result).toContain('maps.google.com/maps?q=');
    expect(result).toContain('output=embed');
  });
});

describe('resolveGoogleMapsUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('follows short link redirects', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: PLACE_URL,
    } as Response);

    await expect(resolveGoogleMapsUrl('https://maps.app.goo.gl/abc123')).resolves.toBe(PLACE_URL);
  });
});

describe('resolveMapEmbedUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses official Google embed URLs directly', async () => {
    const url = 'https://www.google.com/maps/embed?pb=abc123';
    await expect(resolveMapEmbedUrl(url, 'Calle 1')).resolves.toBe(url);
  });

  it('uses Google embed for resolved short links', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: PLACE_URL,
    } as Response);

    const result = await resolveMapEmbedUrl('https://maps.app.goo.gl/xyz789');
    expect(result).toMatch(/^https:\/\/maps\.google\.com\/maps\?q=-34\.9886487,-71\.240891/);
    expect(result).toContain('output=embed');
  });

  it('falls back to address query when resolution fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));

    const result = await resolveMapEmbedUrl(
      'https://maps.app.goo.gl/fail-unique-id',
      '2160 Volcán Antuco',
    );
    expect(result).toContain(encodeURIComponent('2160 Volcán Antuco'));
    expect(result).toContain('maps.google.com/maps');
  });
});

describe('resolveMapCoords', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts coords from resolved short URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      url: PLACE_URL,
    } as Response);

    await expect(resolveMapCoords('https://maps.app.goo.gl/test-coords')).resolves.toEqual({
      lat: -34.9886487,
      lng: -71.240891,
    });
  });
});

describe('isShortGoogleMapsUrl', () => {
  it('detects maps.app.goo.gl', () => {
    expect(isShortGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);
  });
});

describe('toGoogleMapsLink', () => {
  it('prefers mapsUrl when provided', () => {
    const url = 'https://maps.google.com/?q=test';
    expect(toGoogleMapsLink(url, 'Calle 123')).toBe(url);
  });
});
