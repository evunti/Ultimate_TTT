import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

function getOrCreatePlayerId(gameId: string) {
  const key = `ttt-playerId-${gameId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function GameBoard({ gameId }: { gameId: Id<"games"> }) {
  const game = useQuery(api.games.getGame, { gameId });
  const makeMove = useMutation(api.games.makeMove);
  const [playerRole, setPlayerRole] = useState<"X" | "O" | null>(null);
  const [playerId] = useState(() => getOrCreatePlayerId(gameId));

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
      joinGame({ gameId, player: playerRole, playerId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canJoin, playerRole, playerId, gameId]);

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
          {(game.boards ?? []).map((board, boardIndex) => (
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
                {board.map((cell, position) => (
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
                        gameId,
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
