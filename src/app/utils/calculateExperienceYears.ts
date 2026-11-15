export const calculateExperienceYears = (
    reviewedAt: Date,
    today: Date,
): number => {
    let years = today.getFullYear() - reviewedAt.getFullYear();

    const isLeapYear =
        today.getFullYear() % 4 === 0 &&
        (today.getFullYear() % 100 !== 0 ||
            today.getFullYear() % 400 === 0);

    const anniversaryMonth =
        reviewedAt.getMonth() === 1 &&
            reviewedAt.getDate() === 29 &&
            !isLeapYear
            ? 2
            : reviewedAt.getMonth();

    const anniversaryDay =
        reviewedAt.getMonth() === 1 &&
            reviewedAt.getDate() === 29 &&
            !isLeapYear
            ? 1
            : reviewedAt.getDate();

    const hasReachedAnniversary =
        today.getMonth() > anniversaryMonth ||
        (today.getMonth() === anniversaryMonth &&
            today.getDate() >= anniversaryDay);

    if (!hasReachedAnniversary) {
        years--;
    }

    return Math.max(0, years);
};