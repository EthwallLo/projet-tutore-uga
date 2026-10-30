import {
  ACTION_CARDS, DESTINATIONS, FLIGHT_PRICE, SOUVENIRS, STARTING_MONEY, WORK_CARDS,
  actionCardById, needsTarget, souvenirById, workCardById, type ActionCard, type Souvenir,
} from "../data/game-cards";

export type Player = {
  id: string;
  name: string;
  money: number;
  destinationIndex: number;
  hand: string[];
  souvenirs: string[];
  discount: number;
  foodDiscount: number;
  protection: number;
  returnBonus: number;
};

export type GameState = {
  version: 1;
  phase: "playing" | "finished";
  players: Player[];
  activePlayerIndex: number;
  turn: number;
  revealedDestinations: number;
  revealAtTurn: number | null;
  seed: number;
  generalDeck: string[];
  workDecks: Record<string, string[]>;
  pendingCard: string | null;
  returnedBy: string | null;
  log: { turn: number; text: string }[];
};

export type GameCommand =
  | { type: "work" }
  | { type: "draw-action" }
  | { type: "resolve-action"; targetId: string }
  | { type: "play-card"; cardId: string; targetId?: string }
  | { type: "buy"; souvenirId: string }
  | { type: "travel" }
  | { type: "return" };

export type TurnAction = GameCommand & { turn: number };
export type GameTransition = { game: GameState; error: string | null };

export function validateNames(names: string[]) {
  if (names.length < 2 || names.length > 6) return "Choisis entre 2 et 6 joueurs.";
  const cleaned = names.map((name) => name.trim());
  if (cleaned.some((name) => name.length < 1 || name.length > 20)) return "Chaque prénom doit contenir entre 1 et 20 caractères.";
  if (new Set(cleaned.map((name) => name.toLocaleLowerCase("fr"))).size !== cleaned.length) return "Donne un prénom différent à chaque joueur.";
  return null;
}

function random(game: GameState) {
  // Une suite reproductible permet de sauvegarder les pioches et de tester les règles
  let value = game.seed;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  game.seed = value >>> 0;
  return game.seed / 4294967296;
}

function shuffle(game: GameState, ids: string[]) {
  const deck = [...ids];
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random(game) * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return deck;
}

function record(game: GameState, text: string) {
  game.log.push({ turn: game.turn, text });
  game.log = game.log.slice(-40);
}

export function createGame(names: string[], seed: number): GameState {
  const error = validateNames(names);
  if (error) throw new Error(error);
  const game: GameState = {
    version: 1, phase: "playing", activePlayerIndex: 0, turn: 1,
    revealedDestinations: 1, revealAtTurn: names.length + 1,
    seed: (seed >>> 0) || 1, generalDeck: [], workDecks: {}, pendingCard: null, returnedBy: null,
    players: names.map((name, index) => ({
      id: `player${index + 1}`, name: name.trim(), money: STARTING_MONEY,
      destinationIndex: 0, hand: ACTION_CARDS.filter((card) => card.destination === DESTINATIONS[0].id).map((card) => card.id),
      souvenirs: [], discount: 0, foodDiscount: 0, protection: 0, returnBonus: 0,
    })),
    log: [],
  };
  game.generalDeck = shuffle(game, ACTION_CARDS.filter((card) => card.destination === null).map((card) => card.id));
  for (const destination of DESTINATIONS) {
    game.workDecks[destination.id] = shuffle(game, WORK_CARDS.filter((card) => card.destination === destination.id).map((card) => card.id));
  }
  record(game, `Le voyage commence à Kyoto. ${game.players[0].name} joue en premier.`);
  return game;
}

export function activePlayer(game: GameState) {
  return game.players[game.activePlayerIndex];
}

export function playerPoints(player: Player) {
  return player.souvenirs.reduce((total, id) => total + souvenirById[id].points, player.returnBonus);
}

export function souvenirPrice(player: Player, souvenir: Souvenir) {
  return Math.max(0, souvenir.price - player.discount - (souvenir.type === "nourriture" ? player.foodDiscount : 0));
}

export function nextDestination(game: GameState) {
  const index = activePlayer(game).destinationIndex + 1;
  const destination = DESTINATIONS[index];
  if (!destination) return null;
  return { ...destination, available: index < game.revealedDestinations };
}

export function rankings(game: GameState) {
  const sorted = game.players.map((player) => ({ player, points: playerPoints(player), rank: 0 })).sort((a, b) => b.points - a.points);
  sorted.forEach((entry, index) => { entry.rank = index > 0 && entry.points === sorted[index - 1].points ? sorted[index - 1].rank : index + 1; });
  return sorted;
}

function finishTurn(game: GameState) {
  game.activePlayerIndex = (game.activePlayerIndex + 1) % game.players.length;
  game.turn += 1;
  if (game.revealAtTurn !== null && game.turn >= game.revealAtTurn) {
    game.revealedDestinations += 1;
    game.revealAtTurn = null;
    record(game, `${DESTINATIONS[game.revealedDestinations - 1].name} est maintenant accessible.`);
  }
}

