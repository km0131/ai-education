'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';

// =================================================================
// Step 2: Confirmation Screen Component
// =================================================================
interface SignUpStep2Props {
  qrCode: string;
  registeredName: string;
  createdId: string;
  isTeacher: boolean;
}

function SignUpStep2({ qrCode, registeredName, createdId, isTeacher }: SignUpStep2Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const element = printRef.current;
    if (element) {
      const canvas = await html2canvas(element, {
        scale: 2, // 高解像度でキャプチャ
        backgroundColor: '#ffffff',
      });
      const data = canvas.toDataURL('image/png');
      const link = document.createElement('a');

      link.href = data;
      link.download = `user-id-card-${registeredName}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
      <div className="w-full max-w-sm mx-auto">
        <div 
          ref={printRef}
          className="bg-white rounded-3xl shadow-lg p-6"
        >
          <div className="text-center pb-6 border-b-2 border-dashed border-[#e0f2fe]">
            <h3 className="text-3xl font-bold text-[#0ea5e9] tracking-tight">🎉 かいいんしょ！ 🎉</h3>
            <p className="text-sm text-[#38bdf8] mt-2">たいせつにほぞんしてね！</p>
          </div>
          <div className="py-6 text-center">
            {qrCode && (
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="QR Code" 
                className="mx-auto w-40 h-40 rounded-2xl shadow-md"
              />
            )}
          </div>
          <div className="space-y-4 text-base bg-[#f0f9ff] p-4 rounded-2xl">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0369a1]">😊 なまえ</span>
              <span className="font-bold text-lg text-[#0c4a6e]">{registeredName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0369a1]">🆔 ID</span>
              <span className="font-mono bg-white px-3 py-1 rounded-lg text-lg text-[#0c4a6e]">{createdId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0369a1]">✨ やくわり</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                isTeacher ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#d1fae5] text-[#065f46]'
              }`}>
                {isTeacher ? 'せんせい' : 'せいと'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={handleDownload}
            className="w-full bg-[#34d399] hover:bg-[#10b981] text-white font-bold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            カードをほぞんする
          </button>
          <Link 
            href="/" 
            className="block w-full text-center bg-[#60a5fa] hover:bg-[#3b82f6] text-white font-bold py-3 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            ログインがめんへ
          </Link>
        </div>
      </div>
    </div>
  );
}


// =================================================================
// Step 1: Registration Form Component
// =================================================================
interface SignUpStep1Props {
  onSuccess: (data: { ID: string; QR: string; name: string; teacher: boolean }) => void;
}

