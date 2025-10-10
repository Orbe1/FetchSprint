import { UserProfile } from "@/types/types";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { uploadProfilePicture, getAuthUser } from "@/utility_methods/userUtils";
import { supabase } from "@/app/utils/supabase/client";
import { toast } from "sonner";
import { useMemberInteractions } from "@/hooks/useMemberInteractions";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
}

interface UserTimeZone {
  time_zone?: string;
  chronotype?: string;
}

export default function ProfileHeader({
  profile,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | undefined>(
    profile.profilePicture
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userTimeZone, setUserTimeZone] = useState<UserTimeZone>({});

  const {
    isFriends,
    isPendingRequest,
    isDisabled,
    sendConnectionRequest,
    enterDM,
  } = useMemberInteractions(profile.id);

  useEffect(() => {
    if (isOwnProfile) return;

    const fetchUserTimeZone = async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("time_zone, chronotype")
          .eq("id", profile.id)
          .single();

        if (data) {
          setUserTimeZone(data);
        }
      } catch (error) {
        alert(error);
      }
    };

    fetchUserTimeZone();
  }, [isOwnProfile, profile.id]);
  const handleProfilePictureClick = () => {
    if (isOwnProfile && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadProfilePicture(profile.id, file);

      if (result.success && result.profilePicUrl) {
        setProfilePic(result.profilePicUrl);
        toast.success("Profile picture updated successfully");
      } else {
        toast.error("Failed to upload profile picture");
      }
    } catch (error) {
      toast.error("An error occurred while uploading the profile picture");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12">
      <div className="flex flex-col items-center text-center">
        <div
          className={`relative mb-6 ${
            isOwnProfile ? "cursor-pointer group" : ""
          }`}
          onClick={handleProfilePictureClick}
        >
          {profilePic ? (
            <div className="relative">
              <img
                src={profilePic}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-500 dark:text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {profile.displayName}
        </h2>

        <p className="text-blue-100 text-lg mb-4">{profile.email}</p>

        {!isOwnProfile && (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  router.push(`/schedule_meeting?userId=${profile.id}`)
                }
                className="px-6 py-2 bg-white text-purple-600 font-medium rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
              >
                Schedule Meeting
              </button>

              {isFriends ? (
                <button
                  onClick={() => enterDM(profile.displayName)}
                  className="px-6 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
                >
                  Message
                </button>
              ) : isPendingRequest ? (
                <button
                  onClick={sendConnectionRequest}
                  className="px-6 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
                >
                  Accept Request
                </button>
              ) : (
                <button
                  onClick={sendConnectionRequest}
                  disabled={isDisabled}
                  className={`px-6 py-2 font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 ${
                    isDisabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isDisabled ? "Request Sent" : "Connect"}
                </button>
              )}
            </div>

            {userTimeZone?.time_zone && (
              <div className="text-white bg-purple-700 bg-opacity-50 px-4 py-1 rounded-full text-sm flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {userTimeZone.time_zone}
                {userTimeZone.chronotype && (
                  <span className="ml-2 bg-purple-800 px-2 py-0.5 rounded-full text-xs">
                    {userTimeZone.chronotype === "early_bird"
                      ? "Early Bird"
                      : "Night Owl"}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
