/**
 * 🌐 LANDING PAGE — Web-only route
 *
 * Premium landing page for Optimus Vintage.
 * Designed with the Vanta Design System (Aether/Ivory).
 * This route is web-only — native users go directly to onboarding/tabs.
 */

import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View
} from "react-native";

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN TOKENS — Inline for self-contained web page
// ═══════════════════════════════════════════════════════════════════════════════

const Colors = {
  // Vanta Aether (Dark)
  background: "#000000",
  surface: "#0A0A0A",
  surfaceElevated: "#111111",
  surfaceCard: "#1C1C1C",
  // Metals
  gold: "#F4C025",
  goldGlow: "rgba(244,192,37,0.6)",
  champagne: "#C9A961",
  // Text
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.6)",
  textSubtle: "rgba(255,255,255,0.4)",
  // Semantic
  success: "#4ADE80",
  // Ivory (Light accents)
  ivory: "#FAF9F6",
  cream: "#FDFCF9",
} as const;

const Font = {
  regular: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 PLAN DATA
// ═══════════════════════════════════════════════════════════════════════════════

const PLANS = [
  {
    name: "Starter",
    price: "0€",
    period: "pour toujours",
    badge: null,
    features: [
      "3 lots maximum",
      "50 articles",
      "20 ventes/mois",
      "5 scans IA/mois",
      "1 plateforme",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "4,99€",
    period: "/mois",
    badge: "POPULAIRE",
    features: [
      "Lots illimités",
      "Articles illimités",
      "Ventes illimitées",
      "30 scans IA/mois",
      "Toutes les plateformes",
      "Graphiques & analytics",
      "Export CSV",
      "Mode hors ligne",
    ],
    cta: "Essai gratuit 7 jours",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "12,99€",
    period: "/mois",
    badge: "PRO",
    features: [
      "Tout Premium +",
      "Scans IA illimités",
      "P&L avancé",
      "Rapports PDF",
      "3 appareils",
      "Sync marketplace",
      "IA pricing",
      "Widget iOS",
    ],
    cta: "Essai gratuit 7 jours",
    highlighted: false,
  },
] as const;

const FEATURES = [
  {
    icon: "📦",
    title: "Gestion de lots",
    description:
      "Importez vos lots en un clic. Coûts répartis automatiquement par article.",
  },
  {
    icon: "🤖",
    title: "IA Gemini intégrée",
    description:
      "Scannez un vêtement, l'IA identifie marque, état et prix de revente optimal.",
  },
  {
    icon: "📊",
    title: "Analytics en temps réel",
    description:
      "Dashboard avec marge nette, ROI, tendances et performance par plateforme.",
  },
  {
    icon: "💰",
    title: "Suivi des ventes",
    description:
      "Vinted, Vestiaire, Leboncoin… toutes vos ventes centralisées avec frais déduits.",
  },
  {
    icon: "📱",
    title: "Multi-plateforme",
    description:
      "iOS, Android et Web. Synchronisez votre inventaire partout, même hors ligne.",
  },
  {
    icon: "🔒",
    title: "Sécurité enterprise",
    description:
      "Chiffrement de bout en bout, données hébergées en Europe, RGPD compliant.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Marie L.",
    role: "Revendeuse Vinted",
    text: "Je gérais mes achats dans un tableur. Optimus a tout changé — je vois enfin ma vraie marge article par article.",
    avatar: "👩‍💼",
  },
  {
    name: "Thomas R.",
    role: "Reseller semi-pro",
    text: "L'IA qui identifie les marques directement depuis la photo, c'est un game changer. J'économise 2h par jour.",
    avatar: "👨‍💻",
  },
  {
    name: "Léa D.",
    role: "Gérante boutique vintage",
    text: "Le plan Pro nous permet de gérer 3000+ pièces sans effort. Les rapports PDF sont top pour la comptabilité.",
    avatar: "👩‍🏫",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Optimus est-il gratuit ?",
    a: "Oui ! Le plan Starter est 100% gratuit, sans limite de temps. Il inclut la gestion de 3 lots, 50 articles et 20 ventes par mois — parfait pour débuter.",
  },
  {
    q: "Quelles plateformes sont supportées ?",
    a: "Vinted, Vestiaire Collective, Leboncoin, Depop, eBay, et bientôt d'autres. Le plan Premium débloque toutes les plateformes.",
  },
  {
    q: "Comment fonctionne l'IA ?",
    a: "Prenez une photo d'un article, notre IA (Google Gemini) identifie la marque, l'état, la catégorie et suggère un prix de revente optimal basé sur les tendances du marché.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Absolument. Serveurs en Europe, chiffrement en transit et au repos, conformité RGPD. Vos données restent les vôtres — zéro revente à des tiers.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement. Annulez depuis l'app ou les réglages de votre store (App Store / Google Play). Vos données restent accessibles.",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function NavBar({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: isMobile ? 20 : 48,
        paddingVertical: 16,
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.7)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 24 }}>✦</Text>
        <Text
          style={{
            color: Colors.gold,
            fontSize: 18,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          OPTIMUS VINTAGE
        </Text>
      </View>

      {!isMobile && (
        <View style={{ flexDirection: "row", gap: 32, alignItems: "center" }}>
          {["Fonctionnalités", "Tarifs", "FAQ"].map((item) => (
            <Text
              key={item}
              style={{
                color: Colors.textMuted,
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {item}
            </Text>
          ))}
          <Pressable
            style={{
              backgroundColor: Colors.gold,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              borderCurve: "continuous",
            }}
          >
            <Text
              style={{
                color: Colors.background,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              Télécharger
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function HeroSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingTop: isMobile ? 120 : 160,
        paddingBottom: 80,
        paddingHorizontal: isMobile ? 20 : 48,
        alignItems: "center",
        gap: 32,
      }}
    >
      {/* Badge */}
      <View
        style={{
          borderWidth: 1,
          borderColor: Colors.champagne,
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: Colors.success,
          }}
        />
        <Text
          style={{
            color: Colors.champagne,
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Nouveau — IA Gemini intégrée
        </Text>
      </View>

      {/* Headline */}
      <Text
        style={{
          color: Colors.text,
          fontSize: isMobile ? 36 : 64,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: -2,
          lineHeight: isMobile ? 42 : 72,
          maxWidth: 800,
        }}
      >
        La revente de vêtements,{"\n"}
        <Text style={{ color: Colors.gold }}>enfin sous contrôle.</Text>
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: isMobile ? 16 : 20,
          textAlign: "center",
          lineHeight: isMobile ? 24 : 32,
          maxWidth: 600,
        }}
      >
        Gérez votre stock, calculez vos marges réelles et boostez vos ventes
        avec l'IA. L'app n°1 des revendeurs de vêtements.
      </Text>

      {/* CTAs */}
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() =>
            Linking.openURL("https://apps.apple.com/app/optimus-vintage")
          }
          style={{
            backgroundColor: Colors.gold,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 12,
            borderCurve: "continuous",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            boxShadow: `0 0 30px ${Colors.goldGlow}`,
          }}
        >
          <Text style={{ fontSize: 18 }}>📱</Text>
          <Text
            style={{
              color: Colors.background,
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            Télécharger gratuitement
          </Text>
        </Pressable>

        <Link href="/(tabs)" asChild>
          <Pressable
            style={{
              borderWidth: 1,
              borderColor: Colors.champagne,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              borderCurve: "continuous",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>▶️</Text>
            <Text
              style={{
                color: Colors.champagne,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Voir la démo
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Stats */}
      <View
        style={{
          flexDirection: "row",
          gap: isMobile ? 24 : 48,
          marginTop: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { value: "10K+", label: "Revendeurs" },
          { value: "2M+", label: "Articles gérés" },
          { value: "4.8⭐", label: "App Store" },
        ].map((stat) => (
          <View key={stat.label} style={{ alignItems: "center", gap: 4 }}>
            <Text
              style={{
                color: Colors.gold,
                fontSize: 28,
                fontWeight: "800",
                letterSpacing: -1,
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                color: Colors.textSubtle,
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturesSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 80,
        paddingHorizontal: isMobile ? 20 : 48,
        backgroundColor: Colors.surface,
      }}
    >
      <Text
        style={{
          color: Colors.textSubtle,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 3,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Fonctionnalités
      </Text>
      <Text
        style={{
          color: Colors.text,
          fontSize: isMobile ? 28 : 42,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: -1.5,
          marginBottom: 48,
        }}
      >
        Tout ce qu'il faut pour{" "}
        <Text style={{ color: Colors.gold }}>réussir</Text>
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 20,
          justifyContent: "center",
          maxWidth: 1100,
          alignSelf: "center",
        }}
      >
        {FEATURES.map((f) => (
          <View
            key={f.title}
            style={{
              backgroundColor: Colors.surfaceElevated,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 28,
              width: isMobile ? "100%" : 340,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 32 }}>{f.icon}</Text>
            <Text
              style={{
                color: Colors.text,
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}
            >
              {f.title}
            </Text>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 14,
                lineHeight: 22,
              }}
            >
              {f.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PricingSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 80,
        paddingHorizontal: isMobile ? 20 : 48,
      }}
    >
      <Text
        style={{
          color: Colors.textSubtle,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 3,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Tarifs
      </Text>
      <Text
        style={{
          color: Colors.text,
          fontSize: isMobile ? 28 : 42,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: -1.5,
          marginBottom: 16,
        }}
      >
        Simple et <Text style={{ color: Colors.gold }}>transparent</Text>
      </Text>
      <Text
        style={{
          color: Colors.textMuted,
          fontSize: 16,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        Commencez gratuitement, évoluez quand vous êtes prêt.
      </Text>

      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
          justifyContent: "center",
          alignItems: isMobile ? "stretch" : "flex-start",
          maxWidth: 1100,
          alignSelf: "center",
        }}
      >
        {PLANS.map((plan) => (
          <View
            key={plan.name}
            style={{
              backgroundColor: plan.highlighted
                ? Colors.surfaceCard
                : Colors.surfaceElevated,
              borderRadius: 20,
              borderCurve: "continuous",
              padding: 32,
              flex: isMobile ? undefined : 1,
              maxWidth: isMobile ? undefined : 360,
              borderWidth: plan.highlighted ? 2 : 1,
              borderColor: plan.highlighted
                ? Colors.gold
                : "rgba(255,255,255,0.05)",
              gap: 20,
              ...(plan.highlighted
                ? { boxShadow: `0 0 40px ${Colors.goldGlow}` }
                : {}),
            }}
          >
            {/* Plan header */}
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  {plan.name}
                </Text>
                {plan.badge && (
                  <View
                    style={{
                      backgroundColor: Colors.gold,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.background,
                        fontSize: 10,
                        fontWeight: "800",
                        letterSpacing: 1,
                      }}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 4,
                }}
              >
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 40,
                    fontWeight: "800",
                    letterSpacing: -2,
                  }}
                >
                  {plan.price}
                </Text>
                <Text
                  style={{
                    color: Colors.textMuted,
                    fontSize: 14,
                  }}
                >
                  {plan.period}
                </Text>
              </View>
            </View>

            {/* Features */}
            <View style={{ gap: 12 }}>
              {plan.features.map((feat) => (
                <View
                  key={feat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ color: Colors.success, fontSize: 14 }}>✓</Text>
                  <Text
                    style={{
                      color: Colors.textMuted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <Pressable
              onPress={() =>
                Linking.openURL("https://apps.apple.com/app/optimus-vintage")
              }
              style={{
                backgroundColor: plan.highlighted ? Colors.gold : "transparent",
                borderWidth: plan.highlighted ? 0 : 1,
                borderColor: Colors.champagne,
                paddingVertical: 14,
                borderRadius: 10,
                borderCurve: "continuous",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: plan.highlighted
                    ? Colors.background
                    : Colors.champagne,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {plan.cta}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function TestimonialsSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 80,
        paddingHorizontal: isMobile ? 20 : 48,
        backgroundColor: Colors.surface,
      }}
    >
      <Text
        style={{
          color: Colors.textSubtle,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 3,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Témoignages
      </Text>
      <Text
        style={{
          color: Colors.text,
          fontSize: isMobile ? 28 : 42,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: -1.5,
          marginBottom: 48,
        }}
      >
        Ils nous font <Text style={{ color: Colors.gold }}>confiance</Text>
      </Text>

      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: 20,
          justifyContent: "center",
          maxWidth: 1100,
          alignSelf: "center",
        }}
      >
        {TESTIMONIALS.map((t) => (
          <View
            key={t.name}
            style={{
              backgroundColor: Colors.surfaceElevated,
              borderRadius: 16,
              borderCurve: "continuous",
              padding: 28,
              flex: isMobile ? undefined : 1,
              maxWidth: isMobile ? undefined : 360,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.05)",
              gap: 16,
            }}
          >
            <Text
              style={{
                color: Colors.gold,
                fontSize: 24,
              }}
            >
              ★★★★★
            </Text>
            <Text
              style={{
                color: Colors.textMuted,
                fontSize: 14,
                lineHeight: 22,
                fontStyle: "italic",
              }}
            >
              "{t.text}"
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 28 }}>{t.avatar}</Text>
              <View>
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {t.name}
                </Text>
                <Text
                  style={{
                    color: Colors.textSubtle,
                    fontSize: 12,
                  }}
                >
                  {t.role}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FAQItem({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={{
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 12,
        borderCurve: "continuous",
        padding: 20,
        borderWidth: 1,
        borderColor: open ? Colors.champagne : "rgba(255,255,255,0.05)",
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: Colors.text,
            fontSize: 15,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {item.q}
        </Text>
        <Text style={{ color: Colors.champagne, fontSize: 18, marginLeft: 12 }}>
          {open ? "−" : "+"}
        </Text>
      </View>
      {open && (
        <Text
          style={{
            color: Colors.textMuted,
            fontSize: 14,
            lineHeight: 22,
            marginTop: 4,
          }}
        >
          {item.a}
        </Text>
      )}
    </Pressable>
  );
}

function FAQSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 80,
        paddingHorizontal: isMobile ? 20 : 48,
      }}
    >
      <Text
        style={{
          color: Colors.textSubtle,
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 3,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        FAQ
      </Text>
      <Text
        style={{
          color: Colors.text,
          fontSize: isMobile ? 28 : 42,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: -1.5,
          marginBottom: 48,
        }}
      >
        Questions <Text style={{ color: Colors.gold }}>fréquentes</Text>
      </Text>

      <View
        style={{
          maxWidth: 700,
          alignSelf: "center",
          gap: 12,
          width: "100%",
        }}
      >
        {FAQ_ITEMS.map((item) => (
          <FAQItem key={item.q} item={item} />
        ))}
      </View>
    </View>
  );
}

function FooterSection({ isMobile }: { isMobile: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 48,
        paddingHorizontal: isMobile ? 20 : 48,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
        gap: 24,
        alignItems: "center",
      }}
    >
      {/* Final CTA */}
      <View style={{ alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Text
          style={{
            color: Colors.text,
            fontSize: isMobile ? 24 : 32,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Prêt à prendre le contrôle ?
        </Text>
        <Pressable
          onPress={() =>
            Linking.openURL("https://apps.apple.com/app/optimus-vintage")
          }
          style={{
            backgroundColor: Colors.gold,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 12,
            borderCurve: "continuous",
            boxShadow: `0 0 30px ${Colors.goldGlow}`,
          }}
        >
          <Text
            style={{
              color: Colors.background,
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            Télécharger gratuitement
          </Text>
        </Pressable>
      </View>

      {/* Footer links */}
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 32,
          alignItems: "center",
        }}
      >
        {[
          "Conditions d'utilisation",
          "Politique de confidentialité",
          "Contact",
        ].map((link) => (
          <Text
            key={link}
            style={{
              color: Colors.textSubtle,
              fontSize: 12,
            }}
          >
            {link}
          </Text>
        ))}
      </View>

      {/* Copyright */}
      <Text style={{ color: Colors.textSubtle, fontSize: 11 }}>
        © {new Date().getFullYear()} Optimus Vintage. Tous droits réservés.
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏠 MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // On native, redirect to the app immediately
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <StatusBar style="light" />
      <NavBar isMobile={isMobile} />
      <HeroSection isMobile={isMobile} />
      <FeaturesSection isMobile={isMobile} />
      <PricingSection isMobile={isMobile} />
      <TestimonialsSection isMobile={isMobile} />
      <FAQSection isMobile={isMobile} />
      <FooterSection isMobile={isMobile} />
    </ScrollView>
  );
}
