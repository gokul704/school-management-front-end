/**
 * Format class name for display
 * @param className - The class name (e.g., "7", "8", "9")
 * @param section - Optional section (e.g., "A", "B", "C")
 * @returns Formatted class name (e.g., "Class 7-A" or "Class 7")
 */
export function formatClassName(className: string, section?: string | null): string {
  if (!className) return '';
  
  const classNum = className.trim();
  if (section) {
    return `Class ${classNum}-${section}`;
  }
  return `Class ${classNum}`;
}

/**
 * Get display text for class dropdown
 * @param classObj - Class object with name and optional section
 * @param includeYear - Whether to include academic year
 * @returns Formatted display text
 */
export function getClassDisplayText(
  classObj: { name: string; section?: string | null; academicYear?: string },
  includeYear: boolean = false
): string {
  const className = formatClassName(classObj.name, classObj.section);
  if (includeYear && classObj.academicYear) {
    return `${className} (${classObj.academicYear})`;
  }
  return className;
}

