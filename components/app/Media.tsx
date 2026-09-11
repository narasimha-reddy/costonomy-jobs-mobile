import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Avatar } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { ApiError, type EmployeeDocument } from '@/lib/api';
import { fileSize, pickPhoto, type PickedFile } from '@/lib/media';
import { shortDate, parseServerDate } from '@/lib/format';
import { Txt } from './Txt';
import { Sheet } from './Sheet';
import { ListGroup, ListRow } from './Controls';
import { toast } from './Feedback';

type Translate = ReturnType<typeof useT>['t'];

/**
 * The message for a failed upload. Errors raised on the phone (no network, the
 * PUT to storage failing) carry no server message, so they get copy here.
 */
export function uploadErrorMessage(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.message) return error.message;
  const code = error instanceof ApiError ? error.code : '';
  if (code === 'NETWORK') return t('media.error.network');
  if (code === 'UPLOAD_TYPE_NOT_ALLOWED') return t('media.error.type');
  if (code === 'UPLOAD_TOO_LARGE') return t('media.error.tooLarge');
  return t('media.error.failed');
}

/**
 * An avatar that changes when tapped: camera, gallery, or remove. Shows a spinner
 * over the photo while it uploads, so the old photo stays put until the new one
 * is really saved.
 */
export function EditableAvatar({
  name,
  uri,
  shape = 'circle',
  size = 'lg',
  onUpload,
  onRemove,
  editable = true,
}: {
  name: string | null | undefined;
  uri: string | null | undefined;
  shape?: 'circle' | 'rounded';
  size?: 'lg' | 'xl';
  /** Uploads and attaches the picked file. Throw to show an error. */
  onUpload: (file: PickedFile) => Promise<void>;
  onRemove: () => Promise<void>;
  editable?: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dimension = size === 'xl' ? 88 : 64;

  const run = async (work: () => Promise<void>, success: string) => {
    setOpen(false);
    setBusy(true);
    try {
      await work();
      toast(success);
    } catch (e) {
      toast(uploadErrorMessage(e, t), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Pick first, then show the spinner: the photo stays as it was while the person
  // is still choosing, and a cancelled picker changes nothing at all.
  const choose = async (source: 'camera' | 'library') => {
    setOpen(false);
    let file: PickedFile | null;
    try {
      file = await pickPhoto(source);
    } catch (e) {
      toast(uploadErrorMessage(e, t), 'error');
      return;
    }
    if (file) {
      const picked = file;
      await run(() => onUpload(picked), shape === 'circle' ? t('media.photoSaved') : t('media.logoSaved'));
    }
  };

  const avatar = (
    <View style={{ width: dimension, height: dimension }}>
      <Avatar name={name} uri={uri} size={size} shape={shape} />
      {busy && (
        <View style={[StyleSheet.absoluteFill, styles.busy, { borderRadius: shape === 'circle' ? dimension / 2 : Spacing.radiusMd }]}>
          <ActivityIndicator color={Colors.white} />
        </View>
      )}
      {editable && !busy && (
        <View style={styles.badge}>
          <Ionicons name="camera" size={14} color={Colors.white} />
        </View>
      )}
    </View>
  );

  if (!editable) return avatar;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        disabled={busy}
        activeOpacity={PRESS_OPACITY}
        accessibilityRole="button"
        accessibilityLabel={shape === 'circle' ? t('media.changePhoto') : t('media.changeLogo')}
        hitSlop={8}
      >
        {avatar}
      </TouchableOpacity>

      <Sheet visible={open} onClose={() => setOpen(false)} title={shape === 'circle' ? t('media.photoTitle') : t('media.logoTitle')}>
        <ListGroup>
          {Platform.OS !== 'web' && <ListRow icon="camera-outline" title={t('media.takePhoto')} onPress={() => void choose('camera')} />}
          <ListRow icon="images-outline" title={t('media.chooseFromGallery')} onPress={() => void choose('library')} />
          {uri ? (
            <ListRow
              icon="trash-outline"
              danger
              title={shape === 'circle' ? t('media.removePhoto') : t('media.removeLogo')}
              onPress={() => void run(onRemove, t('media.removed'))}
            />
          ) : null}
        </ListGroup>
        {shape === 'circle' && (
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: Spacing.lg }}>
            {t('media.photoHint')}
          </Txt>
        )}
      </Sheet>
    </>
  );
}

/** Opens a signed document URL in the browser or the system viewer. */
export function openDocument(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
  } else {
    void Linking.openURL(url);
  }
}

/** One document as a row: what it is, how big, when it was added. */
export function DocumentRow({
  document: d,
  onPress,
  right,
}: {
  document: EmployeeDocument;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  const { t } = useT();
  const isPdf = d.contentType === 'application/pdf';
  const title = d.title ?? d.fileName ?? (d.type === 'RESUME' ? t('documents.resume') : t('documents.certificate'));
  const added = parseServerDate(d.createdAt);
  return (
    <View style={styles.docRow}>
      <TouchableOpacity onPress={onPress} activeOpacity={PRESS_OPACITY} style={styles.doc} accessibilityRole="button" accessibilityLabel={title}>
        <View style={[styles.docIcon, { backgroundColor: isPdf ? Colors.dangerLight : Colors.accentLight }]}>
          <Ionicons name={isPdf ? 'document-text' : 'image'} size={20} color={isPdf ? Colors.danger : Colors.accentDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="body" weight="medium" numberOfLines={1}>
            {title}
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {[isPdf ? 'PDF' : t('documents.image'), fileSize(d.sizeBytes), added ? shortDate(added) : null].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        {right == null && <Ionicons name="open-outline" size={18} color={Colors.textTertiary} />}
      </TouchableOpacity>
      {/* A sibling, not a child: a button inside a button is invalid on web. */}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  busy: { backgroundColor: 'rgba(17,24,39,0.45)', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.xs },
  doc: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 64 },
  docIcon: { width: 40, height: 40, borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center' },
});
