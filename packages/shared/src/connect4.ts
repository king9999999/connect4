import type {
  Board,
  CellValue,
  Connect4Variant,
  GameResult,
  PlayerColor,
  SerializedConnect4Game
} from "./types.js";

export const ROWS = 6;
export const COLUMNS = 7;
export const DEFAULT_CONNECT_LENGTH = 4;

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<CellValue>(COLUMNS).fill(null));
}

export function otherColor(color: PlayerColor): PlayerColor {
  return color === "red" ? "yellow" : "red";
}

export function canDrop(board: Board, column: number): boolean {
  return isValidColumn(column) && board[0][column] === null;
}

export function dropPiece(board: Board, column: number, color: PlayerColor): { board: Board; row: number } {
  if (!canDrop(board, column)) {
    throw new Error("Column is full or invalid.");
  }

  const next = board.map((row) => [...row]);
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (next[row][column] === null) {
      next[row][column] = color;
      return { board: next, row };
    }
  }

  throw new Error("No open row found.");
}

export function getValidColumns(board: Board): number[] {
  return Array.from({ length: COLUMNS }, (_, column) => column).filter((column) => canDrop(board, column));
}

export function isBoardFull(board: Board): boolean {
  return getValidColumns(board).length === 0;
}

export function findWinner(
  board: Board,
  connectLength = DEFAULT_CONNECT_LENGTH
): { winner: PlayerColor | null; cells: Array<[number, number]> } {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ] as const;

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const color = board[row][column];
      if (!isPlayerCell(color)) continue;

      for (const [rowStep, columnStep] of directions) {
        const cells: Array<[number, number]> = [[row, column]];

        for (let distance = 1; distance < connectLength; distance += 1) {
          const nextRow = row + rowStep * distance;
          const nextColumn = column + columnStep * distance;

          if (
            nextRow < 0 ||
            nextRow >= ROWS ||
            nextColumn < 0 ||
            nextColumn >= COLUMNS ||
            board[nextRow][nextColumn] !== color
          ) {
            break;
          }

          cells.push([nextRow, nextColumn]);
        }

        if (cells.length === connectLength) {
          return { winner: color, cells };
        }
      }
    }
  }

  return { winner: null, cells: [] };
}

export class Connect4Engine {
  private readonly variant: NormalizedVariant;
  private board: Board;
  private currentTurn: PlayerColor;
  private status: GameResult;
  private winner: PlayerColor | null;
  private winningCells: Array<[number, number]>;
  private moveCount: number;

  constructor(options: { variant?: Connect4Variant; startingTurn?: PlayerColor } = {}) {
    this.variant = normalizeVariant(options.variant);
    this.board = createEmptyBoard();
    this.currentTurn = options.startingTurn ?? "red";
    this.status = "active";
    this.winner = null;
    this.winningCells = [];
    this.moveCount = 0;

    if (this.variant.randomBlockers.count > 0) {
      this.placeRandomBlockers();
    }
  }

  static deserialize(serialized: string | SerializedConnect4Game): Connect4Engine {
    const data = typeof serialized === "string" ? (JSON.parse(serialized) as SerializedConnect4Game) : serialized;
    assertSerializedGame(data);

    const engine = new Connect4Engine({
      variant: {
        connectLength: data.variant.connectLength,
        invisiblePieces: data.variant.invisiblePieces,
        randomBlockers: {
          count: data.variant.randomBlockers.count,
          seed: data.variant.randomBlockers.seed ?? undefined
        }
      },
      startingTurn: data.currentTurn
    });

    engine.board = cloneBoard(data.board);
    engine.currentTurn = data.currentTurn;
    engine.status = data.status;
    engine.winner = data.winner;
    engine.winningCells = data.winningCells.map(([row, column]) => [row, column]);
    engine.moveCount = data.moveCount;
    return engine;
  }

  getState(options: { revealInvisible?: boolean } = {}) {
    return {
      board: this.getBoard({ revealInvisible: options.revealInvisible }),
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      winningCells: [...this.winningCells],
      moveCount: this.moveCount,
      variant: this.getVariant()
    };
  }

  getBoard(options: { revealInvisible?: boolean } = {}): Board {
    if (!this.variant.invisiblePieces || options.revealInvisible) {
      return cloneBoard(this.board);
    }

    return this.board.map((row) => row.map((cell) => (isPlayerCell(cell) ? null : cell)));
  }

  getInternalBoard(): Board {
    return cloneBoard(this.board);
  }

  getCurrentTurn(): PlayerColor {
    return this.currentTurn;
  }

  getStatus(): GameResult {
    return this.status;
  }

