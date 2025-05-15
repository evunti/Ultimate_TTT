import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type GameState = {
  boards: string[][];
  innerWinners: string[];
  currentTurn: "X" | "O";
  activeBoard: number;
  status: "playing" | "won" | "draw";
};

const emptyBoard = Array(9).fill("");
const initialState: GameState = {
  boards: Array(9)
    .fill(null)
    .map(() => [...emptyBoard]),
  innerWinners: Array(9).fill(""),
  currentTurn: "X",
  activeBoard: -1,
  status: "playing",
};

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

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    makeMove(
      state: GameState,
      action: PayloadAction<{ boardIndex: number; position: number }>
    ) {
      const { boardIndex, position } = action.payload;
      if (
        state.status !== "playing" ||
        state.boards[boardIndex][position] !== "" ||
        state.innerWinners[boardIndex] !== "" ||
        (state.activeBoard !== -1 && state.activeBoard !== boardIndex)
      ) {
        return;
      }
      state.boards[boardIndex][position] = state.currentTurn;
      const innerWinner = checkWinner(state.boards[boardIndex]);
      if (innerWinner) state.innerWinners[boardIndex] = innerWinner;
      const overallWinner = checkWinner(state.innerWinners);
      const isDraw =
        !overallWinner && state.innerWinners.every((w: string) => w !== "");
      let nextActiveBoard = position;
      if (state.innerWinners[nextActiveBoard] !== "") nextActiveBoard = -1;
      state.currentTurn = state.currentTurn === "X" ? "O" : "X";
      state.activeBoard = nextActiveBoard;
      if (overallWinner) {
        state.status = "won";
      } else if (isDraw) {
        state.status = "draw";
      }
    },
    resetGame(state: GameState) {
      Object.assign(state, initialState);
    },
  },
});

export const { makeMove, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
