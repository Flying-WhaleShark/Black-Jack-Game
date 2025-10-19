const API_URL =
  "https://7nuei3ww3benljj3rvjlhnzjxu.appsync-api.ap-northeast-1.amazonaws.com/graphql";
const API_KEY = "da2-ptwrtpimp5e2jlvqebmjmtvovu";

// 共通fetch関数
async function fetchGraphQL(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// プレイヤー取得
export async function getPlayer(name) {
  const query = `
    query GetPlayer($name: ID!) {
      getPlayer(name: $name) {
        name
        money
      }
    }
  `;
  const data = await fetchGraphQL(query, { name });
  return data.getPlayer ?? null;
}

// プレイヤー作成
export async function createPlayer(name, initialMoney = 1000) {
  const mutation = `
    mutation CreatePlayer($name: ID!, $money: Int) {
      createPlayer(name: $name, money: $money) {
        name
        money
      }
    }
  `;
  const data = await fetchGraphQL(mutation, { name, money: initialMoney });
  return data.createPlayer;
}

// プレイヤー更新
export async function updatePlayer(name, diff) {
  const current = await getPlayer(name);
  if (!current) {
    // 存在しない場合は新規作成
    return await createPlayer(name, 1000 + diff);
  }

  const newMoney = (current.money ?? 1000) + diff;

  const mutation = `
    mutation UpdatePlayer($name: ID!, $money: Int) {
      updatePlayer(name: $name, money: $money) {
        name
        money
      }
    }
  `;
  const data = await fetchGraphQL(mutation, { name, money: newMoney });
  return data.updatePlayer;
}

// ブラックジャックから呼ばれる関数
export async function updateMoney(name, diff) {
  try {
    const player = await updatePlayer(name, diff);
    return player;
  } catch (e) {
    console.error("updateMoney error:", e);
    throw e;
  }
}

// ランキング表示用
export async function listPlayers() {
  const query = `
    query ListPlayers {
      listPlayers {
        name
        money
      }
    }
  `;
  const data = await fetchGraphQL(query);
  return (
    data.listPlayers?.sort((a, b) => (b.money ?? 0) - (a.money ?? 0)) ?? []
  );
}
