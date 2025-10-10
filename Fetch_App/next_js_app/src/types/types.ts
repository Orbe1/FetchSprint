export type Message = {
  created_at: string;
  text: string;
  sent_by: string;
};

export interface ListOfMessages {
  messages: Message[];
}

export interface MeetingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    start: Date;
    end: Date;
  };
  targetUser: {
    id: string;
    name?: string;
    display_name?: string;
    email?: string;
  };
  onConfirm: (meetingDetails: { title: string }) => void;
  teachingHours?: number;
  matchingSkill?: string;
}

export interface MatchUser {
  id: string;
  name: string;
  email?: string;
  maxLearnScore?: number;
  maxTeachScore?: number;
  profilePicUrl?: string;
}

export interface CommentModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  handleSubmitComment: () => void;
  comment: string;
  setComment: (comment: string) => void;
  comments?: Array<{ author_name: string | null; post_content: string }>;
}

export interface UseSimilarityReturn {
  similarity: number | null;
  loading: boolean;
  error: string | null;
  calculateSimilarity: (
    loggedInUserId: string,
    targetUserId: string
  ) => Promise<void>;
  refreshSimilarityData: () => Promise<void>;
  clearResults: () => void;
}

export interface SearchBarProps {
  onSearchChange: (searchTerm: string) => void;
  searchTerm: string;
}
export interface Member {
  id: string;
  name: string;
  email?: string;
  profilePicUrl?: string;
}

export interface MemberWithSimilarity extends Member {
  similarityScore?: number;
  similarityLoading?: boolean;
  maxLearnScore?: number;
  maxTeachScore?: number;
  profilePicUrl?: string;
}

export interface LoggedInUser {
  id: string;
  email?: string;
  displayName?: string;
  profilePicUrl?: string;
  completedOnboarding?: boolean;
  teachingSkills: string[];
  learningSkills: string[];
  communicationStyle?: string;
  timeZone?: string;
  chronotype?: string;
  availability: string[];
  learning_embeddings?: number[][];
  teaching_embeddings?: number[][];
}

export interface UserWithEmbeddings {
  learning_embeddings?: number[][];
  teaching_embeddings?: number[][];
}

export interface MemberWithSimilarity extends Member {
  similarityScore?: number;
  similarityLoading?: boolean;
}

export interface MemberCardsProps {
  members: MemberWithSimilarity[];
  loggedInUserId?: string;
  showSimilarityScores?: boolean;
  loggedInUser?: Member;
}

export interface MemberCardProps {
  member: MemberWithSimilarity;
  loggedInUserId?: string;
  showSimilarityScore?: boolean;
  loggedInUser?: Member;
}

export interface SkillLevel {
  skill: string;
  level: number;
}

export interface ProfileSkill {
  skill: string;
  level: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  teachingSkills: ProfileSkill[];
  learningSkills: ProfileSkill[];
}
export interface CalendarUser {
  id: string;
  display_name?: string;
  name?: string;
  email?: string;
  time_zone?: string;
  availability?: string;
}

export interface CalendarEvent {
  start: Date;
  end: Date;
  startUTC?: string;
  endUTC?: string;
  displayStartHour?: number;
  displayEndHour?: number;
  displayTime?: string;
  resource?: { available: boolean };
  action?: string;
}

export interface UserSkill {
  type: string;
  embedding: string | Record<string, number> | number[];
  skill: string;
  teaching_time?: number;
}

export interface Meeting {
  id: string;
  host_id: string;
  guest_id: string;
  start_time: string;
  scheduler_timezone?: string;
  title: string;
  is_confirmed: boolean;
  host?: {
    display_name?: string;
    name?: string;
    email?: string;
  };
  guest?: {
    display_name?: string;
    name?: string;
    email?: string;
  };
}

export interface CalendarMeeting {
  id: string;
  title: string;
  start: Date;
  end: Date;
  host_id: string;
  guest_id: string;
  is_confirmed: boolean;
  scheduler_timezone?: string;
  host?: {
    display_name?: string;
    name?: string;
    email?: string;
  };
  guest?: {
    display_name?: string;
    name?: string;
    email?: string;
  };
}

export interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: CalendarMeeting;
  onConfirm: (meetingId: string) => void;
  onCancel: (meetingId: string) => void;
}

export type Chronotype = "early_bird" | "night_owl";

export interface MeetingUser {
  user_id: string;
  timezone: string;
  chronotype: Chronotype;
  existingMeetings?: ExistingMeeting[];
}

export interface ExistingMeeting {
  startUTC: string;
  endUTC: string;
}

export interface MeetingSlot {
  startUTC: string;
  endUTC: string;
}

export interface RankedSlot extends MeetingSlot {
  score: number;
  components: {
    time_gap: number;
    chronotype: number;
    density: number;
  };
}

export interface DatabaseMeeting {
  host_id: string;
  guest_id: string;
  start_time: string;
  [key: string]: unknown;
}

export interface MeetingRankerRequestBody {
  user1: MeetingUser;
  user2: MeetingUser;
  slots: MeetingSlot[];
  existingMeetings?: DatabaseMeeting[];
}

export interface RankedCalendarEvent extends CalendarEvent {
  score?: number;
  title?: string;
}

export interface ScoredMeetingSlot extends MeetingSlot {
  score: number;
}
