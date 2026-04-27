import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
  PLATFORM_OPTIONS,
  SERVICE_OPTIONS,
} from "../data/filterOptions";
import { useIssues } from "../features/issues/useIssues";
import type { IssueFormValues, IssueItem } from "../types/issue";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import styles from "./IssueFormPage.module.css";

const defaultValues: IssueFormValues = {
  registeredAt: new Date().toISOString().slice(0, 10),
  authorName: "",
  serviceName: "",
  platform: "",
  path: "",
  issueStatus: "",
  fixStatus: "수정 필요",
  notIssueReason: "",
  jiraKey: "",
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

  function toIssueItem(values: IssueFormValues): Omit<IssueItem, "id"> {
    return {
      registeredAt: values.registeredAt,
      authorName: values.authorName.trim(),
      serviceName: values.serviceName || "서비스 A",
      platform: values.platform || "Web",
      path: values.path.trim() || "-",
      issueStatus: values.issueStatus || "이슈",
      fixStatus: values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      jiraKey: values.jiraKey.trim() || undefined,
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
    <>
      <PageHeader
        title="이슈 입력 뷰"
        description="서포터즈 제보 내용을 운영 데이터로 등록합니다."
      />

      <SectionCard title="제보 등록">
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>등록일</span>
              <input
                type="date"
                {...register("registeredAt", { required: "등록일은 필수입니다." })}
              />
              {errors.registeredAt ? (
                <em>{errors.registeredAt.message}</em>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>작성자 이름</span>
              <input
                placeholder="예: 김민준"
                {...register("authorName", {
                  required: "작성자 이름은 필수입니다.",
                })}
              />
              {errors.authorName ? <em>{errors.authorName.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>서비스명</span>
              <select
                {...register("serviceName", {
                  required: "서비스명은 필수입니다.",
                })}
              >
                <option value="">선택</option>
                {SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              {errors.serviceName ? <em>{errors.serviceName.message}</em> : null}
            </label>

            <label className={styles.field}>
              <span>플랫폼</span>
              <select
                {...register("platform", {
                  required: "플랫폼은 필수입니다.",
                })}
              >
                <option value="">선택</option>
                {PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              {errors.platform ? <em>{errors.platform.message}</em> : null}
            </label>

            <label className={`${styles.field} ${styles.wide}`}>
              <span>실행 경로</span>
              <input placeholder="예: /payment/coupon" {...register("path")} />
            </label>

            <label className={styles.field}>
              <span>이슈 여부</span>
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
              {errors.issueStatus ? <em>{errors.issueStatus.message}</em> : null}
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

            {issueStatus === "이슈 아님" ? (
              <label className={styles.field}>
                <span>이슈 아님 사유</span>
                <select {...register("notIssueReason")}>
                  <option value="">선택</option>
                  {NOT_ISSUE_REASON_OPTIONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className={styles.field}>
              <span>지라 카드 번호</span>
              <input placeholder="예: SPT-201" {...register("jiraKey")} />
            </label>
          </div>

          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={saveDraft}>
              임시 저장
            </Button>
            <Button type="submit" variant="primary">
              등록
            </Button>
            <Button variant="ghost" onClick={resetForm}>
              초기화
            </Button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
