export type EventCategory = "holiday" | "tax" | "school" | "deadline" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startDate: string;
  endDate: string | null;
  recurrence: "none" | "yearly" | "monthly";
  location: string | null;
  source: string | null;
  sourceUrl: string | null;
  tags: string[];
  embedding: ArrayBuffer | null;
  embeddingModel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolTerm {
  id: string;
  name: string;
  year: number;
  termNumber: number;
  startDate: string;
  endDate: string;
}

export interface EventInput {
  title: string;
  description?: string | null;
  category?: EventCategory;
  startDate: string;
  endDate?: string | null;
  recurrence?: "none" | "yearly" | "monthly";
  location?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string[];
}
