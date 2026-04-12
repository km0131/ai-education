"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';

// =================================================================
// QR Code Scanner Modal
// =================================================================
// =================================================================
// QR Code Scanner Modal (Custom Simple UI)
// =================================================================
interface QrScannerModalProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

function QrScannerModal({ onScanSuccess, onClose }: QrScannerModalProps) {
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // インスタンス作成
    // 既に存在する場合は作成しない
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    return () => {
      // クリーンアップ
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((err) => console.error("Stop failed", err));
        }
        scannerRef.current.clear();
      }
    };
  }, []);

  const startCamera = async () => {
    setError("");
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // スキャン成功時の処理
          // 1. まずスキャンを停止するフラグを立てる（重複防止）または即座に停止処理を行う
          // 2. 停止が完了してから onScanSuccess を呼ぶ
          handleScanSuccess(decodedText);
        },
        () => {
          // エラーは無視
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error(err);
      setError("カメラが つかえない みたい。せってい を かくにん してね。");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!scannerRef.current) return;
    try {
      // カメラを停止
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch (err) {
      console.error("Stop failed", err);
    }
    setIsScanning(false);
    onScanSuccess(decodedText);
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Stop failed", err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // インスタンスがなくてもファイル読み込みはjsQRで行うのでチェックを緩和しても良いが、
    // モーダル全体のロジックとしてはスキャナーが準備できている前提でも問題ない。
    setError("");

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      try {
        const imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const image = new Image();
        image.src = imageUrl;
        await new Promise((resolve) => {
          image.onload = resolve;
        });

        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas Contextの取得に失敗しました");
        }

        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          onScanSuccess(code.data);
        } else {
          console.log("jsQR code not found");
          setError("QRコードが見つかりませんでした。別の写真を試してください。");
        }

      } catch (err) {
        console.error("QR Scan Error:", err);
        setError("画像の読み込みに失敗しました。別の写真を試してください。");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 animate-fadeIn backdrop-blur-sm">
      <div className="bg-white p-6 rounded-3xl w-full max-w-sm relative shadow-2xl flex flex-col gap-4">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
        >
          ✕
        </button>

        <h3 className="text-center font-bold text-xl text-slate-700 mt-2">QRコード を よみとる</h3>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl bg-black min-h-[250px] flex items-center justify-center">
          <div id="reader" className="w-full h-full"></div>
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-2">
              <span className="text-4xl">📷</span>
              <span className="text-sm font-bold">カメラは 停止中 だよ</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              🎥 カメラ を 起動する
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full bg-red-400 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95"
            >
              ⏹ カメラ を 止める
            </button>
          )}

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border-2 border-sky-200 text-sky-600 hover:bg-sky-50 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              📁 アルバム から 選ぶ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Step 1: Username Input Component
// =================================================================
interface LoginStep1Props {
  onUserChecked: (username: string, imageList: string[], imageNames: string[]) => void;
}

function LoginStep1({ onUserChecked }: LoginStep1Props) {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const router = useRouter();

  const handleUserCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("なまえをいれてね。");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputUsername: username }),
      });

      const data = await response.json();

      if (response.ok && data.status === "next_step") {
        onUserChecked(username, data.img_list, data.img_name);
      } else {
        setErrorMessage(data.error || "そのなまえのひとはいないみたい。もういちどかくにんしてね。");
      }
    } catch (err) {
      setErrorMessage("えらーがはっせいしました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrScan = async (decodedText: string) => {
    setShowQrScanner(false);
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch('/api/login_qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: decodedText }),
      });

      const data = await response.json();
      console.log("QR Login Response:", data);

      if (response.ok) {
        // Relaxed success check logic
        const isPasswordValid = data.password === true || data.password === "true" || data.password === "True";
        const isSuccessStatus = data.status === "success" || (data.status === "password" && isPasswordValid);

        if (isSuccessStatus || isPasswordValid) {
          console.log("Login Success! Redirecting to /main_room");
          router.push('/main_room');
        } else if (data.status === "next_step" || data.status === "QR_Registrer") {
          console.log("Next Step Branch. img_list:", data.img_list);
          // 画像リストがあれば次のステップ（画像認証）へ、なければログイン成功とみなす
          if (data.img_list && data.img_list.length > 0) {
            console.log("Proceeding to Step 2");
            onUserChecked(data.username, data.img_list, data.img_name);
          } else {
            console.log("No images, redirecting to /main_room");
            router.push('/main_room');
          }
        } else {
          const debugInfo = `(st:${data.status}, pw:${data.password})`;
          console.error("Login Failed:", debugInfo);
          setErrorMessage(data.error || "QRコードのログインに しっぱい しました。 " + debugInfo);
        }
      } else {
        setErrorMessage(data.error || "QRコードが ただしく ありません。");
      }
    } catch (err) {
      console.error("QR Error:", err);
      setErrorMessage("えらーが はっせい しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
        <h3 className="text-center text-3xl font-bold text-[#0ea5e9] mb-6 tracking-tight">👋 ろぐいん</h3>

        {showQrScanner && (
          <QrScannerModal
            onScanSuccess={handleQrScan}
            onClose={() => setShowQrScanner(false)}
          />
        )}

        {errorMessage && (
          <p className="text-red-500 border border-red-300 bg-red-50 p-3 mb-4 text-sm rounded-xl text-center">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleUserCheck}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-semibold text-slate-600">
              😊 なまえ
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? "かくにんちゅう..." : "つぎへ →"}
          </button>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowQrScanner(true)}
              disabled={isLoading}
              className="w-full bg-white border-2 border-sky-500 text-sky-500 font-bold py-4 rounded-full transition-all hover:bg-sky-50 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              📷 QRコードで ろぐいん
            </button>
          </div>
        </form>

        <hr className="my-6 border-slate-200" />

        <div className="text-center text-sm space-y-2">
          <a href="#" className="font-semibold text-slate-400 cursor-not-allowed">
            ぱすわーどをわすれたばあい
          </a>
          <Link href="/signup" className="block font-semibold text-sky-500 hover:text-sky-600 hover:underline">
            あたらしく とうろくする
          </Link>
        </div>
      </div>
    </div>
  );
}


