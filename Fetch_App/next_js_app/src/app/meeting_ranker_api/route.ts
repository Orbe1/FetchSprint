import { NextResponse } from "next/server";
import { rankSlots } from "@/app/lib/rankSlots";
import {
  ExistingMeeting,
  DatabaseMeeting,
  MeetingRankerRequestBody,
} from "@/types/types";

export async function POST(req: Request) {
  const body = (await req.json()) as MeetingRankerRequestBody;
  const { user1, user2, slots, existingMeetings } = body;

  if (!slots?.length) return NextResponse.json({ top_slots: [] });

  if (existingMeetings) {
    const user1Meetings = existingMeetings.filter(
      (meeting: DatabaseMeeting) =>
        meeting.host_id === user1.user_id || meeting.guest_id === user1.user_id
    );

    const user2Meetings = existingMeetings.filter(
      (meeting: DatabaseMeeting) =>
        meeting.host_id === user2.user_id || meeting.guest_id === user2.user_id
    );

    if (user1Meetings.length > 0) {
      user1.existingMeetings = user1Meetings.map(
        (meeting: DatabaseMeeting): ExistingMeeting => ({
          startUTC: meeting.start_time,
          endUTC: new Date(
            new Date(meeting.start_time).getTime() + 60 * 60 * 1000
          ).toISOString(),
        })
      );
    }

    if (user2Meetings.length > 0) {
      user2.existingMeetings = user2Meetings.map(
        (meeting: DatabaseMeeting): ExistingMeeting => ({
          startUTC: meeting.start_time,
          endUTC: new Date(
            new Date(meeting.start_time).getTime() + 60 * 60 * 1000
          ).toISOString(),
        })
      );
    }
  }

  const ranked = rankSlots(user1, user2, slots);
  return NextResponse.json({
    top_slots: ranked,
  });
}
