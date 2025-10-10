import { useState } from "react";
import SkillBadge from "./SkillBadge";
import { addUserSkill, removeUserSkill } from "@/utility_methods/userUtils";
import { toast } from "sonner";
import { getEmbeddingFromAPI } from "@/utility_methods/embeddingUtils";
import { ProfileSkill } from "@/types/types";

interface SkillSectionProps {
  title: string;
  skills: ProfileSkill[];
  icon: "teaching" | "learning";
  emptyMessage: string;
  isOwnProfile?: boolean;
  userId: string;
  skillType: "teach" | "learn";
}

export default function SkillSection({
  title,
  skills,
  icon,
  emptyMessage,
  isOwnProfile = false,
  userId,
  skillType,
}: SkillSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [teachingTime, setTeachingTime] = useState<number>(10);
  const [localSkills, setLocalSkills] = useState<ProfileSkill[]>(skills);
  const iconColors = {
    teaching:
      "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    learning: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  };

  const teachingIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  );

  const learningIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  );

  const [skillLevel, setSkillLevel] = useState<number>(1);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSkill.trim()) {
      toast.error("Skill cannot be empty");
      return;
    }

    if (localSkills.some((s) => s.skill === newSkill.trim())) {
      toast.error("This skill already exists");
      return;
    }

    if (localSkills.length >= 5) {
      toast.error("You can only have up to 5 skills");
      return;
    }

    try {
      const embedding = await getEmbeddingFromAPI(newSkill.trim());
      const result = await addUserSkill(
        userId,
        newSkill.trim(),
        skillType,
        embedding,
        skillType === "teach" ? teachingTime : undefined,
        skillLevel
      );

      if (result.success) {
        setLocalSkills([
          ...localSkills,
          { skill: newSkill.trim(), level: skillLevel },
        ]);
        setNewSkill("");
        setIsAdding(false);
        toast.success("Skill added successfully");
      } else {
        toast.error("Failed to add skill");
      }
    } catch (error) {
      toast.error("An error occurred while adding the skill");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      const result = await removeUserSkill(userId, skillToRemove, skillType);

      if (result.success) {
        setLocalSkills(
          localSkills.filter((skill) => skill.skill !== skillToRemove)
        );
        toast.success("Skill removed successfully");
      } else {
        toast.error("Failed to remove skill");
      }
    } catch (error) {
      toast.error("An error occurred while removing the skill");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 ${iconColors[icon]} rounded-full flex items-center justify-center`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {icon === "teaching" ? teachingIcon : learningIcon}
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        {isOwnProfile && !isAdding && localSkills.length < 5 && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition-colors"
          >
            Add Skill
          </button>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[120px]">
        {isAdding && (
          <form onSubmit={handleAddSkill} className="mb-4 space-y-3">
            <div className="flex">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill..."
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewSkill("");
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md ml-2"
              >
                Cancel
              </button>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">Your skill level:</p>
              <div className="flex gap-4">
                {[1, 2, 3].map((level) => (
                  <label
                    key={level}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="skill-level"
                      checked={skillLevel === level}
                      onChange={() => setSkillLevel(level)}
                      className="w-3 h-3"
                    />
                    <span className="text-sm">
                      {level === 1 &&
                        (skillType === "learn"
                          ? "Complete beginner"
                          : "Beginner")}
                      {level === 2 && "Know the basics"}
                      {level === 3 && "Intermediate"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {skillType === "teach" && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">
                  How long will it take you to teach this skill?
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teaching-time"
                      checked={teachingTime === 5}
                      onChange={() => setTeachingTime(5)}
                      className="w-3 h-3"
                    />
                    <span className="text-sm">5 hours</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teaching-time"
                      checked={teachingTime === 10}
                      onChange={() => setTeachingTime(10)}
                      className="w-3 h-3"
                    />
                    <span className="text-sm">10 hours</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        )}

        {localSkills.length > 0 ? (
          <div className="flex flex-wrap">
            {localSkills.map((skillObj, index) => {
              const skillName =
                typeof skillObj === "string" ? skillObj : skillObj.skill;
              const skillLevel =
                typeof skillObj === "string" ? undefined : skillObj.level;

              return (
                <div key={index} className="relative group">
                  <SkillBadge skill={skillName} />
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveSkill(skillName)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
