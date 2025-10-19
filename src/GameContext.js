import React, { createContext, useState, useCallback, useMemo } from "react";

// Contextを作成（グローバル共有）
export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [page, setPage] = useState("join");
  const [playerName, setPlayerName] = useState("");

  // プレイヤーの所持金（単一ユーザー用）
  const [playerMoney, setPlayerMoney] = useState(1000);

  // 金額を加算・減算する
  const addMoney = useCallback((_, amount) => {
    setPlayerMoney((prev) => prev + amount);
  }, []);

  // useMemo：Contextが提供する値の再生成を防止
  const value = useMemo(
    () => ({
      playerName,
      setPlayerName,
      page,
      setPage,
      playerMoney,
      addMoney,
    }),
    [playerName, page, playerMoney, addMoney],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
