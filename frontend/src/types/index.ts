export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Option {
  id: string;
  question_id: string;
  text: string;
  order_index: number;
}

export interface Question {
  id: string;
  poll_id: string;
  text: string;
  is_mandatory: boolean;
  order_index: number;
  options: Option[];
}

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  is_anonymous: boolean;
  expires_at: string | null;
  is_published: boolean;
  is_active: boolean;
  public_link: string;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  response_count?: number;
  question_count?: number;
}

export interface OptionAnalytics {
  option: Option;
  count: number;
  percentage: number;
}

export interface QuestionAnalytics {
  question: Question;
  options: OptionAnalytics[];
  total_answers: number;
  response_rate: number;
}

export interface RecentResponse {
  submitted_at: string;
  respondent_name?: string;
}

export interface Analytics {
  poll: Poll;
  total_responses: number;
  questions: QuestionAnalytics[];
  participation_rate: number;
  recent_responses: RecentResponse[];
}

export interface PublicPollData {
  poll: Poll;
  questions?: Question[];
  analytics?: Analytics;
  alreadyResponded?: boolean;
  view: 'form' | 'results' | 'expired';
}

export interface CreatePollForm {
  title: string;
  description: string;
  is_anonymous: boolean;
  expires_at: string;
  questions: CreateQuestionForm[];
}

export interface CreateQuestionForm {
  text: string;
  is_mandatory: boolean;
  options: string[];
}

export interface AnswerInput {
  question_id: string;
  option_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}
