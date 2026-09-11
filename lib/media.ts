import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { ApiError, type UploadTicket } from '@/lib/api';

export interface PickedFile {
  uri: string;
  mimeType: string;
  name: string | null;
}

/** Longest edge of an uploaded photo. Enough for an avatar at 3x, a few hundred KB as JPEG. */
const PHOTO_EDGE = 720;

/**
 * A square photo from the camera or the gallery, resized and re-encoded as JPEG
 * on the phone. That turns a 4 MB camera photo into ~150 KB before it touches a
 * prepaid data plan, and turns HEIC (which the API doesn't accept) into JPEG.
 *
 * Returns null when the person cancels or refuses permission — neither is an error
 * worth a message.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<PickedFile | null> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted && Platform.OS !== 'web') return null;

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > PHOTO_EDGE) {
    context.resize(asset.width >= asset.height ? { width: PHOTO_EDGE } : { height: PHOTO_EDGE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  return { uri: saved.uri, mimeType: 'image/jpeg', name: 'photo.jpg' };
}

const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** A PDF, or a photo of a document. Null when cancelled. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: DOCUMENT_TYPES, copyToCacheDirectory: true, multiple: false });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const mimeType = asset.mimeType ?? guessType(asset.name);
  if (!DOCUMENT_TYPES.includes(mimeType)) {
    throw new ApiError('UPLOAD_TYPE_NOT_ALLOWED', '', 422);
  }
  return { uri: asset.uri, mimeType, name: asset.name ?? null };
}

/**
 * Uploads a file the way every upload works here: ask the API for a signed URL,
 * PUT the bytes straight to storage, and return the token that attaches it.
 * The API never sees the bytes in production — they go phone → bucket.
 */
export async function upload(file: PickedFile, start: (contentType: string, sizeBytes: number) => Promise<UploadTicket>): Promise<string> {
  let blob: Blob;
  try {
    blob = await (await fetch(file.uri)).blob();
  } catch {
    throw new ApiError('NETWORK', '', 0);
  }
  const ticket = await start(file.mimeType, blob.size);

  let response: Response;
  try {
    response = await fetch(ticket.uploadUrl, { method: ticket.method, headers: ticket.headers, body: blob });
  } catch {
    throw new ApiError('NETWORK', '', 0);
  }
  if (!response.ok) {
    throw new ApiError(response.status === 413 ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_NOT_FOUND', '', response.status);
  }
  return ticket.uploadToken;
}

function guessType(name: string | null | undefined): string {
  const ext = name?.split('.').pop()?.toLowerCase();
  return ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : '';
}

/** "240 KB", "1.2 MB". */
export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
