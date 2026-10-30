export type SouvenirType = "nourriture" | "bien" | "service" | "voyage";

export type Souvenir = {
  id: string;
  destination: string;
  name: string;
  type: SouvenirType;
  price: number;
  points: number;
  description: string;
  protection?: number;
};

export type CardEffect =
  | { type: "money"; amount: number }
  | { type: "discount"; amount: number }
  | { type: "food-discount"; amount: number }
  | { type: "lose-money"; amount: number }
  | { type: "opponent-loss"; amount: number }
  | { type: "discard" };

export type ActionCard = {
  id: string;
  name: string;
  description: string;
  destination: string | null;
  effect: CardEffect;
};

export type WorkCard = {
  id: string;
  destination: string;
  name: string;
  income: number;
  foodDiscount?: number;
};

export const STARTING_MONEY = 1800;
export const FLIGHT_PRICE = 1400;

export const DESTINATIONS = [
  { id: "kyoto", name: "Kyoto", travelPrice: 0 },
  { id: "tokyo", name: "Tokyo", travelPrice: 600 },
  { id: "sapporo", name: "Sapporo", travelPrice: 900 },
] as const;

export const SOUVENIRS: Souvenir[] = [
  { id: "kyoto_matcha", destination: "kyoto", name: "Matcha de Kyoto", type: "nourriture", price: 600, points: 1, description: "Une pause autour du thé pour se souvenir de Kyoto." },
  { id: "kyoto_fan", destination: "kyoto", name: "Éventail de Kyoto", type: "bien", price: 1000, points: 2, description: "Un objet à rapporter et à montrer à ses amis." },
  { id: "kyoto_ryokan", destination: "kyoto", name: "Nuit dans un ryokan", type: "service", price: 1400, points: 3, description: "Le souvenir d’une nuit dans une auberge japonaise." },
  { id: "tokyo_taiyaki", destination: "tokyo", name: "Taiyaki à Asakusa", type: "nourriture", price: 500, points: 1, description: "Une gourmandise à savourer pendant une promenade." },
  { id: "tokyo_print", destination: "tokyo", name: "Estampe japonaise", type: "bien", price: 1200, points: 3, description: "Une image à garder du voyage." },
  { id: "tokyo_onsen", destination: "tokyo", name: "Pause dans un onsen", type: "service", price: 900, points: 1, protection: 1, description: "Protège contre le prochain malus d’un autre joueur. La protection est ensuite consommée." },
  { id: "sapporo_ramen", destination: "sapporo", name: "Ramen de Sapporo", type: "nourriture", price: 600, points: 1, description: "Un bol bien chaud pour une étape au nord du Japon." },
  { id: "sapporo_walk", destination: "sapporo", name: "Balade dans la neige", type: "voyage", price: 1000, points: 2, description: "Une promenade à raconter au retour." },
  { id: "sapporo_craft", destination: "sapporo", name: "Artisanat de Hokkaidō", type: "bien", price: 1400, points: 3, description: "Une pièce choisie pour prolonger le souvenir du séjour." },
];

export const ACTION_CARDS: ActionCard[] = [
  { id: "kyoto_coupon", destination: "kyoto", name: "Bon de réduction", description: "Réduit de 400 ¥ le prix du prochain souvenir acheté.", effect: { type: "discount", amount: 400 } },
  { id: "kyoto_help", destination: "kyoto", name: "Coup de main au marché", description: "Un commerçant te remercie avec 400 ¥.", effect: { type: "money", amount: 400 } },
  { id: "tokyo_evening", destination: "tokyo", name: "Soirée arrosée", description: "Un autre joueur perd une carte action au hasard.", effect: { type: "discard" } },
  { id: "tokyo_food", destination: "tokyo", name: "Invitation gourmande", description: "Réduit de 500 ¥ le prochain souvenir de type nourriture.", effect: { type: "food-discount", amount: 500 } },
  { id: "sapporo_coupon", destination: "sapporo", name: "Invitation au marché", description: "Réduit de 400 ¥ le prix du prochain souvenir acheté.", effect: { type: "discount", amount: 400 } },
  { id: "sapporo_detour", destination: "sapporo", name: "Détour imprévu", description: "Un autre joueur perd jusqu’à 300 ¥.", effect: { type: "opponent-loss", amount: 300 } },
  { id: "general_encounter", destination: null, name: "Rencontre généreuse", description: "Reçois 600 ¥ pour poursuivre ton voyage.", effect: { type: "money", amount: 600 } },
  { id: "general_coupon", destination: null, name: "Bon de réduction", description: "Réduit de 400 ¥ le prix du prochain souvenir acheté.", effect: { type: "discount", amount: 400 } },
  { id: "general_evening", destination: null, name: "Soirée arrosée", description: "Un autre joueur perd une carte action au hasard.", effect: { type: "discard" } },
  { id: "general_food", destination: null, name: "Invitation gourmande", description: "Réduit de 500 ¥ le prochain souvenir de type nourriture.", effect: { type: "food-discount", amount: 500 } },
  { id: "general_detour", destination: null, name: "Détour imprévu", description: "Un autre joueur perd jusqu’à 300 ¥.", effect: { type: "opponent-loss", amount: 300 } },
  { id: "general_expense", destination: null, name: "Dépense imprévue", description: "Paie jusqu’à 300 ¥ pour régler un imprévu du voyage.", effect: { type: "lose-money", amount: 300 } },
  { id: "general_sun", destination: null, name: "Journée ensoleillée", description: "Économise sur tes déplacements et reçois 400 ¥.", effect: { type: "money", amount: 400 } },
  { id: "general_luck", destination: null, name: "Coup de chance", description: "Reçois 800 ¥ pour les prochaines découvertes.", effect: { type: "money", amount: 800 } },
];

export const WORK_CARDS: WorkCard[] = [
  { id: "kyoto_tea", destination: "kyoto", name: "Service dans un salon de thé", income: 800 },
  { id: "kyoto_market", destination: "kyoto", name: "Aide sur un marché", income: 1000 },
  { id: "kyoto_office", destination: "kyoto", name: "Travail de bureau", income: 600, foodDiscount: 400 },
  { id: "tokyo_shop", destination: "tokyo", name: "Renfort dans une boutique", income: 900 },
  { id: "tokyo_delivery", destination: "tokyo", name: "Livraison dans le quartier", income: 1100 },
  { id: "tokyo_office", destination: "tokyo", name: "Travail de bureau", income: 600, foodDiscount: 400 },
  { id: "sapporo_market", destination: "sapporo", name: "Aide au marché", income: 900 },
  { id: "sapporo_inn", destination: "sapporo", name: "Service dans une auberge", income: 1100 },
  { id: "sapporo_office", destination: "sapporo", name: "Travail de bureau", income: 600, foodDiscount: 400 },
];

export const souvenirById = Object.fromEntries(SOUVENIRS.map((souvenir) => [souvenir.id, souvenir])) as Record<string, Souvenir>;
export const actionCardById = Object.fromEntries(ACTION_CARDS.map((card) => [card.id, card])) as Record<string, ActionCard>;
export const workCardById = Object.fromEntries(WORK_CARDS.map((card) => [card.id, card])) as Record<string, WorkCard>;

export function needsTarget(card: ActionCard) {
  return card.effect.type === "discard" || card.effect.type === "opponent-loss";
}
