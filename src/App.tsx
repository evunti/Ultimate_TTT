import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { GameBoard } from "./GameBoard";

export default function App() {
  const games = useQuery(api.games.listGames);
  const createGame = useMutation(api.games.createGame);
  const [newGameId, setNewGameId] = useState<string | null>(null);

  const handleCreateGame = async () => {
    const id = await createGame({});
    setNewGameId(id);
  };

  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ultimate Tic Tac Toe</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-600 space-y-2">
          <h3 className="font-semibold text-base text-black">
            How to Play Ultimate Tic Tac Toe:
          </h3>
          <p>1. Win small boards to claim them in the big game</p>
          <p>
            2. Your move determines which board your opponent must play in next
          </p>
          <p>3. Win three small boards in a row to win the game!</p>
        </div>
      </div>

      {newGameId && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 my-4">
          <div className="mb-2 font-semibold">
            Share this link to invite a friend:
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 w-full"
              value={window.location.origin + "/game/" + newGameId}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() =>
                navigator.clipboard.writeText(
                  window.location.origin + "/game/" + newGameId
                )
              }
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {games?.length ? (
        <div className="space-y-8">
          <h2 className="text-xl font-semibold">Games</h2>
          {games.map((game) => (
            <GameBoard key={game._id} gameId={game._id} />
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="text-xl font-semibold mb-4">Start a New Game</h2>
        <button
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          onClick={handleCreateGame}
        >
          Start Game
        </button>
      </div>
    </main>
  );
}
