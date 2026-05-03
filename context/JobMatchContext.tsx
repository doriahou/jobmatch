"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type {
  StructuredOutput,
  InterviewOutput,
} from "@/lib/difyApi";

// ─── Re-export for convenience ────────────────────────────────────────────────
export type { StructuredOutput, InterviewOutput };

// ─── Status types ─────────────────────────────────────────────────────────────

export type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";
export type InterviewStatus = "idle" | "loading" | "done" | "error";

// ─── State ────────────────────────────────────────────────────────────────────

interface JobMatchState {
  // Inputs
  jdText: string;
  resumeFile: File | null;
  resumeFileId: string | null;

  // Analysis workflow
  analysisStatus: AnalysisStatus;
  analysisOutput: StructuredOutput | null;

  // Interview workflow
  interviewStatus: InterviewStatus;
  interviewOutput: InterviewOutput | null;

  // Error
  errorMessage: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_JD_TEXT"; payload: string }
  | { type: "SET_RESUME_FILE"; payload: File | null }
  | { type: "SET_RESUME_FILE_ID"; payload: string }
  | { type: "SET_ANALYSIS_STATUS"; payload: AnalysisStatus }
  | { type: "SET_ANALYSIS_OUTPUT"; payload: StructuredOutput }
  | { type: "SET_INTERVIEW_STATUS"; payload: InterviewStatus }
  | { type: "SET_INTERVIEW_OUTPUT"; payload: InterviewOutput }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: JobMatchState = {
  jdText: "",
  resumeFile: null,
  resumeFileId: null,
  analysisStatus: "idle",
  analysisOutput: null,
  interviewStatus: "idle",
  interviewOutput: null,
  errorMessage: null,
};

function reducer(state: JobMatchState, action: Action): JobMatchState {
  switch (action.type) {
    case "SET_JD_TEXT":
      return { ...state, jdText: action.payload };

    case "SET_RESUME_FILE":
      return { ...state, resumeFile: action.payload, resumeFileId: null };

    case "SET_RESUME_FILE_ID":
      return { ...state, resumeFileId: action.payload };

    case "SET_ANALYSIS_STATUS":
      return { ...state, analysisStatus: action.payload, errorMessage: null };

    case "SET_ANALYSIS_OUTPUT":
      return {
        ...state,
        analysisOutput: action.payload,
        analysisStatus: "done",
        errorMessage: null,
      };

    case "SET_INTERVIEW_STATUS":
      return { ...state, interviewStatus: action.payload };

    case "SET_INTERVIEW_OUTPUT":
      return {
        ...state,
        interviewOutput: action.payload,
        interviewStatus: "done",
      };

    case "SET_ERROR":
      return { ...state, errorMessage: action.payload, analysisStatus: "error" };

    case "CLEAR_ERROR":
      return {
        ...state,
        errorMessage: null,
        analysisStatus: state.analysisStatus === "error" ? "idle" : state.analysisStatus,
        interviewStatus: state.interviewStatus === "error" ? "idle" : state.interviewStatus,
      };

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface JobMatchContextValue {
  state: JobMatchState;
  dispatch: React.Dispatch<Action>;
}

const JobMatchContext = createContext<JobMatchContextValue | undefined>(undefined);

export function JobMatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <JobMatchContext.Provider value={{ state, dispatch }}>
      {children}
    </JobMatchContext.Provider>
  );
}

export function useJobMatch(): JobMatchContextValue {
  const ctx = useContext(JobMatchContext);
  if (!ctx) throw new Error("useJobMatch must be used inside <JobMatchProvider>");
  return ctx;
}
