export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="rounded-[28px] border border-white/70 bg-card/80 p-8 text-center text-sm text-muted-foreground shadow-paper">
    {label}
  </div>
);

