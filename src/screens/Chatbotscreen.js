// screens/ChatbotScreen.js

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/Authcontext";
import chatbotService from "../services/ChatbotService";

// ── Design tokens (cohérent avec DashboardScreen) ────────────────────
const C = {
  orange: "#FF5A3C",
  orangeDim: "#FF5A3C18",
  blue: "#3B82F6",
  blueDim: "#3B82F618",
  red: "#EF4444",
  green: "#22C55E",
  bg: "#F8F9FB",
  card: "#FFFFFF",
  border: "#E8EAF0",
  text: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  botBubble: "#F0F2F8",
  userBubble: "#FF5A3C",
};

// ── Intent → icône ────────────────────────────────────────────────────
const INTENT_ICON = {
  system_status: "shield-checkmark-outline",
  temperature: "thermometer-outline",
  alerts: "warning-outline",
  alert_history: "time-outline",
  emergency: "flame-outline",
  zones: "home-outline",
  sensors: "radio-outline",
  default: "chatbubble-ellipses-outline",
};
const getIntentIcon = (intent = "") =>
  INTENT_ICON[(intent || "").toLowerCase()] ?? INTENT_ICON.default;

// ── Typing indicator (3 dots pulsing) ────────────────────────────────
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 160);
    const a3 = animate(dot3, 320);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      <View style={styles.botAvatarSmall}>
        <Ionicons name="shield-outline" size={12} color={C.orange} />
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
};

