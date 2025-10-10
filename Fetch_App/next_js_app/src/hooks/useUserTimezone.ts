import { useState, useEffect } from "react";
import { getIANATimezone } from "@/utility_methods/schedulingUtils";
import moment from "moment-timezone";

export function useUserTimezone(user: any | null) {
  const [userTimezone, setUserTimezone] = useState<string>("");

  useEffect(() => {
    if (user) {
      const timezone = user?.time_zone || "";
      const ianaTimezone = getIANATimezone(timezone);
      setUserTimezone(ianaTimezone);
    } else {
      setUserTimezone(moment.tz.guess());
    }
  }, [user]);

  return userTimezone;
}
