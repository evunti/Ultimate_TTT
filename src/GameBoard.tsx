import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import { makeMove as makeLocalMove, resetGame } from "./gameSlice";

function getOrCreatePlayerId(gameId: string) {
  const key = `ttt-playerId-${gameId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function GameBoard({
  local,
  ...props
}: {
  local?: boolean;
  gameId?: any;
}) {
  if (local) {
    // Redux local play version
    const game = useSelector((state: RootState) => state.game);
    const dispatch = useDispatch();
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight drop-shadow-md">
          Ultimate Tic Tac Toe
        </h1>
        <div className="bg-white/90 rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-8 w-full">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 aspect-square">
            {game.boards.map((board: string[], boardIndex: number) => (
              <div
                key={boardIndex}
                className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200
                  ${game.activeBoard === -1 || game.activeBoard === boardIndex ? "bg-white border-blue-400 shadow-lg scale-105" : "bg-slate-100 border-slate-200 opacity-60"}
                `}
                style={{ minWidth: 0 }}
              >
                {/* Winner overlay */}
                {game.innerWinners[boardIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 rounded-2xl z-10">
                    <span
                      className={`font-extrabold text-6xl sm:text-7xl ${game.innerWinners[boardIndex] === "X" ? "text-blue-600" : "text-pink-500"}`}
                    >
                      {game.innerWinners[boardIndex]}
                    </span>
                  </div>
                )}
                {/* Mini board grid */}
                <div className="relative w-full h-full grid grid-cols-3 grid-rows-3 gap-1 sm:gap-2 z-0">
                  {board.map((cell: string, position: number) => (
                    <button
                      key={position}
                      className={`w-full h-full aspect-square flex items-center justify-center text-3xl sm:text-4xl font-extrabold rounded-lg border border-slate-200 transition-colors duration-150
                        ${cell === "X" ? "text-blue-600" : cell === "O" ? "text-pink-500" : "hover:bg-blue-50 active:bg-blue-100"}
                        ${game.activeBoard === -1 || game.activeBoard === boardIndex ? "" : "cursor-not-allowed"}
                      `}
                      onClick={() =>
                        dispatch(makeLocalMove({ boardIndex, position }))
                      }
                      disabled={
                        cell !== "" ||
                        (game.activeBoard !== -1 &&
                          game.activeBoard !== boardIndex) ||
                        game.status !== "playing"
                      }
                    >
                      {cell}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center space-y-3 mt-4">
          {game.status === "playing" ? (
            <p className="text-lg font-semibold text-slate-700">
              <span className="mr-2">Current turn:</span>
              <span
                className={
                  game.currentTurn === "X"
                    ? "text-blue-600 font-bold"
                    : "text-pink-500 font-bold"
                }
              >
                {game.currentTurn}
              </span>
              <span className="ml-2">
                {game.activeBoard === -1
                  ? "You can play in any board."
                  : `Play in board ${game.activeBoard + 1}.`}
              </span>
            </p>
          ) : game.status === "won" ? (
            <p className="text-2xl font-bold text-green-600 drop-shadow-sm">
              Winner: {game.currentTurn === "X" ? "O" : "X"}
            </p>
          ) : (
            <p className="text-2xl font-bold text-slate-500 drop-shadow-sm">
              Draw!
            </p>
          )}
          <button
            className="mt-3 px-8 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl shadow hover:from-blue-600 hover:to-pink-600 transition-colors text-lg font-bold tracking-wide"
            onClick={() => dispatch(resetGame())}
          >
            Reset Game
          </button>
        </div>
      </div>
    );
  }

  // Only allow online mode if gameId is provided
  if (!props.gameId) {
    return <div className="text-center text-red-600">No game ID provided.</div>;
  }

  const game = useQuery(api.games.getGame, { gameId: props.gameId });
  const makeMove = useMutation(api.games.makeMove);
  const [playerRole, setPlayerRole] = useState<"X" | "O" | null>(null);
  const [playerId] = useState(() => getOrCreatePlayerId(props.gameId));

  // Assign player automatically
  useEffect(() => {
    if (!game) return;
    if (game.status === "waiting") {
      // Assign X first, then O
      if (!game.playerX) {
        setPlayerRole("X");
        // Patch game to set playerX
        // (You may want to add a joinGame mutation for this, but for now, just set in UI)
      } else if (!game.playerO && game.playerX !== playerId) {
        setPlayerRole("O");
      } else if (game.playerX === playerId) {
        setPlayerRole("X");
      } else if (game.playerO === playerId) {
        setPlayerRole("O");
      } else {
        setPlayerRole(null); // Spectator
      }
    } else {
      // If already assigned
      if (game.playerX === playerId) setPlayerRole("X");
      else if (game.playerO === playerId) setPlayerRole("O");
      else setPlayerRole(null);
    }
  }, [game, playerId]);

  // Show waiting for second player and allow joining
  if (!game) return null;

  // Only allow moves for assigned player and if it's their turn
  const isMyTurn =
    playerRole && game.currentTurn === playerRole && game.status === "playing";

  // Helper to join as X or O if not already set in DB
  const canJoin =
    game.status === "waiting" &&
    ((playerRole === "X" && !game.playerX) ||
      (playerRole === "O" && !game.playerO));
  const joinGame = useMutation(api.games.joinGame);
  useEffect(() => {
    if (canJoin && playerRole) {
      joinGame({ gameId: props.gameId, player: playerRole, playerId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canJoin, playerRole, playerId, props.gameId]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="mb-2 text-center">
          {playerRole ? (
            <span>
              You are <b>{playerRole}</b>
            </span>
          ) : (
            <span>You are spectating</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 aspect-square">
          {(game.boards ?? []).map((board: string[], boardIndex: number) => (
            <div key={boardIndex} className="relative">
              <div className="absolute top-1 left-1 text-xs text-gray-500">
                {boardIndex + 1}
              </div>
              {game.innerWinners?.[boardIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-4xl font-bold">
                  {game.innerWinners[boardIndex]}
                </div>
              )}
              <div className="grid grid-cols-3 gap-[2px] bg-gray-200 p-[2px]">
                {board.map((cell: string, position: number) => (
                  <button
                    key={position}
                    className={`
                      aspect-square flex items-center justify-center text-xl font-bold
                      ${cell ? "bg-white" : "bg-white hover:bg-gray-50"}
                      ${position % 3 === 1 ? "border-x-2 border-gray-300" : ""}
                      ${Math.floor(position / 3) === 1 ? "border-y-2 border-gray-300" : ""}
                    `}
                    disabled={
                      !isMyTurn ||
                      cell !== "" ||
                      game.status !== "playing" ||
                      game.innerWinners?.[boardIndex] !== "" ||
                      ((game.activeBoard ?? -1) !== -1 &&
                        (game.activeBoard ?? -1) !== boardIndex)
                    }
                    onClick={() =>
                      makeMove({
                        gameId: props.gameId,
                        boardIndex,
                        position,
                        player: playerRole!,
                      })
                    }
                  >
                    {cell}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm">
          {game.status === "waiting" && (
            <p className="text-yellow-600">
              Waiting for another player to join...
            </p>
          )}
          {game.status === "playing" ? (
            isMyTurn ? (
              <p className="text-green-600">
                Your turn!{" "}
                {(game.activeBoard ?? -1) === -1
                  ? "Play in any board"
                  : `Must play in board ${(game.activeBoard ?? -1) + 1}`}
              </p>
            ) : (
              <p className="text-gray-600">Waiting for opponent...</p>
            )
          ) : null}
          {game.status === "won" && (
            <p className="text-blue-600 font-semibold">{game.winner} wins!</p>
          )}
          {game.status === "draw" && (
            <p className="text-blue-600 font-semibold">It's a draw!</p>
          )}
        </div>
      </div>
    </div>
  );
}
