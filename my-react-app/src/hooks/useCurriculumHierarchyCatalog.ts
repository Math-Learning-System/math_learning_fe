import { useQuery } from '@tanstack/react-query';
import { LessonSlideService } from '../services/api/lesson-slide.service';

type CatalogQueryOptions = {
  /** Refetch when form mounts (e.g. sau khi admin thêm lớp/môn mới). */
  refetchOnMount?: boolean | 'always';
  staleTime?: number;
};

/** Cascading catalog for Lớp → Môn → Chương → Bài (aligned with /student/public-slides). */
export function useCurriculumHierarchyCatalog(
  state: {
    gradeId: string;
    subjectId: string;
    chapterId: string;
  },
  options?: CatalogQueryOptions
) {
  const refetchOnMount = options?.refetchOnMount;
  const staleTime = options?.staleTime ?? 5 * 60 * 1000;

  const gradesQuery = useQuery({
    queryKey: ['school-grades', 'active'],
    queryFn: () => LessonSlideService.getSchoolGrades(true),
    staleTime,
    refetchOnMount,
  });

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'by-school-grade', state.gradeId],
    queryFn: () => LessonSlideService.getSubjectsBySchoolGrade(state.gradeId),
    enabled: !!state.gradeId,
    staleTime,
    refetchOnMount,
  });

  const chaptersQuery = useQuery({
    queryKey: ['chapters', 'by-subject', state.subjectId],
    queryFn: () => LessonSlideService.getChaptersBySubject(state.subjectId),
    enabled: !!state.subjectId,
    staleTime: 5 * 60 * 1000,
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons', 'by-chapter', state.chapterId],
    queryFn: () => LessonSlideService.getLessonsByChapter(state.chapterId),
    enabled: !!state.chapterId,
    staleTime: 5 * 60 * 1000,
  });

  const schoolGrades = gradesQuery.data?.result ?? [];
  const subjects = subjectsQuery.data?.result ?? [];

  const loadingCatalog =
    (gradesQuery.isFetching && schoolGrades.length === 0) ||
    (subjectsQuery.isFetching && !!state.gradeId && subjects.length === 0) ||
    chaptersQuery.isFetching ||
    lessonsQuery.isFetching;

  return {
    schoolGrades,
    subjects,
    chapters: chaptersQuery.data?.result ?? [],
    lessons: lessonsQuery.data?.result ?? [],
    loadingCatalog,
    gradesLoading: gradesQuery.isLoading && schoolGrades.length === 0,
    subjectsLoading: subjectsQuery.isLoading && !!state.gradeId && subjects.length === 0,
    catalogError:
      gradesQuery.error || subjectsQuery.error || chaptersQuery.error || lessonsQuery.error,
    refetchGrades: () => void gradesQuery.refetch(),
    refetchSubjects: () => void subjectsQuery.refetch(),
  };
}