function applyCard(game: GameState, player: Player, card: ActionCard, targetId?: string) {
  const effect = card.effect;
  if (needsTarget(card)) {
    const target = game.players.find((other) => other.id === targetId);
    if (!target || target.id === player.id) return "Choisis un autre joueur pour cette carte.";
    if (target.protection > 0) {
      target.protection -= 1;
      record(game, `${player.name} joue ${card.name}. La protection de ${target.name} absorbe le malus.`);
    } else if (effect.type === "opponent-loss") {
      const amount = Math.min(effect.amount, target.money);
      target.money -= amount;
      record(game, `${player.name} joue ${card.name}. ${target.name} perd ${amount} ¥.`);
    } else if (effect.type === "discard") {
      if (target.hand.length === 0) record(game, `${player.name} joue ${card.name}, mais ${target.name} n’a aucune carte à perdre.`);
      else {
        const [removed] = target.hand.splice(Math.floor(random(game) * target.hand.length), 1);
        record(game, `${player.name} joue ${card.name}. ${target.name} perd ${actionCardById[removed].name}.`);
      }
    }
    return null;
  }
  switch (effect.type) {
    case "money":
      player.money += effect.amount;
      record(game, `${player.name} joue ${card.name} et reçoit ${effect.amount} ¥.`);
      break;
    case "discount":
      player.discount += effect.amount;
      record(game, `${player.name} joue ${card.name} et obtient ${effect.amount} ¥ de réduction sur son prochain souvenir.`);
      break;
    case "food-discount":
      player.foodDiscount += effect.amount;
      record(game, `${player.name} joue ${card.name} et obtient ${effect.amount} ¥ de réduction sur sa prochaine nourriture.`);
      break;
    case "lose-money": {
      const amount = Math.min(player.money, effect.amount);
      player.money -= amount;
      record(game, `${player.name} pioche ${card.name} et paie ${amount} ¥.`);
      break;
    }
  }
  return null;
}

