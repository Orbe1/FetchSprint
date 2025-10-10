import moment from "moment-timezone";
import {
  Chronotype,
  MeetingUser as User,
  ExistingMeeting as ExistingMeeting,
  MeetingSlot as Slot,
  RankedSlot,
} from "@/types/types";

function scoreTimeGap(startUTC: string, nowMS = Date.now()): number {
  const halfLife = 3 * 24 * 60;
  const maxWindow = 14 * 24 * 60;
  const leadMin = (Date.parse(startUTC) - nowMS) / 60000;
  if (leadMin <= 0 || leadMin > maxWindow) return 0;
  return Math.exp((-leadMin * Math.log(2)) / halfLife);
}

function getChronotypeScore(chronotype: Chronotype, hour: number): number {
  if (chronotype === "early_bird") {
    const dist = Math.abs(hour - 9);
    return hour >= 6 && hour < 12 ? Math.max(0, 1 - dist / 3) : 0;
  }
  if (chronotype === "night_owl") {
    const dist = Math.abs(hour - 21);
    return hour >= 19 && hour < 24 ? Math.max(0, 1 - dist / 2) : 0;
  }
  return 0;
}

function scoreChronotype(user1: User, user2: User, startUTC: string): number {
  const hour1 = moment.utc(startUTC).tz(user1.timezone).hour();
  const hour2 = moment.utc(startUTC).tz(user2.timezone).hour();
  const chronotypeScore1 = getChronotypeScore(user1.chronotype, hour1);
  const chronotypeScore2 = getChronotypeScore(user2.chronotype, hour2);
  let base = (chronotypeScore1 + chronotypeScore2) / 2;
  if (chronotypeScore1 >= 0.9 && chronotypeScore2 >= 0.9)
    base = Math.min(1, base + 0.1);
  return base;
}

function scoreDensity(slot: Slot, u1: User, u2: User): number {
  if (!u1.existingMeetings && !u2.existingMeetings) {
    return 0.5;
  }

  const bothUsersExistingMeetings: ExistingMeeting[] = [
    ...(u1.existingMeetings || []),
    ...(u2.existingMeetings || []),
  ];

  if (bothUsersExistingMeetings.length === 0) {
    return 1.0;
  }

  const proposedStart = moment.utc(slot.startUTC);
  const proposedEnd = moment.utc(slot.endUTC);

  let minBefore = Number.MAX_SAFE_INTEGER;
  let minAfter = Number.MAX_SAFE_INTEGER;

  bothUsersExistingMeetings.forEach((meeting) => {
    const meetingStart = moment.utc(meeting.startUTC);
    const meetingEnd = moment.utc(meeting.endUTC);

    if (proposedStart.isSame(meetingStart) && proposedEnd.isSame(meetingEnd)) {
      return;
    }

    if (meetingEnd.isBefore(proposedStart)) {
      const gap = proposedStart.diff(meetingEnd, "minutes");
      minBefore = Math.min(minBefore, gap);
    }

    if (meetingStart.isAfter(proposedEnd)) {
      const gap = meetingStart.diff(proposedEnd, "minutes");
      minAfter = Math.min(minAfter, gap);
    }
  });

  if (minBefore === Number.MAX_SAFE_INTEGER) minBefore = 480;
  if (minAfter === Number.MAX_SAFE_INTEGER) minAfter = 480;

  minBefore = Math.min(minBefore, 240);
  minAfter = Math.min(minAfter, 240);

  const idealGap = 960;

  const calculateGapScore = (gap: number): number => {
    if (gap < idealGap) {
      return Math.pow(gap / idealGap, 2) * 0.8;
    } else {
      return Math.max(0, 1 - (gap - idealGap) / 960);
    }
  };

  const beforeScore = calculateGapScore(minBefore);
  const afterScore = calculateGapScore(minAfter);

  return (beforeScore + afterScore) / 2;
}

export function rankSlots(u1: User, u2: User, slots: Slot[]): RankedSlot[] {
  return slots
    .map((meeting_slot) => {
      const timegap_score = scoreTimeGap(meeting_slot.startUTC);
      const chronotype_score = scoreChronotype(u1, u2, meeting_slot.startUTC);
      const density_score = scoreDensity(meeting_slot, u1, u2);

      const score =
        0.4 * timegap_score + 0.3 * chronotype_score + 0.3 * density_score;

      return {
        ...meeting_slot,
        score,
        components: {
          time_gap: timegap_score,
          chronotype: chronotype_score,
          density: density_score,
        },
      };
    })
    .sort((a, b) => (b.score + a.score) / 2);
}
