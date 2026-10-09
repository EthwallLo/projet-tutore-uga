# Japon — Un archipel à explorer

Premier squelette du projet de licence : une carte du Japon qui occupe toute la fenêtre, avec des fiches culturelles pour les villes, construite avec Next.js, React et TypeScript.

## Démarrer

Avec Node.js 22.13 ou supérieur sur la branche 22 :

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Utiliser le même environnement (par exemple WSL) pour l’installation et le lancement.

## La carte

- Contours géographiques en SVG : Hokkaidō, Honshū, Shikoku et Kyūshū.
- Encart des îles du sud-ouest, dont Okinawa, à une échelle différente.
- Six villes sélectionnables : Sapporo, Tokyo, Kyoto, Osaka, Hiroshima et Fukuoka.
- Un clic sur une ville ouvre sa fiche : description, repères culturels et lien vers le guide de l’office national du tourisme japonais.
- La fiche se ferme avec la croix, la touche Échap ou un clic à l’extérieur ; le focus revient au repère choisi.
- La carte SVG remplit la fenêtre sur fond blanc, avec les villes directement sur la carte.
- Un bouton « Mode nuit » adapte la carte et les fiches à un thème sombre ; le choix est conservé localement dans le navigateur.
- Sélection des repères au clic ou au clavier.
- Les préférences de réduction des animations sont respectées.

Au clavier, les repères sont accessibles avec Tab, puis Entrée ou Espace pour ouvrir une fiche. Échap ferme la fiche.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `app/page.tsx` | Page d’accueil |
| `components/japan-map.tsx` | Affichage de la carte et interactions |
| `components/city-card.tsx` | Fiche descriptive et fenêtre modale accessible |
| `data/city-descriptions.ts` | Descriptions, repères culturels et sources des six villes |
| `lib/japan.ts` | Données exposées et projection des coordonnées |
| `data/japan-map.json` | Contours et positions des villes, générés et conservés localement |
| `scripts/generate-japan-map.mjs` | Génération des données SVG |
| `app/globals.css` | Styles et adaptation aux tailles d’écran |

## Données géographiques

Les contours et les positions des villes proviennent de [Natural Earth 5.1.2](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2), à l’échelle 1:50m. Ces données sont dans le [domaine public](https://www.naturalearthdata.com/about/terms-of-use/).

La carte utilise une projection équirectangulaire simplifiée. Elle présente les îles principales et un encart du sud-ouest ; certains petits îlots hors du cadrage sont omis. La géométrie est locale : aucune requête à un service cartographique n’est nécessaire pendant l’utilisation.

Pour régénérer les contours et les coordonnées après modification du script (accès Internet requis) :

```bash
node scripts/generate-japan-map.mjs
```

Modifier la liste `requestedCities` dans le script pour ajouter des villes, puis ajouter leur fiche dans `data/city-descriptions.ts`. Les positions sont récupérées dans le jeu de données Natural Earth ; les décalages `label` règlent le placement des étiquettes.

## Vérification

```bash
npm run build
```
