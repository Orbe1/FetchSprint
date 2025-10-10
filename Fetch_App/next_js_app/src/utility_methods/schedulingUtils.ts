import moment from "moment-timezone";
import { CalendarEvent } from "@/types/types";

moment.tz.add([
  "America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0",
  "America/Denver|MST MDT|70 60|0101|1Lzm0 1zb0 Op0",
  "America/Chicago|CST CDT|60 50|0101|1Lzm0 1zb0 Op0",
  "America/New_York|EST EDT|50 40|0101|1Lzm0 1zb0 Op0",
  "America/Halifax|AST ADT|40 30|0101|1Lzm0 1zb0 Op0",
  "Pacific/Honolulu|HST|a0|0|",
  "America/Anchorage|AKST AKDT|90 80|0101|1Lzm0 1zb0 Op0",
]);

const timezoneMapping: { [key: string]: string } = {
  "Pacific Time (PT)": "America/Los_Angeles",
  "Mountain Time (MT)": "America/Denver",
  "Central Time (CT)": "America/Chicago",
  "Eastern Time (ET)": "America/New_York",
  "Atlantic Time (AT)": "America/Halifax",
  "Hawaii Time (HT)": "Pacific/Honolulu",
  "Alaska Time (AKT)": "America/Anchorage",
};

export function getIANATimezone(tz: string): string {
  return timezoneMapping[tz] || tz;
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

export function findOverlap(slot1: string, slot2: string): string | null {
  const [start1, end1] = slot1.split(" - ").map(timeToMinutes);
  const [start2, end2] = slot2.split(" - ").map(timeToMinutes);

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapStart < overlapEnd) {
    return `${minutesToTime(overlapStart)} - ${minutesToTime(overlapEnd)}`;
  }

  return null;
}

export function findOverlappingTimeSlots(
  hostSlots: string[],
  targetSlots: string[]
): string[] {
  const overlappingSlots = [];

  for (const hostSlot of hostSlots) {
    for (const targetSlot of targetSlots) {
      const overlap = findOverlap(hostSlot, targetSlot);
      if (overlap) {
        overlappingSlots.push(overlap);
      }
    }
  }
  return overlappingSlots;
}

export function convertToCalendarEvents(
  timeSlots: string[],
  userTimeZone: string
): CalendarEvent[] {
  const events = [];
  const startDate = new Date();

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);

  const timezone = getIANATimezone(userTimeZone);

  for (
    let day = new Date(startDate);
    day <= endDate;
    day.setDate(day.getDate() + 1)
  ) {
    for (const slot of timeSlots) {
      const [startTime, endTime] = slot.split(" - ");
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const utcStart = moment.utc({
        year: day.getFullYear(),
        month: day.getMonth(),
        date: day.getDate(),
        hour: startHours,
        minute: startMinutes,
        second: 0,
        millisecond: 0,
      });
      const utcEnd = moment.utc({
        year: day.getFullYear(),
        month: day.getMonth(),
        date: day.getDate(),
        hour: endHours,
        minute: endMinutes,
        second: 0,
        millisecond: 0,
      });

      const localStart = utcStart.clone().tz(timezone);
      const localEnd = utcEnd.clone().tz(timezone);

      // eslint-disable-next-line prefer-const
      let slotStart = localStart.clone();

      while (
        slotStart.isBefore(localEnd) &&
        slotStart.clone().add(1, "hour").isSameOrBefore(localEnd)
      ) {
        const slotEnd = slotStart.clone().add(1, "hour");

        const formattedStartTime = slotStart.format("h:mm A");
        const formattedEndTime = slotEnd.format("h:mm A");

        const slotStartUTC = slotStart.clone().utc();
        const slotEndUTC = slotEnd.clone().utc();

        const startDate = slotStart.toDate();
        const endDate = slotEnd.toDate();

        events.push({
          start: startDate,
          end: endDate,
          startUTC: slotStartUTC.format(),
          endUTC: slotEndUTC.format(),
          displayStartHour: slotStart.hour(),
          displayEndHour: slotEnd.hour(),
          displayTime: `${formattedStartTime} - ${formattedEndTime}`,
          resource: { available: true },
        });

        slotStart.add(1, "hour");
      }
    }
  }

  return events;
}
