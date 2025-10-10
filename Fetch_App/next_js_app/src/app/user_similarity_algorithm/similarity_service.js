import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function fetchAllUsers() {
  try {
    const { data, error } = await getSupabaseClient()
      .from("users")
      .select("*")
      .eq("completed_onboarding", true);

    if (error) throw new Error(`Error fetching user data: ${error.message}`);

    return data;
  } catch (e) {
    throw new Error(`Error fetching user data: ${e.message}`);
  }
}

function preprocessAvailabilityData(users) {
  return users.map((user) => {
    const availability = user.availability;
    if (typeof availability === "string") {
      try {
        return JSON.parse(availability);
      } catch (e) {
        alert("error parsing availability data");
      }
    } else if (Array.isArray(availability)) {
      return availability;
    }
    return [];
  });
}

function oneHotEncode(usersList, column) {
  const uniqueValues = [
    ...new Set(usersList.map((item) => item[column] || "unknown")),
  ];
  const OHE_Hashmap = {};

  for (const user of usersList) {
    const userId = user.id;
    if (!OHE_Hashmap[userId]) OHE_Hashmap[userId] = {};

    const value = user[column];
    for (const uniqueValue of uniqueValues) {
      const featureName = `${column}_${uniqueValue}`;
      OHE_Hashmap[userId][featureName] = value === uniqueValue ? 1 : 0;
    }
  }

  return {
    encoded: OHE_Hashmap,
    featureNames: uniqueValues.map((val) => `${column}_${val}`),
  };
}

function multiLabelBinarize(availabilityLists, users) {
  const uniqueValues = new Set();
  for (const possibleAvailability of availabilityLists) {
    for (const availabilitySlot of possibleAvailability) {
      uniqueValues.add(availabilitySlot);
    }
  }

  const possibleAvalabilities = [...uniqueValues];
  const encoded = {};

  availabilityLists.forEach((list, index) => {
    const userId = users[index].id;
    if (!encoded[userId]) encoded[userId] = {};

    for (const value of possibleAvalabilities) {
      const featureName = `availability_${value}`;
      encoded[userId][featureName] = list.includes(value) ? 1 : 0;
    }
  });

  return {
    encoded,
    featureNames: possibleAvalabilities.map((val) => `availability_${val}`),
  };
}

function cosineSimilarity(vector1, vector2) {
  if (!vector1 || !vector2 || vector1.length !== vector2.length) return 0;

  let dotProduct = 0;
  let normalized_v1 = 0;
  let normalized_v2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    normalized_v1 += vector1[i] * vector1[i];
    normalized_v2 += vector2[i] * vector2[i];
  }

  normalized_v1 = Math.sqrt(normalized_v1);
  normalized_v2 = Math.sqrt(normalized_v2);

  if (normalized_v1 === 0 || normalized_v2 === 0) return 0;

  const similarity = dotProduct / (normalized_v1 * normalized_v2);
  return similarity;
}

async function createEncodersAndHashmap() {
  const users = await fetchAllUsers();
  const encoders = {};
  const encodedFeatures = {};
  let allFeatureNames = [];

  const simpleColumns = ["communication_style", "time_zone", "chronotype"];

  for (const column of simpleColumns) {
    if (users.some((user) => user[column])) {
      const { encoded, featureNames } = oneHotEncode(users, column);
      encoders[column] = { type: "oneHot", values: featureNames };
      encodedFeatures[column] = encoded;
      allFeatureNames = [...allFeatureNames, ...featureNames];
    }
  }

  try {
    const availabilityLists = preprocessAvailabilityData(users);
    const nonEmptyAvailability = availabilityLists.filter(
      (list) => list && list.length > 0
    );

    if (nonEmptyAvailability.length > 0) {
      const { encoded, featureNames } = multiLabelBinarize(
        availabilityLists,
        users
      );
      encoders["availability"] = { type: "multiLabel", values: featureNames };
      encodedFeatures["availability"] = encoded;
      allFeatureNames = [...allFeatureNames, ...featureNames];
    }
  } catch (e) {
    alert("error getting availability data");
  }

  const userEncodings = {};

  for (const user of users) {
    const userId = user.id;
    const encodedVector = [];

    for (const featureName of allFeatureNames) {
      let category;
      if (featureName.startsWith("time_zone_")) {
        category = "time_zone";
      } else if (featureName.startsWith("communication_style_")) {
        category = "communication_style";
      } else if (featureName.startsWith("chronotype_")) {
        category = "chronotype";
      } else if (featureName.startsWith("availability_")) {
        category = "availability";
      } else {
        [category] = featureName.split("_");
      }

      if (
        encodedFeatures[category] &&
        encodedFeatures[category][userId] &&
        encodedFeatures[category][userId][featureName] !== undefined
      ) {
        encodedVector.push(encodedFeatures[category][userId][featureName]);
      } else {
        encodedVector.push(0);
      }
    }

    const weightedVector = [...encodedVector];

    for (let i = 0; i < allFeatureNames.length; i++) {
      const featureName = allFeatureNames[i];
      if (featureName.startsWith("communication_style_")) {
        weightedVector[i] = encodedVector[i];
      }
      if (featureName.startsWith("time_zone_")) {
        weightedVector[i] = encodedVector[i];
      }
    }

    userEncodings[userId] = weightedVector;
  }

  return { encoders, userEncodings, featureNames: allFeatureNames };
}

function calculateUserSimilarity(user1Id, user2Id, userEncodings) {
  if (!userEncodings[user1Id] || !userEncodings[user2Id]) return 0.0;
  return cosineSimilarity(userEncodings[user1Id], userEncodings[user2Id]);
}

class SimilarityService {
  constructor() {
    this.encoders = null;
    this.userEncodings = null;
    this.featureNames = null;
    this._initialize();
  }

  async _initialize() {
    try {
      await this.refresh_data();
    } catch (e) {
      alert("refresh Failed");
    }
  }

  async refresh_data() {
    try {
      const { encoders, userEncodings, featureNames } =
        await createEncodersAndHashmap();
      this.encoders = encoders;
      this.userEncodings = userEncodings;
      this.featureNames = featureNames;
      return true;
    } catch (e) {
      return false;
    }
  }

  get_similarity(user1Id, user2Id) {
    if (!this.userEncodings) return 0.0;

    try {
      return calculateUserSimilarity(user1Id, user2Id, this.userEncodings);
    } catch (e) {
      return 0.0;
    }
  }
}

export const similarity_service = new SimilarityService();
