export function NeuralView() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-950">
      <iframe 
        src="/neural_network.html?v=1" 
        className="w-full flex-1 border-0" 
        title="Neural Network Reinforcement Sandbox" 
      />
    </div>
  );
}