// =================================================================
// Step 2: Image Password Component
// =================================================================
interface LoginStep2Props {
  username: string;
  imageList: string[];
  imageNames: string[];
  onBack: () => void;
}

function LoginStep2({ username, imageList, imageNames, onBack }: LoginStep2Props) {
  const router = useRouter();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState({ text: "えらんだ どうぶつ: 0/3", color: "text-slate-500" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const toggleImageSelection = (index: number) => {
    if (selectedIndices.includes(index) || isLoading || successMessage) {
      if (!isLoading && !successMessage) {
        setSelectedIndices(selectedIndices.filter(i => i !== index));
      }
    } else if (selectedIndices.length < 3) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  useEffect(() => {
    const count = selectedIndices.length;
    if (count === 3) {
      setStatusMessage({ text: "3つえらんだね！OK！", color: "text-green-500" });
    } else {
      setStatusMessage({ text: `えらんだしゃしん: ${count}/3`, color: "text-slate-500" });
    }
  }, [selectedIndices]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndices.length !== 3) {
      setErrorMessage("しゃしんを3つえらんでね。");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
      const sortedLabels = sortedIndices.map(index => imageNames[index]);
      const loginData = {
        username: username,
        images: sortedLabels
      };

      const response = await fetch('/api/login_registrer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok && (result.password === true || result.password === "true")) {
        // メイン画面の代わりにログイン画面（ルート）へ移動
        // router.push('/') だと同じページのため状態がリセットされない可能性があるので
        // 明示的にリロードするか、単純に '/' へ遷移させる。
        // ここではユーザーの指示通り「ログイン画面に移動」として '/' を指定。
        router.push('/main_room');
      } else {
        setErrorMessage("パスワードが違います。");
        setIsLoading(false);
      }

    } catch (err) {
      setErrorMessage('えらーがはっせいしました。');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
        <h3 className="text-center text-3xl font-bold text-[#0ea5e9] mb-2 tracking-tight">ひみつのパスワード</h3>
        <p className="text-center text-slate-500 mb-6">とうろくした しゃしん 3つえらんでね</p>

        {errorMessage && (
          <p className="text-red-500 border border-red-300 bg-red-50 p-3 mb-4 text-sm rounded-xl text-center">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-green-600 border border-green-300 bg-green-50 p-3 mb-4 text-sm rounded-xl text-center">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            {imageList.map((path, index) => (
              <div key={index} className="flex justify-center">
                <label className={`relative cursor-pointer group w-full ${isLoading || successMessage ? 'cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    className="absolute opacity-0 w-0 h-0"
                    checked={selectedIndices.includes(index)}
                    onChange={() => toggleImageSelection(index)}
                    disabled={isLoading || !!successMessage}
                  />
                  <img
                    src={path}
                    alt={`img-pw-${index}`}
                    className={`w-full aspect-square object-contain p-1 rounded-2xl border-4 transition-all duration-200 
                      ${selectedIndices.includes(index)
                        ? "border-sky-400 ring-4 ring-sky-100 scale-105"
                        : "border-slate-200 group-hover:border-sky-300 group-hover:scale-105"
                      }
                      ${isLoading || successMessage ? 'opacity-50' : ''}
                    `}
                  />
                </label>
              </div>
            ))}
          </div>

          <p className={`text-center font-semibold mb-5 min-h-[1.5rem] ${statusMessage.color}`}>
            {statusMessage.text}
          </p>

          <button
            type="submit"
            disabled={selectedIndices.length !== 3 || isLoading || !!successMessage}
            className="w-full bg-[#34d399] hover:bg-[#10b981] text-white font-bold py-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? "ろぐいんちゅう..." : "ろぐいん！"}
          </button>
        </form>

        <hr className="my-6 border-slate-200" />
        <div className="text-center">
          <button
            onClick={onBack}
            className="text-sm font-semibold text-sky-500 hover:text-sky-600 hover:underline disabled:text-slate-400 disabled:cursor-not-allowed disabled:no-underline"
            disabled={isLoading || !!successMessage}
          >
            ← なまえのにゅうりょくにもどる
          </button>
        </div>
      </div>
    </div>
  );
}


// =================================================================
// Main Page Component (Controller)
// =================================================================
interface LoginData {
  username: string;
  imageList: string[];
  imageNames: string[];
}

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [loginData, setLoginData] = useState<LoginData | null>(null);

  const handleUserChecked = (username: string, imageList: string[], imageNames: string[]) => {
    setLoginData({ username, imageList, imageNames });
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setLoginData(null);
    setStep(1);
  }

  if (step === 1) {
    return <LoginStep1 onUserChecked={handleUserChecked} />;
  }

  if (step === 2 && loginData) {
    return <LoginStep2 {...loginData} onBack={handleBackToStep1} />;
  }

  return null; // Default fallback
}
