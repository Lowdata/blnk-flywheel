'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { soundManager } from '@/lib/sound';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import {
  Trophy,
  Copy,
  Check,
  Info,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Task {
  taskId: string;
  description: string;
  rewardAmount: number;
  taskUrl?: string;
  type?: string;
}

interface CompletedTask {
  taskId: string;
  rewardAmount: number;
}

interface UserState {
  walletAddress: string;
  coins: number;
  referralCode: string;
  referralCount: number;
  twitterLinked: boolean;
  twitterHandle: string;
  completedTasks: CompletedTask[];
  referredBy: string | null;
}

const INITIAL_DUMMY_USER: UserState = {
  walletAddress: '0x71C83956691458A31c26038e93231362e54D49A1',
  coins: 24,
  referralCode: 'BLNK-7X9Q',
  referralCount: 5,
  twitterLinked: true,
  twitterHandle: '@blnk_official',
  completedTasks: [
    { taskId: 'task_follow_twitter', rewardAmount: 2 },
    { taskId: 'task_retweet', rewardAmount: 3 },
  ],
  referredBy: 'ORIGIN',
};

const INITIAL_DUMMY_TASKS: Task[] = [
  {
    taskId: 'task_follow_twitter',
    description: 'Follow @BlnkINC on X',
    rewardAmount: 2,
    taskUrl: 'https://x.com/BlnkINC',
  },
  {
    taskId: 'task_retweet',
    description: 'Retweet the Genesis Announcement',
    rewardAmount: 3,
    taskUrl: 'https://x.com/BlnkINC',
  },
  {
    taskId: 'task_like_twitter',
    description: 'Like the Genesis Announcement Tweet',
    rewardAmount: 2,
    taskUrl: 'https://x.com/BlnkINC',
  },
  {
    taskId: 'task_discord',
    description: 'Join the BLNK Discord Community',
    rewardAmount: 2,
    taskUrl: 'https://discord.gg',
  },
  {
    taskId: 'task_referral',
    description: 'Share your Referral Link (+2 coins)',
    rewardAmount: 2,
    type: 'referral',
    taskUrl: 'https://x.com/intent/tweet?text=Join%20me%20on%20BLNK!%20Use%20my%20referral%20code%20BLNK-7X9Q',
  },
];

