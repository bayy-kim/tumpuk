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
    userId: string;
    userName: string;
    isSpectator?: boolean;
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

export type ClientUpdateHouseRulesEvent = {
  type: 'update_house_rules';
  payload: {
    houseRules: HouseRules;
  };
};

export type ClientSubmitChallengeVoteEvent = {
  type: 'submit_challenge_vote';
  payload: {
    option: string; // e.g. "terigu" | "garam" | "joget" | custom string
  };
};

export type ClientNotifyProofUploadedEvent = {
  type: 'notify_proof_uploaded';
  payload: {
    fileUrl: string;
  };
};

export type ClientEvent =
  | ClientJoinRoomEvent
  | ClientStartGameEvent
  | ClientPlayCardEvent
  | ClientDrawCardEvent
  | ClientCallTumpukEvent
  | ClientChallengeTumpukEvent
  | ClientLeaveRoomEvent
  | ClientUpdateHouseRulesEvent
  | ClientSubmitChallengeVoteEvent
  | ClientNotifyProofUploadedEvent;

// Server -> Client Events
export type ServerRoomUpdateEvent = {
  type: 'room_update';
  payload: {
    players: { id: string; name: string; connected: boolean; isHost: boolean; isSpectator?: boolean }[];
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

export type ServerChallengePollStartEvent = {
  type: 'challenge_poll_start';
  payload: {
    loserId: string;
    loserName: string;
    pollDeadline: number; // epoch ms (10 seconds timer)
  };
};

export type ServerChallengeResultEvent = {
  type: 'challenge_result';
  payload: {
    loserId: string;
    loserName: string;
    winningChallenge: string;
  };
};

export type ServerChallengeUploadedEvent = {
  type: 'challenge_uploaded';
  payload: {
    loserId: string;
    loserName: string;
    fileUrl: string;
  };
};

export type ServerAdminBroadcastEvent = {
  type: 'admin_broadcast';
  payload: {
    message: string;
  };
};

export type ServerEvent =
  | ServerRoomUpdateEvent
  | ServerGameStateEvent
  | ServerInvalidMoveEvent
  | ServerTurnTimeoutEvent
  | ServerGameOverEvent
  | ServerChallengePollStartEvent
  | ServerChallengeResultEvent
  | ServerChallengeUploadedEvent
  | ServerAdminBroadcastEvent;
