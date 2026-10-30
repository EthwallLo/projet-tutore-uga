"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import GameDialog from "@/components/game-dialog";
import { DESTINATIONS, FLIGHT_PRICE, SOUVENIRS, STARTING_MONEY, actionCardById, needsTarget, souvenirById, type ActionCard } from "@/data/game-cards";
import { activePlayer, nextDestination, playerPoints, rankings, souvenirPrice, validateNames, type GameCommand, type GameState, type Player } from "@/lib/game";
import type { GameSession } from "@/lib/use-game";
import { cities, project } from "@/lib/japan";

export function yen(value: number) { return `${value.toLocaleString("fr-FR")} ¥`; }
function points(value: number) { return `${value} ${value === 1 ? "point" : "points"}`; }

function GameSetup({ players, onStart, onClose }: { players?: Player[]; onStart: (names: string[]) => void; onClose: () => void }) {
  const [count, setCount] = useState(players?.length ?? 2);
  const [names, setNames] = useState(Array.from({ length: 6 }, (_, index) => players?.[index]?.name ?? `Joueur ${index + 1}`));
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = names.slice(0, count).map((name) => name.trim());
    const problem = validateNames(selected);
    setError(problem);
    if (!problem) onStart(selected);
  }

  return (
    <GameDialog id="game-setup" title="Préparer le voyage" onClose={onClose}>
      <p>Jouez à tour de rôle sur ce même écran. Le voyage commence à Kyoto, avec {yen(STARTING_MONEY)} par personne.</p>
      <form onSubmit={submit}>
        <label className="game-field">Nombre de joueurs
          <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
            {[2, 3, 4, 5, 6].map((number) => <option key={number} value={number}>{number} joueurs</option>)}
          </select>
        </label>
        <div className="game-names">
          {names.slice(0, count).map((name, index) => <label key={index} className="game-field">Joueur {index + 1}<input name={`player${index + 1}`} value={name} required maxLength={20} autoComplete="off" onChange={(event) => setNames(names.map((current, position) => position === index ? event.target.value : current))} /></label>)}
        </div>
        <p className="game-note">Une action principale par tour, trois destinations, puis l’avion du retour. Le premier joueur de la liste commence.</p>
        {players && <p className="game-note">Le lancement remplacera la partie enregistrée.</p>}
        {error && <p role="alert" className="game-error">{error}</p>}
        <button className="game-button game-button-primary" type="submit">{players ? "Lancer la nouvelle partie" : "Commencer le voyage"}</button>
      </form>
    </GameDialog>
  );
}

function Rules({ onClose }: { onClose: () => void }) {
  return (
    <GameDialog id="game-rules" title="Les règles du voyage" onClose={onClose}>
      <p>Collectionne les souvenirs qui rapportent le plus de points. Chaque joueur commence avec {yen(STARTING_MONEY)} et deux cartes à Kyoto.</p>
      <ol className="game-rules-list">
        <li>À ton tour, effectue une action : travailler, jouer une carte, piocher une action générale, acheter un souvenir ou voyager.</li>
        <li>Une action acceptée passe la main au joueur suivant. Consulter les fiches, les cartes et les collections est gratuit.</li>
        <li>La première destination suivante se révèle après le premier tour de table. Ensuite, chaque joueur doit avoir joué une fois après la première arrivée pour révéler l’étape suivante.</li>
        <li>Les voyages se font vers la prochaine étape révélée. Chaque arrivée donne deux cartes propres à la destination.</li>
        <li>Une action générale piochée se joue immédiatement. Si elle vise un autre joueur, choisis sa cible pour terminer le tour.</li>
        <li>Les réductions s’additionnent et servent au prochain achat concerné, sans rendre le prix négatif. Chaque souvenir peut être acheté une fois par joueur.</li>
        <li>Le petit boulot de bureau donne une réduction sur la prochaine nourriture. L’onsen bloque un seul malus venant d’un autre joueur.</li>
        <li>Depuis la dernière destination, paie {yen(FLIGHT_PRICE)} pour rentrer. La partie se termine immédiatement et ce retour rapporte 1 point.</li>
      </ol>
      <p>Le meilleur total de points gagne. En cas d’égalité, les joueurs partagent la victoire. Les prix et les gains sont des valeurs de jeu à tester ensemble.</p>
    </GameDialog>
  );
}

