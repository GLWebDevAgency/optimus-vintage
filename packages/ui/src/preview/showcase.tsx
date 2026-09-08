"use client";
/**
 * Vitrine de tous les composants avec des données d'exemple. Montée par l'app web sur /dev/ui.
 * Aucune dépendance au routeur : les liens sont des `a`.
 */
import { useState } from "react";
import { BigButton } from "../components/BigButton";
import { Button } from "../components/Button";
import { Chip, ChipGroup } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { Field, MoneyInput, Select, Textarea, TextInput } from "../components/Field";
import { HangTag } from "../components/HangTag";
import { KpiHero } from "../components/KpiHero";
import { List, ListRow } from "../components/ListRow";
import { Logo, LogoMark, Wordmark } from "../components/Logo";
import { Avatar, PageHeader } from "../components/PageHeader";
import { PhotoGrid, PhotoTile } from "../components/Photo";
import { Receipt } from "../components/Receipt";
import { SectionHeader } from "../components/SectionHeader";
import { Segmented } from "../components/Segmented";
import { Sheet } from "../components/Sheet";
import { Skeleton, SkeletonRow } from "../components/Skeleton";
import { SnapToggle } from "../components/SnapToggle";
import { Stamp } from "../components/Stamp";
import { StatusPill } from "../components/StatusPill";
import { StitchProgress } from "../components/StitchProgress";
import { TabBar } from "../components/TabBar";
import { Tally } from "../components/Tally";
import { TapeMeasure } from "../components/TapeMeasure";
import { ToastProvider, useToast } from "../components/Toast";
import { TopBar } from "../components/TopBar";
import { AppIcon, ICON_NAMES } from "../icons";

const eur = (minor: number) => ({ minor, currency: "EUR" });

const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='#E8E1D0'/><path d='M38 22 26 30 14 56l16 6-2 38h64l-2-38 16-6-12-26-12-8c-4 8-10 12-22 12S42 30 38 22z' fill='#22306A' opacity='.85'/></svg>",
  );

function Section({
  title,
  children,
  note,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[.16em] text-thread before:h-0 before:w-[22px] before:border-t-2 before:border-dashed before:border-thread before:content-['']">
          {title}
        </p>
        {note ? <p className="text-[13px] text-ink-2">{note}</p> : null}
      </div>
      <div className="grid gap-4 rounded-sheet border border-line bg-surface p-4">{children}</div>
    </section>
  );
}

function ToastDemo() {
  const { show } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="subtle"
        onClick={() => show("Ajoutée à la chine", { kind: "success" })}
      >
        Succès
      </Button>
      <Button
        size="sm"
        variant="subtle"
        onClick={() =>
          show("Pas de connexion. Réessaie quand tu seras en ligne.", {
            kind: "offline",
            duration: 0,
            action: { label: "Réessayer", onClick: () => {} },
          })
        }
      >
        Hors ligne
      </Button>
      <Button
        size="sm"
        variant="subtle"
        onClick={() => show("L'expertise a échoué.", { kind: "error" })}
      >
        Erreur
      </Button>
    </div>
  );
}

