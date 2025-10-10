"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment-timezone";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "@/app/utils/supabase/client";
import { getAuthUser } from "@/utility_methods/userUtils";
import MeetingDetailsModal from "./MeetingDetailsModal";
import {
  Meeting,
  CalendarMeeting,
  CalendarUser,
  RankedCalendarEvent,
} from "@/types/types";
import MeetingConfirmationModal from "../schedule_meeting/MeetingConfirmationModal";
import {
  findOverlappingTimeSlots,
  convertToCalendarEvents,
} from "@/utility_methods/schedulingUtils";
import {
  filterAvailableEvents,
  prepareUserForRanking,
  prepareSlotsForRanking,
  markTopMeetingSlots,
} from "@/utility_methods/meetingUtils";
import {
  calculateUserSimilarityScores,
  areFriends,
} from "@/utility_methods/memberCardUtils";

const localizer = momentLocalizer(moment);

export default function MeetingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <MeetingsPageContent />
    </Suspense>
  );
}

function MeetingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] =
    useState<CalendarMeeting | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState<CalendarUser | null>(null);
  const [targetUser, setTargetUser] = useState<CalendarUser | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    RankedCalendarEvent[] | null
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<RankedCalendarEvent | null>(
    null
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [teachingHours, setTeachingHours] = useState<number>(0);
  const [matchingSkill, setMatchingSkill] = useState<string>("");
  const [usersAreFriends, setUsersAreFriends] = useState<boolean>(false);
  const [checkingFriendship, setCheckingFriendship] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const userTimezone = useUserTimezone(loggedInUser || null);
  useEffect(() => {
    if (targetUserId) {
      setIsSchedulingMode(true);
      setCheckingFriendship(true);
    } else {
      setIsSchedulingMode(false);
    }
  }, [targetUserId]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const user = await getAuthUser();

      const { data: meetingsData } = await supabase
        .from("meetings")
        .select(
          `
          *,
          host:host_id(display_name, email),
          guest:guest_id(display_name, email)
        `
        )
        .or(`host_id.eq.${user?.id},guest_id.eq.${user?.id}`);

      if (meetingsData) {
        const calendarMeetings = meetingsData.map((meeting: Meeting) => {
          let timezone = userTimezone;

          if (meeting.scheduler_timezone && meeting.host_id === user?.id) {
            timezone = meeting.scheduler_timezone;
          }

          const startMoment = moment.tz(meeting.start_time, timezone);
          const endMoment = moment
            .tz(meeting.start_time, timezone)
            .add(1, "hour");

          const startTime = startMoment.toDate();
          const endTime = endMoment.toDate();

          return {
            id: meeting.id,
            title: meeting.title,
            start: startTime,
            end: endTime,
            host_id: meeting.host_id,
            guest_id: meeting.guest_id,
            is_confirmed: meeting.is_confirmed,
            host: meeting.host,
            guest: meeting.guest,
            scheduler_timezone: meeting.scheduler_timezone,
          };
        });

        setMeetings(calendarMeetings);
      }
    } catch (error) {
      alert("Error fetching meetings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getAuthUser();
        if (user) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          setLoggedInUser(data);

          if (targetUserId && isSchedulingMode) {
            const { data: targetUserData } = await supabase
              .from("users")
              .select("*")
              .eq("id", targetUserId)
              .single();

            setTargetUser(targetUserData);

            const friendshipStatus = await areFriends(user.id, targetUserId);
            setUsersAreFriends(friendshipStatus);
            setCheckingFriendship(false);

            if (friendshipStatus && data && targetUserData) {
              try {
                const result = await calculateUserSimilarityScores(
                  data.id,
                  targetUserData.id
                );

                const { teaching_hours, matching_skill } = result;

                if (
                  teaching_hours !== undefined &&
                  teaching_hours > 0 &&
                  matching_skill
                ) {
                  setTeachingHours(teaching_hours);
                  setMatchingSkill(matching_skill);
                }
              } catch (error) {
                alert(error);
              }
            }
          }
        }
      } catch (error) {
        alert(error);
      }
    };

    fetchUserData();
    fetchMeetings();
  }, [targetUserId, isSchedulingMode]);

  useEffect(() => {
    const findAvailableSlots = async () => {
      if (
        !isSchedulingMode ||
        !loggedInUser ||
        !targetUser ||
        !userTimezone ||
        !usersAreFriends
      ) {
        return;
      }

      const slots = await findAvailableMeetingSlots(
        loggedInUser.id,
        targetUser.id,
        teachingHours
      );
      setAvailableSlots(slots);
    };

    findAvailableSlots();
  }, [
    loggedInUser,
    targetUser,
    userTimezone,
    teachingHours,
    isSchedulingMode,
    usersAreFriends,
  ]);

  const findAvailableMeetingSlots = async (
    hostId: string,
    targetId: string,
    hours: number = teachingHours
  ) => {
    const { data: hostData } = await supabase
      .from("users")
      .select("*")
      .eq("id", hostId)
      .single();

    const { data: targetData } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetId)
      .single();

    if (!hostData?.availability || !targetData?.availability) {
      return [];
    }

    try {
      const hostAvailabilityArray = JSON.parse(hostData.availability);
      const targetAvailabilityArray = JSON.parse(targetData.availability);

      const overlappingSlots = findOverlappingTimeSlots(
        hostAvailabilityArray,
        targetAvailabilityArray
      );

      const calendarEvents = convertToCalendarEvents(
        overlappingSlots,
        userTimezone || "UTC"
      );

      const startDate = moment().startOf("day").toISOString();
      const endDate = moment().add(2, "months").endOf("month").toISOString();

      const { data: existingMeetings, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .or(
          `host_id.eq.${hostId},guest_id.eq.${hostId},host_id.eq.${targetId},guest_id.eq.${targetId}`
        )
        .gte("start_time", startDate)
        .lte("start_time", endDate);

      if (meetingsError) {
        alert("Error fetching existing meetings");
      }

      const availableEvents = filterAvailableEvents(
        calendarEvents,
        existingMeetings || []
      );

      if (availableEvents.length === 0) {
        return [];
      }

      const host = prepareUserForRanking(hostId, hostData);
      const target = prepareUserForRanking(targetId, targetData);

      const slotsForRanking = prepareSlotsForRanking(availableEvents);

      try {
        const response = await fetch("/meeting_ranker_api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user1: host,
            user2: target,
            slots: slotsForRanking,
            existingMeetings: existingMeetings || [],
          }),
        });

        if (!response.ok) {
          return availableEvents;
        }

        const { top_slots } = await response.json();

        if (top_slots && top_slots.length > 0) {
          const numSlotsToShow = hours > 0 ? hours : 5;
          return markTopMeetingSlots(
            availableEvents,
            top_slots,
            numSlotsToShow
          ) as RankedCalendarEvent[];
        } else {
          return availableEvents as RankedCalendarEvent[];
        }
      } catch (error) {
        return availableEvents;
      }
    } catch (error) {
      alert("Error finding available meeting slots");
      return [];
    }
  };

  const selectEvent = (event: any) => {
    if (event.id) {
      setSelectedMeeting(event);
      setIsDetailsModalOpen(true);
    } else {
      const oneHourSlot = {
        start: event.start,
        end: event.end,
        startUTC: event.startUTC || "",
        endUTC: event.endUTC || "",
        action: "click",
      };

      setSelectedSlot(oneHourSlot);
      setIsScheduleModalOpen(true);
    }
  };

  const acceptMeeting = async (meetingId: string) => {
    try {
      await supabase
        .from("meetings")
        .update({ is_confirmed: true })
        .eq("id", meetingId);

      await fetchMeetings();
      alert("Meeting confirmed successfully!");
    } catch (error) {
      alert("Failed to confirm meeting. Please try again.");
    }
  };

  const cancelMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) {
      return;
    }

    try {
      await supabase.from("meetings").delete().eq("id", meetingId);

      if (selectedMeeting && selectedMeeting.id === meetingId) {
        setIsDetailsModalOpen(false);
        setSelectedMeeting(null);
      }

      await fetchMeetings();

      alert("Meeting cancelled successfully!");
    } catch (error) {
      alert("Failed to cancel meeting");
    }
  };

  const bookMeeting = async ({ title }: { title: string }) => {
    try {
      if (!loggedInUser || !targetUser || !selectedSlot) {
        throw new Error("Missing required information to book meeting");
      }

      const startTimeISO = selectedSlot.startUTC
        ? moment.utc(selectedSlot.startUTC).toISOString()
        : moment.utc(selectedSlot.start).toISOString();

      const { data: existingMeetings, error: conflictError } = await supabase
        .from("meetings")
        .select("*")
        .or(
          `host_id.eq.${loggedInUser.id},guest_id.eq.${loggedInUser.id},host_id.eq.${targetUser.id},guest_id.eq.${targetUser.id}`
        )
        .eq("start_time", startTimeISO);

      if (conflictError) {
        alert("Error checking for meeting conflicts");
        throw new Error("Error checking for meeting conflicts");
      }

      if (existingMeetings && existingMeetings.length > 0) {
        alert(
          "This time slot is no longer available. Please select another time."
        );
        return;
      }

      const { error: insertError } = await supabase.from("meetings").insert({
        host_id: loggedInUser.id,
        guest_id: targetUser.id,
        start_time: startTimeISO,
        title: title,
        is_confirmed: false,
      });

      if (insertError) {
        alert("Failed to schedule meeting");
        throw new Error("Failed to schedule meeting");
      }

      alert("Meeting scheduled successfully!");
      setIsScheduleModalOpen(false);
      fetchMeetings();
    } catch (error) {
      alert("Failed to schedule meeting. Please try again.");
    }
  };

  const calendarCSS = (event: any) => {
    if (event.id) {
      let backgroundColor = event.is_confirmed ? "#4CAF50" : "#FFC107";

      return {
        style: {
          backgroundColor,
          borderRadius: "5px",
          opacity: 0.8,
          color: "white",
          border: "0px",
          display: "block",
        },
      };
    }

    if (event.resource?.isBestSlot) {
      return {
        style: {
          backgroundColor: "#FF5722",
          cursor: "pointer",
          border: "2px solid #D84315",
          boxShadow: "0 0 5px rgba(255, 87, 34, 0.5)",
          borderRadius: "5px",
          color: "white",
        },
      };
    }

    return {
      style: {
        backgroundColor: "#78909C",
        cursor: "pointer",
        borderRadius: "5px",
        color: "white",
      },
    };
  };

  if (isLoading || (isSchedulingMode && checkingFriendship)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isSchedulingMode && !usersAreFriends && targetUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-4">Connection Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be connected with{" "}
            {targetUser?.name || targetUser?.display_name} before you can
            schedule a meeting.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allEvents = isSchedulingMode
    ? [...meetings, ...(availableSlots || [])]
    : meetings;

  return (
    <div className="container mx-auto px-4 py-8 text-black">
      <h1 className="text-2xl font-bold mb-4 text-black">
        {isSchedulingMode
          ? `Schedule a Meeting with ${
              targetUser?.name || targetUser?.display_name
            }`
          : "My Meetings"}
      </h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-500 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm text-blue-700">
            <span className="font-medium">Your time zone:</span> {userTimezone}
          </p>
        </div>
      </div>

      {isSchedulingMode && teachingHours > 0 && matchingSkill && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-500 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-700 font-medium">
              Teaching Plan Information
            </p>
          </div>
          <div className="mt-2 text-sm text-green-700">
            <p>
              <span className="font-medium">Matching Skill:</span>{" "}
              {matchingSkill}
            </p>
            <p>
              <span className="font-medium">Teaching Hours Required:</span>{" "}
              {teachingHours} hours
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-black">Meeting Calendar</h2>
          <div className="flex space-x-2">
            {isSchedulingMode && (
              <button
                onClick={() => router.push("/meetings")}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                View My Meetings
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back Home
            </button>
          </div>
        </div>

        <div className="flex mb-4">
          <div className="flex items-center mr-4">
            <div className="w-4 h-4 bg-[#4CAF50] rounded-full mr-2"></div>
            <span className="text-sm text-black">Confirmed</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-4 h-4 bg-[#FFC107] rounded-full mr-2"></div>
            <span className="text-sm text-black">Pending</span>
          </div>
          {isSchedulingMode && (
            <>
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 bg-[#FF5722] rounded mr-2"></div>
                <span className="text-sm text-black">Best Meeting Time</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#78909C] rounded mr-2"></div>
                <span className="text-sm text-black">Available Time</span>
              </div>
            </>
          )}
        </div>

        <div className="border border-gray-200 rounded-md">
          <div className="h-[700px] text-black">
            <Calendar
              localizer={localizer}
              events={allEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={selectEvent}
              eventPropGetter={calendarCSS}
              defaultView="week"
              views={["month", "week", "day"]}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              min={new Date(0, 0, 0, 6, 0)}
              max={new Date(0, 0, 0, 23, 0)}
              formats={{
                timeGutterFormat: (date: Date) =>
                  moment(date)
                    .tz(userTimezone || "UTC")
                    .format("h A"),
                eventTimeRangeFormat: (range) => {
                  return `${moment(range.start)
                    .tz(userTimezone || "UTC")
                    .format("h:mm A")} - ${moment(range.end)
                    .tz(userTimezone || "UTC")
                    .format("h:mm A")}`;
                },
              }}
            />
          </div>
        </div>
      </div>

      {selectedMeeting && (
        <MeetingDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          meeting={selectedMeeting}
          onConfirm={acceptMeeting}
          onCancel={cancelMeeting}
        />
      )}

      {isSchedulingMode && selectedSlot && targetUser && (
        <MeetingConfirmationModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          selectedSlot={selectedSlot}
          targetUser={targetUser}
          onConfirm={bookMeeting}
          teachingHours={teachingHours}
          matchingSkill={matchingSkill}
        />
      )}
    </div>
  );
}
