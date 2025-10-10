import { MemberWithSimilarity } from "@/types/types";
import { useMemberInteractions } from "@/hooks/useMemberInteractions";

const MATCH_THRESHOLD = 0.8;

export default function MemberCard({
  member,
}: {
  member: MemberWithSimilarity;
}) {
  const {
    isDisabled,
    isFriends,
    isPendingRequest,
    sendConnectionRequest,
    viewProfile,
    enterDM,
    scheduleMeeting,
  } = useMemberInteractions(member.id);

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 relative">
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {member.maxLearnScore !== undefined && member.maxLearnScore >= MATCH_THRESHOLD && (
          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            🎓 Learn From
          </div>
        )}
        {member.maxTeachScore !== undefined && member.maxTeachScore >= MATCH_THRESHOLD && (
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            👨‍🏫 Teach
          </div>
        )}
      </div>

      {isPendingRequest && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Pending Request
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {member.profilePicUrl ? (
          <div className="w-16 h-16 rounded-full mb-4 overflow-hidden">
            <img
              src={member.profilePicUrl}
              alt={`${member.name}'s profile`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white font-semibold text-xl">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {member.name}
        </h3>

        {member.email && (
          <p className="text-sm text-gray-600 mb-4">{member.email}</p>
        )}

        <div className="w-full space-y-2">
          {isFriends ? (
            <button
              onClick={() => enterDM(member.name)}
              className="w-full px-4 py-2 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
            >
              DM
            </button>
          ) : (
            <button
              onClick={sendConnectionRequest}
              disabled={isDisabled}
              className={`w-full px-4 py-2 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
              }`}
            >
              Connect
            </button>
          )}
          <button
            onClick={() => viewProfile()}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            View Profile
          </button>
          <button
            onClick={() => scheduleMeeting()}
            className="w-full px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Schedule Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
