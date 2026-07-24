const FACTORS = [
  { label: "Classement ATP/WTA", weight: "30%", desc: "Delta logarithmique entre les classements, plafonné pour éviter qu'un gros écart n'écrase les autres signaux." },
  { label: "Winrate sur la surface", weight: "25%", desc: "Pourcentage de victoires de chaque joueur sur la surface exacte du match (Hard / Clay / Grass / Indoor Hard)." },
  { label: "Forme récente", weight: "20%", desc: "Ratio de victoires sur les 10 derniers matchs disputés, toutes surfaces confondues." },
  { label: "Indices de jeu", weight: "15%", desc: "Moyenne des 6 indices (service, retour, filet, endurance, mental, régularité) notés sur 100." },
  { label: "H2H direct", weight: "10%", desc: "Historique des confrontations directes entre les deux joueurs, pondéré par le nombre total de rencontres." },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-ink-50">Méthodologie</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-400">
        CourtEdge combine plusieurs signaux publics pour estimer une probabilité de victoire par
        joueur, puis compare cette probabilité à la cote Betclic pour détecter les écarts de
        marché (value bets). Cette page explique honnêtement les limites du modèle actuel.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-50">1. Calcul de la probabilité</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">
          Le modèle v1 est une <strong className="text-ink-200">heuristique multi-facteurs</strong>,
          pas un modèle entraîné sur données historiques. Chaque facteur produit un score entre -1
          et +1 en faveur d&apos;un des deux joueurs, la somme pondérée passe ensuite par une
          fonction logistique pour donner une probabilité entre 0 et 1.
        </p>
        <div className="mt-4 flex flex-col divide-y divide-base-border rounded-xl border border-base-border bg-base-900">
          {FACTORS.map((f) => (
            <div key={f.label} className="flex items-start justify-between gap-4 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-ink-50">{f.label}</p>
                <p className="mt-0.5 text-xs text-ink-400">{f.desc}</p>
              </div>
              <span className="shrink-0 rounded-md bg-base-800 px-2 py-1 font-mono text-xs font-semibold text-court-bright">
                {f.weight}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-50">2. Calcul de la value</h2>
        <div className="mt-3 rounded-xl border border-base-border bg-base-900 p-4">
          <code className="font-mono text-sm text-court-bright">
            value = (probabilité_modèle × cote_Betclic) − 1
          </code>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          Une value positive signifie que, selon notre estimation, le marché sous-évalue les
          chances du joueur : la cote proposée est plus généreuse que ce que « devrait » offrir un
          marché parfaitement calibré sur notre probabilité. Une value de +8% ne garantit rien sur
          un pari isolé — c&apos;est un avantage statistique qui ne s&apos;exprime que sur un grand
          nombre de paris, à condition que le modèle soit correctement calibré.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-50">3. Limites connues</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-ink-400">
          <li>— Le modèle n&apos;intègre pas encore l&apos;état physique / blessures en temps réel.</li>
          <li>— Les indices de jeu (service, retour, etc.) sont pour l&apos;instant des agrégats simplifiés, pas des métriques calculées point par point.</li>
          <li>— Aucun ajustement météo (vent, chaleur) ou altitude n&apos;est appliqué.</li>
          <li>— Le modèle n&apos;a pas été rétro-testé sur plusieurs saisons — sa calibration réelle reste à valider.</li>
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-edge/30 bg-edge/5 p-4">
        <p className="text-sm leading-relaxed text-ink-200">
          Cet outil fournit une aide à la décision statistique, pas une garantie de gain. Les paris
          sportifs comportent un risque de perte en capital. Fixe-toi des limites et pratique un
          jeu responsable.
        </p>
      </section>
    </div>
  );
}
