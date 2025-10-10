import React from "react";
import HomeButton from "../../components/homeButton";

interface ChatHeaderProps {
  name: string;
  profilePicUrl?: string;
}

const ChatHeader = ({ name, profilePicUrl }: ChatHeaderProps) => {
  return (
    <div className="h-20">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <HomeButton />
          <div className="flex-1 flex items-center justify-center">
            {profilePicUrl ? (
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <img
                  src={profilePicUrl}
                  alt={`${name}'s profile`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-center">
              <h1 className="text-xl font-bold">{name}</h1>
              <div className="flex items-center justify-center gap-1"></div>
            </div>
          </div>
          <div className="w-32"></div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
