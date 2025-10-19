import React, { useContext } from "react";
import { GameProvider, GameContext } from "./GameContext";
import JoinPage from "./JoinPage";
import BlackjackGame from "./BlackjackGame";
import Ranking from "./Ranking";
import "./BlackjackGame.css";

function PageSwitcher() {
  const { page } = useContext(GameContext);
  if (page === "join") return <JoinPage />;
  if (page === "blackjack") return <BlackjackGame />;
  if (page === "ranking") return <Ranking />;
  return <div>ページが見つかりません</div>;
}

export default function App() {
  return (
    <GameProvider>
      <PageSwitcher />
    </GameProvider>
  );
}
