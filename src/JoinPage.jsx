import React, { useState, useContext } from "react";
import { GameContext } from "./GameContext";
import { getPlayer, createPlayer } from "./api";

const INITIAL_MONEY = 1000;
const YOUR_NAME = "チームX_●●"

export default function JoinPage() {
  const { setPage, setPlayerName, addMoney } = useContext(GameContext);
  const [inputName, setInputName] = useState(YOUR_NAME);
  const [message, setMessage] = useState("");

  const handleJoin = async () => {
    if (!inputName.trim()) {
      setMessage("名前を入力してください。");
      return;
    }

    try {
      const existing = await getPlayer(inputName.trim());
      if (existing) {
        addMoney(existing.name, existing.money - 1000); // 既存データ反映
        setMessage(`ようこそ ${existing.name} さん！`);
      } else {
        await createPlayer(inputName.trim(), INITIAL_MONEY);
        addMoney(inputName.trim(), 0);
        setMessage(`新規登録しました (${INITIAL_MONEY}円からスタート)`);
      }

      setPlayerName(inputName.trim());
      setTimeout(() => setPage("blackjack"), 800);
    } catch (err) {
      console.error(err);
      setMessage("参加処理に失敗しました。API設定を確認してください。");
    }
  };

  return (
    <div className="page">
      <h1>🎮 ブラックジャックに参加</h1>
      <p>あなたの名前を入力してください。</p>
      <input
        type="text"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        placeholder="プレイヤー名"
      />
      <button onClick={handleJoin}>参加する</button>
      <p>{message}</p>
    </div>
  );
}
