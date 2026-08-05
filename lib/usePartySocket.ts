'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PartySocket from 'partysocket';
import { ClientEvent, ServerEvent, CardColor } from './events';

interface UsePartySocketOptions {
  roomCode: string;
  host?: string;
  userId?: string;
  guestName?: string;
  onMessage?: (event: ServerEvent) => void;
}

export function usePartySocket({
  roomCode,
  host = typeof window !== 'undefined' ? window.location.host : 'localhost:1999',
  userId,
  guestName,
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

    // Use environment variable if present, otherwise default to host parameter or local development host
    const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST || host;

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
          guestName,
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
  }, [roomCode, host, userId, guestName]);

  // Helper function to send typed events to server
  const sendEvent = useCallback((event: ClientEvent) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn('Cannot send event, WebSocket is not connected.', event);
    }
  }, []);

  const joinRoom = useCallback(
    (code: string, uId?: string, name?: string) => {
      sendEvent({
        type: 'join_room',
        payload: { code, userId: uId, guestName: name },
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

  return {
    isConnected,
    joinRoom,
    startGame,
    playCard,
    drawCard,
    callTumpuk,
    challengeTumpuk,
    leaveRoom,
  };
}
export default usePartySocket;
