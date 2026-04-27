export const PERIOD_OPTIONS = [
  {
    id: "2025",
    label: "2025.04.01 - 2026.03.30",
    start: "2025-04-01",
    end: "2026-03-30",
  },
  {
    id: "2026",
    label: "2026.04.01 - 2027.03.30",
    start: "2026-04-01",
    end: "2027-03-30",
  },
] as const;

export const SERVICE_OPTIONS = [
  "서비스 A",
  "서비스 B",
  "서비스 C",
  "서비스 D",
  "서비스 E",
] as const;

export const PLATFORM_OPTIONS = ["Web", "iOS", "Android"] as const;

export const ISSUE_STATUS_OPTIONS = ["이슈", "이슈 아님"] as const;

export const FIX_STATUS_OPTIONS = ["수정 필요", "수정 완료"] as const;

export const NOT_ISSUE_REASON_OPTIONS = [
  "기획 의도에 부합",
  "중복 제보",
  "사용자 오인",
  "개선 불가",
  "기타",
] as const;
