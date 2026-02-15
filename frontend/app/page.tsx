"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("読み込み中...");

  useEffect(() => {
    // UbuntuのTailscale IPを指定
    fetch("https://ai-api.kiiswebai.com/api/v1/ping")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("APIへの接続に失敗しました"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Salon App 疎通テスト</h1>
      <p className="mt-4 text-xl text-blue-500">{message}</p>
    </main>
  );
}