export default function Dashboard() {
  const [user, setUser] = useState<UserState>(INITIAL_DUMMY_USER);
  const [tasks] = useState<Task[]>(INITIAL_DUMMY_TASKS);
  const [verifyingTasks, setVerifyingTasks] = useState<{ [taskId: string]: number }>({});
  const [activeModal, setActiveModal] = useState<'about' | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [dashboardRefInput, setDashboardRefInput] = useState('');
  const [isClaimingRef, setIsClaimingRef] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  // Wagmi & RainbowKit
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const showToast = useCallback((title: string, desc?: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.title === title ? null : cur));
    }, 3500);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync connected wallet address into state if available
  useEffect(() => {
    if (isConnected && address) {
      setUser((prev) => ({
        ...prev,
        walletAddress: address,
      }));
    }
  }, [isConnected, address]);

  // Read URL referral code if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referral');
      if (ref) {
        localStorage.setItem('blnk_ref_code', ref.toUpperCase());
        setDashboardRefInput(ref.toUpperCase());
      } else {
        const saved = localStorage.getItem('blnk_ref_code');
        if (saved) setDashboardRefInput(saved);
      }
    }
  }, []);

  const handleDashboardClaimReferral = () => {
    const code = dashboardRefInput.trim().toUpperCase();
    if (!code) return;
    setIsClaimingRef(true);
    soundManager.playClick();

    setTimeout(() => {
      soundManager.playWin();
      setUser((prev) => ({
        ...prev,
        coins: prev.coins + 15,
        referredBy: code,
      }));
      showToast('Referral Code Applied!', 'You earned +15 COINS welcome bonus.', 'success');
      setDashboardRefInput('');
      if (typeof window !== 'undefined') localStorage.removeItem('blnk_ref_code');
      setIsClaimingRef(false);
    }, 600);
  };

  const connectWallet = () => {
    soundManager.playClick();
    openConnectModal?.();
  };

  const handleLogout = () => {
    soundManager.playClick();
    disconnect();
    setUser((prev) => ({
      ...prev,
      walletAddress: INITIAL_DUMMY_USER.walletAddress,
    }));
    showToast('Disconnected', 'Switched to demo state.', 'info');
  };

  const handleCopyAddress = () => {
    const addr = address || user.walletAddress;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    showToast('Address Copied', addr, 'info');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyReferral = () => {
    if (!user.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedReferral(true);
    showToast('Invite Code Copied', user.referralCode, 'info');
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleTaskClick = (task: Task) => {
    const isCompleted = user.completedTasks.some((ct) => ct.taskId === task.taskId);

    if (task.type === 'referral' && isCompleted) {
      soundManager.playClick();
      if (task.taskUrl) window.open(task.taskUrl, '_blank');
      showToast('Referral link opened!', 'Share with friends to earn more coins.', 'info');
      return;
    }

    if (isCompleted || verifyingTasks[task.taskId]) return;
    soundManager.playClick();
    if (task.taskUrl) window.open(task.taskUrl, '_blank');

    let secondsLeft = 3;
    setVerifyingTasks((prev) => ({ ...prev, [task.taskId]: secondsLeft }));

    const interval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setVerifyingTasks((prev) => ({ ...prev, [task.taskId]: secondsLeft }));
      } else {
        clearInterval(interval);
        setVerifyingTasks((prev) => {
          const copy = { ...prev };
          delete copy[task.taskId];
          return copy;
        });
        soundManager.playWin();
        showToast(`Task verified! +${task.rewardAmount} Coins`, 'Coins added to your balance.', 'success');
        setUser((prevUser) => ({
          ...prevUser,
          coins: prevUser.coins + task.rewardAmount,
          completedTasks: [...prevUser.completedTasks, { taskId: task.taskId, rewardAmount: task.rewardAmount }],
        }));
      }
    }, 1000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
        <div className="text-sm text-white/60 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#CCFF00]" />
          Loading BLNK Dashboard…
        </div>
      </div>
    );
  }

  const displayAddress = address || user.walletAddress;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-x-hidden flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-float-in flex items-center gap-3 px-5 py-3 rounded-xl border border-white/20 bg-[#111115]/95 backdrop-blur-xl shadow-2xl">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toastMessage.type === 'success' ? 'bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]' : 'bg-blue-400'
            }`}
          />
          <div>
            <p className="text-xs font-bold text-white">{toastMessage.title}</p>
            {toastMessage.desc && <p className="text-[11px] text-white/70">{toastMessage.desc}</p>}
          </div>
        </div>
      )}

      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-green-800/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between bg-black/75 backdrop-blur-xl border-b border-white/10">
        <Link href="/" className="group flex items-center gap-2 no-underline">
          <span className="font-black text-2xl tracking-[0.25em] uppercase bg-gradient-to-r from-[#CCFF00] via-green-500 to-green-700 bg-clip-text text-transparent group-hover:opacity-85 transition-opacity">
            BLNK
          </span>
        </Link>

        {/* Right side nav items */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Leaderboard Coming Soon */}
          <div
            className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 select-none"
            title="Leaderboard coming soon"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-white/80 hidden md:inline">Leaderboard</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold">SOON</span>
          </div>

          {/* Connection status */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_2px_rgba(204,255,0,0.6)]" />
                <span className="text-xs font-semibold text-[#CCFF00]">Connected</span>
              </div>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 hover:border-[#CCFF00]/60 hover:bg-white/15 transition-all text-xs font-mono font-semibold text-[#CCFF00]"
                title="Click to copy address"
              >
                <span>{`${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`}</span>
                <span>{copiedAddress ? <Check className="w-3 h-3 text-[#CCFF00]" /> : <Copy className="w-3 h-3 text-white/40" />}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-white/50 hover:text-red-400 px-2 py-1 transition-colors"
                title="Disconnect"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="hidden md:flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-xs font-mono text-[#CCFF00]"
                title="Click to copy demo address"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]" />
                <span>{`${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`}</span>
              </button>
              <button
                type="button"
                onClick={connectWallet}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#CCFF00] to-green-500 text-black hover:opacity-90 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Coins Pill */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 md:px-3 py-1.5 rounded-lg border border-white/15">
            <span className="text-[11px] font-bold tracking-wider text-white/70 uppercase">Coins</span>
            <span className="text-sm font-black text-[#CCFF00]">{user.coins}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 z-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl flex flex-col gap-6 animate-float-in">
          {/* Header Title */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#CCFF00] via-green-500 to-green-700 bg-clip-text text-transparent">
              BLNK
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-white/60 mt-1">
              black to ink.
            </p>
          </div>

          {/* Cards Grid: Tasks & Referrals */}
          <div className="flex flex-col md:flex-row gap-5 w-full">
            {/* Left Card: Tasks */}
            <div className="flex-1 p-[1.5px] rounded-2xl bg-gradient-to-r from-[#CCFF00] via-green-600 to-green-800 shadow-[0_0_25px_rgba(72,187,120,0.22)] flex flex-col">
              <div className="flex-1 bg-[#111116] p-5 rounded-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#CCFF00] via-green-500 to-green-800" />
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                    Tasks
                  </h2>
                  <span className="text-xs text-white/50">Complete to earn coins</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {tasks.map((task) => {
                    const isCompleted = user.completedTasks.some((ct) => ct.taskId === task.taskId);
                    const isVerifying = verifyingTasks[task.taskId];
                    return (
                      <div
                        key={task.taskId}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="text-xs md:text-sm font-medium text-white/90 pr-2">
                          {task.description}
                        </div>
                        <button
                          type="button"
                          disabled={isCompleted || !!isVerifying}
                          onClick={() => handleTaskClick(task)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-white/10 text-white/40 cursor-default'
                              : isVerifying
                              ? 'bg-[#CCFF00]/20 text-[#CCFF00] cursor-wait'
                              : 'bg-gradient-to-r from-[#CCFF00] to-green-500 text-black hover:opacity-90 shadow-[0_0_12px_rgba(204,255,0,0.3)] cursor-pointer'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              Done
                            </>
                          ) : isVerifying ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {verifyingTasks[task.taskId]}s
                            </>
                          ) : (
                            `+${task.rewardAmount}`
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Card: Referrals */}
            <div className="flex-1 p-[1.5px] rounded-2xl bg-gradient-to-r from-[#CCFF00] via-green-600 to-green-800 shadow-[0_0_25px_rgba(72,187,120,0.22)] flex flex-col">
              <div className="flex-1 bg-[#111116] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#CCFF00] via-green-500 to-green-800" />
                <div>
                  <h2 className="text-lg font-bold text-white">Referrals</h2>
                  <p className="text-xs text-white/60 mt-0.5 mb-4">
                    Invite friends to earn additional color drops.
                  </p>

                  {/* Invite code box */}
                  <div className="p-[1px] rounded-xl bg-gradient-to-r from-[#CCFF00] to-green-600 mb-4">
                    <div className="p-3 bg-black/80 rounded-xl">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">
                        Your Invite Code
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        className="w-full flex items-center justify-between cursor-pointer group"
                      >
                        <span className="font-mono text-xl font-black tracking-widest text-white group-hover:text-[#CCFF00] transition-colors">
                          {user.referralCode}
                        </span>
                        <span className="text-xs font-semibold text-[#CCFF00] flex items-center gap-1">
                          {copiedReferral ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-white/40" /> Copy
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Claim friend code input */}
                {!user.referredBy ? (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white/80">Have a friend&apos;s code?</span>
                      <span className="px-2 py-0.5 rounded bg-[#CCFF00] text-black text-[10px] font-black">
                        +15 COINS
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE (e.g. BLNK-E4F1B3)"
                        value={dashboardRefInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDashboardRefInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]"
                      />
                      <button
                        type="button"
                        disabled={isClaimingRef || !dashboardRefInput.trim()}
                        onClick={handleDashboardClaimReferral}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#CCFF00] to-green-500 text-black text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 cursor-pointer"
                      >
                        {isClaimingRef ? <Loader2 className="w-3 h-3 animate-spin" /> : 'CLAIM'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white/70">Referred By</span>
                      </div>
                      <span className="text-xs font-black font-mono text-[#CCFF00]">{user.referredBy}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              router.push('/marketplace');
            }}
            className="w-full h-16 md:h-20 rounded-2xl text-xl md:text-2xl font-black tracking-widest uppercase text-white bg-gradient-to-r from-[#CCFF00] via-green-600 to-green-800 shadow-[0_0_35px_rgba(72,187,120,0.45)] hover:shadow-[0_0_50px_rgba(204,255,0,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>ENTER COLOUR MARKETPLACE</span>
            <ExternalLink className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Floating Info Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => setActiveModal('about')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-black/80 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold transition-all shadow-xl backdrop-blur-md cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-[#CCFF00]" />
          INFO
        </button>
      </div>

      {/* About Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111116] border border-green-600/60 rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-[0_0_40px_rgba(72,187,120,0.3)] relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-[#CCFF00] to-green-500 bg-clip-text text-transparent mb-6">
              About — The Crypto Bro
            </h3>

            <div className="flex flex-col gap-4 text-sm text-white/80 leading-relaxed">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#CCFF00] mb-1">Origin</h4>
                <p>
                  He remembers when the charts used to be interesting. Now it&apos;s just grey lines on a grey screen, in a room he hasn&apos;t left in a while. Rugged twice. Liquidated once, badly. The losses stopped feeling like losses and started feeling like weather. His world went flat around the same time his portfolio did.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-green-500 mb-1">The Machine</h4>
                <p>
                  There&apos;s a machine he keeps coming back to. A claw, a pile of capsules, no promise except a pull. He pulls anyway. Most of the time, nothing. The grey holds.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#99CC00] mb-1">The Pull</h4>
                <p>
                  Then one hits. The colour doesn&apos;t ease in, it floods. He&apos;d forgotten anything could be this loud. For the first time in longer than he can count, the world isn&apos;t grey.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#CCFF00] mb-1">The Comeback</h4>
                <p>
                  One pull doesn&apos;t undo two rugs and a liquidation. But he pulls again. Not chasing the number anymore. Chasing the feeling of the grey breaking, one capsule at a time.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-2">Colour Machine</h4>
                <p className="text-xs text-white/70 mb-3">
                  Colour has to be earned. Complete tasks, refer friends, fill your coin balance. Use it to operate the claw.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-[#CCFF00]/40">
                    <p className="text-xs font-bold text-[#CCFF00] mb-0.5">GUARANTEED</p>
                    <p className="text-[11px] text-white/60">Your spot is locked, no matter what.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-green-500/40">
                    <p className="text-xs font-bold text-green-400 mb-0.5">FIRST COME FIRST SERVED</p>
                    <p className="text-[11px] text-white/60">Colour is real, but it&apos;s racing the clock.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
