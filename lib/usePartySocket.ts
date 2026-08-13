'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PartySocket from 'partysocket';
import { ClientEvent, ServerEvent, CardColor, HouseRules } from './events';

interface UsePartySocketOptions {
  roomCode: string;
  host?: string;
  userId: string;
  userName: string;
  isSpectator?: boolean;
  onMessage?: (event: ServerEvent) => void;
}

export function usePartySocket({
  roomCode,
  host,
  userId,
  userName,
  isSpectator = false,
  onMessage,
}: UsePartySocketOptions) {
  const socketRef = useRef<PartySocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep a stable ref to the callback to prevent restarting socket connection when it changes
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomCode) return;

    // Resolve target PartyKit host:
    // 1. Explicit NEXT_PUBLIC_PARTYKIT_HOST if specified
    // 2. Local development fallback (port 1999) if running on localhost
    // 3. Deployed default fallback host
    let partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || host;

    if (!partyHost && typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        partyHost = 'localhost:1999';
      } else {
        partyHost = 'tumpuk-party.bayy-kim.partykit.dev';
      }
    }

    if (!partyHost) {
      partyHost = 'localhost:1999';
    }

    const socket = new PartySocket({
      host: partyHost,
      room: roomCode,
    });

    socketRef.current = socket;

    const handleOpen = () => {
      setIsConnected(true);
      // Auto-emit join_room when socket connects successfully
      const joinPayload: ClientEvent = {
        type: 'join_room',
        payload: {
          code: roomCode,
          userId,
          userName,
          isSpectator,
        },
      };
      socket.send(JSON.stringify(joinPayload));
    };

    const handleClose = () => {
      setIsConnected(false);
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ServerEvent;
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (err) {
        console.error('Failed to parse server WebSocket event:', err);
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('message', handleMessage);
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode, host, userId, userName, isSpectator]);

  // Helper function to send typed events to server
  const sendEvent = useCallback((event: ClientEvent) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn('Cannot send event, WebSocket is not connected.', event);
    }
  }, []);

  const joinRoom = useCallback(
    (code: string, uId: string, name: string, isSpectator?: boolean) => {
      sendEvent({
        type: 'join_room',
        payload: { code, userId: uId, userName: name, isSpectator },
      });
    },
    [sendEvent]
  );

  const startGame = useCallback(() => {
    sendEvent({
      type: 'start_game',
      payload: {},
    });
  }, [sendEvent]);

  const playCard = useCallback(
    (cardId: string, chosenColor?: CardColor) => {
      sendEvent({
        type: 'play_card',
        payload: { cardId, chosenColor },
      });
    },
    [sendEvent]
  );

  const drawCard = useCallback(() => {
    sendEvent({
      type: 'draw_card',
      payload: {},
    });
  }, [sendEvent]);

  const callTumpuk = useCallback(() => {
    sendEvent({
      type: 'call_tumpuk',
      payload: {},
    });
  }, [sendEvent]);

  const challengeTumpuk = useCallback(
    (targetPlayerId: string) => {
      sendEvent({
        type: 'challenge_tumpuk',
        payload: { targetPlayerId },
      });
    },
    [sendEvent]
  );

  const leaveRoom = useCallback(() => {
    sendEvent({
      type: 'leave_room',
      payload: {},
    });
  }, [sendEvent]);

  const updateHouseRules = useCallback(
    (houseRules: HouseRules) => {
      sendEvent({
        type: 'update_house_rules',
        payload: { houseRules },
      });
    },
    [sendEvent]
  );

  const submitChallengeVote = useCallback(
    (option: string) => {
      sendEvent({
        type: 'submit_challenge_vote',
        payload: { option },
      });
    },
    [sendEvent]
  );

  const notifyProofUploaded = useCallback(
    (fileUrl: string) => {
      sendEvent({
        type: 'notify_proof_uploaded',
        payload: { fileUrl },
      });
    },
    [sendEvent]
  );

  return {
    isConnected,
    joinRoom,
    startGame,
    playCard,
    drawCard,
    callTumpuk,
    challengeTumpuk,
    leaveRoom,
    updateHouseRules,
    submitChallengeVote,
    notifyProofUploaded,
  };
}
export default usePartySocket;
