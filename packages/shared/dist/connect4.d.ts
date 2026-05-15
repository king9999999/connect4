import type { Board, Connect4Variant, GameResult, PlayerColor, SerializedConnect4Game } from "./types.js";
export declare const ROWS = 6;
export declare const COLUMNS = 7;
export declare const DEFAULT_CONNECT_LENGTH = 4;
export declare function createEmptyBoard(): Board;
export declare function otherColor(color: PlayerColor): PlayerColor;
export declare function canDrop(board: Board, column: number): boolean;
export declare function dropPiece(board: Board, column: number, color: PlayerColor): {
    board: Board;
    row: number;
};
export declare function getValidColumns(board: Board): number[];
export declare function isBoardFull(board: Board): boolean;
export declare function findWinner(board: Board, connectLength?: number): {
    winner: PlayerColor | null;
    cells: Array<[number, number]>;
};
export declare class Connect4Engine {
    private readonly variant;
    private board;
    private currentTurn;
    private status;
    private winner;
    private winningCells;
    private moveCount;
    constructor(options?: {
        variant?: Connect4Variant;
        startingTurn?: PlayerColor;
    });
    static deserialize(serialized: string | SerializedConnect4Game): Connect4Engine;
    getState(options?: {
        revealInvisible?: boolean;
    }): {
        board: Board;
        currentTurn: PlayerColor;
        status: GameResult;
        winner: PlayerColor | null;
        winningCells: [number, number][];
        moveCount: number;
        variant: Required<Omit<Connect4Variant, "randomBlockers">> & {
            randomBlockers: {
                count: number;
                seed: number | null;
            };
        };
    };
    getBoard(options?: {
        revealInvisible?: boolean;
    }): Board;
    getInternalBoard(): Board;
    getCurrentTurn(): PlayerColor;
    getStatus(): GameResult;
    getWinner(): PlayerColor | null;
    getValidMoves(): number[];
    canPlay(column: number): boolean;
    play(column: number): {
        row: number;
        column: number;
        color: PlayerColor;
        status: GameResult;
    };
    serialize(): SerializedConnect4Game;
    toJSON(): SerializedConnect4Game;
    private getVariant;
    private updateOutcome;
    private placeRandomBlockers;
}
