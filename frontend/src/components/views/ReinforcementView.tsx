import { useEffect, useState } from 'react';
import { Target, TrendingUp, ShieldAlert, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ReinforcementView() {
  const [playState, setPlayState] = useState(0);

  // Self-looping animation timer
  useEffect(() => {
    setPlayState(0);
    const interval = setInterval(() => {
      setPlayState((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animation cycle progress 0 to 1
  const cycleDuration = 100; // 5 seconds (50ms * 100)
  const progress = playState / cycleDuration;
  
  // Ease out cubic
  const eased = 1 - Math.pow(1 - progress, 3);

  const policyRows = [
    { label: 'Guided Tutorial', old: 18, new: 12 },
    { label: 'Proactive Nudge', old: 42, new: 71 },
    { label: 'Human Handoff', old: 25, new: 11 },
    { label: 'Incentive / Discount', old: 15, new: 6 },
  ];

  // SVG Path for Reward Curve
  const rewardPath = "M0,80 Q20,70 40,65 T80,50 T120,40 T160,30 T200,10 T240,5 T280,0";
  // The path length is roughly 300, we animate dashoffset from 300 to 0
  const pathLength = 300;
  const currentDashoffset = pathLength * (1 - eased);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          Reinforcement Learning: Policy Improvement
        </h2>
        <p className="text-sm text-slate-400">
          Learned from 2,400 past interventions: what worked to stop churn, and what the policy just improved.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Column */}
        <div className="flex flex-col space-y-6">
          
          {/* Reward per episode Chart */}
          <div className="card flex flex-col p-5 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Reward per episode</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">Episode #2401</span>
            </div>
            
            <div className="relative h-32 w-full mt-2">
              <svg viewBox="0 0 280 80" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(255, 183, 3)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(255, 183, 3)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Area fill */}
                <path 
                  d={`${rewardPath} L280,80 L0,80 Z`} 
                  fill="url(#rewardGrad)" 
                  style={{ opacity: eased * 0.8 }}
                />
                {/* Line stroke */}
                <path 
                  d={rewardPath} 
                  fill="none" 
                  stroke="#ffb703" 
                  strokeWidth="2"
                  strokeDasharray={pathLength}
                  strokeDashoffset={currentDashoffset}
                  filter="url(#glow)"
                />
                {/* Dot at end */}
                <circle 
                  cx="280" 
                  cy="0" 
                  r="4" 
                  fill="#ffb703" 
                  filter="url(#glow)"
                  style={{ opacity: eased > 0.95 ? (1 - (1-eased)*20) : 0 }} 
                />
              </svg>
            </div>
          </div>

          {/* Past 24 similar customers */}
          <div className="card flex flex-col p-5 relative overflow-hidden group">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-4">Past 24 similar customers: outcome</h3>
            <div className="flex items-end justify-between h-20 gap-1 mt-auto">
              {Array.from({ length: 24 }).map((_, i) => {
                // Preset sequence of wins/losses based on index
                const isSuccess = [0,2,3,5,6,7,9,11,12,14,15,17,19,20,22,23].includes(i);
                const height = 30 + Math.sin(i * 1.5) * 20 + Math.random() * 20;
                
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div 
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-300",
                        isSuccess 
                          ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" 
                          : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                      )}
                      style={{ 
                        height: `${height}%`,
                        opacity: progress * 24 > i ? 1 : 0.1
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-mono">
              <span>t-24</span>
              <span>latest</span>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col space-y-6">
          
          {/* Suggested Next Action */}
          <div className="card flex flex-col p-6 relative overflow-hidden group border-cyan-500/30 bg-cyan-950/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            
            <div className="flex justify-between items-center mb-5">
              <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Suggested next action
              </span>
              <span className="text-xs font-mono font-medium text-cyan-100 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                71% confidence
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-300">
                <ChevronRight className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Proactive Nudge</h3>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed mt-2">
              Based on this customer's behavior cluster, a proactive nudge outperforms other interventions. 
              <strong className="text-cyan-100 font-medium px-1">340 similar past cases</strong> saw churn drop by 
              <strong className="text-cyan-400 font-mono ml-1 shadow-[0_0_10px_rgba(34,211,238,0.4)]">34%</strong> vs. 11% for a generic guided tutorial.
            </p>
          </div>

          {/* Policy Re-weighting */}
          <div className="card flex flex-col flex-1 p-5 relative overflow-hidden group">
            <h3 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Policy re-weighting this cycle
            </h3>
            
            <div className="flex flex-col gap-5 justify-center flex-1">
              {policyRows.map((row) => {
                const currentAnimatedVal = row.old + (row.new - row.old) * eased;
                const isWinner = row.new > row.old;
                
                return (
                  <div key={row.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className={cn("font-medium", isWinner ? "text-slate-200" : "text-slate-400")}>
                        {row.label}
                      </span>
                      <span className={cn("font-mono", isWinner ? "text-pulse-400" : "text-slate-500")}>
                        {currentAnimatedVal.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                      {/* Old baseline bar */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-slate-700/50 rounded-full"
                        style={{ width: `${row.old}%` }}
                      />
                      {/* New animated bar */}
                      <div 
                        className={cn(
                          "absolute top-0 left-0 h-full rounded-full transition-all duration-75",
                          isWinner 
                            ? "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" 
                            : "bg-slate-600"
                        )}
                        style={{ width: `${currentAnimatedVal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
