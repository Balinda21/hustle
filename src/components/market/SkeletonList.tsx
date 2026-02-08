export default function SkeletonList() {
  return (
    <div className="py-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center py-3 px-4">
            {/* Left */}
            <div className="flex items-center flex-1 min-w-[100px]">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] animate-shimmer" />
              <div className="ml-3 flex flex-col gap-1.5">
                <div className="w-[70px] h-3 rounded-md bg-[#2A2A2A] animate-shimmer" />
                <div className="w-[45px] h-2.5 rounded-md bg-[#2A2A2A] animate-shimmer" />
              </div>
            </div>
            {/* Sparkline */}
            <div className="flex-1 h-[30px] rounded-md bg-[#2A2A2A] mx-3 animate-shimmer" />
            {/* Right */}
            <div className="flex flex-col items-end min-w-[80px] gap-1.5">
              <div className="w-[60px] h-3 rounded-md bg-[#2A2A2A] animate-shimmer" />
              <div className="w-[45px] h-2.5 rounded-md bg-[#2A2A2A] animate-shimmer" />
            </div>
          </div>
          {i < 7 && <div className="h-px bg-[#2A2A2A] mx-4" />}
        </div>
      ))}
    </div>
  );
}
