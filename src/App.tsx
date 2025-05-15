import { Provider } from "react-redux";
import { store } from "./store";
import { GameBoard } from "./GameBoard";

export default function App() {
  // Only show local play by default
  return (
    <Provider store={store}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50">
        <GameBoard local={true} />
      </div>
    </Provider>
  );
}
