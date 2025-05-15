import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createGame = mutation({
  args: {},
  handler: async (ctx) => {
    // Create 9 empty boards
    const emptyBoard = Array(9).fill("");
    const boards = Array(9)
      .fill(null)
      .map(() => [...emptyBoard]);

    // No playerX/playerO at creation; they join via link
    return await ctx.db.insert("games", {
      boards,
      playerX: undefined,
      playerO: undefined,
      currentTurn: "X",
      activeBoard: -1, // -1 means any board can be played
      innerWinners: Array(9).fill(""),
      status: "waiting", // waiting for players to join
    });
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.id("games"),
    boardIndex: v.number(),
    position: v.number(),
    player: v.string(), // "X" or "O"
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "playing") throw new Error("Game is not active");

    // Only allow the correct player to move
    if (game.currentTurn !== args.player) throw new Error("Not your turn");

    const boards =
      game.boards ??
      Array(9)
        .fill(null)
        .map(() => Array(9).fill(""));
    const innerWinners = game.innerWinners ?? Array(9).fill("");
    const activeBoard = game.activeBoard ?? -1;

    if (activeBoard !== -1 && activeBoard !== args.boardIndex) {
      throw new Error("Must play in the active board");
    }
    if (innerWinners[args.boardIndex] !== "") {
      throw new Error("This board is already completed");
    }
    if (boards[args.boardIndex][args.position] !== "") {
      throw new Error("Position already taken");
    }

    const newBoards = boards.map((board, index) =>
      index === args.boardIndex
        ? board.map((cell, pos) => (pos === args.position ? args.player : cell))
        : board
    );

    const newInnerWinners = [...innerWinners];
    const innerWinner = checkWinner(newBoards[args.boardIndex]);
    if (innerWinner) {
      newInnerWinners[args.boardIndex] = innerWinner;
    }

    const winner = checkWinner(newInnerWinners);
    const isDraw = !winner && newInnerWinners.every((w) => w !== "");

    let nextActiveBoard = args.position;
    if (newInnerWinners[nextActiveBoard] !== "") {
      nextActiveBoard = -1;
    }

    await ctx.db.patch(args.gameId, {
      boards: newBoards,
      currentTurn: args.player === "X" ? "O" : "X",
      activeBoard: nextActiveBoard,
      innerWinners: newInnerWinners,
      status: winner ? "won" : isDraw ? "draw" : "playing",
      winner: winner || undefined,
    });
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
    player: v.string(), // "X" or "O"
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (args.player !== "X" && args.player !== "O")
      throw new Error("Invalid player");
    if (game.status !== "waiting") return; // Only allow joining if waiting

    if (args.player === "X" && !game.playerX) {
      await ctx.db.patch(args.gameId, {
        playerX: args.playerId,
        status: game.playerO ? "playing" : "waiting",
      });
    } else if (args.player === "O" && !game.playerO) {
      await ctx.db.patch(args.gameId, {
        playerO: args.playerId,
        status: game.playerX ? "playing" : "waiting",
      });
    }
  },
});

export const getGame = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const listGames = query({
  args: {},
  handler: async (ctx) => {
    // Just return all games for now (or filter as needed)
    return await ctx.db.query("games").collect();
  },
});

function checkWinner(board: string[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}
