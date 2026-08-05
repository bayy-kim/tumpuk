export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}

export interface HouseRules {
  stacking: boolean;
  jumpIn: boolean;
  sevenZero: boolean;
  drawToMatch: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  connected: boolean;
  calledTumpuk: boolean;
}

export interface PlayerPublicState {
  id: string;
  name: string;
  handCount: number;
  connected: boolean;
  calledTumpuk: boolean;
}

export interface PlayerSelfState {
  id: string;
  hand: Card[];
}

export interface PublicGameState {
  roomId: string;
  you: PlayerSelfState;
  opponents: PlayerPublicState[];
  discardTop: Card;
  currentColor: CardColor;
  currentPlayerIndex: number;
  direction: 1 | -1;
  turnDeadline: number;
  drawStack: number;
}

// Client -> Server Events
export type ClientJoinRoomEvent = {
  type: 'join_room';
  payload: {
    code: string;
    userId?: string;
    guestName?: string;
  };
};

export type ClientStartGameEvent = {
  type: 'start_game';
  payload: Record<string, never>;
};

export type ClientPlayCardEvent = {
  type: 'play_card';
  payload: {
    cardId: string;
    chosenColor?: CardColor;
  };
};

export type ClientDrawCardEvent = {
  type: 'draw_card';
  payload: Record<string, never>;
};

export type ClientCallTumpukEvent = {
  type: 'call_tumpuk';
  payload: Record<string, never>;
};

export type ClientChallengeTumpukEvent = {
  type: 'challenge_tumpuk';
  payload: {
    targetPlayerId: string;
  };
};

export type ClientLeaveRoomEvent = {
  type: 'leave_room';
  payload: Record<string, never>;
};

export type ClientEvent =
  | ClientJoinRoomEvent
  | ClientStartGameEvent
  | ClientPlayCardEvent
  | ClientDrawCardEvent
  | ClientCallTumpukEvent
  | ClientChallengeTumpukEvent
  | ClientLeaveRoomEvent;

// Server -> Client Events
export type ServerRoomUpdateEvent = {
  type: 'room_update';
  payload: {
    players: { id: string; name: string; connected: boolean; isHost: boolean }[];
    hostId: string;
    status: 'waiting' | 'playing' | 'finished';
    houseRules: HouseRules;
  };
};

export type ServerGameStateEvent = {
  type: 'game_state';
  payload: PublicGameState;
};

export type ServerInvalidMoveEvent = {
  type: 'invalid_move';
  payload: {
    reason: string;
  };
};

export type ServerTurnTimeoutEvent = {
  type: 'turn_timeout';
  payload: {
    playerId: string;
  };
};

export type ServerGameOverEvent = {
  type: 'game_over';
  payload: {
    winnerId: string;
    scores: { playerId: string; score: number }[];
  };
};

export type ServerEvent =
  | ServerRoomUpdateEvent
  | ServerGameStateEvent
  | ServerInvalidMoveEvent
  | ServerTurnTimeoutEvent
  | ServerGameOverEvent;
