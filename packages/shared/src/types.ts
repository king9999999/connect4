export type GameMode = "ranked" | "unranked" | "bot";
export type QueueMode = Exclude<GameMode, "bot">;
export type MatchStatus = "waiting" | "active" | "finished" | "abandoned";
export type PlayerColor = "red" | "yellow";
export type BlockerCell = "blocker";
export type CellValue = PlayerColor | BlockerCell | null;
export type Board = CellValue[][];
export type GameResult = "red-won" | "yellow-won" | "draw" | "active";

export type Connect4Variant = {
  connectLength?: 4 | 5;
  invisiblePieces?: boolean;
  randomBlockers?: {
    count: number;
    seed?: number;
  };
};

export type SerializedConnect4Game = {
  version: 1;
  board: Board;
  currentTurn: PlayerColor;
  status: GameResult;
  winner: PlayerColor | null;
  winningCells: Array<[number, number]>;
  moveCount: number;
  variant: Required<Omit<Connect4Variant, "randomBlockers">> & {
    randomBlockers: { count: number; seed: number | null };
  };
};

export type PublicProfile = {
  id: string;
  username: string;
  rating: number;
};

export type MatchPlayer = {
  userId: string;
  username: string;
  color: PlayerColor;
  rating: number;
};

export type MatchState = {
  id: string;
  mode: GameMode;
  status: MatchStatus;
  board: Board;
  currentTurn: PlayerColor;
  players: MatchPlayer[];
  winnerColor: PlayerColor | null;
  winningCells: Array<[number, number]>;
  moveCount: number;
  createdAt: string;
};

export type ClientToServerEvents = {
  "queue:join": (payload: { mode: GameMode }) => void;
  "queue:leave": () => void;
  "match:move": (payload: { matchId: string; column: number }) => void;
  "match:resign": (payload: { matchId: string }) => void;
  "invite:create": (payload: { toUserId: string; mode: QueueMode }) => void;
  "invite:accept": (payload: { inviteId: string }) => void;
  "invite:decline": (payload: { inviteId: string }) => void;
};

export type ServerToClientEvents = {
  "queue:status": (payload: {
    mode: GameMode;
    message: string;
    waitMs?: number;
    ratingWindow?: number;
    position?: number;
    playersInQueue?: number;
  }) => void;
  "match:started": (state: MatchState) => void;
  "match:reconnected": (state: MatchState) => void;
  "match:updated": (state: MatchState) => void;
  "match:error": (payload: { message: string }) => void;
  "invite:received": (payload: {
    inviteId: string;
    from: PublicProfile;
    mode: QueueMode;
    expiresAt: number;
  }) => void;
  "invite:sent": (payload: { inviteId: string; toUserId: string; mode: QueueMode; expiresAt: number }) => void;
  "invite:declined": (payload: { inviteId: string }) => void;
  "invite:expired": (payload: { inviteId: string }) => void;
};
