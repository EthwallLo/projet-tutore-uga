import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_CARDS, FLIGHT_PRICE, STARTING_MONEY, souvenirById } from "../data/game-cards";
import { activePlayer, applyAction, createGame, isGameState, playerPoints, rankings, souvenirPrice, type GameCommand, type GameState } from "../lib/game";

function play(game: GameState, command: GameCommand) {
  const result = applyAction(game, { ...command, turn: game.turn });
  assert.equal(result.error, null);
  assert.equal(isGameState(result.game), true, "Une transition conserve une sauvegarde valide");
  return result.game;
}

function inTokyo() {
  const game = createGame(["Alice", "Basile"], 123);
  game.revealedDestinations = 3;
  game.revealAtTurn = null;
  game.turn = 10;
  for (const player of game.players) {
    player.destinationIndex = 1;
    player.hand.push(...ACTION_CARDS.filter((card) => card.destination === "tokyo").map((card) => card.id));
  }
  return game;
}

test("Le départ valide les joueurs et distribue seulement les cartes de Kyoto", () => {
  for (const count of [2, 3, 4, 5, 6]) {
    const game = createGame(Array.from({ length: count }, (_, index) => `Voyageur ${index + 1}`), 10);
    assert.equal(isGameState(game), true);
    assert.equal(game.players.length, count);
    assert.equal(game.players[0].money, STARTING_MONEY);
    assert.deepEqual(game.players[0].hand, ["kyoto_coupon", "kyoto_help"]);
  }
  assert.throws(() => createGame(["Alice"], 1));
  assert.throws(() => createGame(["Alice", " alice "], 1));
  assert.throws(() => createGame(["", "Basile"], 1));
});

test("Les destinations sont révélées après les actions de tout le groupe", () => {
  for (const count of [2, 3, 6]) {
    let game = createGame(Array.from({ length: count }, (_, index) => `Voyageur ${index + 1}`), 10);
    assert.ok(applyAction(game, { type: "travel", turn: game.turn }).error);
    for (let index = 0; index < count; index++) {
      assert.equal(game.revealedDestinations, 1);
      game = play(game, { type: "work" });
    }
    assert.equal(game.revealedDestinations, 2);
    const money = activePlayer(game).money;
    game = play(game, { type: "travel" });
    assert.equal(game.players[0].money, money - 600);
    assert.equal(game.players[0].destinationIndex, 1);
    assert.ok(game.players[0].hand.includes("tokyo_evening"));
    for (let index = 0; index < count; index++) {
      assert.equal(game.revealedDestinations, 2);
      game = play(game, { type: "work" });
    }
    assert.equal(game.revealedDestinations, 3);
  }
});

test("Un achat déduit le prix exact, ajoute les points et refuse les achats impossibles", () => {
  const initial = createGame(["Alice", "Basile"], 3);
  const before = structuredClone(initial);
  let game = play(initial, { type: "buy", souvenirId: "kyoto_fan" });
  assert.deepEqual(initial, before, "Le moteur ne modifie pas l’état précédent");
  assert.equal(game.players[0].money, 800);
  assert.equal(playerPoints(game.players[0]), 2);
  game = play(game, { type: "work" });
  for (const souvenirId of ["kyoto_fan", "kyoto_ryokan", "tokyo_print", "missing"]) {
    const result = applyAction(game, { type: "buy", souvenirId, turn: game.turn });
    assert.ok(result.error);
    assert.strictEqual(result.game, game);
  }
});

test("Les déplacements et l’avion exigent les fonds et la bonne étape", () => {
  let game = createGame(["Alice", "Basile"], 3);
  assert.ok(applyAction(game, { type: "return", turn: game.turn }).error);
  game = play(game, { type: "work" });
  game = play(game, { type: "work" });
  game.players[0].money = 599;
  const failed = applyAction(game, { type: "travel", turn: game.turn });
  assert.ok(failed.error);
  assert.strictEqual(failed.game, game);
  game.players[0].money = 600;
  game = play(game, { type: "travel" });
  assert.equal(game.players[0].money, 0);
  const final = inTokyo();
  final.players[0].destinationIndex = 2;
  final.players[0].money = FLIGHT_PRICE - 1;
  const flight = applyAction(final, { type: "return", turn: final.turn });
  assert.ok(flight.error);
  assert.equal(flight.game.phase, "playing");
});

