import { BookMarked, BookOpen, FileText, Filter, GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCurriculumHierarchyCatalog } from '../../hooks/useCurriculumHierarchyCatalog';
import { formatSchoolGradeLabel } from '../../utils/schoolGradeLabel';

export type CurriculumHierarchyDepth = 'subject' | 'chapter' | 'lesson';

const selectCls =
  'w-full border border-[#e2e8f0] rounded-lg px-3 py-2 font-[Be_Vietnam_Pro] text-[13px] text-[#0f172a] outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] bg-white transition-colors disabled:bg-[#f8fafc] disabled:text-[#64748b]';

export interface CurriculumHierarchyFilterProps {
  gradeId: string;
  subjectId: string;
  chapterId: string;
  lessonId?: string;
  onGradeChange: (id: string) => void;
  onSubjectChange: (id: string) => void;
  onChapterChange: (id: string) => void;
  onLessonChange?: (id: string) => void;
  /** Default `lesson` — full Lớp → Môn → Chương → Bài */
  depth?: CurriculumHierarchyDepth;
  disabled?: boolean;
  className?: string;
  /** Hide panel title row (Filter + heading) */
  hideTitle?: boolean;
  footnote?: ReactNode;
}

export function CurriculumHierarchyFilter({
  gradeId,
  subjectId,
  chapterId,
  lessonId = '',
  onGradeChange,
  onSubjectChange,
  onChapterChange,
  onLessonChange = () => {},
  depth = 'lesson',
  disabled = false,
  className = '',
  hideTitle = false,
  footnote,
}: Readonly<CurriculumHierarchyFilterProps>) {
  const { schoolGrades, subjects, chapters, lessons, loadingCatalog } =
    useCurriculumHierarchyCatalog({
      gradeId,
      subjectId,
      chapterId,
    });

  const busy = disabled || loadingCatalog;
  const showChapter = depth === 'chapter' || depth === 'lesson';
  const showLesson = depth === 'lesson';

  const gridCols =
    depth === 'subject'
      ? 'sm:grid-cols-2 lg:grid-cols-2'
      : depth === 'chapter'
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`bg-white rounded-2xl border border-[#e2e8f0] p-5 space-y-4 ${className}`}>
      {!hideTitle && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748b]" aria-hidden />
          <h2 className="font-[Be_Vietnam_Pro] text-[13px] font-semibold text-[#475569] uppercase tracking-wide">
            Bộ lọc tìm kiếm
          </h2>
        </div>
      )}
      <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
        <div>
          <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mb-1.5">
            <GraduationCap className="w-3.5 h-3.5" aria-hidden />
            Lớp
          </label>
          <select
            className={selectCls}
            value={gradeId}
            onChange={(e) => onGradeChange(e.target.value)}
            disabled={busy}
            aria-label="Lọc theo lớp"
          >
            <option value="">Tất cả lớp</option>
            {schoolGrades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {formatSchoolGradeLabel(grade)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mb-1.5">
            <BookOpen className="w-3.5 h-3.5" aria-hidden />
            Môn học
          </label>
          <select
            className={selectCls}
            value={subjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={!gradeId || busy}
            aria-label="Lọc theo môn học"
          >
            <option value="">{gradeId ? 'Tất cả môn học' : 'Chọn lớp trước'}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {showChapter && (
          <div>
            <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mb-1.5">
              <BookMarked className="w-3.5 h-3.5" aria-hidden />
              Chương
            </label>
            <select
              className={selectCls}
              value={chapterId}
              onChange={(e) => onChapterChange(e.target.value)}
              disabled={!subjectId || busy}
              aria-label="Lọc theo chương"
            >
              <option value="">{subjectId ? 'Tất cả chương' : 'Chọn môn trước'}</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {showLesson && (
          <div>
            <label className="flex items-center gap-1.5 font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] mb-1.5">
              <FileText className="w-3.5 h-3.5" aria-hidden />
              Bài học
            </label>
            <select
              className={selectCls}
              value={lessonId}
              onChange={(e) => onLessonChange(e.target.value)}
              disabled={!chapterId || busy}
              aria-label="Lọc theo bài học"
            >
              <option value="">{chapterId ? 'Tất cả bài học' : 'Chọn chương trước'}</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {footnote ? (
        <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#64748b] leading-relaxed">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
