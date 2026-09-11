import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { PRESS_OPACITY } from '@/constants/motion';
import { WEB_NO_OUTLINE } from '@/constants/platform';
import { Avatar } from '@/components/ui';
import { IconButton } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, ErrorView, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type ChatMessage, type ChatThread } from '@/lib/api';
import { dayLabel, parseServerDate, timeLabel } from '@/lib/format';
import { keys } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { useFontFamily } from '@/hooks/useFontFamily';

/** How often an open thread asks for new messages. Only while the screen is focused. */
const POLL_MS = 5000;

type Pending = { key: string; body: string; failed: boolean };
type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage; seen: boolean }
  | { kind: 'pending'; key: string; pending: Pending };

/**
 * One conversation about one application. Plain and fast: text only, newest at
 * the bottom, new messages every few seconds while it is open, and a message that
 * fails to send stays on screen with a tap to retry rather than disappearing.
 */
export default function Thread() {
  const { t } = useT();
  const { font } = useFontFamily();
  const { role } = useSession();
  const { applicationId: raw } = useLocalSearchParams<{ applicationId: string }>();
  const applicationId = Number(raw);
  const queryClient = useQueryClient();

  const [thread, setThread] = useState<Omit<ChatThread, 'messages'> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [text, setText] = useState('');
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const lastId = useRef<number | undefined>(undefined);

  const merge = useCallback((incoming: ChatMessage[], where: 'append' | 'prepend') => {
    if (!incoming.length) return;
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      const next = where === 'append' ? [...current, ...fresh] : [...fresh, ...current];
      lastId.current = next.length ? next[next.length - 1]!.id : undefined;
      return next;
    });
  }, []);

  const refreshLists = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    void queryClient.invalidateQueries({ queryKey: keys.unread });
    void queryClient.invalidateQueries({ queryKey: keys.notifications });
  }, [queryClient]);

  const markRead = useCallback(() => {
    api.messages.markRead(applicationId).then(refreshLists).catch(() => {});
  }, [applicationId, refreshLists]);

  // First load.
  useEffect(() => {
    let live = true;
    api.messages
      .thread(applicationId)
      .then(({ messages: first, ...meta }) => {
        if (!live) return;
        setThread(meta);
        merge(first, 'append');
        markRead();
      })
      .catch((e) => live && setError(e));
    return () => {
      live = false;
    };
  }, [applicationId, merge, markRead]);

  // New messages while the screen is in front.
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(async () => {
        if (!thread) return;
        try {
          const { messages: newer, ...meta } = await api.messages.thread(applicationId, lastId.current ? { afterId: lastId.current } : {});
          setThread((current) => (current ? { ...current, open: meta.open, counterpartReadAt: meta.counterpartReadAt } : meta));
          merge(newer, 'append');
          if (newer.some((m) => !m.mine)) markRead();
        } catch {
          /* the offline banner says why; the next tick tries again */
        }
      }, POLL_MS);
      return () => clearInterval(timer);
    }, [applicationId, thread != null, merge, markRead]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadEarlier = async () => {
    if (!thread?.hasEarlier || loadingEarlier || !messages.length) return;
    setLoadingEarlier(true);
    try {
      const { messages: older, hasEarlier } = await api.messages.thread(applicationId, { beforeId: messages[0]!.id });
      merge(older, 'prepend');
      setThread((current) => (current ? { ...current, hasEarlier } : current));
    } finally {
      setLoadingEarlier(false);
    }
  };

  const deliver = async (item: Pending) => {
    setPending((list) => list.map((p) => (p.key === item.key ? { ...p, failed: false } : p)));
    try {
      const sent = await api.messages.send(applicationId, item.body);
      setPending((list) => list.filter((p) => p.key !== item.key));
      merge([sent], 'append');
      refreshLists();
    } catch (e) {
      setPending((list) => list.map((p) => (p.key === item.key ? { ...p, failed: true } : p)));
      toast(errorMessage(e, t('messages.sendFailed')), 'error');
    }
  };

  const send = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    const item = { key: `pending-${Date.now()}`, body, failed: false };
    setPending((list) => [...list, item]);
    void deliver(item);
  };

  // Oldest first with day headers, then reversed for the inverted list.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay = '';
    const readAt = parseServerDate(thread?.counterpartReadAt);
    const lastMine = [...messages].reverse().find((m) => m.mine);
    for (const m of messages) {
      const at = parseServerDate(m.createdAt);
      const day = at ? at.toDateString() : '';
      if (day !== lastDay && at) {
        out.push({ kind: 'day', key: `day-${day}`, label: dayLabel(at) });
        lastDay = day;
      }
      out.push({ kind: 'message', key: `m-${m.id}`, message: m, seen: m === lastMine && readAt != null && at != null && readAt >= at });
    }
    for (const p of pending) out.push({ kind: 'pending', key: p.key, pending: p });
    return out.reverse();
  }, [messages, pending, thread?.counterpartReadAt]);

  if (error) return <ErrorView error={error} onRetry={() => router.replace(`/messages/${applicationId}`)} />;
  if (!thread) return <Loading />;

  const openApplication = () =>
    router.push(role === 'restaurant' ? `/hiring/applications/${applicationId}` : `/applications/${applicationId}`);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.fill}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <TouchableOpacity onPress={openApplication} activeOpacity={PRESS_OPACITY} style={styles.who} accessibilityRole="button">
          <Avatar name={thread.counterpartName} uri={thread.counterpartPhotoUrl} size="sm" shape={role === 'restaurant' ? 'circle' : 'rounded'} />
          <View style={{ flex: 1 }}>
            <Txt variant="subheading" numberOfLines={1}>
              {thread.counterpartName ?? t('common.deletedAccount')}
            </Txt>
            <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
              {thread.jobTitle}
            </Txt>
          </View>
        </TouchableOpacity>
        <IconButton icon="ellipsis-horizontal" label={t('documents.options')} onPress={() => setMenu(true)} />
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          onEndReached={loadEarlier}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loadingEarlier ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.md }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.textTertiary} />
              <Txt variant="body" color={Colors.textSecondary} align="center">
                {role === 'restaurant' ? t('messages.start.restaurant') : t('messages.start.candidate')}
              </Txt>
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === 'day') {
              return (
                <Txt variant="micro" color={Colors.textTertiary} align="center" style={styles.day}>
                  {item.label}
                </Txt>
              );
            }
            if (item.kind === 'pending') {
              return (
                <TouchableOpacity
                  disabled={!item.pending.failed}
                  onPress={() => void deliver(item.pending)}
                  style={[styles.bubble, styles.mine, { opacity: item.pending.failed ? 1 : 0.6 }]}
                  accessibilityRole={item.pending.failed ? 'button' : undefined}
                >
                  <Txt variant="body" color={Colors.white}>
                    {item.pending.body}
                  </Txt>
                  <Txt variant="micro" color={Colors.white} style={styles.meta}>
                    {item.pending.failed ? t('messages.tapToRetry') : t('messages.sending')}
                  </Txt>
                </TouchableOpacity>
              );
            }
            const m = item.message;
            const at = parseServerDate(m.createdAt);
            // On a team, whose reply it was matters; to a candidate it is the restaurant talking.
            const showName = !m.mine && role === 'candidate' && m.senderName;
            return (
              <View style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
                {showName ? (
                  <Txt variant="micro" color={Colors.accentDark} style={{ marginBottom: 2 }}>
                    {m.senderName}
                  </Txt>
                ) : null}
                <Txt variant="body" color={m.mine ? Colors.white : Colors.textPrimary} selectable>
                  {m.body}
                </Txt>
                <Txt variant="micro" color={m.mine ? 'rgba(255,255,255,0.8)' : Colors.textTertiary} style={styles.meta}>
                  {[at ? timeLabel(at) : null, item.seen ? t('messages.seen') : null].filter(Boolean).join(' · ')}
                </Txt>
              </View>
            );
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {thread.open ? (
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('messages.placeholder')}
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={1000}
              style={[styles.input, { fontFamily: font('regular') }]}
              accessibilityLabel={t('messages.placeholder')}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!text.trim()}
              activeOpacity={PRESS_OPACITY}
              style={[styles.send, !text.trim() && { backgroundColor: Colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={t('messages.send')}
            >
              <Ionicons name="arrow-up" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closed}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
            <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
              {t('messages.closed')}
            </Txt>
          </View>
        )}
      </KeyboardAvoidingView>

      <Sheet visible={menu} onClose={() => setMenu(false)} title={thread.counterpartName ?? undefined}>
        <ListGroup>
          <ListRow icon="document-text-outline" title={t('messages.viewApplication')} onPress={() => { setMenu(false); openApplication(); }} />
          <ListRow icon="flag-outline" title={t('messages.report')} danger onPress={() => { setMenu(false); setReporting(true); }} />
        </ListGroup>
      </Sheet>

      <ConfirmSheet
        visible={reporting}
        onClose={() => setReporting(false)}
        title={t('messages.report')}
        body={t('messages.reportBody')}
        confirmLabel={t('messages.reportSend')}
        danger
        reasonPlaceholder={t('messages.reportReason')}
        onConfirm={async (reason) => {
          await api.messages.report(applicationId, reason || t('messages.report'));
          toast(t('messages.reported'));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  list: { padding: Spacing.lg, gap: Spacing.sm, flexGrow: 1 },
  day: { alignSelf: 'center', marginVertical: Spacing.sm, textTransform: 'uppercase' },
  bubble: { maxWidth: '80%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 18 },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: Colors.borderLight },
  meta: { marginTop: 2, alignSelf: 'flex-end' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl, transform: [{ scaleY: -1 }] },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingLeft: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    ...WEB_NO_OUTLINE,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSunken,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  closed: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Colors.surfaceSunken },
});
