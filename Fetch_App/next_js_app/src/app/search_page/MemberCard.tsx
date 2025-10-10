import { MemberCardProps } from "@/types/types";
import {
  getSimilarityColor,
  getSimilarityLabel,
} from "@/utility_methods/memberCardUtils";
import { useMemberInteractions } from "@/hooks/useMemberInteractions";

export default function MemberCard({
  member,
  loggedInUserId = "",
  showSimilarityScore = false,
}: MemberCardProps) {
  const {
    isDisabled,
    isFriends,
    isPendingRequest,
    requestSent,
    requestReceived,
    sendConnectionRequest,
    viewProfile,
    enterDM,
    scheduleMeeting,
  } = useMemberInteractions(member.id);

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 relative">
      {showSimilarityScore &&
        member.similarityScore !== undefined &&
        loggedInUserId !== member.id && (
          <div className="absolute top-3 right-3 z-10">
            <div
              className={`${getSimilarityColor(
                member.similarityScore
              )} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}
            >
              {(member.similarityScore * 100).toFixed(1)}%
            </div>
          </div>
        )}


      {isPendingRequest && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Pending Connection Request
          </div>
        </div>
      )}

      {showSimilarityScore && member.similarityLoading && (
        <div className="absolute top-3 right-3 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
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

        <h3 className="font-semibold text-gray-900 text-lg mb-2">
          {member.name}
        </h3>

        {showSimilarityScore &&
          member.similarityScore !== undefined &&
          loggedInUserId !== member.id && (
            <div className="mb-3">
              <span className="text-xs text-gray-600 font-medium">
                {getSimilarityLabel(member.similarityScore)}
              </span>
            </div>
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
                isDisabled || requestSent
                  ? "bg-gray-400 cursor-not-allowed"
                  : requestReceived
                  ? "bg-green-500 hover:bg-green-600 focus:ring-green-500"
                  : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
              }`}
            >
              {requestSent
                ? "Request Sent"
                : requestReceived
                ? "Accept Request"
                : "Connect"}
            </button>
          )}
          <button
            onClick={() => viewProfile()}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            View Profile
          </button>
          {isFriends && (
            <button
              onClick={() => scheduleMeeting()}
              className="w-full px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Schedule Meeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
