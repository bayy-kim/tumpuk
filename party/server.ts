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

// Extends in-memory states
export interface ServerPlayerState extends PlayerState {
  isHost: boolean;
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
}

function generateDeck(): Card[] {
  const colors: CardColor[] = ["red", "yellow", "green", "blue"];
  const deck: Card[] = [];

  // Generate color cards
  colors.forEach((color) => {
    // 0 card
    deck.push({ id: `${color}-0`, color, type: "number", value: 0 });

    // 1-9 cards (2 of each)
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `${color}-${i}-a`, color, type: "number", value: i });
      deck.push({ id: `${color}-${i}-b`, color, type: "number", value: i });
    }

    // Action cards (2 of each)
    for (const type of ["skip", "reverse", "draw2"] as const) {
      deck.push({ id: `${color}-${type}-a`, color, type });
      deck.push({ id: `${color}-${type}-b`, color, type });
    }
  });

  // Wild cards (4 of each)
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
  disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    };
  }

  onConnect() {
    // Handled in join_room message
  }

  onClose(conn: Party.Connection) {
    const player = this.state.players.find((p) => p.id === conn.id);
    if (!player) return;

    player.connected = false;

    // Grace period for disconnection (60 seconds)
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
        const { guestName } = event.payload;

        // Clear disconnect timer if reconnecting
        if (this.disconnectTimers.has(senderId)) {
          clearTimeout(this.disconnectTimers.get(senderId)!);
          this.disconnectTimers.delete(senderId);
        }

        let player = this.state.players.find((p) => p.id === senderId);

        if (!player) {
          // If room is full, send invalid move
          if (this.state.players.length >= 6) {
            sender.send(JSON.stringify({ type: "invalid_move", payload: { reason: "Room penuh! Maksimal 6 pemain." } }));
            return;
          }

          const isHost = this.state.players.length === 0;

          player = {
            id: senderId,
            name: guestName || `Pemain ${this.state.players.length + 1}`,
            hand: [],
            connected: true,
            calledTumpuk: false,
            isHost,
          };
          this.state.players.push(player);
        } else {
          player.connected = true;
        }

        this.broadcastRoomUpdate();
        if (this.state.status === "playing") {
          this.broadcastGameState();
        }
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

        // Jump-in validation if rule is enabled
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
          // Penalty: Draw 2 cards
          for (let i = 0; i < 2; i++) {
            if (this.state.deck.length === 0) this.recycleDiscardPile();
            const card = this.state.deck.pop();
            if (card) target.hand.push(card);
          }
          this.broadcastGameState();
        }
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
    this.state.currentPlayerIndex = 0;
    this.state.direction = 1;
    this.state.drawStack = 0;
    this.state.winnerId = null;

    // Distribute 7 cards to each player
    this.state.players.forEach((player) => {
      player.hand = [];
      player.calledTumpuk = false;
      for (let i = 0; i < 7; i++) {
        const card = this.state.deck.pop();
        if (card) player.hand.push(card);
      }
    });

    // Start discard pile with a non-wild card
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

    // Card matching rules validation
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

    // Move card from hand to discard pile
    player.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);
    this.state.currentColor = card.color === "wild" || card.type === "wild4" ? chosenColor || "red" : card.color;

    // Reset calledTumpuk if hand size goes back up or resets
    if (player.hand.length > 1) {
      player.calledTumpuk = false;
    }

    // Check winner condition
    if (player.hand.length === 0) {
      this.endGame(playerId);
      return;
    }

    // Stacking rules (+2/+4 stack calculations)
    if (card.type === "draw2") {
      this.state.drawStack += 2;
    } else if (card.type === "wild4") {
      this.state.drawStack += 4;
    }

    // Standard card effects execution
    let skipNext = false;
    if (card.type === "skip") {
      skipNext = true;
    } else if (card.type === "reverse") {
      this.state.direction = (this.state.direction * -1) as 1 | -1;
      // In 2 player games, reverse acts as a skip
      if (this.state.players.length === 2) {
        skipNext = true;
      }
    }

    this.advanceTurn(skipNext ? 2 : 1);
  }

  drawCard(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    // Force draw from accumulation penalty stack if active
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

    // Default 1-card draw
    if (this.state.deck.length === 0) this.recycleDiscardPile();
    const card = this.state.deck.pop();
    if (card) {
      player.hand.push(card);
      player.calledTumpuk = false;

      // Draw-to-match rule toggle validation
      const topCard = this.state.discardPile[this.state.discardPile.length - 1];
      const matches =
        card.color === "wild" ||
        card.type === "wild4" ||
        card.color === this.state.currentColor ||
        card.type === topCard.type ||
        (card.type === "number" && topCard.type === "number" && card.value === topCard.value);

      if (this.state.houseRules.drawToMatch && matches) {
        // Allow playing draw card immediately
        this.broadcastGameState();
        return;
      }
    }

    this.advanceTurn();
  }

  advanceTurn(steps: number = 1) {
    const totalPlayers = this.state.players.length;
    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + this.state.direction * steps + totalPlayers * 2) % totalPlayers;

    this.resetTurnTimer();
    this.broadcastGameState();
  }

  resetTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);

    this.state.turnDeadline = Date.now() + 20000; // 20s

    this.turnTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, 20000);
  }

  handleTurnTimeout() {
    const activePlayer = this.state.players[this.state.currentPlayerIndex];
    if (!activePlayer) return;

    // Trigger turn_timeout warning notification
    this.room.broadcast(JSON.stringify({ type: "turn_timeout", payload: { playerId: activePlayer.id } }));

    // Apply auto draw & turn skipping
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
    // Jump-in cards must match both type/value AND color exactly
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

    // Remove player
    this.state.players.splice(playerIndex, 1);

    // Promote new host if needed
    if (wasHost && this.state.players.length > 0) {
      this.state.players[0].isHost = true;
    }

    if (this.state.players.length === 0) {
      this.state.status = "waiting";
      if (this.turnTimer) clearTimeout(this.turnTimer);
      return;
    }

    // Shift current index if needed
    if (wasActive && this.state.status === "playing") {
      this.advanceTurn(0); // Recalculate turn deadline & deadline bar
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

    // Calculate score based on total remaining hand weights of other players
    let totalScore = 0;
    const finalScores: { playerId: string; score: number }[] = [];

    this.state.players.forEach((player) => {
      let playerPoints = 0;
      if (player.id !== winnerId) {
        player.hand.forEach((card) => {
          if (card.type === "number") {
            playerPoints += card.value || 0;
          } else if (card.type === "wild" || card.type === "wild4") {
            playerPoints += 50;
          } else {
            playerPoints += 20; // Action cards (skip/reverse/draw2)
          }
        });
        totalScore += playerPoints;
        finalScores.push({ playerId: player.id, score: 0 });
      }
    });

    finalScores.push({ playerId: winnerId, score: totalScore });

    const gameOverPayload: ServerEvent = {
      type: "game_over",
      payload: {
        winnerId,
        scores: finalScores,
      },
    };

    this.room.broadcast(JSON.stringify(gameOverPayload));
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

  // Authoritative Broadcast with strict Zero Hand Leak enforcement
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
