import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { api, type DocumentType, type EmployeeDocument } from '@/lib/api';
import { pickDocument, upload, type PickedFile } from '@/lib/media';
import { keys, useMyDocuments } from '@/lib/queries';
import { IconButton } from './Header';
import { ListGroup, ListRow, Section } from './Controls';
import { Sheet } from './Sheet';
import { Txt } from './Txt';
import { ConfirmSheet, toast } from './Feedback';
import { DocumentRow, openDocument, uploadErrorMessage } from './Media';

/**
 * The candidate's resume and certificates, on their profile.
 *
 * One resume (adding another replaces it) and any number of certificates. Nothing
 * here is required: most restaurant hiring in this market happens without a resume,
 * so the section offers, it doesn't nag. Documents are shared only with restaurants
 * the candidate applies to.
 */
export function MyDocuments() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const documents = useMyDocuments();
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [naming, setNaming] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [menu, setMenu] = useState<EmployeeDocument | null>(null);
  const [removing, setRemoving] = useState<EmployeeDocument | null>(null);

  const all = documents.data ?? [];
  const resume = all.find((d) => d.type === 'RESUME');
  const others = all.filter((d) => d.type !== 'RESUME');

  const save = async (file: PickedFile, type: DocumentType, name: string | null) => {
    setUploading(type);
    try {
      const uploadToken = await upload(file, api.profile.documentUpload);
      await api.profile.addDocument({ uploadToken, type, title: name, fileName: file.name });
      await queryClient.invalidateQueries({ queryKey: keys.myDocuments });
      toast(type === 'RESUME' ? t('documents.resumeSaved') : t('documents.saved'));
    } catch (e) {
      toast(uploadErrorMessage(e, t), 'error');
    } finally {
      setUploading(null);
    }
  };

  const choose = async (type: DocumentType) => {
    setMenu(null);
    try {
      const file = await pickDocument();
      if (!file) return;
      if (type === 'RESUME') {
        await save(file, 'RESUME', null);
      } else {
        setTitle((file.name ?? '').replace(/\.[^.]+$/, ''));
        setNaming(file);
      }
    } catch (e) {
      toast(uploadErrorMessage(e, t), 'error');
    }
  };

  const more = (d: EmployeeDocument) => (
    <IconButton icon="ellipsis-horizontal" label={t('documents.options')} color={Colors.textSecondary} onPress={() => setMenu(d)} />
  );

  return (
    <Section title={t('documents.title')}>
      <ListGroup>
        {uploading === 'RESUME' ? (
          <ListRow icon="document-attach-outline" title={t('documents.uploading')} right={<ActivityIndicator color={Colors.primary} />} />
        ) : resume ? (
          <DocumentRow document={resume} onPress={() => openDocument(resume.url)} right={more(resume)} />
        ) : (
          <ListRow icon="document-attach-outline" iconColor={Colors.primary} title={t('documents.addResume')} subtitle={t('documents.resumeHint')} onPress={() => void choose('RESUME')} />
        )}
        {others.map((d) => (
          <DocumentRow key={d.id} document={d} onPress={() => openDocument(d.url)} right={more(d)} />
        ))}
        {uploading === 'CERTIFICATE' ? (
          <ListRow icon="ribbon-outline" title={t('documents.uploading')} right={<ActivityIndicator color={Colors.primary} />} />
        ) : (
          <ListRow icon="add" iconColor={Colors.primary} title={t('documents.addCertificate')} onPress={() => void choose('CERTIFICATE')} />
        )}
      </ListGroup>
      <Txt variant="caption" color={Colors.textTertiary} style={{ marginTop: Spacing.sm }}>
        {t('documents.privacy')}
      </Txt>

      <Sheet
        visible={naming != null}
        onClose={() => setNaming(null)}
        title={t('documents.nameTitle')}
        footer={
          <Button
            label={t('common.save')}
            size="lg"
            fullWidth
            onPress={() => {
              const file = naming!;
              setNaming(null);
              void save(file, 'CERTIFICATE', title.trim() || null);
            }}
          />
        }
      >
        <TextField label={t('documents.nameLabel')} value={title} onChangeText={setTitle} placeholder={t('documents.namePlaceholder')} maxLength={150} autoFocus />
      </Sheet>

      <Sheet visible={menu != null} onClose={() => setMenu(null)} title={menu?.title ?? menu?.fileName ?? undefined}>
        <ListGroup>
          <ListRow icon="open-outline" title={t('documents.open')} onPress={() => { const d = menu!; setMenu(null); openDocument(d.url); }} />
          {menu?.type === 'RESUME' && <ListRow icon="swap-horizontal" title={t('documents.replace')} onPress={() => void choose('RESUME')} />}
          <ListRow icon="trash-outline" danger title={t('common.remove')} onPress={() => { setRemoving(menu); setMenu(null); }} />
        </ListGroup>
      </Sheet>

      <ConfirmSheet
        visible={removing != null}
        onClose={() => setRemoving(null)}
        title={t('documents.removeTitle')}
        confirmLabel={t('common.remove')}
        danger
        onConfirm={async () => {
          await api.profile.deleteDocument(removing!.id);
          await queryClient.invalidateQueries({ queryKey: keys.myDocuments });
          toast(t('media.removed'));
        }}
      />
    </Section>
  );
}
