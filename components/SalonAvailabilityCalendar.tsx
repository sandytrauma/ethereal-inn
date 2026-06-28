"use client";

import React, { useState, useTransition } from "react";
import { format, addDays, startOfToday, setHours } from "date-fns";
import { createNewTimeSlotBooking } from "@/lib/actions/salon-appointments";
import { useRouter } from "next/navigation";

export default function PublicAppointmentCalendar({ 
  clientId, 
  existingAppointments 
}: { 
  clientId: number, 
  existingAppointments: any[] 
}) {
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Operating Hours: 10 AM to 7 PM
  const hours = Array.from({ length: 10 }, (_, i) => 10 + i);

  const isSlotBooked = (hour: number) => {
    return existingAppointments.some(app => {
      const appDate = new Date(app.startTime);
      return appDate.getHours() === hour && 
             format(appDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    });
  };

  const handleBooking = async (hour: number) => {
    startTransition(async () => {
      const result = await createNewTimeSlotBooking({
        clientId,
        targetDate: format(selectedDate, 'yyyy-MM-dd'),
        hour: hour,
        notes: "Public portal booking"
      });

      if (result.success) {
        alert("Booking locked!");
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold text-amber-600">Salon Availability</h1>
        <h2 className="text-lg font-bold text-slate-100">{format(selectedDate, 'MMMM d, yyyy')}</h2>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="text-xs text-pink-400 font-bold">Next Day &rarr;</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {hours.map((hour) => {
          const booked = isSlotBooked(hour);
          return (
            <button
              key={hour}
              disabled={booked || isPending}
              onClick={() => handleBooking(hour)}
              className={`p-3 rounded-xl border text-center transition ${
                booked 
                  ? "bg-slate-800/50 border-slate-700 opacity-40 cursor-not-allowed" 
                  : "bg-pink-950/20 border-pink-500/30 hover:bg-pink-950/40 cursor-pointer text-white"
              }`}
            >
              <p className="text-xs font-bold">{format(setHours(selectedDate, hour), 'h:mm a')}</p>
              <p className="text-[10px] opacity-70">{booked ? "Reserved" : "Available"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}