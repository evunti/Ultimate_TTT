import { Provider } from "react-redux";
import { store } from "./store";
import { GameBoard } from "./GameBoard";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

export default function App() {
  const createGame = useMutation(api.games.createGame);
  const [newGameId, setNewGameId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false); // Animation trigger
  const navigate = useNavigate();

  const handleCreateOnlineGame = async () => {
    const id = await createGame({});
    navigate(`/game/${id}`); // Go directly to the online game
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      window.location.origin + "/game/" + newGameId
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 300); // Animation duration
  };

  const handleShareLinkClick = () => {
    if (newGameId) {
      navigate(`/game/${newGameId}`);
    }
  };

  return (
    <Provider store={store}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <GameBoard local={true} />
                  <button
                    className="w-full max-w-xs px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
                    onClick={handleCreateOnlineGame}
                  >
                    Play online
                  </button>
                </>
              }
            />
            <Route path="/game/:gameId" element={<OnlineGameShareWrapper />} />
          </Routes>
        </div>
      </div>
    </Provider>
  );
}

function OnlineGameShareWrapper() {
  const { gameId } = useParams();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/game/${gameId}`;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6">
      <GameBoard local={false} />
      <div className="bg-blue-50 border border-blue-200 rounded p-4 w-full max-w-xs">
        <div className="mb-2 font-semibold">Share this link to invite a friend:</div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-full"
            value={shareUrl}
            readOnly
            onFocus={e => e.target.select()}
          />
          <button
            className={`px-2 py-1 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition ${copied ? "scale-110" : ""}`}
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 300);
            }}
          >
            Copy
          </button>
        </div>
        <div className="mt-2 text-blue-700 text-sm text-center">Waiting for another player to join...</div>
      </div>
    </div>
  );
}
