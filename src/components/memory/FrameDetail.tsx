import type { Frame } from "@/types/memory";
import type { Process } from "@/types/process";

interface Props {
  frame: Frame | null;
  processes: Process[];
}

export default function FrameDetail({ frame, processes }: Props) {
  if (!frame) {
    return <div className="text-text-muted text-[9px] lg:text-[10px] italic mt-2">Click a frame to inspect</div>;
  }
  const owner = processes.find(p => p.pid === frame.pid);
  return (
    <div className="mt-2 p-2 rounded-lg bg-white/6 text-[9px] lg:text-[10px] font-mono space-y-0.5">
      <div><span className="text-text-muted">Frame:</span> {frame.id}</div>
      <div><span className="text-text-muted">Owner:</span> {frame.pid !== null ? `PID ${frame.pid}${owner ? ` (${owner.state})` : ""}` : "Free"}</div>
      {frame.pid !== null && (
        <>
          <div><span className="text-text-muted">Logical Page:</span> {Math.floor(frame.id / 4)}</div>
          <div><span className="text-text-muted">Offset:</span> {frame.id * 1024}–{(frame.id + 1) * 1024 - 1}</div>
          {owner && owner.pageTable.length > 0 && (
            <div className="mt-2">
              <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Page Table (PID {owner.pid})</div>
              <table className="w-full text-[8px] lg:text-[9px] font-mono">
                <thead>
                  <tr className="text-text-muted">
                    <th className="text-left pr-2">Page</th>
                    <th className="text-left pr-2">Frame</th>
                    <th className="text-left">P</th>
                  </tr>
                </thead>
                <tbody>
                  {owner.pageTable.map(pte => (
                    <tr key={pte.logicalPage} className="border-t border-white/5">
                      <td className="pr-2 py-0.5">{pte.logicalPage}</td>
                      <td className="pr-2 py-0.5">{pte.frameNum}</td>
                      <td className="py-0.5">{pte.present ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