test("Les réductions se cumulent, ne rendent pas d’argent et respectent la nourriture", () => {
  let game = createGame(["Alice", "Basile"], 2);
  game.players[0].foodDiscount = 400;
  game = play(game, { type: "play-card", cardId: "kyoto_coupon" });
  assert.equal(game.players[0].discount, 400);
  game = play(game, { type: "work" });
  assert.equal(souvenirPrice(game.players[0], souvenirById.kyoto_fan), 600);
  assert.equal(souvenirPrice(game.players[0], souvenirById.kyoto_matcha), 0);
  game = play(game, { type: "buy", souvenirId: "kyoto_matcha" });
  assert.equal(game.players[0].money, STARTING_MONEY);
  assert.equal(game.players[0].discount, 0);
  assert.equal(game.players[0].foodDiscount, 0);
  const other = createGame(["Alice", "Basile"], 2);
  other.players[0].foodDiscount = 400;
  const bought = play(other, { type: "buy", souvenirId: "kyoto_fan" });
  assert.equal(bought.players[0].foodDiscount, 400);
});

test("Le travail de bureau donne de l’argent et un avantage sur le prochain repas", () => {
  const game = createGame(["Alice", "Basile"], 5);
  game.workDecks.kyoto = ["kyoto_office"];
  const next = play(game, { type: "work" });
  assert.equal(next.players[0].money, STARTING_MONEY + 600);
  assert.equal(next.players[0].foodDiscount, 400);
  assert.equal(next.players[0].hand.length, 2);
});

test("Une action générale ciblée garde le même joueur jusqu’au choix de la cible", () => {
  let game = createGame(["Alice", "Basile"], 5);
  game.generalDeck = ["general_evening"];
  game = play(game, { type: "draw-action" });
  assert.equal(game.turn, 1);
  assert.equal(game.pendingCard, "general_evening");
  assert.ok(applyAction(game, { type: "work", turn: 1 }).error);
  assert.ok(applyAction(game, { type: "resolve-action", targetId: "player1", turn: 1 }).error);
  assert.ok(applyAction(game, { type: "resolve-action", targetId: "missing", turn: 1 }).error);
  const restored = JSON.parse(JSON.stringify(game));
  assert.equal(isGameState(restored), true);
  game = play(restored, { type: "resolve-action", targetId: "player2" });
  assert.equal(game.pendingCard, null);
  assert.equal(game.turn, 2);
  assert.equal(game.players[1].hand.length, 1);
});

test("Une carte générale immédiate n’est pas ajoutée à la main", () => {
  const game = createGame(["Alice", "Basile"], 5);
  game.generalDeck = ["general_encounter"];
  const next = play(game, { type: "draw-action" });
  assert.equal(next.players[0].money, STARTING_MONEY + 600);
  assert.equal(next.players[0].hand.length, 2);
  assert.equal(next.turn, 2);
});

test("L’onsen protège une fois et garde son point après la consommation du pouvoir", () => {
  let game = inTokyo();
  game = play(game, { type: "buy", souvenirId: "tokyo_onsen" });
  const money = game.players[0].money;
  game = play(game, { type: "play-card", cardId: "tokyo_evening", targetId: "player1" });
  assert.equal(game.players[0].hand.length, 4);
  assert.equal(game.players[0].protection, 0);
  assert.equal(playerPoints(game.players[0]), 1);
  assert.equal(game.players[0].money, money);
  game = play(game, { type: "work" });
  game.generalDeck = ["general_evening"];
  game = play(game, { type: "draw-action" });
  game = play(game, { type: "resolve-action", targetId: "player1" });
  assert.equal(game.players[0].hand.length, 3);
});

