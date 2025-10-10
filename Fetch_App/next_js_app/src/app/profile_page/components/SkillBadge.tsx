interface SkillBadgeProps {
  skill: string;
  level?: number;
}

export default function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300 mr-2 mb-2">
      {skill}
    </span>
  );
}
