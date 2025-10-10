"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface SkillLevel {
  skill: string;
  level: number;
  teaching_time?: number;
}

export interface QuestionnaireData {
  skillsToTeach: SkillLevel[];
  skillsToLearn: SkillLevel[];
  chronotype: string;
  availability: string[];
  communicationStyle: string;
  timeZone: string;
  improvementTime: string;
}

interface UserQuestionsProps {
  formData: QuestionnaireData;
  setFormData: React.Dispatch<React.SetStateAction<QuestionnaireData>>;
  newTeachSkill: string;
  setNewTeachSkill: React.Dispatch<React.SetStateAction<string>>;
  newLearnSkill: string;
  setNewLearnSkill: React.Dispatch<React.SetStateAction<string>>;
  availabilityOptions: string[];
  timeZones: string[];
  handleAvailabilityChange: (option: string) => void;
}

export default function UserQuestions({
  formData,
  setFormData,
  newTeachSkill,
  setNewTeachSkill,
  newLearnSkill,
  setNewLearnSkill,
  availabilityOptions,
  timeZones,
  handleAvailabilityChange,
}: UserQuestionsProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          1. What skills can you confidently teach? (5 MAX) *
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter a skill you can teach"
            value={newTeachSkill}
            onChange={(e) => setNewTeachSkill(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => {
              const skill = newTeachSkill.trim();
              if (
                skill &&
                !formData.skillsToTeach.some((s) => s.skill === skill)
              ) {
                setFormData((prev) => ({
                  ...prev,
                  skillsToTeach: [
                    ...prev.skillsToTeach,
                    { skill, level: 1, teaching_time: 10 },
                  ],
                }));
                setNewTeachSkill("");
              }
            }}
            disabled={
              !newTeachSkill.trim() || formData.skillsToTeach.length >= 5
            }
          >
            Add
          </Button>
        </div>
        {formData.skillsToTeach.map((s, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">{s.skill}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    skillsToTeach: prev.skillsToTeach.filter(
                      (_, idx) => idx !== i
                    ),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Your teaching level:</p>
                {[1, 2, 3].map((lvl) => (
                  <label
                    key={lvl}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`teach-${i}`}
                      checked={s.level === lvl}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          skillsToTeach: prev.skillsToTeach.map((sk, idx) =>
                            idx === i ? { ...sk, level: lvl } : sk
                          ),
                        }))
                      }
                      className="w-3 h-3"
                    />
                    <span className="text-sm">
                      {lvl === 1 && "Beginner"}
                      {lvl === 2 && "Know the basics"}
                      {lvl === 3 && "Intermediate"}
                    </span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  How long will it take you to teach this skill?
                </p>
                <div className="flex gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`teach-time-${i}`}
                      checked={s.teaching_time === 5}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          skillsToTeach: prev.skillsToTeach.map((sk, idx) =>
                            idx === i ? { ...sk, teaching_time: 5 } : sk
                          ),
                        }))
                      }
                      className="w-3 h-3"
                    />
                    <span className="text-sm">5 hours</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer ml-4">
                    <input
                      type="radio"
                      name={`teach-time-${i}`}
                      checked={s.teaching_time === 10}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          skillsToTeach: prev.skillsToTeach.map((sk, idx) =>
                            idx === i ? { ...sk, teaching_time: 10 } : sk
                          ),
                        }))
                      }
                      className="w-3 h-3"
                    />
                    <span className="text-sm">10 hours</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          2. What skills are you interested in learning? (5 MAX) *
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter a skill you want to learn"
            value={newLearnSkill}
            onChange={(e) => setNewLearnSkill(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => {
              const skill = newLearnSkill.trim();
              if (
                skill &&
                !formData.skillsToLearn.some((s) => s.skill === skill)
              ) {
                setFormData((prev) => ({
                  ...prev,
                  skillsToLearn: [...prev.skillsToLearn, { skill, level: 1 }],
                }));
                setNewLearnSkill("");
              }
            }}
            disabled={
              !newLearnSkill.trim() || formData.skillsToLearn.length >= 5
            }
          >
            Add
          </Button>
        </div>
        {formData.skillsToLearn.map((s, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">{s.skill}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    skillsToLearn: prev.skillsToLearn.filter(
                      (_, idx) => idx !== i
                    ),
                  }))
                }
              >
                Remove
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Your current level:</p>
              {[1, 2, 3].map((lvl) => (
                <label
                  key={lvl}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`learn-${i}`}
                    checked={s.level === lvl}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        skillsToLearn: prev.skillsToLearn.map((sk, idx) =>
                          idx === i ? { ...sk, level: lvl } : sk
                        ),
                      }))
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-sm">
                    {lvl === 1 && "Complete beginner"}
                    {lvl === 2 && "Know the basics"}
                    {lvl === 3 && "Intermediate"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          3. Night owl or early bird? *
        </Label>
        {["early-bird", "night-owl"].map((val) => (
          <label
            key={val}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="radio"
              name="chronotype"
              value={val}
              checked={formData.chronotype === val}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, chronotype: e.target.value }))
              }
              className="w-4 h-4"
            />
            <span>{val === "early-bird" ? "Early bird" : "Night owl"}</span>
          </label>
        ))}
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          4. When are you usually available in your local timezone? (Pick all
          that apply) *
        </Label>
        <div className="grid grid-cols-1 gap-3">
          {availabilityOptions.map((opt) => (
            <label
              key={opt}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.availability.includes(opt)}
                onChange={() => handleAvailabilityChange(opt)}
                className="w-4 h-4"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          5. Communication Style - How do you prefer to communicate? *
        </Label>
        {["casual", "direct"].map((val) => (
          <label
            key={val}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="radio"
              name="communicationStyle"
              value={val}
              checked={formData.communicationStyle === val}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  communicationStyle: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>
              {val === "casual"
                ? "Casual & conversational"
                : "Direct & to the point"}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          6. Which time zone are you in? *
        </Label>
        <select
          value={formData.timeZone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, timeZone: e.target.value }))
          }
          className="w-full p-3 border rounded-md"
        >
          <option value="">Select your time zone</option>
          {timeZones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
