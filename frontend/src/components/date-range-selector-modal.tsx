"use client";

import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { formatIntentDate } from "@/lib/rental-intent";

interface DateRangeSelectorModalProps {
  open: boolean;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
  onApply: (range: { startDate: string; endDate: string }) => void;
  title?: string;
}

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInputDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function MonthCalendar({
  month,
  draftStart,
  draftEnd,
  today,
  onSelect,
}: {
  month: Date;
  draftStart: Date | null;
  draftEnd: Date | null;
  today: Date;
  onSelect: (day: Date) => void;
}) {
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  return (
    <div className="rounded-[1.75rem] bg-white p-4 sm:p-6">
      <h3 className="text-center text-base font-bold text-slate-950">{format(month, "MMMM yyyy")}</h3>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday) => (
          <div key={weekday} className="pb-2 text-xs font-semibold text-slate-500">
            {weekday}
          </div>
        ))}
        {days.map((day) => {
          const disabled = isBefore(day, today);
          const outsideMonth = !isSameMonth(day, month);
          const isStart = draftStart ? isSameDay(day, draftStart) : false;
          const isEnd = draftEnd ? isSameDay(day, draftEnd) : false;
          const inRange =
            draftStart && draftEnd
              ? isWithinInterval(day, { start: draftStart, end: draftEnd })
              : false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={cn(
                "relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition sm:h-11",
                outsideMonth ? "text-slate-300" : "text-slate-950",
                disabled && "cursor-not-allowed text-slate-300 opacity-60",
                inRange && !isStart && !isEnd && "rounded-none bg-lime-200/75 text-slate-950",
                isStart && "bg-lime-400 text-slate-950 shadow-[0_10px_24px_rgba(132,204,22,0.32)]",
                isEnd && "bg-lime-400 text-slate-950 shadow-[0_10px_24px_rgba(132,204,22,0.32)]",
                !disabled && !inRange && !isStart && !isEnd && "hover:bg-slate-100",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangeSelectorModal({
  open,
  startDate,
  endDate,
  onClose,
  onApply,
  title = "Select your Dates",
}: DateRangeSelectorModalProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseDate(startDate) || today));
  const [draftStart, setDraftStart] = useState<Date | null>(() => parseDate(startDate));
  const [draftEnd, setDraftEnd] = useState<Date | null>(() => parseDate(endDate));

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const rentalDays =
    draftStart && draftEnd && isAfter(draftEnd, draftStart)
      ? differenceInCalendarDays(draftEnd, draftStart)
      : 0;
  const canApply = Boolean(draftStart && draftEnd && isAfter(draftEnd, draftStart));

  function selectDay(day: Date) {
    const selected = startOfDay(day);
    if (isBefore(selected, today)) return;
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }
    if (isBefore(selected, draftStart) || isSameDay(selected, draftStart)) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }
    setDraftEnd(selected);
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto my-6 w-full max-w-7xl rounded-[2rem] bg-slate-50 p-4 shadow-2xl sm:my-10 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm transition hover:bg-slate-100"
            aria-label="Close date selector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-bold text-slate-900">Delivery Date</p>
                <div className="flex h-14 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 shadow-sm">
                  <CalendarDays className="h-5 w-5 text-slate-600" />
                  {formatIntentDate(draftStart ? toInputDate(draftStart) : undefined) || "Choose date"}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-900">Pickup Date</p>
                <div className="flex h-14 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-950 shadow-sm">
                  <CalendarDays className="h-5 w-5 text-slate-600" />
                  {formatIntentDate(draftEnd ? toInputDate(draftEnd) : undefined) || "Choose date"}
                </div>
              </div>
            </div>

            <div className="flex gap-3 rounded-[1.5rem] bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-950">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <p>
                Pick delivery and pickup dates before searching. We only charge for the rental days
                between those dates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Your Rental Period:</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-5xl font-black tabular-nums text-slate-950">
                  {String(rentalDays || 0).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Days</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {draftStart && draftEnd
                      ? `${formatIntentDate(toInputDate(draftStart))} - ${formatIntentDate(toInputDate(draftEnd))}`
                      : "Select a date range"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 p-5 !text-white">
              <p className="text-2xl font-black italic text-lime-300">Save more with us!</p>
              <p className="mt-5 text-sm font-semibold text-slate-100">
                Longer rental periods unlock better owner responses and make pickup coordination easier.
              </p>
            </div>

            <button
              type="button"
              disabled={!canApply}
              onClick={() => {
                if (!draftStart || !draftEnd) return;
                onApply({ startDate: toInputDate(draftStart), endDate: toInputDate(draftEnd) });
                onClose();
              }}
              className="h-14 w-full rounded-full bg-blue-700 text-base font-bold !text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>

          <div className="rounded-[2rem] bg-white/80 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-950"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-950"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {[visibleMonth, addMonths(visibleMonth, 1)].map((month) => (
                <MonthCalendar
                  key={month.toISOString()}
                  month={month}
                  draftStart={draftStart}
                  draftEnd={draftEnd}
                  today={today}
                  onSelect={selectDay}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
