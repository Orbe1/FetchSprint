import { MemberWithSimilarity } from "@/types/types";
import MemberCard from "./MemberCard";

export default function LearnPageMemberCards({
  members,
}: {
  members: MemberWithSimilarity[];
}) {
  if (members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">👥 No members found</div>
          <div className="text-gray-400 text-sm">
            Try adding more skills to your profile to find better matches
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
