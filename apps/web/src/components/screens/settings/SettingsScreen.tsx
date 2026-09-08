"use client";

import type { MessageKey } from "@chine/i18n";
import { AppIcon, Avatar, Button, Field, SnapToggle, TextInput, useToast } from "@chine/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/components/pwa/InstallPrompt";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { PageSkeleton } from "@/components/shell/PageSkeleton";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { IconChevronRight } from "@/components/ui/Icons";
import { useWorkspace } from "@/hooks/api";
import { useT } from "@/hooks/i18n";
import { usePrefs } from "@/hooks/prefs";
import { authClient, useSession } from "@/lib/auth-client";
import { APP_VERSION } from "@/lib/version";
import { ErrorState, useErrorMessage } from "../common/ErrorState";
import { DataSection } from "./DataSection";
import { FeeOverrides } from "./FeeOverrides";
import { PlanCard } from "./PlanCard";
import { WorkspaceForm } from "./WorkspaceForm";

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="grid gap-2" id={id}>
      <span className="label">{title}</span>
      {children}
    </section>
  );
}

/** Réglages : profil, boutique, frais, matière, formule, données, installation, mentions, déconnexion. */
export function SettingsScreen() {
  const t = useT();
  const { show } = useToast();
  const describe = useErrorMessage();
  const workspace = useWorkspace();
  const session = useSession();
  const [prefs, setPrefs] = usePrefs();
  const install = useInstallPrompt();
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (session.data?.user.name) setName(session.data.user.name);
  }, [session.data?.user.name]);

  const saveName = async () => {
    setSavingName(true);
    try {
      const res = await authClient.updateUser({ name: name.trim() });
      if (res.error) throw new Error(res.error.message ?? t("errors.generic"));
      show(t("settings.saved"), { kind: "success" });
    } catch (e) {
      show(describe(e), { kind: "error" });
    } finally {
      setSavingName(false);
    }
  };

  const overview = workspace.data;
  const user = overview?.user ?? session.data?.user;
  const displayName = user?.name || user?.email || "—";

  return (
    <>
      <TopBar title={t("settings.title")} kicker={t("nav.account")} back="/app" avatar={false} />
      <Screen>
        <Section title={t("settings.profile")}>
          <div className="card grid gap-3 enter d1">
            <div className="flex items-center gap-3">
              <Avatar initial={displayName.charAt(0)} src={overview?.user.avatarUrl} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{displayName}</div>
                <div className="mono truncate text-[12px] text-ink-3">{user?.email ?? ""}</div>
              </div>
              {overview ? (
                <span className={`pill ${overview.billing.plan === "FREE" ? "stock" : "sold"}`}>
                  {t(`billing.plan.${overview.billing.plan}` as MessageKey)}
                </span>
              ) : null}
            </div>
            <Field label={t("settings.name")}>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoComplete="nickname"
                trailing={
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => void saveName()}
                    loading={savingName}
                    disabled={!name.trim() || name.trim() === (session.data?.user.name ?? "")}
                  >
                    {t("common.save")}
                  </Button>
                }
              />
            </Field>
          </div>
        </Section>

        {workspace.isPending && !overview ? (
          <PageSkeleton variant="settings" rows={4} />
        ) : workspace.isError && !overview ? (
          <div className="card enter d2">
            <ErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />
          </div>
        ) : overview ? (
          <>
            <Section title={t("settings.workspaceSection")}>
              <div className="enter d2">
                <WorkspaceForm overview={overview} />
              </div>
            </Section>
            <Section title={t("settings.fees")}>
              <p className="text-[12.5px] text-ink-2">{t("settings.feesHint")}</p>
              <div className="enter d3">
                <FeeOverrides overview={overview} />
              </div>
            </Section>
          </>
        ) : null}

        <Section title={t("settings.appearanceSection")}>
          <div className="grid gap-3 enter d3">
            <ThemePicker />
            <div className="card">
              <SnapToggle
                checked={prefs.haptics}
                onChange={(v) => setPrefs({ haptics: v })}
                label={t("settings.haptics")}
                description={t("settings.hapticsHint")}
              />
            </div>
          </div>
        </Section>

        {overview ? (
          <Section title={t("settings.planSection")} id="plan">
            <div className="enter d4">
              <PlanCard overview={overview} />
            </div>
          </Section>
        ) : null}

        <Section title={t("settings.dataSection")}>
          <div className="enter d4">
            <DataSection />
          </div>
        </Section>

        <div className="list enter d5">
          {install.available ? (
            <button type="button" className="settings-row w-full text-left" onClick={install.open}>
              <div>
                <div className="t">{t("settings.install")}</div>
                <div className="s">{t("settings.installHint")}</div>
              </div>
              <AppIcon name="plus" size={18} className="text-ink-3" />
            </button>
          ) : install.installed ? (
            <div className="settings-row">
              <div>
                <div className="t">{t("pwa.installed")}</div>
                <div className="s">{t("settings.installHint")}</div>
              </div>
              <AppIcon name="check" size={18} className="text-brass" />
            </div>
          ) : null}
          <Link href="/legal/cgu" className="settings-row">
            <div className="t">{t("settings.terms")}</div>
            <IconChevronRight className="text-ink-3" />
          </Link>
          <Link href="/legal/confidentialite" className="settings-row">
            <div className="t">{t("settings.privacy")}</div>
            <IconChevronRight className="text-ink-3" />
          </Link>
          <a href="mailto:bonjour@chine.app" className="settings-row">
            <div className="t">{t("settings.support")}</div>
            <IconChevronRight className="text-ink-3" />
          </a>
        </div>

        <div className="mt-auto grid gap-3 pt-4 enter d6">
          <Link
            href="/auth/deconnexion"
            className="btn ghost"
            prefetch={false}
            data-testid="sign-out"
          >
            {t("nav.logout")}
          </Link>
          <p className="label text-center">{t("settings.version", { version: APP_VERSION })}</p>
        </div>
      </Screen>
    </>
  );
}
