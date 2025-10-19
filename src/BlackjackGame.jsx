import React, { useState, useContext, useCallback, useEffect } from "react";
import { GameContext } from "./GameContext";
import "./BlackjackGame.css";
import { getPlayer, updatePlayer } from "./api";

// トランプのマークと値
const suits = ["♠", "♥", "♦", "♣"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// デッキを生成する関数
const generateDeck = () => {
  const deck = [];
  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push({ value, suit });
    });
  });
  return deck;
};

// 手札の合計点を計算
const calculateScore = (hand) => {
  let score = 0;
  let aces = 0;
  hand.forEach((card) => {
    if (["J", "Q", "K"].includes(card.value)) score += 10;
    else if (card.value === "A") {
      score += 11;
      aces += 1;
    } else score += parseInt(card.value, 10);
  });
  // Aを11→1に変更してバースト回避
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

const BlackjackGame = () => {
  const { playerName, addMoney, playerMoney, setPage } =
    useContext(GameContext);

  // 各種state
  const [deck, setDeck] = useState(generateDeck());
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [bet, setBet] = useState(0);
  const [message, setMessage] = useState(
    "賭け金を入力してスタートしてください！",
  );

  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // デッキから1枚引く
  const drawCard = useCallback(() => {
    const newDeck = [...deck];
    const idx = Math.floor(Math.random() * newDeck.length);
    const card = newDeck.splice(idx, 1)[0];
    setDeck(newDeck);
    return card;
  }, [deck]);

  // ブラックジャックから呼ばれる関数
  async function updateMoney(name, diff) {
    try {
      const player = await updatePlayer(name, diff);
      return player;
    } catch (e) {
      console.error("updateMoney error:", e);
      throw e;
    }
  }

  // サーバからプレイヤー情報を同期
  const syncPlayerFromServer = useCallback(async () => {
    try {
      setLoadingPlayer(true);
      const p = await getPlayer(playerName);
      if (p && typeof p.money === "number") {
        const diff = p.money - playerMoney;
        if (diff !== 0) addMoney(playerName, diff);
      } else {
        // サーバになければ初期化
        const created = await updateMoney(playerName, 0);
        const diff = created.money - playerMoney;
        if (diff !== 0) addMoney(playerName, diff);
      }
    } catch (e) {
      console.error("syncPlayerFromServer error:", e);
      setMessage(
        "サーバ同期に失敗しました（開発環境でAPIが未設定の可能性があります）。",
      );
    } finally {
      setLoadingPlayer(false);
    }
  }, [playerName, addMoney, playerMoney]);

  useEffect(() => {
    syncPlayerFromServer();
  }, [syncPlayerFromServer]);

  // ゲーム開始
  const startGame = () => {
    if (bet <= 0) {
      setMessage("有効な賭け金を入力してください。");
      return;
    }

    // ※ 所持金超過チェックを削除（マイナス可）
    const newDeck = generateDeck();
    const pHand = [
      newDeck.splice(Math.floor(Math.random() * newDeck.length), 1)[0],
      newDeck.splice(Math.floor(Math.random() * newDeck.length), 1)[0],
    ];
    const dHand = [
      newDeck.splice(Math.floor(Math.random() * newDeck.length), 1)[0],
    ];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);

    setMessage(
      "あなたのターンです。カードを引く または 勝負 を選んでください。",
    );
    setIsGameOver(false);
  };

  // カードを引く
  const hit = () => {
    if (isGameOver) return;
    const card = drawCard();
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    if (calculateScore(newHand) > 21) {
      setMessage("バースト！あなたの負けです。");
      settleResultOnServer(-Math.abs(bet)); // 負け：マイナス
      setIsGameOver(true); // ← 追加：操作不可にする
    }
  };

  // 勝負！
  const stand = async () => {
    if (isGameOver) return;
    let dealerCards = [...dealerHand];

    // ディーラーが17以上になるまで引く
    while (calculateScore(dealerCards) < 17) {
      dealerCards.push(drawCard());
    }
    setDealerHand(dealerCards);

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerCards);

    if (dealerScore > 21 || playerScore > dealerScore) {
      setMessage("あなたの勝ち！賞金ゲット！");
      await settleResultOnServer(Math.abs(bet)); // 勝ち：プラス
    } else if (playerScore === dealerScore) {
      setMessage("引き分け！");
    } else {
      setMessage("あなたの負けです…");
      await settleResultOnServer(-Math.abs(bet)); // 負け：マイナス
    }
    setIsGameOver(true); // ← 追加：勝負後はボタン非活性化
  };

  // サーバに結果を反映（失敗時はローカル反映のみ）
  const settleResultOnServer = async (amount) => {
    try {
      const updated = await updateMoney(playerName, amount);
      const diff = updated.money - playerMoney;
      if (diff !== 0) addMoney(playerName, diff);
    } catch (e) {
      console.error("settleResultOnServer error:", e);
      setMessage("結果送信に失敗しました。ローカルのみで反映します。");
      addMoney(playerName, amount);
    }
  };

  return (
    <div className="blackjack-container">
      <h1>ブラックジャック</h1>

      <p className="explanation">
        ブラックジャックは21を超えない範囲で、ディーラーより高い点数を目指すゲームです。
        <br />
        J・Q・Kは10点、Aは1点または11点として計算します。
        <br />
        あなたの持ち金を賭けて勝負しましょう！
      </p>

      {/* 賭け金と操作エリア */}
      <div className="bet-section">
        <p>
          所持金:{" "}
          <span style={{ color: playerMoney < 0 ? "red" : "white" }}>
            {loadingPlayer ? "..." : playerMoney}
          </span>
        </p>
        <input
          type="number"
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          placeholder="賭け金を入力"
        />
        <button onClick={startGame}>ゲーム開始</button>
        <button onClick={() => setPage("ranking")}>ランキングを見る</button>
      </div>

      {/* 手札表示 */}
      <div className="hands">
        <div className="player-hand">
          <h2>あなたのカード</h2>
          <div className="cards">
            {playerHand.map((card, index) => (
              <div key={index} className="card">
                {card.value}
                {card.suit}
              </div>
            ))}
          </div>
          <p>合計: {calculateScore(playerHand)}</p>
        </div>

        <div className="dealer-hand">
          <h2>ディーラーのカード</h2>
          <div className="cards">
            {dealerHand.map((card, index) => (
              <div key={index} className="card">
                {card.value}
                {card.suit}
              </div>
            ))}
          </div>
          {<p>合計: {calculateScore(dealerHand)}</p>}
        </div>
      </div>

      {/* 操作ボタン */}
      {!isGameOver && (
        <div className="controls">
          <button onClick={hit}>カードを引く</button>
          <button onClick={stand}>勝負！</button>
        </div>
      )}

      <p className="message">{message}</p>
    </div>
  );
};

export default BlackjackGame;
