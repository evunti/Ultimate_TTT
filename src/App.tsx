import { Provider } from "react-redux";
import { store } from "./store";
import { GameBoard } from "./GameBoard";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

export default function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight drop-shadow-md">
          Ultimate Tic Tac Toe
        </h1>
        <div className="flex gap-2 mb-6">
          <ModeSwitchButtons />
        </div>
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          <Routes>
            <Route
              path="/"
              element={<GameBoard local={true} />}
            />
            <Route path="/game/:gameId" element={<OnlineGameShareWrapper />} />
          </Routes>
        </div>
      </div>
    </Provider>
  );
}

function ModeSwitchButtons() {
  const navigate = useNavigate();
  const params = useParams();
  const isOnline = window.location.pathname.startsWith("/game/");

  const createGame = useMutation(api.games.createGame);

  const handleModeSwitch = async (mode: "local" | "online") => {
    if (mode === "local") {
      navigate("/");
    } else {
      if (isOnline && params.gameId) return;
      const id = await createGame({});
      navigate(`/game/${id}`);
    }
  };

  return (
    <>
      <button
        className={`px-4 py-2 rounded-l font-semibold border border-blue-600 ${!isOnline ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
        onClick={() => handleModeSwitch("local")}
        disabled={!isOnline}
      >
        Local Play
      </button>
      <button
        className={`px-4 py-2 rounded-r font-semibold border border-blue-600 border-l-0 ${isOnline ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
        onClick={() => handleModeSwitch("online")}
        disabled={isOnline}
      >
        Online Play
      </button>
    </>
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
        <div className="mb-2 font-semibold">
          Share this link to invite a friend:
        </div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-full"
            value={shareUrl}
            readOnly
            onFocus={(e) => e.target.select()}
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
        <div className="mt-2 text-blue-700 text-sm text-center">
          Waiting for another player to join...
        </div>
      </div>
    </div>
  );
}
