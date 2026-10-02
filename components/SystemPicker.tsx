"use client";

import { useState } from "react";

type Sys = { id: string; name: string; department: string | null };

/** 대상 시스템 다중 선택 (전체 선택 지원). name="systemIds" 체크박스로 전송됩니다. */
export function SystemPicker({ systems }: { systems: Sys[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  if (systems.length === 0) {
    return <p className="text-sm text-slate-500">선택할 수 있는 시스템이 없습니다.</p>;
  }
  const all = selected.size === systems.length;
  return (
    <div className="rounded-md border border-slate-200">
      <label className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={all}
          onChange={() => setSelected(all ? new Set() : new Set(systems.map((s) => s.id)))}
        />
        전체 선택 ({selected.size}/{systems.length})
      </label>
      <div className="grid max-h-72 gap-1 overflow-y-auto p-3 sm:grid-cols-2">
        {systems.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="systemIds"
              value={s.id}
              checked={selected.has(s.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(s.id);
                else next.delete(s.id);
                setSelected(next);
              }}
            />
            <span>{s.name}</span>
            {s.department && <span className="text-xs text-slate-500">{s.department}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
