import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
  SERVICE_OPTIONS,
} from "../../data/filterOptions";
import { useAuth } from "../../features/auth/useAuth";
import type { IssueUpdate } from "../../features/issues/issueContext";
import type { IssueFormValues, IssueItem } from "../../types/issue";
import {
  formatDate,
  getIssueJiraLinks,
  getServiceJiraUrls,
} from "../../utils/formatters";
import { linkifyText } from "../../utils/linkify";
import { Button } from "./Button";
import { NotIssueReasonHelp } from "./NotIssueReasonHelp";
import { StatusBadge } from "./StatusBadge";
import styles from "./DetailModal.module.css";

const editableServiceOptions = [
  ...SERVICE_OPTIONS,
  ...ISSUE_FORM_SERVICE_OPTIONS,
] as const;

const editablePlatformOptions = [...ISSUE_FORM_PLATFORM_OPTIONS] as const;
const uniqueServiceOptions = Array.from(new Set(editableServiceOptions));
const uniquePlatformOptions = Array.from(new Set(editablePlatformOptions));

type DetailIconName =
  | "ban"
  | "calendar"
  | "check"
  | "circle"
  | "clock"
  | "copy"
  | "edit"
  | "external"
  | "file"
  | "globe"
  | "link"
  | "monitor"
  | "trash"
  | "user"
  | "x";

function DetailIcon({ name }: { name: DetailIconName }) {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      viewBox="0 0 24 24"
    >
      {name === "calendar" ? (
        <>
          <path d="M8 3v4M16 3v4M4 9h16" />
          <rect height="16" rx="2" width="16" x="4" y="5" />
        </>
      ) : null}
      {name === "user" ? (
        <>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </>
      ) : null}
      {name === "monitor" ? (
        <>
          <rect height="12" rx="2" width="18" x="3" y="4" />
          <path d="M8 20h8M12 16v4" />
        </>
      ) : null}
      {name === "globe" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      ) : null}
      {name === "circle" ? <circle cx="12" cy="12" r="8" /> : null}
      {name === "check" ? <path d="m5 12 4 4L19 6" /> : null}
      {name === "ban" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m5 5 14 14" />
        </>
      ) : null}
      {name === "link" ? (
        <>
          <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
          <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
        </>
      ) : null}
      {name === "file" ? (
        <>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
          <path d="M14 3v6h6" />
        </>
      ) : null}
      {name === "clock" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ) : null}
      {name === "edit" ? (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </>
      ) : null}
      {name === "x" ? <path d="M18 6 6 18M6 6l12 12" /> : null}
      {name === "external" ? (
        <>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </>
      ) : null}
      {name === "copy" ? (
        <>
          <rect height="13" rx="2" width="13" x="8" y="8" />
          <path d="M4 16c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2" />
        </>
      ) : null}
      {name === "trash" ? (
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2M19 6l-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </>
      ) : null}
    </svg>
  );
}

type DetailModalProps = {
  issue: IssueItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onSave?: (id: string, updates: IssueUpdate) => void;
};

function createServiceJiraField(value = "") {
  return { value };
}

function getDefaultValues(issue: IssueItem): IssueFormValues {
  const serviceJiraUrls = getServiceJiraUrls(issue.serviceJiraUrl).map((value) =>
    createServiceJiraField(value),
  );

  return {
    registeredAt: issue.registeredAt,
    authorName: issue.authorName,
    serviceName: issue.serviceName,
    platform: issue.platform,
    issueStatus: issue.issueStatus,
    fixStatus: issue.fixStatus,
    notIssueReason: issue.notIssueReason ?? "",
    supporterJiraUrl: issue.supporterJiraUrl ?? issue.jiraKey ?? "",
    serviceJiraUrls: serviceJiraUrls.length > 0 ? serviceJiraUrls : [createServiceJiraField()],
    memo: issue.memo ?? "",
  };
}

function getJoinedServiceJiraUrls(values: IssueFormValues) {
  const joinedValue = values.serviceJiraUrls
    .map((item) => item.value.trim())
    .filter(Boolean)
    .join("\n");

  return joinedValue || undefined;
}

export function DetailModal({ issue, onClose, onDelete, onSave }: DetailModalProps) {
  if (!issue) {
    return null;
  }

  return (
    <DetailModalContent
      issue={issue}
      onClose={onClose}
      onDelete={onDelete}
      onSave={onSave}
    />
  );
}

type DetailModalContentProps = {
  issue: IssueItem;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onSave?: (id: string, updates: IssueUpdate) => void;
};

