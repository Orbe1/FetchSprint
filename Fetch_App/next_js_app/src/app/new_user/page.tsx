"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmbeddingFromAPI } from "@/utility_methods/embeddingUtils";
import { supabase } from "@/app/utils/supabase/client";
import {
  convertAvailabilityToUTC,
  availabilityOptions,
  timeZones,
} from "@/utility_methods/timeUtils";
import {
  getAuthUser,
  updateUserAvailability,
  deleteUserSkills,
} from "@/utility_methods/userUtils";

import UserQuestions, { QuestionnaireData } from "@/app/new_user/UserQuestions";

export default function NewUserQuestionnaire() {
  const router = useRouter();

  const [formData, setFormData] = useState<QuestionnaireData>({
    skillsToTeach: [],
    skillsToLearn: [],
    chronotype: "",
    availability: [],
    communicationStyle: "",
    timeZone: "",
    improvementTime: "",
  });

  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");

  const handleAvailabilityChange = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter((a) => a !== option)
        : [...prev.availability, option],
    }));
  };

  const isFormComplete = (): boolean => {
    return (
      formData.skillsToTeach.length > 0 &&
      formData.skillsToLearn.length > 0 &&
      formData.chronotype !== "" &&
      formData.availability.length > 0 &&
      formData.communicationStyle !== "" &&
      formData.timeZone !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const user = await getAuthUser();

      if (!user) {
        alert("Authentication error. Please sign in again.");
        return;
      }

      const utcAvailability = convertAvailabilityToUTC(
        formData.availability,
        formData.timeZone
      );

      try {
        await updateUserAvailability(
          user.id,
          formData.communicationStyle,
          formData.timeZone,
          formData.chronotype,
          utcAvailability
        );
      } catch (error) {
        alert("There was an error updating your profile. Please try again.");
        return;
      }

      try {
        await deleteUserSkills(user.id);
      } catch (error) {
        alert("There was an error deleting your skills. Please try again.");
        return;
      }

      const teachSkillsWithEmbeddings = await Promise.all(
        formData.skillsToTeach.map(async (skill) => {
          const embedding = await getEmbeddingFromAPI(skill.skill);
          return {
            user_id: user.id,
            skill: skill.skill,
            level: skill.level,
            type: "teach",
            embedding: embedding,
            teaching_time: skill.teaching_time,
          };
        })
      );

      const learnSkillsWithEmbeddings = await Promise.all(
        formData.skillsToLearn.map(async (skill) => {
          const embedding = await getEmbeddingFromAPI(skill.skill);
          return {
            user_id: user.id,
            skill: skill.skill,
            level: skill.level,
            type: "learn",
            embedding: embedding,
            teaching_time: 5,
          };
        })
      );

      const skillsToInsert = [
        ...teachSkillsWithEmbeddings,
        ...learnSkillsWithEmbeddings,
      ];

      if (skillsToInsert.length > 0) {
        const { error: skillsError } = await supabase
          .from("user_skills")
          .insert(skillsToInsert);

        if (skillsError) {
          alert("There was an error saving your skills. Please try again.");
          return;
        }
      }

      alert("Profile completed successfully!");
      router.push("/");
    } catch (error) {
      alert("There was an error saving your profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Welcome! Let's Get to Know You
            </CardTitle>
            <CardDescription className="text-center">
              Please answer these questions to help us match you with the right
              learning partners
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8">
              <UserQuestions
                formData={formData}
                setFormData={setFormData}
                newTeachSkill={newTeachSkill}
                setNewTeachSkill={setNewTeachSkill}
                newLearnSkill={newLearnSkill}
                setNewLearnSkill={setNewLearnSkill}
                availabilityOptions={availabilityOptions}
                timeZones={timeZones}
                handleAvailabilityChange={handleAvailabilityChange}
              />

              <Button
                type="submit"
                className="w-full py-3 text-lg"
                disabled={!isFormComplete()}
              >
                {isFormComplete()
                  ? "Complete Setup"
                  : "Please Complete All Fields"}
              </Button>
              {!isFormComplete() && (
                <div className="text-center text-sm text-red-600 mt-2">
                  All fields marked with * are required
                </div>
              )}
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