  getWinner(): PlayerColor | null {
    return this.winner;
  }

  getValidMoves(): number[] {
    return getValidColumns(this.board);
  }

  canPlay(column: number): boolean {
    return this.status === "active" && canDrop(this.board, column);
  }

  play(column: number): { row: number; column: number; color: PlayerColor; status: GameResult } {
    if (this.status !== "active") {
      throw new Error("Game is already finished.");
    }

    if (!canDrop(this.board, column)) {
      throw new Error("Column is full or invalid.");
    }

    const color = this.currentTurn;
    const result = dropPiece(this.board, column, color);
    this.board = result.board;
    this.moveCount += 1;
    this.updateOutcome();

    if (this.status === "active") {
      this.currentTurn = otherColor(this.currentTurn);
    }

    return {
      row: result.row,
      column,
      color,
      status: this.status
    };
  }

  serialize(): SerializedConnect4Game {
    return {
      version: 1,
      board: cloneBoard(this.board),
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      winningCells: [...this.winningCells],
      moveCount: this.moveCount,
      variant: this.getVariant()
    };
  }

  toJSON(): SerializedConnect4Game {
    return this.serialize();
  }

  private getVariant(): SerializedConnect4Game["variant"] {
    return {
      connectLength: this.variant.connectLength,
      invisiblePieces: this.variant.invisiblePieces,
      randomBlockers: {
        count: this.variant.randomBlockers.count,
        seed: this.variant.randomBlockers.seed
      }
    };
  }

  private updateOutcome() {
    const result = findWinner(this.board, this.variant.connectLength);
    if (result.winner) {
      this.winner = result.winner;
      this.winningCells = result.cells;
      this.status = `${result.winner}-won`;
      return;
    }

    if (isBoardFull(this.board)) {
      this.status = "draw";
    }
  }

  private placeRandomBlockers() {
    const rng = createSeededRandom(this.variant.randomBlockers.seed ?? Date.now());
    const cells = Array.from({ length: ROWS * COLUMNS }, (_, index) => ({
      row: Math.floor(index / COLUMNS),
      column: index % COLUMNS
    }));

    // Shuffle once, then place blockers from the front. This avoids duplicate blocker positions.
    for (let index = cells.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng() * (index + 1));
      [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
    }

    for (const cell of cells.slice(0, this.variant.randomBlockers.count)) {
      this.board[cell.row][cell.column] = "blocker";
    }
  }
}

type NormalizedVariant = {
  connectLength: 4 | 5;
  invisiblePieces: boolean;
  randomBlockers: {
    count: number;
    seed: number | null;
  };
};

function normalizeVariant(variant: Connect4Variant = {}): NormalizedVariant {
  const connectLength = variant.connectLength ?? DEFAULT_CONNECT_LENGTH;
  if (connectLength !== 4 && connectLength !== 5) {
    throw new Error("connectLength must be 4 or 5.");
  }

  const blockerCount = variant.randomBlockers?.count ?? 0;
  if (!Number.isInteger(blockerCount) || blockerCount < 0 || blockerCount >= ROWS * COLUMNS) {
    throw new Error("randomBlockers.count must be an integer between 0 and 41.");
  }

  return {
    connectLength,
    invisiblePieces: variant.invisiblePieces ?? false,
    randomBlockers: {
      count: blockerCount,
      seed: variant.randomBlockers?.seed ?? null
    }
  };
}

function isValidColumn(column: number): boolean {
  return Number.isInteger(column) && column >= 0 && column < COLUMNS;
}

function isPlayerCell(cell: CellValue): cell is PlayerColor {
  return cell === "red" || cell === "yellow";
}

function cloneBoard(board: Board): Board {
  validateBoard(board);
  return board.map((row) => [...row]);
}

function validateBoard(board: Board) {
  if (!Array.isArray(board) || board.length !== ROWS) {
    throw new Error("Board must contain 6 rows.");
  }

  for (const row of board) {
    if (!Array.isArray(row) || row.length !== COLUMNS) {
      throw new Error("Each board row must contain 7 cells.");
    }

    for (const cell of row) {
      if (cell !== null && cell !== "red" && cell !== "yellow" && cell !== "blocker") {
        throw new Error("Board contains an invalid cell value.");
      }
    }
  }
}

function assertSerializedGame(data: SerializedConnect4Game) {
  if (data.version !== 1) {
    throw new Error("Unsupported serialized Connect 4 version.");
  }

  validateBoard(data.board);
  if (data.currentTurn !== "red" && data.currentTurn !== "yellow") {
    throw new Error("Serialized game has an invalid current turn.");
  }
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