// ── Message bubble ────────────────────────────────────────────────────
const MessageBubble = ({ item, isLast }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isUser = item.role === "user";
  const intentIcon = getIntentIcon(item.intent);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowBot,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Bot avatar */}
      {!isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name={intentIcon} size={14} color={C.orange} />
        </View>
      )}

      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
      >
        {/* Intent tag — bot only */}
        {!isUser && item.intent && item.intent !== "unknown" && (
          <View style={styles.intentTag}>
            <Ionicons name={intentIcon} size={9} color={C.orange} />
            <Text style={styles.intentTagText}>
              {item.intent.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {item.text}
        </Text>

        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
          {new Date(item.timestamp).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Suggestion chip ───────────────────────────────────────────────────
const SuggestionChip = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.chip}>
    <Text style={styles.chipText} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────
// ChatbotScreen
// ─────────────────────────────────────────────────────────────────────
export const ChatbotScreen = () => {
  const { token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const PAGE_SIZE = 20;

  // ── Load history (initial) ────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setHistoryLoading(false);
      return;
    }

    (async () => {
      setHistoryLoading(true);

      try {
        const result = await chatbotService.getHistory(1, PAGE_SIZE, token);

        if (result.success && Array.isArray(result.data)) {
          const formatted = result.data.flatMap((h) => [
            {
              id: `user-${h.id}`,
              role: "user",
              text: h.userMessage,
              timestamp: h.createdAt,
            },
            {
              id: `bot-${h.id}`,
              role: "assistant",
              text: h.botResponse,
              intent: h.detectedIntent,
              timestamp: h.createdAt,
            },
          ]);

          // ⚠️ IMPORTANT: NE PAS reverse ici (API retourne du plus ancien au plus récent)
          setMessages(formatted);
        } else {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
      }

      setHistoryLoading(false);
    })();
  }, [token]);

  // ── Load suggestions ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const result = await chatbotService.getSuggestions(token);
      if (result.success) {
        setSuggestions(
          result.data?.suggestions ?? result.data?.Suggestions ?? [],
        );
      }
    })();
  }, [token]);

  // ── Load older messages on scroll up ─────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !token) return;
    setLoadingMore(true);
    try {
      const result = await chatbotService.getHistory(
        page + 1,
        PAGE_SIZE,
        token,
      );
      if (
        result.success &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        const older = result.data.flatMap((h) => [
          {
            id: `user-${h.id}`,
            role: "user",
            text: h.userMessage,
            timestamp: h.createdAt,
          },
          {
            id: `bot-${h.id}`,
            role: "assistant",
            text: h.botResponse,
            intent: h.detectedIntent,
            timestamp: h.createdAt,
          },
        ]);
        setMessages((prev) => [...older, ...prev]);
        setPage((p) => p + 1);
        setHasMore(result.data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, token]);

  // ── Send message ──────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      intent: null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    const result = await chatbotService.sendMessage(trimmed, token);
    setIsTyping(false);

    const botMsg = {
      id: `bot-${Date.now()}`,
      role: "assistant",
      text: result.success
        ? (result.data?.Response ??
          result.data?.response ??
          result.data?.botResponse ??
          result.data?.message ??
          "Réponse reçue.")
        : "Je suis désolé, une erreur est survenue. Veuillez réessayer.",
      intent: result.success
        ? (result.data?.Intent ?? result.data?.intent ?? null)
        : null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, botMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ── Scroll to bottom when keyboard opens ─────────────────────────
  const handleKeyboardShow = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const showSuggestions = messages.length === 0 && !historyLoading;

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBot}>
          <View style={styles.botIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color={C.orange} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Assistant Sécurité</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>En ligne · IA locale</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMessages([])}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* ── Messages list ──────────────────────────────────── */}
      {historyLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={C.orange} />
          <Text style={styles.loadingText}>Chargement de l historique...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble item={item} isLast={index === messages.length - 1} />
          )}
          contentContainerStyle={[
            styles.listContent,
            showSuggestions && { flex: 1, justifyContent: "center" },
          ]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            loadingMore ? (
              <View style={styles.loadingMoreWrap}>
                <ActivityIndicator size="small" color={C.orange} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            showSuggestions ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={36}
                    color={C.orange}
                  />
                </View>
                <Text style={styles.emptyTitle}>Assistant Sécurité</Text>
                <Text style={styles.emptySubtitle}>
                  Posez vos questions sur l état du système, les alertes, ou les
                  procédures d urgence.
                </Text>

                {/* ── Suggestions ── */}
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsWrap}>
                    <Text style={styles.suggestionsLabel}>
                      Questions fréquentes
                    </Text>
                    <View style={styles.chipsWrap}>
                      {suggestions.map((s, i) => (
                        <SuggestionChip
                          key={i}
                          label={s}
                          onPress={() => sendMessage(s)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => inputRef.current?.blur()}
        />
      )}

      {/* ── Typing indicator ───────────────────────────────── */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <TypingIndicator />
        </View>
      )}

      {/* ── Inline suggestions (quand messages présents) ──── */}
      {!showSuggestions && suggestions.length > 0 && messages.length > 0 && (
        <View style={styles.inlineSuggestions}>
          <FlatList
            horizontal
            data={suggestions}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <SuggestionChip label={item} onPress={() => sendMessage(item)} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          />
        </View>
      )}

      {/* ── Input bar ─────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Posez votre question..."
            placeholderTextColor={C.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage()}
            onFocus={handleKeyboardShow}
            editable={!isTyping}
          />
        </View>
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
          style={[
            styles.sendBtn,
            (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
          ]}
        >
          {isTyping ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={16}
              color={inputText.trim() ? "#fff" : C.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBot: { flexDirection: "row", alignItems: "center", gap: 10 },
  botIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.orangeDim,
    borderWidth: 1,
    borderColor: C.orange + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  onlineText: { fontSize: 11, color: C.green, fontWeight: "600" },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13, color: C.textSub },
  loadingMoreWrap: { paddingVertical: 12, alignItems: "center" },

  // List
  listContent: { paddingVertical: 16, paddingHorizontal: 16, gap: 4 },

  // Empty state
  emptyState: { alignItems: "center", paddingHorizontal: 24, gap: 12 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.orangeDim,
    borderWidth: 1.5,
    borderColor: C.orange + "30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },
  suggestionsWrap: { width: "100%", marginTop: 8, gap: 10 },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  // Suggestion chip
  chip: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.orange + "35",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 240,
  },
  chipText: {
    fontSize: 12,
    color: C.orange,
    fontWeight: "600",
  },

  // Inline suggestions bar
  inlineSuggestions: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.card,
  },

  // Message rows
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 6,
  },
  messageRowBot: { alignSelf: "flex-start", maxWidth: "85%" },
  messageRowUser: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    flexDirection: "row-reverse",
  },

  // Bot avatar
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.orangeDim,
    borderWidth: 1,
    borderColor: C.orange + "30",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  botAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.orangeDim,
    borderWidth: 1,
    borderColor: C.orange + "30",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Bubbles
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleBot: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 5,
  },
  bubbleUser: {
    backgroundColor: C.userBubble,
    borderBottomRightRadius: 5,
  },
  intentTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.orangeDim,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  intentTagText: {
    fontSize: 8,
    fontWeight: "800",
    color: C.orange,
    letterSpacing: 0.4,
  },
  bubbleText: { fontSize: 14, color: C.text, lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },
  bubbleTime: { fontSize: 10, color: C.textMuted, alignSelf: "flex-end" },
  bubbleTimeUser: { color: "rgba(255,255,255,0.65)" },

  // Typing
  typingContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.textMuted,
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 120,
  },
  input: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  sendBtnDisabled: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatbotScreen;
