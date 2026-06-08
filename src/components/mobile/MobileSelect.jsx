import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/**
 * MobileSelect — on mobile (<640px) opens as a bottom-sheet Drawer.
 * On desktop falls back to a floating dropdown.
 *
 * Props:
 *   value, onValueChange, placeholder, options: [{value, label}], className
 */
export default function MobileSelect({ value, onValueChange, placeholder = "Select...", options = [], className = "" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white hover:bg-white/10 transition-colors"
      >
        <span className={selected ? "text-white" : "text-gray-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {/* Mobile: bottom-sheet */}
      {isMobile && (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="bg-[#0d1220] border-t border-white/10">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-sm text-gray-400">{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-sm transition-colors ${
                    opt.value === value
                      ? "bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "text-gray-200 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                  {opt.value === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Desktop: floating dropdown */}
      {!isMobile && open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-1 left-0 w-full min-w-[160px] bg-[#1a2235] border border-white/10 rounded-lg shadow-xl overflow-hidden">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                  opt.value === value
                    ? "bg-[#00d4ff]/10 text-[#00d4ff]"
                    : "text-gray-200 hover:bg-white/5"
                }`}
              >
                {opt.label}
                {opt.value === value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}