import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
} from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import type { IssueFormValues, IssueItem } from "../types/issue";
import { Button } from "../components/ui/Button";
import styles from "./IssueFormPage.module.css";

const defaultValues: IssueFormValues = {
  registeredAt: new Date().toISOString().slice(0, 10),
  authorName: "",
  serviceName: "",
  platform: "선택 안 함",
  issueStatus: "",
  fixStatus: "수정 필요",
  notIssueReason: "",
  supporterJiraUrl: "",
  serviceJiraUrl: "",
};

export function IssueFormPage() {
  const { addIssue } = useIssues();
  const [message, setMessage] = useState("");
  const {
    formState: { errors },
    control,
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm<IssueFormValues>({ defaultValues });
  const issueStatus = useWatch({ control, name: "issueStatus" });
  const isNotIssue = issueStatus === "이슈 아님";

  function toIssueItem(values: IssueFormValues): Omit<IssueItem, "id"> {
    return {
      registeredAt: values.registeredAt,
      authorName: values.authorName.trim(),
      serviceName: values.serviceName || "카카오톡",
      platform: values.platform,
      path: "-",
      issueStatus: values.issueStatus || "이슈",
      fixStatus: values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      supporterJiraUrl: values.supporterJiraUrl.trim() || undefined,
      serviceJiraUrl: values.serviceJiraUrl.trim() || undefined,
    };
  }

  function onSubmit(values: IssueFormValues) {
    const createdIssue = addIssue(toIssueItem(values));
    setMessage(`${createdIssue.id} 제보가 등록되었습니다.`);
    reset(defaultValues);
  }

  function saveDraft() {
    const values = getValues();
    localStorage.setItem("supporters-issue-draft", JSON.stringify(values));
    console.info("임시 저장", values);
    setMessage("입력 중인 내용이 임시 저장되었습니다.");
  }

  function resetForm() {
    reset(defaultValues);
    setMessage("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>이슈 입력 뷰</h1>
          <p>서포터즈 제보 내용을 운영 데이터로 등록합니다.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>제보 등록</h2>
          <span className={styles.requiredGuide}>* 표시는 필수입니다</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <fieldset className={styles.section}>
            <legend>
              <span>1</span>
              기본 정보
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>
                  등록일 <b>*</b>
                </span>
                <input
                  type="date"
                  {...register("registeredAt", {
                    required: "등록일은 필수입니다.",
                  })}
                />
                {errors.registeredAt ? (
                  <em>{errors.registeredAt.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  작성자 이름 <small>선택</small>
                </span>
                <input
                  placeholder="예: 김민준"
                  {...register("authorName", {
                    required: "작성자 이름은 필수입니다.",
                  })}
                />
                {errors.authorName ? (
                  <em>{errors.authorName.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>
                  서비스명 <b>*</b>
                </span>
                <select
                  {...register("serviceName", {
                    required: "서비스명은 필수입니다.",
                  })}
                >
                  <option value="">선택</option>
                  {ISSUE_FORM_SERVICE_OPTIONS.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {errors.serviceName ? (
                  <em>{errors.serviceName.message}</em>
                ) : null}
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>2</span>
              상태 분류
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>플랫폼</span>
                <select
                  {...register("platform", {
                    required: "플랫폼은 필수입니다.",
                  })}
                >
                  {ISSUE_FORM_PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                {errors.platform ? <em>{errors.platform.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>
                  이슈 여부 <b>*</b>
                </span>
                <select
                  {...register("issueStatus", {
                    required: "이슈 여부는 필수입니다.",
                  })}
                >
                  <option value="">선택</option>
                  {ISSUE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {errors.issueStatus ? (
                  <em>{errors.issueStatus.message}</em>
                ) : null}
              </label>

              <label className={styles.field}>
                <span>수정 여부</span>
                <select {...register("fixStatus")}>
                  {FIX_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>3</span>
              추가 정보
            </legend>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>
                  이슈 아님 사유
                  {!isNotIssue ? (
                    <small className={styles.locked}>
                      이슈 아님 선택 시 활성
                    </small>
                  ) : null}
                </span>
                <select disabled={!isNotIssue} {...register("notIssueReason")}>
                  <option value="">선택</option>
                  {NOT_ISSUE_REASON_OPTIONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                <small className={styles.help}>
                  이슈 여부를 이슈 아님으로 선택해야만 활성화됩니다.
                </small>
              </label>

              <div className={`${styles.field} ${styles.wide}`}>
                <span>Jira 링크</span>
                <div className={styles.jiraLinks}>
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
              </div>
            </div>
          </fieldset>

          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.footer}>
            <span className={styles.autoSave}>자동 저장 대기 중</span>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={resetForm}>
                초기화
              </Button>
              <Button variant="secondary" onClick={saveDraft}>
                ▣ 임시 저장
              </Button>
              <Button type="submit" variant="primary">
                ✓ 등록
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
