import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  FIX_STATUS_OPTIONS,
  ISSUE_FORM_PLATFORM_OPTIONS,
  ISSUE_FORM_SERVICE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  NOT_ISSUE_REASON_OPTIONS,
  PERIOD_OPTIONS,
} from "../data/filterOptions";
import { useAuth } from "../features/auth/useAuth";
import { useIssues } from "../features/issues/useIssues";
import { usePeriod } from "../features/period/usePeriod";
import type { IssueFormValues, IssueItem } from "../types/issue";
import { Button } from "../components/ui/Button";
import styles from "./IssueFormPage.module.css";

function createServiceJiraField(value = "") {
  return { value };
}

function createDefaultValues(): IssueFormValues {
  return {
    registeredAt: new Date().toISOString().slice(0, 10),
    authorName: "",
    serviceName: "",
    platform: "선택 안 함",
    issueStatus: "",
    fixStatus: "수정 필요",
    notIssueReason: "",
    supporterJiraUrl: "",
    serviceJiraUrls: [createServiceJiraField()],
    memo: "",
  };
}

function getJoinedServiceJiraUrls(values: IssueFormValues) {
  const joinedValue = values.serviceJiraUrls
    .map((item) => item.value.trim())
    .filter(Boolean)
    .join("\n");

  return joinedValue || undefined;
}

export function IssueFormPage() {
  const { isAuthenticated } = useAuth();
  const { addIssue } = useIssues();
  const { setSelectedPeriodId } = usePeriod();
  const [message, setMessage] = useState("");
  const [formResetKey, setFormResetKey] = useState(0);
  const {
    formState: { errors },
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<IssueFormValues>({ defaultValues: createDefaultValues() });
  const {
    fields: serviceJiraFields,
    append: appendServiceJiraField,
    remove: removeServiceJiraField,
    replace: replaceServiceJiraFields,
  } = useFieldArray({
    control,
    name: "serviceJiraUrls",
  });
  const issueStatus = useWatch({ control, name: "issueStatus" });
  const isNotIssue = issueStatus === "이슈 아님";
  const isFixStatusLocked = issueStatus === "이슈 아님" || issueStatus === "보류";

  useEffect(() => {
    if (isFixStatusLocked) {
      setValue("fixStatus", "-");
      return;
    }

    if (getValues("fixStatus") === "-") {
      setValue("fixStatus", "수정 필요");
    }
  }, [getValues, isFixStatusLocked, setValue]);

  function toIssueItem(values: IssueFormValues): Omit<IssueItem, "id"> {
    return {
      registeredAt: values.registeredAt,
      authorName: values.authorName.trim(),
      serviceName: values.serviceName || "카카오톡",
      platform: values.platform,
      path: "-",
      issueStatus: values.issueStatus || "이슈",
      fixStatus:
        values.issueStatus === "이슈 아님" || values.issueStatus === "보류"
          ? "-"
          : values.fixStatus,
      notIssueReason:
        values.issueStatus === "이슈 아님" && values.notIssueReason
          ? values.notIssueReason
          : undefined,
      supporterJiraUrl: values.supporterJiraUrl.trim() || undefined,
      serviceJiraUrl: getJoinedServiceJiraUrls(values),
      memo: values.memo.trim() || undefined,
    };
  }

  function resetIssueForm() {
    const nextDefaultValues = createDefaultValues();

    reset(nextDefaultValues);
    replaceServiceJiraFields(nextDefaultValues.serviceJiraUrls);
    setValue("registeredAt", nextDefaultValues.registeredAt);
    setValue("authorName", nextDefaultValues.authorName);
    setValue("serviceName", nextDefaultValues.serviceName);
    setValue("platform", nextDefaultValues.platform);
    setValue("issueStatus", nextDefaultValues.issueStatus);
    setValue("fixStatus", nextDefaultValues.fixStatus);
    setValue("notIssueReason", nextDefaultValues.notIssueReason);
    setValue("supporterJiraUrl", nextDefaultValues.supporterJiraUrl);
    setValue("serviceJiraUrls", nextDefaultValues.serviceJiraUrls);
    setValue("memo", nextDefaultValues.memo);
    setFormResetKey((current) => current + 1);
  }

  function onSubmit(values: IssueFormValues) {
    const createdIssue = addIssue(toIssueItem(values));
    const period = PERIOD_OPTIONS.find(
      (option) =>
        createdIssue.registeredAt >= option.start &&
        createdIssue.registeredAt <= option.end,
    );

    if (period) {
      setSelectedPeriodId(period.id);
    }

    setMessage(`${createdIssue.id} 제보가 등록되었습니다.`);
    resetIssueForm();
  }

  function saveDraft() {
    const values = getValues();
    console.info("임시 저장", values);
    setMessage("임시 저장은 브라우저 로컬 저장소에 보관되지 않고 콘솔 기록만 남깁니다.");
  }

  function resetForm() {
    resetIssueForm();
    setMessage("");
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>이슈 입력 뷰</h1>
            <p>서포터즈 제보 내용을 운영 데이터로 등록합니다.</p>
          </div>
        </header>

        <section className={styles.panel}>
          <p>이슈를 등록하려면 로그인이 필요합니다. 우측 상단의 로그인 버튼을 이용해주세요.</p>
        </section>
      </div>
    );
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

        <form
          className={styles.form}
          key={formResetKey}
          onSubmit={handleSubmit(onSubmit)}
        >
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
                <input placeholder="예: 김민준" {...register("authorName")} />
                {errors.authorName ? <em>{errors.authorName.message}</em> : null}
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
                {errors.serviceName ? <em>{errors.serviceName.message}</em> : null}
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

                {errors.issueStatus ? <em>{errors.issueStatus.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>
                  수정 여부
                  {isFixStatusLocked ? (
                    <small className={styles.locked}>
                      이슈 아님/보류 선택 시 비활성화
                    </small>
                  ) : null}
                </span>
                <select disabled={isFixStatusLocked} {...register("fixStatus")}>
                  {isFixStatusLocked ? <option value="-">-</option> : null}
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
                    <small className={styles.locked}>이슈 아님 선택 시 활성</small>
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

                  <div className={styles.serviceJiraGroup}>
                    {serviceJiraFields.map((field, index) => (
                      <label key={field.id}>
                        <strong>서비스 전달</strong>
                        <div className={styles.serviceJiraFieldRow}>
                          <input
                            placeholder="https://jira.daumkakao.com/browse/..."
                            {...register(`serviceJiraUrls.${index}.value`)}
                          />
                          {serviceJiraFields.length > 1 ? (
                            <button
                              className={styles.serviceJiraRemoveButton}
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
                      className={styles.serviceJiraAddButton}
                      type="button"
                      onClick={() => appendServiceJiraField(createServiceJiraField())}
                    >
                      + 서비스 전달 링크 추가
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend>
              <span>4</span>
              비고 / 전달 메모
            </legend>
            <label className={`${styles.field} ${styles.full}`}>
              <textarea
                placeholder="추가 메모나 전달 사항을 입력하세요"
                rows={5}
                {...register("memo")}
              />
              <small className={styles.localHint}>
                브라우저 로컬 저장소에 자동 저장됩니다
              </small>
            </label>
          </fieldset>

          {message ? <p className={styles.message}>{message}</p> : null}

          <div className={styles.footer}>
            <span className={styles.autoSave}>자동 저장 대기 중</span>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={resetForm}>
                초기화
              </Button>
              <Button variant="secondary" onClick={saveDraft}>
                임시 저장
              </Button>
              <Button type="submit" variant="primary">
                등록
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
