import { Provider } from "react-redux";
import { store } from "./store";
import { GameBoard } from "./GameBoard";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  const createGame = useMutation(api.games.createGame);
  const [newGameId, setNewGameId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false); // Animation trigger

  const handleCreateOnlineGame = async () => {
    const id = await createGame({});
    setNewGameId(id);
    setShowShare(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      window.location.origin + "/game/" + newGameId
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 300); // Animation duration
  };

  return (
    <Provider store={store}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          <GameBoard local={true} />
          <button
            className="w-full max-w-xs px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700  "
            onClick={handleCreateOnlineGame}
          >
            Play online
          </button>
          {showShare && newGameId && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 w-full max-w-xs ">
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
                  className={`px-3 py-1  bg-blue-600 text-white border border-blue-200 rounded p-4relative transition-transform duration-200 focus:outline-none active:scale-105 `}
                  onClick={handleCopy}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Provider>
  );
}