test("Les malus ne rendent pas un portefeuille négatif et fonctionnent aussi avec une main vide", () => {
  let game = createGame(["Alice", "Basile"], 7);
  game.players[1].money = 100;
  game.generalDeck = ["general_detour"];
  game = play(game, { type: "draw-action" });
  game = play(game, { type: "resolve-action", targetId: "player2" });
  assert.equal(game.players[1].money, 0);
  game.players[0].hand = [];
  game.generalDeck = ["general_evening"];
  game = play(game, { type: "draw-action" });
  game = play(game, { type: "resolve-action", targetId: "player1" });
  assert.equal(game.players[0].hand.length, 0);
});

test("Une action périmée ne joue pas le tour du joueur suivant", () => {
  const action = { type: "work" as const, turn: 1 };
  const first = applyAction(createGame(["Alice", "Basile"], 1), action);
  const second = applyAction(first.game, action);
  assert.ok(second.error);
  assert.strictEqual(second.game, first.game);
  assert.equal(second.game.turn, 2);
});

test("Une partie complète peut aller jusqu’au retour et les points décident du gagnant", () => {
  let game = createGame(["Alice", "Basile"], 9);
  game = play(game, { type: "work" });
  game = play(game, { type: "buy", souvenirId: "kyoto_ryokan" });
  game = play(game, { type: "travel" });
  game = play(game, { type: "work" });
  game = play(game, { type: "work" });
  game = play(game, { type: "work" });
  game = play(game, { type: "travel" });
  while (activePlayer(game).id !== "player1" || activePlayer(game).money < FLIGHT_PRICE) game = play(game, { type: "work" });
  const before = game.players[0].money;
  game = play(game, { type: "return" });
  assert.equal(game.phase, "finished");
  assert.equal(game.players[0].money, before - FLIGHT_PRICE);
  assert.equal(game.players[0].returnBonus, 1);
  assert.equal(rankings(game)[0].player.id, "player2", "Le premier à rentrer ne gagne pas automatiquement");
  assert.ok(applyAction(game, { type: "work", turn: game.turn }).error);
  assert.equal(isGameState(JSON.parse(JSON.stringify(game))), true);
});

test("Le classement conserve les égalités", () => {
  const game = createGame(["Alice", "Basile", "Chloé"], 1);
  game.players[0].souvenirs = ["kyoto_fan"];
  game.players[1].souvenirs = ["kyoto_fan"];
  assert.deepEqual(rankings(game).map((entry) => entry.rank), [1, 1, 3]);
});

test("Les pioches se renouvellent et restent reproductibles après sauvegarde", () => {
  let first = createGame(["Alice", "Basile"], 89);
  for (let index = 0; index < 12; index++) first = play(first, { type: "work" });
  let restored: GameState = JSON.parse(JSON.stringify(first));
  for (let index = 0; index < 20; index++) {
    first = play(first, { type: "draw-action" });
    restored = play(restored, { type: "draw-action" });
    if (first.pendingCard) {
      const targetId = first.players.find((player) => player.id !== activePlayer(first).id)!.id;
      first = play(first, { type: "resolve-action", targetId });
      restored = play(restored, { type: "resolve-action", targetId });
    }
    assert.deepEqual(first, restored);
  }
});

test("Une sauvegarde invalide est refusée avant sa réutilisation", () => {
  const game = createGame(["Alice", "Basile"], 1);
  for (const invalid of [null, {}, { ...game, version: 2 }, { ...game, activePlayerIndex: 10 }, { ...game, seed: 0 }, { ...game, pendingCard: "missing" }, { ...game, workDecks: {} }, { ...game, revealedDestinations: 7 }]) assert.equal(isGameState(invalid), false);
  for (const edit of [(state: GameState) => { state.players[0].money = -1; }, (state: GameState) => { state.players[0].souvenirs = ["missing"]; }, (state: GameState) => { state.players[0].hand = ["general_coupon"]; }, (state: GameState) => { state.players[0].destinationIndex = 2; }]) {
    const invalid = structuredClone(game); edit(invalid); assert.equal(isGameState(invalid), false);
  }
});
