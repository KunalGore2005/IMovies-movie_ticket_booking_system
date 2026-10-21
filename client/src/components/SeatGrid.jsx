import React from 'react';
import { Armchair, Check, Ban } from 'lucide-react';

const SeatGrid = ({
  seats = {},
  selectedSeats = [],
  onSeatToggle = () => {},
  maxSelectable = 10,
}) => {
  const seatEntries = Object.entries(seats);

  // Group seats by tier
  const tiers = {
    balcony: [],
    middle: [],
    lower: [],
    other: [],
  };

  seatEntries.forEach(([code, data]) => {
    const seatObj =
      typeof data === 'object' && data !== null
        ? data
        : { seatNumber: code, tier: 'middle', price: 0, status: data };

    const tierKey = (seatObj.tier || '').toLowerCase();
    if (tiers[tierKey]) {
      tiers[tierKey].push({ code, ...seatObj });
    } else {
      tiers.other.push({ code, ...seatObj });
    }
  });

  // Sort seats within each tier by code for consistent grid order
  const sortSeats = (list) => {
    return list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
  };

  const balconySeats = sortSeats(tiers.balcony);
  const middleSeats = sortSeats(tiers.middle);
  const lowerSeats = sortSeats(tiers.lower);

  const getTierPrice = (tierList) => {
    if (tierList.length > 0 && tierList[0].price) {
      return tierList[0].price;
    }
    return null;
  };

  const renderSeat = (seat) => {
    const isBooked =
      seat.status === 'booked' ||
      (typeof seat.status === 'string' && seat.status !== 'available');
    const isSelected = selectedSeats.includes(seat.code);

    let tierColors = 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-500';
    if (seat.tier === 'balcony') {
      tierColors = 'border-amber-400/70 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 hover:border-amber-400';
    } else if (seat.tier === 'middle') {
      tierColors = 'border-sky-400/70 dark:border-sky-500/50 text-sky-600 dark:text-sky-400 hover:border-sky-400';
    }

    if (isSelected) {
      return (
        <button
          key={seat.code}
          type="button"
          onClick={() => onSeatToggle(seat.code)}
          aria-label={`Seat ${seat.code}, selected, $${seat.price}`}
          className="relative group p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-600/30 scale-105 transition-all flex flex-col items-center justify-center min-w-[38px] h-10 font-bold text-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-tighter">{seat.code}</span>
        </button>
      );
    }

    if (isBooked) {
      return (
        <div
          key={seat.code}
          title={`Seat ${seat.code} is already booked`}
          aria-label={`Seat ${seat.code}, booked`}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex flex-col items-center justify-center min-w-[38px] h-10 text-xs opacity-60"
        >
          <Ban className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-tighter">{seat.code}</span>
        </div>
      );
    }

    return (
      <button
        key={seat.code}
        type="button"
        onClick={() => onSeatToggle(seat.code)}
        aria-label={`Seat ${seat.code}, available, $${seat.price}`}
        className={`p-2 rounded-xl border bg-white dark:bg-slate-900 ${tierColors} hover:scale-105 transition-all flex flex-col items-center justify-center min-w-[38px] h-10 text-xs font-semibold shadow-xs`}
      >
        <Armchair className="w-3.5 h-3.5" />
        <span className="text-[10px] tracking-tighter">{seat.code}</span>
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-6">
      
      {/* Cinema Screen Indicator */}
      <div className="w-full max-w-2xl flex flex-col items-center mb-10">
        <div className="relative w-full h-8 overflow-hidden flex items-center justify-center">
          <div className="w-3/4 h-12 border-t-4 border-rose-500/60 rounded-[100%] shadow-[0_-12px_24px_rgba(244,63,94,0.25)]"></div>
        </div>
        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 dark:text-slate-500 mt-1">
          Cinema Screen — All Eyes Front
        </span>
      </div>

      {/* Seat Layout Sections */}
      <div className="w-full max-w-3xl space-y-8 px-4">
        
        {/* Balcony Tier */}
        {balconySeats.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-500/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                  Balcony (VIP)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Prime Viewing Angle</span>
              </div>
              {getTierPrice(balconySeats) !== null && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  ${getTierPrice(balconySeats)} / seat
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {balconySeats.map(renderSeat)}
            </div>
          </div>
        )}

        {/* Middle Tier */}
        {middleSeats.length > 0 && (
          <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-500/5 border border-sky-500/20">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-sky-500/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500 text-white">
                  Middle (Executive)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Balanced Surround Sound</span>
              </div>
              {getTierPrice(middleSeats) !== null && (
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  ${getTierPrice(middleSeats)} / seat
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {middleSeats.map(renderSeat)}
            </div>
          </div>
        )}

        {/* Lower Tier */}
        {lowerSeats.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-500/5 dark:bg-slate-500/5 border border-slate-500/20">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-500/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-600 text-white">
                  Lower (Standard)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Closest to Action</span>
              </div>
              {getTierPrice(lowerSeats) !== null && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  ${getTierPrice(lowerSeats)} / seat
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {lowerSeats.map(renderSeat)}
            </div>
          </div>
        )}

      </div>

      {/* Seat Map Legend */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-rose-600 to-amber-500 shadow-sm flex items-center justify-center text-white">
            <Check className="w-3 h-3" />
          </div>
          <span className="font-semibold text-rose-600 dark:text-rose-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 opacity-60 flex items-center justify-center text-slate-500">
            <Ban className="w-3 h-3" />
          </div>
          <span>Booked / Reserved</span>
        </div>
      </div>

    </div>
  );
};

export default SeatGrid;
