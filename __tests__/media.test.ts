jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('expo-document-picker', () => ({}));

import { fileSize, upload } from '@/lib/media';

const ticket = { uploadToken: 'tok', uploadUrl: 'https://bucket/put', method: 'PUT' as const, headers: { 'Content-Type': 'image/jpeg' }, expiresAt: '' };

describe('upload', () => {
  it('asks for a ticket with the real size, PUTs the bytes, and returns the token', async () => {
    const blob = { size: 1234 } as Blob;
    const calls: string[] = [];
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      return url.startsWith('file:') ? ({ blob: async () => blob } as Response) : ({ ok: true, status: 200 } as Response);
    }) as unknown as typeof fetch;
    const start = jest.fn(async () => ticket);

    await expect(upload({ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', name: 'photo.jpg' }, start)).resolves.toBe('tok');
    expect(start).toHaveBeenCalledWith('image/jpeg', 1234);
    expect(calls).toEqual(['GET file:///photo.jpg', 'PUT https://bucket/put']);
  });

  it('turns a refused PUT into an error the screen can explain', async () => {
    global.fetch = jest.fn(async (url: string) =>
      url.startsWith('file:') ? ({ blob: async () => ({ size: 10 }) } as Response) : ({ ok: false, status: 413 } as Response),
    ) as unknown as typeof fetch;
    await expect(upload({ uri: 'file:///big.pdf', mimeType: 'application/pdf', name: null }, async () => ticket))
      .rejects.toMatchObject({ code: 'UPLOAD_TOO_LARGE' });
  });

  it('shows sizes the way a person reads them', () => {
    expect(fileSize(900)).toBe('1 KB');
    expect(fileSize(240 * 1024)).toBe('240 KB');
    expect(fileSize(1.2 * 1024 * 1024)).toBe('1.2 MB');
  });
});
