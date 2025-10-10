import moment from "moment-timezone";
import { CalendarEvent, ScoredMeetingSlot, RankedSlot } from "@/types/types";

export function hasConflict(
  event: { startUTC?: string; endUTC?: string },
  existingMeetings: Array<{ start_time: string }>
): boolean {
  if (!event.startUTC || !event.endUTC) {
    return false;
  }

  const eventStart = moment.utc(event.startUTC);
  const eventEnd = moment.utc(event.endUTC);

  return existingMeetings.some((meeting) => {
    const meetingStart = moment.utc(meeting.start_time);
    const meetingEnd = moment.utc(meeting.start_time).add(1, "hour");
    return eventStart.isBefore(meetingEnd) && meetingStart.isBefore(eventEnd);
  });
}
export function filterAvailableEvents(
  calendarEvents: CalendarEvent[],
  existingMeetings: Array<{ start_time: string }> | null
): CalendarEvent[] {
  if (!existingMeetings || existingMeetings.length === 0) {
    return calendarEvents;
  }

  return calendarEvents.filter(
    (event) => !hasConflict(event, existingMeetings)
  );
}

interface UserData {
  time_zone?: string;
  chronotype?: string;
}

export function prepareUserForRanking(
  userId: string,
  userData: UserData
): { user_id: string; timezone: string; chronotype: string } {
  return {
    user_id: userId,
    timezone: userData.time_zone || "America/Los_Angeles",
    chronotype: userData.chronotype || "early_bird",
  };
}

export function prepareSlotsForRanking(
  events: CalendarEvent[]
): Array<{ startUTC: string; endUTC: string }> {
  return events.map((event) => ({
    startUTC: event.startUTC || "",
    endUTC: event.endUTC || "",
  }));
}

export function markBestMeetingSlot(
  events: CalendarEvent[],
  bestSlot: ScoredMeetingSlot | null
): CalendarEvent[] {
  if (!bestSlot) return events;

  return events.map((event) => {
    if (
      event.startUTC === bestSlot.startUTC &&
      event.endUTC === bestSlot.endUTC
    ) {
      return {
        ...event,
        score: bestSlot.score,
        resource: {
          ...(event.resource || {}),
          available: true,
          isBestSlot: true,
          score: bestSlot.score,
        },
      };
    }

    return {
      ...event,
      resource: {
        ...(event.resource || {}),
        available: true,
        isBestSlot: false,
      },
    };
  });
}

export function markTopMeetingSlots(
  events: CalendarEvent[],
  topSlots: RankedSlot[] | ScoredMeetingSlot[],
  numSlots: number = 5
): CalendarEvent[] {
  if (!topSlots || topSlots.length === 0) return events;

  const moment = require("moment-timezone");

  const idealGapMinutes = 16 * 60;
  const gapTolerance = 2 * 60;

  const optimalMeetings: ScoredMeetingSlot[] = [];

  const firstBestSlot = [...topSlots].sort((a, b) => b.score - a.score)[0];
  if (firstBestSlot) {
    optimalMeetings.push(firstBestSlot);
  }

  const findNextOptimalSlot = (
    lastSlot: ScoredMeetingSlot,
    remainingSlots: ScoredMeetingSlot[]
  ): ScoredMeetingSlot | null => {
    const lastSlotEnd = moment.utc(lastSlot.endUTC);
    const targetStartTime = lastSlotEnd.clone().add(idealGapMinutes, "minutes");

    const scoredSlots = remainingSlots.map((slot) => {
      const slotStart = moment.utc(slot.startUTC);
      const gapDiff = Math.abs(slotStart.diff(targetStartTime, "minutes"));
      const gapScore =
        gapDiff <= gapTolerance
          ? 1
          : Math.max(0, 1 - (gapDiff - gapTolerance) / (24 * 60));

      return {
        slot,
        gapScore,
        combinedScore: 0.7 * gapScore + 0.3 * slot.score,
      };
    });

    scoredSlots.sort((a, b) => b.combinedScore - a.combinedScore);

    return scoredSlots.length > 0 ? scoredSlots[0].slot : null;
  };

  let remainingSlots = [
    ...topSlots.filter(
      (slot) =>
        slot.startUTC !== firstBestSlot.startUTC ||
        slot.endUTC !== firstBestSlot.endUTC
    ),
  ];

  while (optimalMeetings.length < numSlots && remainingSlots.length > 0) {
    const lastSelectedSlot = optimalMeetings[optimalMeetings.length - 1];
    const nextSlot = findNextOptimalSlot(lastSelectedSlot, remainingSlots);

    if (nextSlot) {
      optimalMeetings.push(nextSlot);
      remainingSlots = remainingSlots.filter(
        (slot) =>
          slot.startUTC !== nextSlot.startUTC || slot.endUTC !== nextSlot.endUTC
      );
    } else {
      break;
    }
  }

  return events.map((event) => {
    const matchingSlotIndex = optimalMeetings.findIndex(
      (slot) => event.startUTC === slot.startUTC && event.endUTC === slot.endUTC
    );

    if (matchingSlotIndex !== -1) {
      const rank = matchingSlotIndex + 1;
      const matchingSlot = optimalMeetings[matchingSlotIndex];

      return {
        ...event,
        score: matchingSlot.score,
        title: `#${rank}`,
        resource: {
          ...(event.resource || {}),
          available: true,
          isBestSlot: true,
          score: matchingSlot.score,
          rank: rank,
        },
      };
    }

    return {
      ...event,
      resource: {
        ...(event.resource || {}),
        available: true,
        isBestSlot: false,
      },
    };
  });
}
