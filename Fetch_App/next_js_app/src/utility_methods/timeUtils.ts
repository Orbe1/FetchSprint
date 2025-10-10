export const availabilityOptions = [
  "6:00 AM - 9:00 AM",
  "9:00 AM - 12:00 PM",
  "12:00 PM - 3:00 PM",
  "3:00 PM - 6:00 PM",
  "6:00 PM - 9:00 PM",
];

export const timeZones = [
  "Pacific Time (PT)",
  "Mountain Time (MT)",
  "Central Time (CT)",
  "Eastern Time (ET)",
  "Atlantic Time (AT)",
  "Hawaii Time (HT)",
  "Alaska Time (AKT)",
];

export const tzOffsets: { [key: string]: number } = {
  "Pacific Time (PT)": 8,
  "Mountain Time (MT)": 7,
  "Central Time (CT)": 6,
  "Eastern Time (ET)": 5,
  "Atlantic Time (AT)": 4,
  "Alaska Time (AKT)": 9,
  "Hawaii Time (HT)": 10,
};

export const convertTo24Hour = (time12h: string): number => {
  const [time, modifier] = time12h.split(" ");
  let [hours] = time.split(":").map(Number);

  if (hours === 12) {
    hours = 0;
  }
  if (modifier === "PM") {
    hours += 12;
  }

  return hours;
};

export const pad_zeros = (num: number): string => {
  return num.toString().padStart(2, "0");
};

export const toUtcRange = (localRange: string, offset: number): string => {
  const [start, end] = localRange
    .split(" - ")
    .map((t) => convertTo24Hour(t.trim()));

  const startUtc = (start + offset) % 24;
  const endUtc = (end + offset) % 24;

  return `${pad_zeros(startUtc)}:00 - ${pad_zeros(endUtc)}:00`;
};

export const convertAvailabilityToUTC = (
  availabilitySlots: string[],
  timezone: string
): string[] => {
  const offset = tzOffsets[timezone];
  if (!offset) return availabilitySlots;

  return availabilitySlots.map((slot) => toUtcRange(slot, offset));
};
