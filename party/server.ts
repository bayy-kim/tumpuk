import type * as Party from "partykit/server";
import {
  Card,
  CardColor,
  ClientEvent,
  HouseRules,
  PlayerPublicState,
  PlayerSelfState,
  PlayerState,
  ServerEvent,
} from "../lib/events";

export interface ServerPlayerState extends PlayerState {
  isHost: boolean;
  isSpectator?: boolean;
}

export interface ServerGameState {
  roomId: string;
  players: ServerPlayerState[];
  deck: Card[];
  discardPile: Card[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: CardColor;
  drawStack: number;
  turnDeadline: number;
  status: "waiting" | "playing" | "finished";
  houseRules: HouseRules;
  winnerId: string | null;
  loserId: string | null;
}

function generateDeck(): Card[] {
  const colors: CardColor[] = ["red", "yellow", "green", "blue"];
  const deck: Card[] = [];

  colors.forEach((color) => {
    deck.push({ id: `${color}-0`, color, type: "number", value: 0 });

    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `${color}-${i}-a`, color, type: "number", value: i });
      deck.push({ id: `${color}-${i}-b`, color, type: "number", value: i });
    }

    for (const type of ["skip", "reverse", "draw2"] as const) {
      deck.push({ id: `${color}-${type}-a`, color, type });
      deck.push({ id: `${color}-${type}-b`, color, type });
    }
  });

  for (let i = 1; i <= 4; i++) {
    deck.push({ id: `wild-${i}`, color: "wild", type: "wild" });
    deck.push({ id: `wild4-${i}`, color: "wild", type: "wild4" });
  }

  return deck;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default class GameServer implements Party.Server {
  state: ServerGameState;
  turnTimer: ReturnType<typeof setTimeout> | null = null;
  pollTimer: ReturnType<typeof setTimeout> | null = null;
  disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  pollVotes = new Map<string, string>(); // playerId -> voted option

  constructor(readonly room: Party.Room) {
    this.state = {
      roomId: room.id,
      players: [],
      deck: [],
      discardPile: [],
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: "wild",
      drawStack: 0,
      turnDeadline: 0,
      status: "waiting",
      houseRules: {
        stacking: true,
        jumpIn: false,
        sevenZero: true,
        drawToMatch: true,
      },
      winnerId: null,
      loserId: null,
    };
  }

  onConnect() {
    // Handled in join_room message
  }

  onClose(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player) return;

    player.connected = false;

    const timeout = setTimeout(() => {
      this.handlePlayerExit(conn.id);
    }, 60000);

    this.disconnectTimers.set(conn.id, timeout);
    this.broadcastRoomUpdate();
    this.broadcastGameState();
  }

  onMessage(messageString: string, sender: Party.Connection) {
    try {
      const event = JSON.parse(messageString) as ClientEvent;
      this.handleClientEvent(event, sender);
    } catch (err) {
      console.error("Error processing WebSocket message:", err);
    }
  }

  handleClientEvent(event: ClientEvent, sender: Party.Connection) {
    const senderId = sender.id;

    switch (event.type) {
      case "join_room": {
        const { userId, userName, isSpectator } = event.payload;
        const actualPlayerId = userId || senderId;

        if (this.disconnectTimers.has(actualPlayerId)) {
          clearTimeout(this.disconnectTimers.get(actualPlayerId)!);
          this.disconnectTimers.delete(actualPlayerId);
        }

        let player = this.state.players.find((p) => p.id === actualPlayerId || p.id === senderId);

        if (!player) {
          if (this.state.players.length >= 6) {
            sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Room penuh! Maksimal 6 pemain." } }));
            return;
          }

          const isHost = this.state.players.length === 0;

          player = {
            id: actualPlayerId,
            name: userName || `Pemain ${this.state.players.length + 1}`,
            hand: [],
            connected: true,
            calledTumpuk: false,
            isHost,
            isSpectator: !!isSpectator,
          };
          this.state.players.push(player);
        } else {
          player.id = actualPlayerId;
          player.name = userName || player.name;
          player.isSpectator = !!isSpectator;
          player.connected = true;
        }

        this.broadcastRoomUpdate();
        if (this.state.status === "playing") {
          this.broadcastGameState();
        }
        break;
      }

      case "update_house_rules": {
        const player = this.state.players.find((p) => p.id === senderId);
        if (!player || !player.isHost) {
          sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Hanya host yang bisa mengubah aturan rumah!" } }));
          return;
        }

        this.state.houseRules = { ...this.state.houseRules, ...event.payload.houseRules };
        this.broadcastRoomUpdate();
        break;
      }

      case "start_game": {
        const player = this.state.players.find((p) => p.id === senderId);
        if (!player || !player.isHost) {
          sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Hanya host yang bisa memulai game!" } }));
          return;
        }

        this.startGame();
        break;
      }

      case "play_card": {
        if (this.state.status !== "playing") return;

        const player = this.state.players.find((p) => p.id === senderId);
        if (!player) return;

        const currentPlayer = this.state.players[this.state.currentPlayerIndex];
        const isTurn = currentPlayer && currentPlayer.id === senderId;

        const isJumpIn = this.state.houseRules.jumpIn && !isTurn && this.isValidJumpIn(event.payload.cardId, player);

        if (!isTurn && !isJumpIn) {
          sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Bukan giliranmu!" } }));
          return;
        }

        this.playCard(senderId, event.payload.cardId, event.payload.chosenColor);
        break;
      }

      case "draw_card": {
        if (this.state.status !== "playing") return;

        const currentPlayer = this.state.players[this.state.currentPlayerIndex];
        if (!currentPlayer || currentPlayer.id !== senderId) {
          sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Bukan giliranmu!" } }));
          return;
        }

        this.drawCard(senderId);
        break;
      }

      case "call_tumpuk": {
        const player = this.state.players.find((p) => p.id === senderId);
        if (player && player.hand.length <= 2) {
          player.calledTumpuk = true;
          this.broadcastGameState();
        }
        break;
      }

      case "challenge_tumpuk": {
        const { targetPlayerId } = event.payload;
        const target = this.state.players.find((p) => p.id === targetPlayerId);
        if (target && target.hand.length === 1 && !target.calledTumpuk) {
          for (let i = 0; i < 2; i++) {
            if (this.state.deck.length === 0) this.recycleDiscardPile();
            const card = this.state.deck.pop();
            if (card) target.hand.push(card);
          }
          this.broadcastGameState();
        }
        break;
      }

      case "submit_challenge_vote": {
        if (this.state.status !== "finished") return;
        this.pollVotes.set(senderId, event.payload.option);
        break;
      }

      case "notify_proof_uploaded": {
        const loser = this.state.players.find((p) => p.id === this.state.loserId) || { name: "Pecundang" };
        const payload: ServerEvent = {
          type: "challenge_uploaded",
          payload: {
            loserId: this.state.loserId || senderId,
            loserName: loser.name,
            fileUrl: event.payload.fileUrl,
          },
        };
        this.room.broadcast(JSON.stringify(payload));
        break;
      }

      case "leave_room": {
        this.handlePlayerExit(senderId);
        break;
      }
    }
  }

  startGame() {
    this.state.status = "playing";
    this.state.deck = shuffle(generateDeck());
    this.state.discardPile = [];
    
    // Find the first active player (non-spectator) to start the game
    const firstActiveIndex = this.state.players.findIndex((p) => !p.isSpectator);
    this.state.currentPlayerIndex = firstActiveIndex !== -1 ? firstActiveIndex : 0;
    
    this.state.direction = 1;
    this.state.drawStack = 0;
    this.state.winnerId = null;
    this.state.loserId = null;
    this.pollVotes.clear();

    this.state.players.forEach((player) => {
      player.hand = [];
      player.calledTumpuk = false;
      if (player.isSpectator) return; // Skip dealing cards to spectators
      for (let i = 0; i < 7; i++) {
        const card = this.state.deck.pop();
        if (card) player.hand.push(card);
      }
    });

    let startCard = this.state.deck.pop();
    while (startCard && (startCard.color === "wild" || startCard.type === "wild4")) {
      this.state.deck.unshift(startCard);
      this.state.deck = shuffle(this.state.deck);
      startCard = this.state.deck.pop();
    }

    if (startCard) {
      this.state.discardPile.push(startCard);
      this.state.currentColor = startCard.color;
    }

    this.resetTurnTimer();
    this.broadcastRoomUpdate();
    this.broadcastGameState();
  }

  playCard(playerId: string, cardId: string, chosenColor?: CardColor) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = player.hand[cardIndex];
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];

    const isValidMatch =
      card.color === "wild" ||
      card.type === "wild4" ||
      card.color === this.state.currentColor ||
      card.type === topCard.type ||
      (card.type === "number" && topCard.type === "number" && card.value === topCard.value);

    if (!isValidMatch) {
      const socket = this.room.getConnection(playerId);
      socket?.send(
        JSON.stringify({
          type: "invalid_move",
          payload: { reason: "Kartu tidak cocok dengan tumpukan teratas!" },
        })
      );
      return;
    }

    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.currentColor = card.color === "wild" || card.type === "wild4" ? chosenColor || "red" : card.color;

    if (player.hand.length > 1) {
      player.calledTumpuk = false;
    }

    if (player.hand.length === 0) {
      this.endGame(playerId);
      return;
    }

    if (card.type === "draw2") {
      this.state.drawStack += 2;
    } else if (card.type === "wild4") {
      this.state.drawStack += 4;
    }

    let skipNext = false;
    if (card.type === "skip") {
      skipNext = true;
    } else if (card.type === "reverse") {
      this.state.direction = (this.state.direction * -1) as 1 | -1;
      if (this.state.players.length === 2) {
        skipNext = true;
      }
    }

    this.advanceTurn(skipNext ? 2 : 1);
  }

  drawCard(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    if (this.state.drawStack > 0) {
      for (let i = 0; i < this.state.drawStack; i++) {
        if (this.state.deck.length === 0) this.recycleDiscardPile();
        const card = this.state.deck.pop();
        if (card) player.hand.push(card);
      }
      this.state.drawStack = 0;
      player.calledTumpuk = false;
      this.advanceTurn();
      return;
    }

    if (this.state.deck.length === 0) this.recycleDiscardPile();
    const card = this.state.deck.pop();
    if (card) {
      player.hand.push(card);
      player.calledTumpuk = false;

      const topCard = this.state.discardPile[this.state.discardPile.length - 1];
      const matches =
        card.color === "wild" ||
        card.type === "wild4" ||
        card.color === this.state.currentColor ||
        card.type === topCard.type ||
        (card.type === "number" && topCard.type === "number" && card.value === topCard.value);

      if (this.state.houseRules.drawToMatch && matches) {
        this.broadcastGameState();
        return;
      }
    }

    this.advanceTurn();
  }

  advanceTurn(steps: number = 1) {
    const totalPlayers = this.state.players.length;
    if (totalPlayers === 0) return;

    let nextIndex = (this.state.currentPlayerIndex + this.state.direction * steps + totalPlayers * 10) % totalPlayers;
    
    // Skip spectator players in the turn loop
    let attempts = 0;
    while (this.state.players[nextIndex]?.isSpectator && attempts < totalPlayers) {
      nextIndex = (nextIndex + this.state.direction + totalPlayers) % totalPlayers;
      attempts++;
    }

    this.state.currentPlayerIndex = nextIndex;
    this.resetTurnTimer();
    this.broadcastGameState();
  }

  resetTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);

    this.state.turnDeadline = Date.now() + 20000;

    this.turnTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, 20000);
  }

  handleTurnTimeout() {
    const activePlayer = this.state.players[this.state.currentPlayerIndex];
    if (!activePlayer) return;

    this.room.broadcast(JSON.stringify({ type: "turn_timeout", payload: { playerId: activePlayer.id } }));
    this.drawCard(activePlayer.id);
  }

  recycleDiscardPile() {
    if (this.state.discardPile.length <= 1) return;
    const topCard = this.state.discardPile.pop()!;
    this.state.deck = shuffle(this.state.discardPile);
    this.state.discardPile = [topCard];
  }

  isValidJumpIn(cardId: string, player: ServerPlayerState): boolean {
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return false;

    const topCard = this.state.discardPile[this.state.discardPile.length - 1];
    return (
      card.color === topCard.color &&
      card.type === topCard.type &&
      (card.type !== "number" || card.value === topCard.value)
    );
  }

  handlePlayerExit(playerId: string) {
    const playerIndex = this.state.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const wasActive = this.state.currentPlayerIndex === playerIndex;
    const wasHost = this.state.players[playerIndex].isHost;

    this.state.players.splice(playerIndex, 1);

    if (wasHost && this.state.players.length > 0) {
      this.state.players[0].isHost = true;
    }

    if (this.state.players.length === 0) {
      this.state.status = "waiting";
      if (this.turnTimer) clearTimeout(this.turnTimer);
      return;
    }

    if (wasActive && this.state.status === "playing") {
      this.advanceTurn(0);
    }

    this.broadcastRoomUpdate();
    if (this.state.status === "playing") {
      this.broadcastGameState();
    }
  }

  endGame(winnerId: string) {
    if (this.turnTimer) clearTimeout(this.turnTimer);

    this.state.status = "finished";
    this.state.winnerId = winnerId;

    let totalScore = 0;
    const finalScores: { playerId: string; score: number }[] = [];

    let highestPenaltyPoints = -1;
    let selectedLoserId = winnerId;

    this.state.players.forEach((player) => {
      if (player.isSpectator) return; // Skip spectator players from calculations
      
      let playerPoints = 0;
      if (player.id !== winnerId) {
        player.hand.forEach((card) => {
          if (card.type === "number") {
            playerPoints += card.value || 0;
          } else if (card.type === "wild" || card.type === "wild4") {
            playerPoints += 50;
          } else {
            playerPoints += 20;
          }
        });

        // The player with the highest penalty points is the loser
        if (playerPoints > highestPenaltyPoints) {
          highestPenaltyPoints = playerPoints;
          selectedLoserId = player.id;
        }

        totalScore += playerPoints;
        finalScores.push({ playerId: player.id, score: 0 });
      }
    });

    this.state.loserId = selectedLoserId;
    finalScores.push({ playerId: winnerId, score: totalScore });

    const gameOverPayload: ServerEvent = {
      type: "game_over",
      payload: {
        winnerId,
        scores: finalScores,
      },
    };

    this.room.broadcast(JSON.stringify(gameOverPayload));

    // Save match result to Postgres DB using HTTP fetch callback
    const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tumpuk.vercel.app";
    fetch(`${hostUrl}/api/match/record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.state.roomId,
        winnerId,
        scores: finalScores,
        houseRules: this.state.houseRules,
      }),
    }).catch((e) => console.error("Failed to persist match record to Postgres:", e));

    // Start 10-second Challenge Poll timer
    const loser = this.state.players.find((p) => p.id === selectedLoserId) || { id: selectedLoserId, name: "Pecundang" };
    const pollDeadline = Date.now() + 10000;

    const pollStartPayload: ServerEvent = {
      type: "challenge_poll_start",
      payload: {
        loserId: loser.id,
        loserName: loser.name,
        pollDeadline,
      },
    };

    this.room.broadcast(JSON.stringify(pollStartPayload));

    // Schedule 10s poll calculation
    this.pollTimer = setTimeout(() => {
      this.resolveChallengePoll(loser.id, loser.name);
    }, 10000);
  }

  resolveChallengePoll(loserId: string, loserName: string) {
    const voteCounts = new Map<string, number>();
    this.pollVotes.forEach((option) => {
      voteCounts.set(option, (voteCounts.get(option) || 0) + 1);
    });

    let winningChallenge = "Coret muka pakai terigu"; // Fallback default
    let maxVotes = 0;

    voteCounts.forEach((count, option) => {
      if (count > maxVotes) {
        maxVotes = count;
        winningChallenge = option;
      }
    });

    const pollResultPayload: ServerEvent = {
      type: "challenge_result",
      payload: {
        loserId,
        loserName,
        winningChallenge,
      },
    };

    this.room.broadcast(JSON.stringify(pollResultPayload));
  }

  broadcastRoomUpdate() {
    const host = this.state.players.find((p) => p.isHost);
    const roomUpdatePayload: ServerEvent = {
      type: "room_update",
      payload: {
        players: this.state.players.map((p) => ({
          id: p.id,
          name: p.name,
          connected: p.connected,
          isHost: p.isHost,
        })),
        hostId: host?.id || "",
        status: this.state.status,
        houseRules: this.state.houseRules,
      },
    };

    this.room.broadcast(JSON.stringify(roomUpdatePayload));
  }

  broadcastGameState() {
    const topCard = this.state.discardPile[this.state.discardPile.length - 1];

    this.state.players.forEach((player) => {
      const conn = this.room.getConnection(player.id);
      if (!conn) return;

      const you: PlayerSelfState = {
        id: player.id,
        hand: player.hand,
      };

      const opponents: PlayerPublicState[] = this.state.players
        .filter((p) => p.id !== player.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          handCount: p.hand.length,
          connected: p.connected,
          calledTumpuk: p.calledTumpuk,
        }));

      const gameStatePayload: ServerEvent = {
        type: "game_state",
        payload: {
          roomId: this.state.roomId,
          you,
          opponents,
          discardTop: topCard,
          currentColor: this.state.currentColor,
          currentPlayerIndex: this.state.currentPlayerIndex,
          direction: this.state.direction,
          turnDeadline: this.state.turnDeadline,
          drawStack: this.state.drawStack,
        },
      };

      conn.send(JSON.stringify(gameStatePayload));
    });
  }
}
