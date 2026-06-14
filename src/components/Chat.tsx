import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
  type Message,
} from "@/lib/messages";
import { colors, font, radius } from "@/theme/theme";

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Fil de discussion : `eventId` null = canal d'équipe, sinon forum d'un événement. */
export function Chat({
  eventId = null,
  bottomInset = true,
}: {
  eventId?: string | null;
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const meId = profile?.id;
  const myName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.login ||
    "Moi";

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let active = true;
    fetchMessages(eventId).then((m) => active && setMessages(m));
    const unsub = subscribeMessages((m) => {
      setMessages((prev) => {
        const list = prev ?? [];
        if (list.some((x) => x.id === m.id)) return list;
        return [...list, m];
      });
    }, eventId);
    return () => {
      active = false;
      unsub();
    };
  }, [eventId]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await sendMessage(myName, body, eventId);
    setSending(false);
    if (error) {
      setDraft(body);
      return;
    }
    fetchMessages(eventId).then(setMessages);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {messages === null ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.vertLt} />
        </View>
      ) : messages.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyTxt}>Pas de discussion</Text>
          <Text style={s.emptySub}>Sois le premier à poster un message !</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const mine = item.senderId === meId;
            const prev = messages[index - 1];
            const showName = !mine && (!prev || prev.senderId !== item.senderId);
            return (
              <View style={[s.bubbleWrap, mine ? s.wrapMine : s.wrapTheirs]}>
                {showName && <Text style={s.sender}>{item.senderName}</Text>}
                <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                  <Text style={[s.body, mine && { color: colors.ink2 }]}>
                    {item.body}
                  </Text>
                </View>
                <Text style={s.time}>{fmtTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
      )}

      <View
        style={[s.inputBar, { paddingBottom: (bottomInset ? insets.bottom : 0) + 10 }]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Écris un message…"
          placeholderTextColor={colors.txtDim}
          style={s.input}
          multiline
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim() || sending}
          style={[s.sendBtn, (!draft.trim() || sending) && { opacity: 0.5 }]}
        >
          <Text style={s.sendTxt}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { fontFamily: font.cond, fontSize: 16, color: colors.txt, textTransform: "uppercase" },
  emptySub: { fontFamily: font.bodyMed, fontSize: 13, color: colors.txtDim },

  bubbleWrap: { maxWidth: "82%" },
  wrapMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  sender: { fontFamily: font.condSemi, fontSize: 11, color: colors.or, marginBottom: 3, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: colors.or, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderBottomLeftRadius: 4,
  },
  body: { fontFamily: font.body, fontSize: 14.5, color: colors.txt, lineHeight: 19 },
  time: { fontSize: 10, color: colors.txtDim, marginTop: 3, marginHorizontal: 4 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gris3,
    backgroundColor: colors.ink2,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.gris2,
    borderWidth: 1,
    borderColor: colors.gris3,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.txt,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.or,
    alignItems: "center",
    justifyContent: "center",
  },
  sendTxt: { color: colors.ink2, fontSize: 18, fontFamily: font.condBlack },
});