function DetailModalContent({
  issue,
  onClose,
  onDelete,
  onSave,
}: DetailModalContentProps) {
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const {
    formState: { errors },
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<IssueFormValues>({
    defaultValues: getDefaultValues(issue),
  });
  const {
    fields: serviceJiraFields,
    append: appendServiceJiraField,
    remove: removeServiceJiraField,
  } = useFieldArray({
    control,
    name: "serviceJiraUrls",
  });
  const issueStatus = useWatch({ control, name: "issueStatus" });
  const isNotIssue = issueStatus === "이슈 아님";
  const isFixStatusLocked = issueStatus === "이슈 아님" || issueStatus === "보류";
  const jiraLinks = getIssueJiraLinks(issue);
  const jiraLinkGroups = [
    {
      kind: "supporter",
      label: "서포터즈",
      links: jiraLinks.filter((link) => link.kind === "supporter"),
    },
    {
      kind: "service",
      label: "서비스 전달",
      links: jiraLinks.filter((link) => link.kind === "service"),
    },
  ].filter((group) => group.links.length > 0);

  useEffect(() => {
    if (isFixStatusLocked) {
      setValue("fixStatus", "-");
      return;
    }

    if (getValues("fixStatus") === "-") {
      setValue("fixStatus", "수정 필요");
    }
  }, [getValues, isFixStatusLocked, setValue]);

  function cancelEditing() {
    reset(getDefaultValues(issue));
    setIsEditing(false);
  }

  function saveIssue(values: IssueFormValues) {
    onSave?.(issue.id, {
      registeredAt: values.registeredAt,
      authorName: values.authorName.trim(),
      serviceName: values.serviceName || issue.serviceName,
      platform: values.platform,
      issueStatus: values.issueStatus || issue.issueStatus,
      fixStatus:
        values.issueStatus === "이슈 아님" || values.issueStatus === "보류"
          ? "-"
          : values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      jiraKey: undefined,
      supporterJiraUrl: values.supporterJiraUrl.trim() || undefined,
      serviceJiraUrl: getJoinedServiceJiraUrls(values),
      memo: values.memo.trim() || undefined,
    });
    setIsEditing(false);
  }

  async function copyIssue() {
    const jiraLinks = getIssueJiraLinks(issue)
      .map((link) => `${link.label}: ${link.url}`)
      .join("\n");
    const text = [
      `제보 번호: ${issue.id}`,
      `등록일: ${formatDate(issue.registeredAt)}`,
      `작성자: ${issue.authorName || "-"}`,
      `서비스명: ${issue.serviceName}`,
      `플랫폼: ${issue.platform}`,
      `이슈 여부: ${issue.issueStatus}`,
      `수정 여부: ${issue.fixStatus}`,
      `이슈 아님 사유: ${issue.notIssueReason ?? "-"}`,
      `Jira 링크: ${jiraLinks || "-"}`,
      `비고 / 전달 메모: ${issue.memo ?? "-"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("복사 완료");
    } catch {
      setCopyMessage("복사 실패");
    }
  }

  function deleteCurrentIssue() {
    if (
      !window.confirm(
        `${issue.id} 제보를 삭제할까요? 휴지통으로 이동하며, 이후 휴지통에서 복원할 수 있습니다.`,
      )
    ) {
      return;
    }

    onDelete?.(issue.id);
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={styles.modal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.idBadge}>{issue.id}</span>
            <h2>제보 상세</h2>
            <div className={styles.headerBadges}>
              <StatusBadge value={issue.issueStatus} />
              <StatusBadge value={issue.fixStatus} />
            </div>
          </div>
          <div className={styles.headerActions}>
            {!isEditing && isAuthenticated ? (
              <Button
                className={styles.editButton}
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <DetailIcon name="edit" />
                수정
              </Button>
            ) : null}
            <Button className={styles.closeButton} variant="ghost" onClick={onClose}>
              <DetailIcon name="x" />
              닫기
            </Button>
          </div>
        </div>

        {!isEditing ? (
          <>
            <dl className={styles.details}>
              <div>
                <dt>
                  <DetailIcon name="calendar" />
                  등록일
                </dt>
                <dd>{formatDate(issue.registeredAt)}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="user" />
                  작성자
                </dt>
                <dd>{issue.authorName || "-"}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="monitor" />
                  서비스명
                </dt>
                <dd>{issue.serviceName}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="globe" />
                  플랫폼
                </dt>
                <dd>{issue.platform}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="circle" />
                  이슈 여부
                </dt>
                <dd>
                  <StatusBadge value={issue.issueStatus} />
                </dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="check" />
                  수정 여부
                </dt>
                <dd>
                  <StatusBadge value={issue.fixStatus} />
                </dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="ban" />
                  이슈 아님 사유
                </dt>
                <dd>{issue.notIssueReason ?? "-"}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="link" />
                  Jira 링크
                </dt>
                <dd>
                  {jiraLinkGroups.length > 0 ? (
                    <div className={styles.jiraLinkGroups}>
                      {jiraLinkGroups.map((group) => (
                        <div className={styles.jiraLinkGroup} key={group.kind}>
                          <span className={styles.jiraLinkGroupLabel}>{group.label}</span>
                          <div className={styles.jiraLinkList}>
                            {group.links.map((link) => (
                              <a
                                href={link.url}
                                key={`${link.label}-${link.url}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <DetailIcon name="external" />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="user" />
                  등록자 계정
                </dt>
                <dd>{issue.createdBy ?? "-"}</dd>
              </div>
              <div>
                <dt>
                  <DetailIcon name="edit" />
                  최종 수정자
                </dt>
                <dd>{issue.updatedBy ?? "-"}</dd>
              </div>
              <div className={styles.memoDetailRow}>
                <dt>
                  <DetailIcon name="file" />
                  비고 / 전달 메모
                </dt>
                <dd>{issue.memo ? linkifyText(issue.memo) : "-"}</dd>
              </div>
            </dl>
            <footer className={styles.footer}>
              <span>
                <DetailIcon name="clock" />
                최종 수정 {formatDate(issue.registeredAt)}
                {copyMessage ? ` · ${copyMessage}` : ""}
              </span>
              <div className={styles.footerActions}>
                <button className={styles.utilityButton} type="button" onClick={copyIssue}>
                  <DetailIcon name="copy" />
                  복사
                </button>
                {isAuthenticated ? (
                  <button
                    className={styles.utilityButton}
                    type="button"
                    onClick={deleteCurrentIssue}
                  >
                    <DetailIcon name="trash" />
                    삭제
                  </button>
                ) : null}
              </div>
            </footer>
          </>
        ) : (
          <form className={styles.editForm} onSubmit={handleSubmit(saveIssue)}>
            <label>
              <span>등록일</span>
              <input
                type="date"
                {...register("registeredAt", {
                  required: "등록일은 필수입니다.",
                })}
              />
              {errors.registeredAt ? <em>{errors.registeredAt.message}</em> : null}
            </label>
            <label>
              <span>작성자</span>
              <input {...register("authorName")} />
              {errors.authorName ? <em>{errors.authorName.message}</em> : null}
            </label>
            <label>
              <span>서비스명</span>
              <select
                {...register("serviceName", {
                  required: "서비스명은 필수입니다.",
                })}
              >
                {uniqueServiceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              {errors.serviceName ? <em>{errors.serviceName.message}</em> : null}
            </label>
            <label>
              <span>플랫폼</span>
              <select {...register("platform")}>
                {uniquePlatformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>이슈 여부</span>
              <select
                {...register("issueStatus", {
                  required: "이슈 여부는 필수입니다.",
                })}
              >
                {ISSUE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.issueStatus ? <em>{errors.issueStatus.message}</em> : null}
            </label>
            <label>
              <span>수정 여부</span>
              <select disabled={isFixStatusLocked} {...register("fixStatus")}>
                {isFixStatusLocked ? <option value="-">-</option> : null}
                {FIX_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                이슈 아님 사유
                <NotIssueReasonHelp />
              </span>
              <select disabled={!isNotIssue} {...register("notIssueReason")}>
                <option value="">선택</option>
                {NOT_ISSUE_REASON_OPTIONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.jiraEditor}>
              <span>Jira 링크</span>
              <label>
                <strong>서포터즈</strong>
                <input
                  placeholder="https://jira.example.com/browse/SUP-..."
                  {...register("supporterJiraUrl")}
                />
              </label>
              <div className={styles.serviceJiraEditorGroup}>
                {serviceJiraFields.map((field, index) => (
                  <label key={field.id}>
                    <strong>서비스 전달</strong>
                    <div className={styles.serviceJiraEditorRow}>
                      <input
                        placeholder="https://jira.daumkakao.com/browse/..."
                        {...register(`serviceJiraUrls.${index}.value`)}
                      />
                      {serviceJiraFields.length > 1 ? (
                        <button
                          className={styles.serviceJiraEditorRemoveButton}
                          type="button"
                          onClick={() => removeServiceJiraField(index)}
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                  </label>
                ))}

                <button
                  className={styles.serviceJiraEditorAddButton}
                  type="button"
                  onClick={() => appendServiceJiraField(createServiceJiraField())}
                >
                  + 서비스 전달 링크 추가
                </button>
              </div>
            </div>
            <label className={styles.memoEditor}>
              <span>비고 / 전달 메모</span>
              <textarea
                placeholder="추가 메모나 전달 사항을 입력하세요"
                rows={4}
                {...register("memo")}
              />
            </label>
            <div className={styles.formActions}>
              <Button variant="ghost" onClick={cancelEditing}>
                취소
              </Button>
              <Button type="submit" variant="primary">
                저장
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
