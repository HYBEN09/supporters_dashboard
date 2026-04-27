import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
  PLATFORM_OPTIONS,
  SERVICE_OPTIONS,
} from "../../data/filterOptions";
import type { IssueUpdate } from "../../features/issues/issueContext";
import type { IssueFormValues, IssueItem } from "../../types/issue";
import { formatDate, getIssueJiraLinks } from "../../utils/formatters";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import styles from "./DetailModal.module.css";

const editableServiceOptions = [
  ...SERVICE_OPTIONS,
  ...ISSUE_FORM_SERVICE_OPTIONS,
] as const;

const editablePlatformOptions = [
  ...PLATFORM_OPTIONS,
  ...ISSUE_FORM_PLATFORM_OPTIONS,
] as const;

const uniqueServiceOptions = Array.from(new Set(editableServiceOptions));
const uniquePlatformOptions = Array.from(new Set(editablePlatformOptions));

type DetailModalProps = {
  issue: IssueItem | null;
  onClose: () => void;
  onSave?: (id: string, updates: IssueUpdate) => void;
};

function getDefaultValues(issue: IssueItem): IssueFormValues {
  return {
    registeredAt: issue.registeredAt,
    authorName: issue.authorName,
    serviceName: issue.serviceName,
    platform: issue.platform,
    issueStatus: issue.issueStatus,
    fixStatus: issue.fixStatus,
    notIssueReason: issue.notIssueReason ?? "",
    supporterJiraUrl: issue.supporterJiraUrl ?? issue.jiraKey ?? "",
    serviceJiraUrl: issue.serviceJiraUrl ?? "",
  };
}

export function DetailModal({ issue, onClose, onSave }: DetailModalProps) {
  if (!issue) {
    return null;
  }

  return (
    <DetailModalContent issue={issue} onClose={onClose} onSave={onSave} />
  );
}

type DetailModalContentProps = {
  issue: IssueItem;
  onClose: () => void;
  onSave?: (id: string, updates: IssueUpdate) => void;
};

function DetailModalContent({ issue, onClose, onSave }: DetailModalContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    formState: { errors },
    control,
    handleSubmit,
    register,
    reset,
  } = useForm<IssueFormValues>({
    defaultValues: getDefaultValues(issue),
  });
  const issueStatus = useWatch({ control, name: "issueStatus" });
  const isNotIssue = issueStatus === "이슈 아님";

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
      fixStatus: values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      jiraKey: undefined,
      supporterJiraUrl: values.supporterJiraUrl.trim() || undefined,
      serviceJiraUrl: values.serviceJiraUrl.trim() || undefined,
    });
    setIsEditing(false);
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
          <div>
            <h2>제보 상세</h2>
            <p>{issue.id}</p>
          </div>
          <div className={styles.headerActions}>
            {!isEditing ? (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
        {!isEditing ? (
          <dl className={styles.details}>
            <div>
              <dt>등록일</dt>
              <dd>{formatDate(issue.registeredAt)}</dd>
            </div>
            <div>
              <dt>작성자</dt>
              <dd>{issue.authorName}</dd>
            </div>
            <div>
              <dt>서비스명</dt>
              <dd>{issue.serviceName}</dd>
            </div>
            <div>
              <dt>플랫폼</dt>
              <dd>{issue.platform}</dd>
            </div>
            <div>
              <dt>실행 경로</dt>
              <dd>{issue.path}</dd>
            </div>
            <div>
              <dt>이슈 여부</dt>
              <dd>
                <StatusBadge value={issue.issueStatus} />
              </dd>
            </div>
            <div>
              <dt>수정 여부</dt>
              <dd>
                <StatusBadge value={issue.fixStatus} />
              </dd>
            </div>
            <div>
              <dt>이슈 아님 사유</dt>
              <dd>{issue.notIssueReason ?? "-"}</dd>
            </div>
            <div>
              <dt>Jira 링크</dt>
              <dd>
                {getIssueJiraLinks(issue).length > 0 ? (
                  <div className={styles.jiraLinkList}>
                    {getIssueJiraLinks(issue).map((link) => (
                      <a href={link.url} key={link.label} rel="noreferrer" target="_blank">
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </dl>
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
              <input
                {...register("authorName", {
                  required: "작성자 이름은 필수입니다.",
                })}
              />
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
              <select {...register("fixStatus")}>
                {FIX_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>이슈 아님 사유</span>
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
              <label>
                <strong>서비스 전달</strong>
                <input
                  placeholder="https://jira.daumkakao.com/browse/..."
                  {...register("serviceJiraUrl")}
                />
              </label>
            </div>
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
