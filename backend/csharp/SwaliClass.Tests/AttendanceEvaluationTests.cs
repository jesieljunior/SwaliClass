using BitraHub.Domain.Common;
using FluentAssertions;
using Xunit;

namespace SwaliClass.Tests;

public class AttendanceEvaluationTests
{
    public record AttendanceRecordModel(Guid StudentId, string StudentName, AttendanceStatus Status, string? Notes);

    public record AttendanceSummary(
        int TotalSessions,
        int PresentCount,
        int AbsentCount,
        int JustifiedCount,
        double AttendanceRate,
        bool IsAtDropoutRisk // < 75% pedagogical risk threshold
    );

    public record GradeSubmissionModel(decimal Score, decimal MaxScore, decimal Weight);

    public static AttendanceSummary CalculateStudentAttendance(IEnumerable<AttendanceStatus> statuses)
    {
        var list = statuses.ToList();
        var total = list.Count;
        if (total == 0)
        {
            return new AttendanceSummary(0, 0, 0, 0, 0.0, false);
        }

        var present = list.Count(s => s == AttendanceStatus.Present || s == AttendanceStatus.Late);
        var justified = list.Count(s => s == AttendanceStatus.Excused);
        var absent = list.Count(s => s == AttendanceStatus.Absent);

        // Attendance rate formula: (Present + Excused) / Total
        var effectivePresent = present + justified;
        var rate = Math.Round((double)effectivePresent / total * 100, 1);
        var isAtRisk = rate < 75.0; // Official ClassCheck pedagogical evasion threshold

        return new AttendanceSummary(total, present, absent, justified, rate, isAtRisk);
    }

    public static decimal CalculateWeightedGrade(IEnumerable<GradeSubmissionModel> submissions)
    {
        var list = submissions.ToList();
        if (!list.Any()) return 0m;

        var totalWeight = list.Sum(s => s.Weight);
        if (totalWeight == 0) return 0m;

        var weightedSum = list.Sum(s => (s.Score / s.MaxScore * 10m) * s.Weight);
        return Math.Round(weightedSum / totalWeight, 2);
    }

    [Theory]
    [InlineData(20, 18, 0, 2, 90.0, false)] // 18/20 = 90% (Safe)
    [InlineData(20, 15, 0, 5, 75.0, false)] // 15/20 = 75% (Minimum limit)
    [InlineData(20, 14, 0, 6, 70.0, true)]  // 14/20 = 70% (<75% => Critical Evasion Risk)
    [InlineData(20, 13, 2, 5, 75.0, false)] // 13 present + 2 justified = 15/20 = 75% (Safe with excuse)
    public void AttendanceRate_Should_Accurately_Flag_Dropout_Risk_Below_75_Percent(
        int total,
        int presentCount,
        int justifiedCount,
        int absentCount,
        double expectedRate,
        bool expectedRisk)
    {
        // Arrange
        var statuses = new List<AttendanceStatus>();
        for (int i = 0; i < presentCount; i++) statuses.Add(AttendanceStatus.Present);
        for (int i = 0; i < justifiedCount; i++) statuses.Add(AttendanceStatus.Excused);
        for (int i = 0; i < absentCount; i++) statuses.Add(AttendanceStatus.Absent);

        // Act
        var result = CalculateStudentAttendance(statuses);

        // Assert
        result.TotalSessions.Should().Be(total);
        result.AttendanceRate.Should().Be(expectedRate);
        result.IsAtDropoutRisk.Should().Be(expectedRisk);
    }

    [Fact]
    public void WeightedGrade_Should_Calculate_Correct_Proportion_Based_On_Activity_Weights()
    {
        // Arrange: 
        // Activity 1: Score 8.0/10.0 with weight 1.0
        // Activity 2 (Project): Score 10.0/10.0 with weight 2.0
        // Activity 3: Score 6.0/10.0 with weight 1.0
        // Total weight = 4.0; Weighted sum = (8*1 + 10*2 + 6*1) = 34; Average = 34 / 4 = 8.5
        var submissions = new List<GradeSubmissionModel>
        {
            new(8.0m, 10.0m, 1.0m),
            new(10.0m, 10.0m, 2.0m),
            new(6.0m, 10.0m, 1.0m)
        };

        // Act
        var finalGrade = CalculateWeightedGrade(submissions);

        // Assert
        finalGrade.Should().Be(8.50m);
    }
}
