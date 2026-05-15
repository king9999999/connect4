import test from "node:test";
import assert from "node:assert/strict";
import { COLUMNS, Connect4Engine, ROWS, canDrop, createEmptyBoard, dropPiece, findWinner, getValidColumns, isBoardFull, otherColor } from "./connect4.js";
test("creates a 7x6 board", () => {
    const board = createEmptyBoard();
    assert.equal(board.length, ROWS);
    assert.equal(board[0].length, COLUMNS);
    assert.deepEqual(board.flat(), Array(ROWS * COLUMNS).fill(null));
});
test("validates and applies drops from the bottom up", () => {
    const board = createEmptyBoard();
    const first = dropPiece(board, 3, "red");
    const second = dropPiece(first.board, 3, "yellow");
    assert.equal(first.row, 5);
    assert.equal(second.row, 4);
    assert.equal(second.board[5][3], "red");
    assert.equal(second.board[4][3], "yellow");
    assert.equal(canDrop(second.board, 3), true);
});
test("rejects invalid and full columns", () => {
    let board = createEmptyBoard();
    for (let index = 0; index < ROWS; index += 1) {
        board = dropPiece(board, 0, index % 2 === 0 ? "red" : "yellow").board;
    }
    assert.equal(canDrop(board, 0), false);
    assert.throws(() => dropPiece(board, 0, "red"), /Column is full or invalid/);
    assert.throws(() => dropPiece(board, -1, "red"), /Column is full or invalid/);
});
test("detects horizontal, vertical, and diagonal wins", () => {
    const horizontal = createEmptyBoard();
    horizontal[5][0] = "red";
    horizontal[5][1] = "red";
    horizontal[5][2] = "red";
    horizontal[5][3] = "red";
    assert.equal(findWinner(horizontal).winner, "red");
    const vertical = createEmptyBoard();
    vertical[5][2] = "yellow";
    vertical[4][2] = "yellow";
    vertical[3][2] = "yellow";
    vertical[2][2] = "yellow";
    assert.equal(findWinner(vertical).winner, "yellow");
    const diagonal = createEmptyBoard();
    diagonal[5][0] = "red";
    diagonal[4][1] = "red";
    diagonal[3][2] = "red";
    diagonal[2][3] = "red";
    assert.equal(findWinner(diagonal).winner, "red");
});
test("manages turns and stops after a win", () => {
    const game = new Connect4Engine();
    game.play(0);
    assert.equal(game.getCurrentTurn(), "yellow");
    game.play(1);
    game.play(0);
    game.play(1);
    game.play(0);
    game.play(1);
    const finalMove = game.play(0);
    assert.equal(finalMove.status, "red-won");
    assert.equal(game.getWinner(), "red");
    assert.throws(() => game.play(2), /already finished/);
});
test("detects draws when no legal moves remain", () => {
    const game = Connect4Engine.deserialize({
        version: 1,
        board: [
            ["yellow", "red", "yellow", "red", "yellow", "red", null],
            ["yellow", "red", "yellow", "red", "yellow", "red", "yellow"],
            ["red", "yellow", "red", "yellow", "red", "yellow", "red"],
            ["red", "yellow", "red", "yellow", "red", "yellow", "red"],
            ["yellow", "red", "yellow", "red", "yellow", "red", "yellow"],
            ["yellow", "red", "yellow", "red", "yellow", "red", "yellow"]
        ],
        currentTurn: "red",
        status: "active",
        winner: null,
        winningCells: [],
        moveCount: 41,
        variant: {
            connectLength: 4,
            invisiblePieces: false,
            randomBlockers: { count: 0, seed: null }
        }
    });
    game.play(6);
    assert.equal(game.getStatus(), "draw");
    assert.equal(isBoardFull(game.getInternalBoard()), true);
});
test("serializes and deserializes game state", () => {
    const game = new Connect4Engine({ variant: { invisiblePieces: true } });
    game.play(2);
    game.play(4);
    const restored = Connect4Engine.deserialize(JSON.stringify(game.serialize()));
    assert.deepEqual(restored.serialize(), game.serialize());
    assert.equal(restored.getCurrentTurn(), game.getCurrentTurn());
});
test("hides pieces from public board in invisible mode", () => {
    const game = new Connect4Engine({ variant: { invisiblePieces: true } });
    game.play(3);
    assert.equal(game.getInternalBoard()[5][3], "red");
    assert.equal(game.getBoard()[5][3], null);
    assert.equal(game.getBoard({ revealInvisible: true })[5][3], "red");
});
test("places deterministic random blockers", () => {
    const first = new Connect4Engine({ variant: { randomBlockers: { count: 5, seed: 123 } } });
    const second = new Connect4Engine({ variant: { randomBlockers: { count: 5, seed: 123 } } });
    const board = first.getInternalBoard();
    assert.deepEqual(board, second.getInternalBoard());
    assert.equal(board.flat().filter((cell) => cell === "blocker").length, 5);
    assert.ok(getValidColumns(board).length <= COLUMNS);
});
test("supports connect-5 mode", () => {
    const board = createEmptyBoard();
    board[5][0] = "yellow";
    board[5][1] = "yellow";
    board[5][2] = "yellow";
    board[5][3] = "yellow";
    assert.equal(findWinner(board, 4).winner, "yellow");
    assert.equal(findWinner(board, 5).winner, null);
    board[5][4] = "yellow";
    assert.equal(findWinner(board, 5).winner, "yellow");
});
test("otherColor swaps players", () => {
    assert.equal(otherColor("red"), "yellow");
    assert.equal(otherColor("yellow"), "red");
});