function SignUpStep1({ onSuccess }: SignUpStep1Props) {
    // Form state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [imageList, setImageList] = useState<string[]>([]);
    const [imageNames, setImageNames] = useState<string[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
    const [isImagesLoading, setIsImagesLoading] = useState(true); // For initial image load
    const [errorMessage, setErrorMessage] = useState('');
    const [statusMessage, setStatusMessage] = useState({ text: 'えらんださしゃしん: 0/3', color: 'text-slate-500' });
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch images on component mount
    useEffect(() => {
      const fetchImages = async () => {
        setIsImagesLoading(true);
        try {
          const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputUsername: username }),
        });

        const data = await response.json();

        if (response.ok && data.status === "next_step") {
          const absoluteImages = data.img_list.map((path: string) => 
            path.startsWith('/') ? path : `/${path}`
          );
          setImageList(absoluteImages);
          setImageNames(data.img_name);
        } else {
          setErrorMessage(data.error || "がぞうのよみこみにしっぱいしました。");
        }

        } catch (err) {
          setErrorMessage('がぞうのよみこみにしっぱいしました。');
        } finally {
          setIsImagesLoading(false);
        }
      };

      fetchImages();
    }, []); // Empty dependency array means this runs once on mount


    const handleRegistrationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        if (!username.trim()) {
            setErrorMessage('なまえをいれてね。');
            setIsSubmitting(false);
            return;
        }
        if (role === 'teacher' && !email.trim()) {
            setErrorMessage('めーるあどれすをいれてね。');
            setIsSubmitting(false);
            return;
        }
        if (selectedIndices.length !== 3) {
            setErrorMessage('しゃしんを3つえらんでね。');
            setIsSubmitting(false);
            return;
        }

        try {
            const sortedIndices = [...selectedIndices].sort((a, b) => a - b);
            const sortedLabels = sortedIndices.map(index => imageNames[index]);
            const registrationData: { username: string; role: string; images: string[]; email?: string } = { 
                username, 
                role, 
                images: sortedLabels
            };

            if (role === 'teacher') {
                registrationData.email = email;
            } else {
                registrationData.email = "";
            }
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'とうろくにしっぱいしました。');
            }

            setSuccessMessage('とうろくがかんりょうしました！');
            
            setTimeout(() => {
                onSuccess(result);
            }, 2000);

        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'エラーがはっせいしました。');
            setIsSubmitting(false);
        }
    };

    // --- Image Selection Logic ---
    const toggleImageSelection = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else if (selectedIndices.length < 3) {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    useEffect(() => {
        const count = selectedIndices.length;
        if (count === 3) {
            setStatusMessage({ text: '3つえらんだね！OK！', color: 'text-green-500' });
        } else {
            setStatusMessage({ text: `えらんだがぞう: ${count}/3`, color: 'text-slate-500' });
        }
    }, [selectedIndices]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] p-4 font-sans">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
                <h3 className="text-center text-3xl font-bold text-[#0ea5e9] mb-6 tracking-tight">✨ あたらしく とうろく ✨</h3>
                
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

                <form onSubmit={handleRegistrationSubmit}>
                
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-semibold text-center text-slate-600">👤 どっちでつかう？</label>
                    <div className="flex justify-center rounded-full bg-slate-100 p-1" role="group">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        disabled={isSubmitting || !!successMessage}
                        className={`w-1/2 px-4 py-2 text-sm font-bold rounded-full transition-colors ${
                          role === 'student'
                            ? 'bg-blue-400 text-white shadow-md'
                            : 'text-slate-500'
                        }`}
                      >
                        せいと
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        disabled={isSubmitting || !!successMessage}
                        className={`w-1/2 px-4 py-2 text-sm font-bold rounded-full transition-colors ${
                          role === 'teacher'
                            ? 'bg-amber-400 text-white shadow-md'
                            : 'text-slate-500'
                        }`}
                      >
                        せんせい
                      </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-600">
                    😊 なまえ
                    </label>
                    <input
                    type="text"
                    className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isSubmitting || !!successMessage}
                    />
                </div>

                {role === 'teacher' && (
                    <div className="mb-6">
                    <label className="block mb-2 text-sm font-semibold text-slate-600">
                        📧 めーるあどれす
                    </label>
                    <input
                        type="email"
                        className="w-full px-4 py-3 text-base border-2 border-slate-200 rounded-xl focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting || !!successMessage}
                        placeholder="teacher@example.com"
                    />
                    </div>
                )}

                <div>
                    <label className="block text-slate-600 font-semibold mb-3">
                    🤫 ひみつのパスワード (すきなしゃしんを3つえらんでね)
                    </label>
                    
                    {isImagesLoading ? (
                    <div className="text-center p-10">
                        <p>しゃしんをよんでいます...</p>
                    </div>
                    ) : (
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                        {imageList.map((path, index) => (
                        <div key={index} className="flex justify-center">
                            <label className="relative cursor-pointer group w-full">
                            <input
                                type="checkbox"
                                className="absolute opacity-0 w-0 h-0"
                                checked={selectedIndices.includes(index)}
                                onChange={() => toggleImageSelection(index)}
                                disabled={isSubmitting || !!successMessage}
                            />
                            <img
                                src={path}
                                alt={`img-pw-${index}`}
                                className={`w-full aspect-square object-contain p-1 rounded-2xl border-4 transition-all duration-200 
                                ${selectedIndices.includes(index)
                                    ? "border-sky-400 ring-4 ring-sky-100 scale-105"
                                    : "border-slate-200 group-hover:border-sky-300 group-hover:scale-105"
                                }`}
                            />
                            </label>
                        </div>
                        ))}
                    </div>
                    )}
                    <p className={`text-center font-semibold mb-4 min-h-[1.5rem] ${statusMessage.color}`}>
                    {statusMessage.text}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isImagesLoading || selectedIndices.length !== 3 || isSubmitting || !!successMessage}
                    className="w-full bg-[#34d399] hover:bg-[#10b981] text-white font-bold py-4 rounded-full transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100"
                >
                    {isSubmitting ? "とうろくしています..." : "とうろくする！"}
                </button>
                </form>

                <hr className="my-6 border-slate-200" />

                <div className="text-center text-sm">
                <Link href="/" className="font-semibold text-sky-500 hover:text-sky-600 hover:underline">
                    もうアカウントをもっているよ
                </Link>
                </div>
            </div>
        </div>
    );
}

// =================================================================
// Main Page Component
// =================================================================
export default function SignUpPage() {
    const [step, setStep] = useState(1);
    const [confirmationData, setConfirmationData] = useState<SignUpStep2Props | null>(null);

    const handleSuccess = (data: { ID: string; QR: string; name:string; teacher: boolean }) => {
        setConfirmationData({
            createdId: data.ID,
            qrCode: data.QR,
            registeredName: data.name,
            isTeacher: data.teacher,
        });
        setStep(2);
    };

    if (step === 1) {
        return <SignUpStep1 onSuccess={handleSuccess} />;
    }
    
    if (step === 2 && confirmationData) {
        return <SignUpStep2 {...confirmationData} />;
    }

    // Default fallback
    return null; 
}