function TargetChoice({ game, card, onChoose, onCancel }: { game: GameState; card: ActionCard; onChoose: (id: string) => void; onCancel?: () => void }) {
  const choiceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    choiceRef.current?.scrollIntoView({ block: "nearest" });
    choiceRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, []);
  return (
    <section ref={choiceRef} className="game-target" aria-label={`Choisir la cible de ${card.name}`}>
      <h3>{card.name}</h3><p>{card.description}</p>
      <p className="game-note">Choisis un autre voyageur{onCancel ? "" : " pour terminer ton action"}.</p>
      <div className="game-target-buttons">
        {game.players.filter((player) => player.id !== activePlayer(game).id).map((player) => <button className="game-button" type="button" key={player.id} onClick={() => onChoose(player.id)}>{player.name}{player.protection > 0 ? " · protégé" : ""}</button>)}
      </div>
      {onCancel && <button type="button" className="game-text-button" onClick={onCancel}>Annuler</button>}
    </section>
  );
}

function Collections({ game, selectedId, onSelect }: { game: GameState; selectedId: string; onSelect: (id: string) => void }) {
  const player = game.players.find((person) => person.id === selectedId) ?? activePlayer(game);
  return (
    <section className="game-collection">
      <label className="game-field">Collection à consulter<select value={player.id} onChange={(event) => onSelect(event.target.value)}>{game.players.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
      <p className="game-collection-total">{points(playerPoints(player))} · {player.souvenirs.length} {player.souvenirs.length === 1 ? "souvenir" : "souvenirs"}</p>
      {player.souvenirs.length === 0 ? <p className="game-empty">Les souvenirs du voyage apparaîtront ici.</p> : <ul className="game-card-list">{player.souvenirs.map((id) => {
        const souvenir = souvenirById[id];
        return <li key={id} className="game-small-card"><div className="game-card-heading"><h3>{souvenir.name}</h3><span>{points(souvenir.points)}</span></div><p className="game-card-meta">{DESTINATIONS.find((destination) => destination.id === souvenir.destination)?.name} · {souvenir.type}</p><p>{souvenir.description}</p></li>;
      })}</ul>}
      {player.returnBonus > 0 && <p className="game-bonus">Premier retour en avion : 1 point bonus</p>}
      {player.protection > 0 && <p className="game-note">Protection disponible contre {player.protection} malus.</p>}
    </section>
  );
}

function TravelAction({ game, act }: { game: GameState; act: (command: GameCommand) => void }) {
  const player = activePlayer(game);
  const next = nextDestination(game);
  return (
    <section className="game-travel" aria-label="Changer de destination">
      {next ? <>
        <button className="game-button" type="button" disabled={!next.available || !!game.pendingCard || player.money < next.travelPrice} onClick={() => act({ type: "travel" })}>
          {next.available ? `Voyager à ${next.name} pour ${yen(next.travelPrice)}` : "Prochaine destination à découvrir"}
        </button>
        {next.available && player.money < next.travelPrice && <p className="game-note">Il te manque {yen(next.travelPrice - player.money)} pour partir.</p>}
      </> : <>
        <button className="game-button game-button-primary" type="button" disabled={!!game.pendingCard || player.money < FLIGHT_PRICE} onClick={() => act({ type: "return" })}>Prendre l’avion pour {yen(FLIGHT_PRICE)}</button>
        <p className="game-note">Le retour termine la partie et rapporte 1 point bonus.{player.money < FLIGHT_PRICE ? ` Il te manque ${yen(FLIGHT_PRICE - player.money)}.` : ""}</p>
      </>}
    </section>
  );
}

function TurnHandoff({ player, onContinue }: { player: Player; onContinue: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { button.current?.focus({ preventScroll: true }); }, []);
  return (
    <section className="game-handoff" aria-label="Passer au joueur suivant">
      <h3>Au tour de {player.name}</h3>
      <p>Passez l’écran à {player.name} avant de dévoiler ses cartes et de jouer son action.</p>
      <button ref={button} className="game-button game-button-primary" type="button" onClick={onContinue}>Jouer mon tour</button>
    </section>
  );
}

export function JourneyOnMap({ game }: { game: GameState }) {
  const route = DESTINATIONS.slice(0, game.revealedDestinations).map((destination) => cities.find((city) => city.id === destination.id)!).map((city) => project(city.longitude, city.latitude));
  return route.length > 1 ? <polyline className="game-map-route" aria-hidden="true" points={route.map((point) => `${point.x},${point.y}`).join(" ")} /> : null;
}

export function GameCityAction({ session, cityId, onTravel }: { session: GameSession; cityId: string; onTravel: () => void }) {
  const game = session.game;
  if (!game || game.phase === "finished") return null;
  const player = activePlayer(game);
  const next = nextDestination(game);
  if (DESTINATIONS[player.destinationIndex].id === cityId) return <p className="city-card-game">{player.name} se trouve actuellement ici. Les souvenirs de cette ville sont disponibles dans le panneau de jeu.</p>;
  if (!next || next.id !== cityId || !next.available) return null;
  return <div className="city-card-game"><button className="game-button game-button-primary" type="button" disabled={!session.turnReady || player.money < next.travelPrice || !!game.pendingCard} onClick={() => { session.act({ type: "travel" }); onTravel(); }}>Voyager ici pour {yen(next.travelPrice)}</button><p className="game-note">Ce déplacement utilise le tour de {player.name}.</p></div>;
}

export default function GameInterface({ session }: { session: GameSession }) {
  const { game, ready, error } = session;
  const [setupOpen, setSetupOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tab, setTab] = useState<"destination" | "hand" | "collection">("destination");
  const [collectionId, setCollectionId] = useState("");
  const [targetCard, setTargetCard] = useState<{ id: string; turn: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const player = game ? activePlayer(game) : null;

  function act(command: GameCommand) { setTargetCard(null); session.act(command); }
  function inspectCollection(id: string) { setCollectionId(id); setTab("collection"); panelRef.current?.scrollIntoView({ block: "nearest" }); }

  return (
    <>
      {!game && ready && <div className="game-start"><button className="game-button game-button-primary" type="button" onClick={() => setSetupOpen(true)}>Commencer une partie</button><span>Un voyage à partager, de 2 à 6 joueurs</span></div>}
      {game && player && <>
        <header className="game-header">
          <div className="game-turn-heading"><p className="game-eyebrow">{game.phase === "finished" ? "Le voyage est terminé" : `Tour ${game.turn} · Une action à jouer`}</p><h1>{game.phase === "finished" ? "Les souvenirs du voyage" : `À ton tour, ${player.name}`}</h1></div>
          <div className="game-scoreboard" aria-label="Les voyageurs">
            {game.players.map((person, index) => <button type="button" key={person.id} className={`game-player${index === game.activePlayerIndex && game.phase === "playing" ? " game-player-active" : ""}`} onClick={() => inspectCollection(person.id)} aria-label={`Collection de ${person.name}, ${points(playerPoints(person))}, ${yen(person.money)}`}><strong>{person.name}</strong><span>{yen(person.money)} · {points(playerPoints(person))}</span><small>{DESTINATIONS[person.destinationIndex].name}</small></button>)}
          </div>
        </header>

        <aside className="game-panel" ref={panelRef} aria-label="Panneau de jeu">
          {game.phase === "finished" ? <section className="game-results" aria-labelledby="game-results-title">
            <p className="game-eyebrow">Fin de partie</p><h2 id="game-results-title">{rankings(game).filter((entry) => entry.rank === 1).map((entry) => entry.player.name).join(" et ")} {rankings(game).filter((entry) => entry.rank === 1).length > 1 ? "remportent" : "remporte"} le voyage</h2>
            <p>{game.players.find((person) => person.id === game.returnedBy)?.name} a pris l’avion et reçu 1 point bonus.</p>
            <ol className="game-ranking">{rankings(game).map((entry) => <li key={entry.player.id}><span>{entry.rank} · {entry.player.name}</span><strong>{points(entry.points)}</strong></li>)}</ol>
            <Collections game={game} selectedId={collectionId || player.id} onSelect={setCollectionId} />
          </section> : <>
            <section className="game-destination-heading"><p className="game-eyebrow">Destination de {player.name}</p><h2>{DESTINATIONS[player.destinationIndex].name}</h2><p>{yen(player.money)} à dépenser · {points(playerPoints(player))}</p></section>
            <ol className="game-itinerary" aria-label="Les étapes du voyage">{DESTINATIONS.map((destination, index) => <li key={destination.id} aria-current={index === player.destinationIndex ? "step" : undefined} className={index < game.revealedDestinations ? "game-step-revealed" : ""}><span>{index + 1}</span>{index < game.revealedDestinations ? destination.name : "À découvrir"}</li>)}</ol>
            {game.revealAtTurn !== null && <p className="game-note">Prochaine étape révélée après {game.revealAtTurn - game.turn} {game.revealAtTurn - game.turn === 1 ? "action" : "actions"}.</p>}
            {session.turnReady ? <>
            <div className="game-primary-actions"><button className="game-button game-button-primary" type="button" disabled={!!game.pendingCard} onClick={() => act({ type: "work" })}>Travailler</button><button className="game-button" type="button" disabled={!!game.pendingCard} onClick={() => act({ type: "draw-action" })}>Piocher une action</button></div>
            <TravelAction game={game} act={act} />
            {game.pendingCard && <TargetChoice game={game} card={actionCardById[game.pendingCard]} onChoose={(targetId) => act({ type: "resolve-action", targetId })} />}
            {(player.discount > 0 || player.foodDiscount > 0 || player.protection > 0) && <div className="game-benefits" aria-label="Avantages actifs">{player.discount > 0 && <span>Prochain souvenir : {yen(player.discount)} de réduction</span>}{player.foodDiscount > 0 && <span>Prochaine nourriture : {yen(player.foodDiscount)} de réduction</span>}{player.protection > 0 && <span>{player.protection} protection contre un malus</span>}</div>}
            {error && <p className="game-error" role="alert">{error}</p>}
            <nav className="game-tabs" aria-label="Consulter la partie"><button type="button" aria-pressed={tab === "destination"} onClick={() => setTab("destination")}>Souvenirs</button><button type="button" aria-pressed={tab === "hand"} onClick={() => setTab("hand")}>Mes cartes ({player.hand.length})</button><button type="button" aria-pressed={tab === "collection"} onClick={() => { setCollectionId(player.id); setTab("collection"); }}>Collections</button></nav>

            {tab === "destination" && <section aria-label={`Souvenirs de ${DESTINATIONS[player.destinationIndex].name}`}><p className="game-note">Chaque souvenir peut rejoindre ta collection une fois.</p><ul className="game-card-list">{SOUVENIRS.filter((souvenir) => souvenir.destination === DESTINATIONS[player.destinationIndex].id).map((souvenir) => {
              const price = souvenirPrice(player, souvenir);
              const owned = player.souvenirs.includes(souvenir.id);
              return <li key={souvenir.id} className="game-small-card"><div className="game-card-heading"><h3>{souvenir.name}</h3><span>{points(souvenir.points)}</span></div><p className="game-card-meta">{souvenir.type}{souvenir.protection ? " · protection" : ""}</p><p>{souvenir.description}</p><button className="game-button game-buy" type="button" data-souvenir={souvenir.id} disabled={owned || !!game.pendingCard || price > player.money} onClick={() => act({ type: "buy", souvenirId: souvenir.id })}>{owned ? "Dans ta collection" : <>Acquérir pour {yen(price)}{price !== souvenir.price && <s>{yen(souvenir.price)}</s>}</>}</button></li>;
            })}</ul></section>}

            {tab === "hand" && <section aria-label="Les cartes du joueur actif"><p className="game-note">Jouer une carte utilise ton tour. Les réductions restent disponibles pour un prochain achat.</p>{player.hand.length === 0 && <p className="game-empty">Ta main est vide. Tu recevras de nouvelles cartes à la prochaine destination.</p>}<ul className="game-card-list">{player.hand.map((id) => {
              const card = actionCardById[id];
              return <li key={id} className="game-small-card"><h3>{card.name}</h3><p className="game-card-meta">Carte de {DESTINATIONS.find((destination) => destination.id === card.destination)?.name}</p><p>{card.description}</p><button className="game-button" type="button" data-action-card={id} disabled={!!game.pendingCard} onClick={() => needsTarget(card) ? setTargetCard({ id, turn: game.turn }) : act({ type: "play-card", cardId: id })}>Jouer cette carte</button></li>;
            })}</ul>{targetCard?.turn === game.turn && player.hand.includes(targetCard.id) && !game.pendingCard && <TargetChoice game={game} card={actionCardById[targetCard.id]} onChoose={(targetId) => act({ type: "play-card", cardId: targetCard.id, targetId })} onCancel={() => setTargetCard(null)} />}</section>}
            {tab === "collection" && <Collections game={game} selectedId={collectionId || player.id} onSelect={setCollectionId} />}

            </> : <><TurnHandoff player={player} onContinue={session.continueTurn} /><button type="button" className="game-text-button" onClick={() => { setCollectionId(player.id); setTab("collection"); }}>Consulter les collections</button>{tab === "collection" && <Collections game={game} selectedId={collectionId || player.id} onSelect={setCollectionId} />}</>}
          </>}
          <section className="game-journal" aria-label="Dernières actions"><h3>Carnet du voyage</h3><ol>{game.log.slice(-3).map((entry, index) => <li key={`${entry.turn}-${index}`}>{entry.text}</li>)}</ol><p className="sr-only" aria-live="polite" aria-atomic="true">{game.log.at(-1)?.text} {game.phase === "playing" ? `Au tour de ${player.name}.` : "Partie terminée."}</p></section>
          <footer className="game-panel-footer"><button type="button" className="game-text-button" onClick={() => setRulesOpen(true)}>Règles du jeu</button><button type="button" className="game-text-button" onClick={() => setSetupOpen(true)}>{game.phase === "finished" ? "Rejouer" : "Nouvelle partie"}</button><span>Partie locale sur ce navigateur</span></footer>
        </aside>
      </>}
      {setupOpen && <GameSetup players={game?.players} onClose={() => setSetupOpen(false)} onStart={(names) => { session.start(names); setSetupOpen(false); setTab("destination"); setCollectionId(""); setTargetCard(null); }} />}
      {rulesOpen && <Rules onClose={() => setRulesOpen(false)} />}
    </>
  );
}
