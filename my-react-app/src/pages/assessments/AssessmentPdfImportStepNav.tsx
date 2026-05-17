import {
  PDF_IMPORT_WIZARD_STEPS,
  type AssessmentPdfImportWizardStep,
} from '../../utils/assessmentPdfImportDraft';

type Props = {
  current: AssessmentPdfImportWizardStep;
  onJump: (step: AssessmentPdfImportWizardStep) => void;
};

export function AssessmentPdfImportStepNav({ current, onJump }: Props) {
  return (
    <nav
      className="assessment-pdf-import__steps"
      aria-label="Các bước import PDF"
    >
      {PDF_IMPORT_WIZARD_STEPS.map((step) => {
        const isActive = step.n === current;
        const isPast = step.n < current;
        const clickable = isPast;
        return (
          <button
            key={step.n}
            type="button"
            disabled={!clickable}
            className={`assessment-pdf-import__step ${
              isActive
                ? 'assessment-pdf-import__step--active'
                : isPast
                  ? 'assessment-pdf-import__step--past'
                  : 'assessment-pdf-import__step--upcoming'
            }`}
            onClick={() => clickable && onJump(step.n)}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="assessment-pdf-import__step-num">Bước {step.n}</span>
            <span className="assessment-pdf-import__step-title">{step.title}</span>
            <span className="assessment-pdf-import__step-hint">{step.hint}</span>
          </button>
        );
      })}
    </nav>
  );
}
