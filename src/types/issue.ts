import type {
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
} from "../data/filterOptions";

type IssueFormServiceName = (typeof ISSUE_FORM_SERVICE_OPTIONS)[number];

type IssueFormPlatform = (typeof ISSUE_FORM_PLATFORM_OPTIONS)[number];

export type ServiceName =
  | "서비스 A"
  | "서비스 B"
  | "서비스 C"
  | "서비스 D"
  | "서비스 E"
  | IssueFormServiceName;

export type Platform = "Web" | "iOS" | "Android" | IssueFormPlatform;

export type IssueStatus = "이슈" | "이슈 아님";

export type FixStatus = "수정 필요" | "수정 완료";

export type NotIssueReason =
  | "기획 의도에 부합"
  | "중복 제보"
  | "사용자 오인"
  | "개선 불가"
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
};

export type SelectableFilter<T extends string> = "전체" | T;

export type IssueFilters = {
  keyword: string;
  periodId: string;
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
  path: string;
  issueStatus: IssueStatus | "";
  fixStatus: FixStatus;
  notIssueReason: NotIssueReason | "";
  jiraKey: string;
};