export function Showcase() {
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const [price, setPrice] = useState(2000);
  const [money, setMoney] = useState<number | null>(4965);
  const [chips, setChips] = useState<string[]>(["LOT"]);
  const [kind, setKind] = useState<string | null>("FLEA_MARKET");
  const [seg, setSeg] = useState("all");
  const [offline, setOffline] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [photos, setPhotos] = useState([
    { id: "a", src: PHOTO },
    { id: "b", src: PHOTO },
  ]);
  const [replay, setReplay] = useState(0);

  return (
    <ToastProvider>
      <div
        className="selvedge texture-calico min-h-dvh bg-bg text-ink"
        data-theme={theme === "auto" ? undefined : theme}
      >
        <TopBar
          title="Selvedge · composants"
          actions={
            <Segmented
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "auto", label: "Auto" },
                { value: "light", label: "Calico" },
                { value: "dark", label: "Indigo" },
              ]}
              aria-label="Thème"
              className="w-[190px]"
            />
          }
          centered={false}
        />
        <main className="mx-auto grid max-w-[520px] gap-10 px-5 pb-40 pt-4">
          <Section
            title="Marque"
            note="Étiquette, œillet, fil rouge ; l'accent aigu de « Chiné » est cousu."
          >
            <div className="flex flex-wrap items-center gap-6">
              <Logo size={40} />
              <LogoMark size={56} scheme="indigo" className="rounded-[14px] bg-[#0E1326] p-2" />
              <LogoMark size={56} scheme="thread" className="rounded-[14px] bg-[#C4283C] p-2" />
              <Wordmark size={34} />
            </div>
          </Section>

          <Section title="En-têtes">
            <PageHeader
              eyebrow="Dim. 7 sept."
              title="Aujourd'hui"
              trailing={<Avatar initial="L" />}
            />
            <PageHeader eyebrow="Vente #0231" title="Vendu" titleEm="sur Vinted" />
            <SectionHeader title="Dernières ventes" action="Tout voir" href="#" />
          </Section>

          <Section
            title="Compter à la craie"
            note="KPI héro, étiquettes suspendues, objectif cousu."
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplay((n) => n + 1)}
              leading={<AppIcon name="refresh" size={16} />}
            >
              Rejouer
            </Button>
            <div key={replay} className="grid gap-5">
              <KpiHero
                label="Marge nette · septembre"
                value={eur(128_450)}
                delta="+18 % vs août · 23 ventes"
              />
              <StitchProgress value={0.64} label="Objectif 2 000 €" valueLabel="64 %" />
              <StitchProgress
                value={1.12}
                label="Palette Eureka"
                valueLabel="112 % remboursée"
                tone="brass"
                delay={0.3}
              />
              <div className="grid grid-cols-3 gap-2.5 pt-4">
                <HangTag label="Stock" value={142} delay={0.35} />
                <HangTag label="En ligne" value={38} delay={0.5} />
                <HangTag label="Dormant" value={12} tone="thread" delay={0.65} />
              </div>
              <div className="grid place-items-center pt-5">
                <HangTag
                  label="CH-0142 · Lacoste"
                  value={<Tally value={75} size="tag" />}
                  unit="€"
                  className="w-[170px]"
                  delay={0.2}
                >
                  <span className="mt-2 inline-block rotate-[-2deg] rounded-[7px] bg-thread px-2 py-1 font-ui text-[11px] font-bold text-white">
                    −70 % vs neuf
                  </span>
                </HangTag>
              </div>
              <div className="grid place-items-center gap-2 rounded-card border border-line bg-surface-2 p-4">
                <span className="text-[13px] text-ink-2">Ensemble Lacoste · 75,00 €</span>
                <Stamp size="lg">Vendu</Stamp>
                <Stamp tone="brass" size="sm" delay={0.8}>
                  Amortie
                </Stamp>
              </div>
            </div>
          </Section>

          <Section title="Dérouler le mètre" note="Glisse, molette, flèches. Vibre à chaque unité.">
            <TapeMeasure valueMinor={price} onChange={setPrice} min={0} max={500} />
            <p className="text-center font-mono text-[11px] text-ink-3">valueMinor = {price}</p>
          </Section>

          <Section title="Boutons">
            <div className="flex flex-wrap gap-2">
              <Button>Vendre</Button>
              <Button variant="ghost">Mettre en ligne</Button>
              <Button variant="danger">Supprimer</Button>
              <Button variant="subtle" leading={<AppIcon name="filter" size={16} />}>
                Filtrer
              </Button>
              <Button loading>Enregistrer</Button>
              <Button size="sm">Petit</Button>
              <Button size="lg">Grand</Button>
            </div>
            <BigButton leading={<AppIcon name="plus" size={18} />}>Ajouter à la chine</BigButton>
            <div className="grid grid-cols-2 gap-2.5">
              <BigButton variant="secondary">Mettre en ligne</BigButton>
              <BigButton>Vendre</BigButton>
            </div>
          </Section>

          <Section title="Sélection">
            <ChipGroup
              mode="multi"
              value={chips}
              onChange={setChips}
              aria-label="Types"
              options={[
                { value: "LOT", label: "Lot" },
                { value: "PALLET", label: "Palette" },
                { value: "PICKING", label: "Picking" },
                { value: "UNIT", label: "À l'unité" },
              ]}
            />
            <ChipGroup
              value={kind}
              onChange={setKind}
              size="sm"
              aria-label="Lieu"
              options={[
                {
                  value: "FLEA_MARKET",
                  label: "Vide-grenier",
                  leading: <AppIcon name="pin" size={14} />,
                },
                { value: "THRIFT_STORE", label: "Friperie" },
                { value: "WHOLESALER", label: "Grossiste" },
                { value: "ONLINE_B2B", label: "B2B" },
              ]}
            />
            <Chip selected>Sélectionnée</Chip>
            <Segmented
              value={seg}
              onChange={setSeg}
              aria-label="Sources"
              options={[
                { value: "all", label: "Toutes" },
                { value: "LOT", label: "Lots" },
                { value: "PALLET", label: "Palettes" },
                { value: "UNIT", label: "Chine" },
              ]}
            />
            <SnapToggle
              checked={offline}
              onChange={setOffline}
              label="Mode chine hors ligne"
              description="Les pièces se synchronisent plus tard."
            />
          </Section>

          <Section title="Statuts">
            <div className="flex flex-wrap gap-2">
              <StatusPill status="stock" />
              <StatusPill status="online" />
              <StatusPill status="reserved" />
              <StatusPill status="sold" />
              <StatusPill status="dormant" />
              <StatusPill status="returned" />
              <StatusPill status="lost" />
              <StatusPill status="pending" label="Sync plus tard" />
              <StatusPill status="amortized" />
            </div>
          </Section>

          <Section title="Champs">
            <Field label="Prix d'achat" hint="Ce que tu as payé, frais compris.">
              <MoneyInput valueMinor={money} onChangeMinor={setMoney} />
            </Field>
            <Field label="Titre" required error="Le titre est requis">
              <TextInput placeholder="Ex. Ensemble Lacoste, 1990s" />
            </Field>
            <Field label="Lieu">
              <TextInput
                defaultValue="Vide-grenier · Bois-Guillaume"
                unit="GPS"
                leading={<AppIcon name="pin" size={16} />}
              />
            </Field>
            <Field label="État">
              <Select
                value="EXCELLENT"
                onChange={() => {}}
                options={[
                  { value: "NEW_WITH_TAGS", label: "Neuf avec étiquette" },
                  { value: "EXCELLENT", label: "Excellent" },
                  { value: "GOOD", label: "Bon" },
                ]}
              />
            </Field>
            <Field label="Notes" trailing="facultatif">
              <Textarea placeholder="Petite tache au col…" />
            </Field>
          </Section>

          <Section title="Reçu">
            <Receipt
              rows={[
                { label: "Prix brut", value: eur(7500) },
                { label: "Frais Vinted", value: eur(0) },
                { label: "Port", value: eur(-495) },
                { label: "Emballage", value: eur(-40) },
                { label: "Achat", value: eur(-2000) },
                { label: "Marge nette", value: eur(4965), total: true, signed: true },
                { label: "ROI", value: { ratio: 2.4825 } },
              ]}
            />
          </Section>

          <Section title="Listes">
            <List>
              <ListRow
                title="Ensemble Lacoste"
                sub="Vinted · hier"
                amount={eur(4965)}
                href="#"
                chevron
              />
              <ListRow
                title="Polaire Patagonia"
                sub="Vinted · hier"
                amount={eur(2210)}
                thumb={PHOTO}
                onClick={() => {}}
              />
              <ListRow
                title="Jean Levi's 501"
                sub="Leboncoin · 3 j"
                amount={eur(-320)}
                trailing={<StatusPill status="returned" />}
              />
            </List>
            <SkeletonRow count={2} />
            <div className="grid gap-2">
              <Skeleton shape="hero" />
              <Skeleton shape="text" count={2} />
              <Skeleton shape="tag" />
            </div>
          </Section>

          <Section title="Photos">
            <PhotoGrid
              photos={photos}
              onRemove={(id) => setPhotos((p) => p.filter((x) => x.id !== id))}
              onAdd={() => setPhotos((p) => [...p, { id: String(Date.now()), src: PHOTO }])}
              max={4}
            />
            <div className="grid grid-cols-3 gap-2">
              <PhotoTile src={PHOTO} loading />
              <PhotoTile />
            </div>
          </Section>

          <Section title="Vide">
            <EmptyState
              title="Aucune pièce"
              body="Chine ta première pièce : une photo, un prix, c'est tout."
              action={<Button>Chiner</Button>}
            />
          </Section>

          <Section title="Plier · Notifier">
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setSheet(true)}>
                Ouvrir le panneau
              </Button>
              <ToastDemo />
            </div>
            <Sheet
              open={sheet}
              onClose={() => setSheet(false)}
              title="Vendre la pièce"
              description="Ensemble Lacoste · CH-0142"
              footer={
                <div className="grid grid-cols-2 gap-2.5">
                  <BigButton variant="secondary" onClick={() => setSheet(false)}>
                    Annuler
                  </BigButton>
                  <BigButton onClick={() => setSheet(false)}>Vendre</BigButton>
                </div>
              }
            >
              <div className="grid gap-4 py-1">
                <Field label="Prix brut">
                  <MoneyInput valueMinor={7500} onChangeMinor={() => {}} data-autofocus />
                </Field>
                <Field label="Plateforme">
                  <Select
                    value="VINTED"
                    onChange={() => {}}
                    options={[
                      { value: "VINTED", label: "Vinted" },
                      { value: "LEBONCOIN", label: "Leboncoin" },
                    ]}
                  />
                </Field>
                <Receipt
                  bare
                  rows={[
                    { label: "Port", value: eur(-495) },
                    { label: "Marge nette", value: eur(4965), total: true, signed: true },
                  ]}
                />
              </div>
            </Sheet>
          </Section>

          <Section title="Icônes" note={`${ICON_NAMES.length} icônes · 24 px · trait 1,8`}>
            <div className="grid grid-cols-6 gap-3">
              {ICON_NAMES.map((n) => (
                <span key={n} className="grid justify-items-center gap-1 text-ink">
                  <AppIcon name={n} />
                  <span className="font-mono text-[8.5px] text-ink-3">{n}</span>
                </span>
              ))}
            </div>
          </Section>
        </main>
        <TabBar
          activeKey="today"
          items={[
            { key: "today", label: "Jour", href: "#", icon: "home" },
            { key: "stock", label: "Stock", href: "#", icon: "tag", badge: 3 },
            { key: "sales", label: "Ventes", href: "#", icon: "receipt" },
            { key: "sources", label: "Sources", href: "#", icon: "layers" },
          ]}
          cta={{ label: "Chiner", onClick: () => setSheet(true) }}
        />
      </div>
    </ToastProvider>
  );
}

export default Showcase;