export function applyAction(current: GameState, action: TurnAction): GameTransition {
  const reject = (error: string): GameTransition => ({ game: current, error });
  if (current.phase !== "playing") return reject("La partie est terminée.");
  if (action.turn !== current.turn) return reject("Le tour a changé. Cette action n’a pas été jouée.");
  if (current.pendingCard && action.type !== "resolve-action") return reject("Choisis d’abord la cible de la carte piochée.");
  const game = structuredClone(current);
  const player = activePlayer(game);
  const destination = DESTINATIONS[player.destinationIndex];

  switch (action.type) {
    case "work": {
      if (game.workDecks[destination.id].length === 0) {
        game.workDecks[destination.id] = shuffle(game, WORK_CARDS.filter((card) => card.destination === destination.id).map((card) => card.id));
      }
      const card = workCardById[game.workDecks[destination.id].shift()!];
      player.money += card.income;
      player.foodDiscount += card.foodDiscount ?? 0;
      record(game, `${player.name} pioche ${card.name} et gagne ${card.income} ¥.${card.foodDiscount ? ` Son prochain souvenir de nourriture bénéficie de ${card.foodDiscount} ¥ de réduction.` : ""}`);
      break;
    }
    case "draw-action": {
      if (game.generalDeck.length === 0) game.generalDeck = shuffle(game, ACTION_CARDS.filter((card) => card.destination === null).map((card) => card.id));
      const card = actionCardById[game.generalDeck.shift()!];
      if (needsTarget(card)) {
        game.pendingCard = card.id;
        record(game, `${player.name} pioche ${card.name} et doit choisir un autre joueur.`);
        return { game, error: null };
      }
      applyCard(game, player, card);
      break;
    }
    case "resolve-action": {
      if (!game.pendingCard) return reject("Aucune carte ne demande de cible.");
      const error = applyCard(game, player, actionCardById[game.pendingCard], action.targetId);
      if (error) return reject(error);
      game.pendingCard = null;
      break;
    }
    case "play-card": {
      const index = player.hand.indexOf(action.cardId);
      if (index < 0) return reject("Cette carte n’est pas dans ta main.");
      const error = applyCard(game, player, actionCardById[action.cardId], action.targetId);
      if (error) return reject(error);
      player.hand.splice(index, 1);
      break;
    }
    case "buy": {
      const souvenir = souvenirById[action.souvenirId];
      if (!souvenir || souvenir.destination !== destination.id) return reject("Ce souvenir n’est pas disponible dans ta destination.");
      if (player.souvenirs.includes(souvenir.id)) return reject("Ce souvenir est déjà dans ta collection.");
      const price = souvenirPrice(player, souvenir);
      if (player.money < price) return reject("Tu n’as pas assez d’argent pour ce souvenir.");
      player.money -= price;
      player.souvenirs.push(souvenir.id);
      player.protection += souvenir.protection ?? 0;
      player.discount = 0;
      if (souvenir.type === "nourriture") player.foodDiscount = 0;
      record(game, `${player.name} acquiert ${souvenir.name} pour ${price} ¥ et gagne ${souvenir.points} ${souvenir.points > 1 ? "points" : "point"}.`);
      break;
    }
    case "travel": {
      const next = nextDestination(game);
      if (!next) return reject("Tu es déjà à la dernière destination.");
      if (!next.available) return reject("La prochaine destination n’est pas encore révélée.");
      if (player.money < next.travelPrice) return reject("Tu n’as pas assez d’argent pour ce déplacement.");
      player.money -= next.travelPrice;
      player.destinationIndex += 1;
      const arrivalCards = ACTION_CARDS.filter((card) => card.destination === next.id).map((card) => card.id);
      player.hand.push(...arrivalCards);
      record(game, `${player.name} arrive à ${next.name} pour ${next.travelPrice} ¥ et reçoit ${arrivalCards.length} cartes action.`);
      if (player.destinationIndex === game.revealedDestinations - 1 && game.revealedDestinations < DESTINATIONS.length && game.revealAtTurn === null) {
        game.revealAtTurn = game.turn + game.players.length + 1;
      }
      break;
    }
    case "return":
      if (player.destinationIndex !== DESTINATIONS.length - 1) return reject("L’avion du retour se prend à la dernière destination.");
      if (player.money < FLIGHT_PRICE) return reject("Tu n’as pas assez d’argent pour le billet d’avion.");
      player.money -= FLIGHT_PRICE;
      player.returnBonus = 1;
      game.returnedBy = player.id;
      game.phase = "finished";
      record(game, `${player.name} prend l’avion pour ${FLIGHT_PRICE} ¥. La partie se termine et ce premier retour rapporte 1 point bonus.`);
      return { game, error: null };
    default:
      return reject("Cette action n’est pas reconnue.");
  }
  finishTurn(game);
  return { game, error: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function ids(value: unknown, allowed: string[], unique = true): value is string[] {
  return Array.isArray(value) && value.length <= allowed.length && value.every((id) => typeof id === "string" && allowed.includes(id)) && (!unique || new Set(value).size === value.length);
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.version !== 1 || !["playing", "finished"].includes(String(value.phase))) return false;
  if (!Array.isArray(value.players) || value.players.length < 2 || value.players.length > 6) return false;
  if (!integer(value.activePlayerIndex, 0, value.players.length - 1) || !integer(value.turn, 1) || !integer(value.seed, 1, 4294967295)) return false;
  if (!integer(value.revealedDestinations, 1, DESTINATIONS.length)) return false;
  if (value.revealAtTurn !== null && (!integer(value.revealAtTurn, value.turn + 1) || value.revealedDestinations === DESTINATIONS.length)) return false;
  const names: string[] = [];
  for (let index = 0; index < value.players.length; index++) {
    const player = value.players[index];
    if (!isRecord(player) || player.id !== `player${index + 1}` || typeof player.name !== "string" || !player.name.trim() || player.name.length > 20) return false;
    names.push(player.name);
    if (!integer(player.destinationIndex, 0, value.revealedDestinations - 1)) return false;
    if (![player.money, player.discount, player.foodDiscount, player.protection].every((field) => integer(field))) return false;
    if (!integer(player.returnBonus, 0, 1)) return false;
    const visited = DESTINATIONS.slice(0, player.destinationIndex + 1).map((destination) => String(destination.id));
    if (!ids(player.hand, ACTION_CARDS.filter((card) => card.destination && visited.includes(card.destination)).map((card) => card.id))) return false;
    if (!ids(player.souvenirs, SOUVENIRS.filter((souvenir) => visited.includes(souvenir.destination)).map((souvenir) => souvenir.id))) return false;
  }
  if (validateNames(names)) return false;
  const atFrontier = value.players.some((player) => player.destinationIndex === (value.revealedDestinations as number) - 1);
  if (value.revealedDestinations < DESTINATIONS.length && atFrontier && value.revealAtTurn === null) return false;
  if (value.revealAtTurn !== null && !atFrontier) return false;
  const generalIds = ACTION_CARDS.filter((card) => card.destination === null).map((card) => card.id);
  if (!ids(value.generalDeck, generalIds) || !isRecord(value.workDecks)) return false;
  for (const destination of DESTINATIONS) {
    if (!ids(value.workDecks[destination.id], WORK_CARDS.filter((card) => card.destination === destination.id).map((card) => card.id))) return false;
  }
  if (value.pendingCard !== null && (typeof value.pendingCard !== "string" || !generalIds.includes(value.pendingCard) || !needsTarget(actionCardById[value.pendingCard]) || value.phase !== "playing" || value.generalDeck.includes(value.pendingCard))) return false;
  const returned = value.players.filter((player) => player.returnBonus === 1);
  if (value.phase === "playing" && (value.returnedBy !== null || returned.length !== 0)) return false;
  if (value.phase === "finished" && (returned.length !== 1 || returned[0].id !== value.returnedBy || returned[0].destinationIndex !== DESTINATIONS.length - 1 || value.pendingCard !== null)) return false;
  return Array.isArray(value.log) && value.log.length > 0 && value.log.length <= 40 && value.log.every((entry) => isRecord(entry) && integer(entry.turn, 1, value.turn as number) && typeof entry.text === "string" && entry.text.length <= 500);
}
