import type {
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
} from "../data/filterOptions";

type IssueFormServiceName = (typeof ISSUE_FORM_SERVICE_OPTIONS)[number];

type IssueFormPlatform = (typeof ISSUE_FORM_PLATFORM_OPTIONS)[number];

export type ServiceName = IssueFormServiceName;

export type Platform = IssueFormPlatform;

export type IssueStatus = "이슈" | "이슈 아님" | "보류";

export type FixStatus = "-" | "수정 필요" | "수정 완료";

export type NotIssueReason =
  | "정상 작동(이슈 재현 안됨)"
  | "실행 경로 불명확"
  | "사용성 이슈"
  | "기능 개발 요청"
  | "접근성 이슈 아님"
  | "기타";

export type IssueItem = {
  id: string;
  registeredAt: string;
  authorName: string;
  serviceName: ServiceName;
  platform: Platform;
  path: string;
  issueStatus: IssueStatus;
  fixStatus: FixStatus;
  notIssueReason?: NotIssueReason;
  jiraKey?: string;
  supporterJiraUrl?: string;
  serviceJiraUrl?: string;
  memo?: string;
};

export type SelectableFilter<T extends string> = "전체" | T;

export type IssueFilters = {
  keyword: string;
  periodStart: string;
  periodEnd: string;
  serviceName: SelectableFilter<ServiceName>;
  platform: SelectableFilter<Platform>;
  issueStatus: SelectableFilter<IssueStatus>;
  fixStatus: SelectableFilter<FixStatus>;
};

export type IssueFormValues = {
  registeredAt: string;
  authorName: string;
  serviceName: ServiceName | "";
  platform: Platform;
  issueStatus: IssueStatus | "";
  fixStatus: FixStatus;
  notIssueReason: NotIssueReason | "";
  supporterJiraUrl: string;
  serviceJiraUrl: string;
  memo: string;
};
