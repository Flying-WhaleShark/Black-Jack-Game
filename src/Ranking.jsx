import React, { useState, useEffect, useContext } from "react";
import { GameContext } from "./GameContext";
import { listPlayers } from "./api";

function Ranking() {
  const { setPage } = useContext(GameContext);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await listPlayers();
        setPlayers(data);
      } catch (e) {
        console.error("ランキング取得失敗:", e);
      }
    };
    fetchRanking();
  }, []);

  return (
    <div className="page">
      <h2>🏆 ランキング</h2>
      {players.map((p, idx) => (
        <div key={p.name}>
          {idx + 1}. {p.name} - 💰 {p.money}
        </div>
      ))}
      <button onClick={() => setPage("blackjack")}>もう一度遊ぶ</button>
    </div>
  );
}

export default Ranking;
