using BitraHub.Domain.Common;
using FluentAssertions;
using Xunit;

namespace SwaliClass.Tests;

/// <summary>
/// Unit tests for Academic Evasion & Dropout Early-Warning Rules (ClassCheck/SwaliClass Core Domain Logic)
/// </summary>
public class EvasionPredictionTests
{
    public enum EvasionRiskLevel
    {
        Normal,
        Warning,
        Critical
    }

    public record EvasionAssessment(
        double AttendanceRate,
        int ConsecutiveAbsences,
        int OverdueActivitiesCount,
        EvasionRiskLevel RiskLevel,
        string RecommendedPedagogicalAction
    );

    public static EvasionAssessment EvaluateEvasionRisk(
        IReadOnlyList<AttendanceStatus> attendanceHistory,
        int overdueActivitiesCount)
    {
        if (attendanceHistory.Count == 0)
        {
            return new EvasionAssessment(100.0, 0, overdueActivitiesCount, EvasionRiskLevel.Normal, "Sem histórico de chamadas.");
        }

        int presentCount = attendanceHistory.Count(s => s == AttendanceStatus.Present || s == AttendanceStatus.Late);
        int excusedCount = attendanceHistory.Count(s => s == AttendanceStatus.Excused);
        int total = attendanceHistory.Count;

        double attendanceRate = Math.Round((double)(presentCount + excusedCount) / total * 100, 1);

        // Calculate trailing consecutive unexcused absences (from most recent backward)
        int consecutiveAbsences = 0;
        for (int i = attendanceHistory.Count - 1; i >= 0; i--)
        {
            if (attendanceHistory[i] == AttendanceStatus.Absent)
            {
                consecutiveAbsences++;
            }
            else
            {
                break;
            }
        }

        // Decision Matrix (Pedagogical SLA from ClassCheck 5-state deployment):
        // 1. Critical: Attendance < 75% OR 3+ consecutive unexcused absences
        // 2. Warning: Attendance between 75% and 85% OR 2 consecutive absences OR overdue activities >= 2
        // 3. Normal: Attendance >= 85% with no severe streaks
        EvasionRiskLevel riskLevel;
        string action;

        if (attendanceRate < 75.0 || consecutiveAbsences >= 3)
        {
            riskLevel = EvasionRiskLevel.Critical;
            action = "Intervenção Imediata: Acionar coordenação pedagógica e responsável legal.";
        }
        else if (attendanceRate < 85.0 || consecutiveAbsences == 2 || overdueActivitiesCount >= 2)
        {
            riskLevel = EvasionRiskLevel.Warning;
            action = "Monitoramento Ativo: Notificar professor conselheiro e reforçar prazos.";
        }
        else
        {
            riskLevel = EvasionRiskLevel.Normal;
            action = "Desempenho Estável: Sem pendências críticas.";
        }

        return new EvasionAssessment(attendanceRate, consecutiveAbsences, overdueActivitiesCount, riskLevel, action);
    }

    [Fact]
    public void Three_Consecutive_Absences_Must_Trigger_Critical_Evasion_Risk_Even_If_Overall_Rate_Is_High()
    {
        // Arrange: Student had 17 presences, but missed the last 3 classes consecutively (20 total)
        // Rate = 17/20 = 85.0% (Overall rate is good, but sudden 3-absence streak indicates acute dropout risk)
        var history = new List<AttendanceStatus>();
        for (int i = 0; i < 17; i++) history.Add(AttendanceStatus.Present);
        history.Add(AttendanceStatus.Absent);
        history.Add(AttendanceStatus.Absent);
        history.Add(AttendanceStatus.Absent);

        // Act
        var assessment = EvaluateEvasionRisk(history, overdueActivitiesCount: 0);

        // Assert
        assessment.AttendanceRate.Should().Be(85.0);
        assessment.ConsecutiveAbsences.Should().Be(3);
        assessment.RiskLevel.Should().Be(EvasionRiskLevel.Critical);
        assessment.RecommendedPedagogicalAction.Should().Contain("Intervenção Imediata");
    }

    [Theory]
    [InlineData(72.0, 1, 0, EvasionRiskLevel.Critical)] // < 75% is always critical
    [InlineData(78.5, 0, 3, EvasionRiskLevel.Warning)]  // 78.5% with 3 overdue tasks = Warning
    [InlineData(95.0, 0, 0, EvasionRiskLevel.Normal)]   // 95% clean history = Normal
    public void EvasionAssessment_Should_Classify_RiskLevels_Accurately(
        double targetRate,
        int trailingAbsences,
        int overdueTasks,
        EvasionRiskLevel expectedRisk)
    {
        // Arrange
        var history = new List<AttendanceStatus>();
        int total = 100;
        int presentCount = (int)Math.Round(targetRate);
        int absentCount = total - presentCount;

        for (int i = 0; i < presentCount; i++) history.Add(AttendanceStatus.Present);
        for (int i = 0; i < absentCount - trailingAbsences; i++) history.Add(AttendanceStatus.Absent);
        for (int i = 0; i < trailingAbsences; i++) history.Add(AttendanceStatus.Absent);

        // Act
        var assessment = EvaluateEvasionRisk(history, overdueTasks);

        // Assert
        assessment.RiskLevel.Should().Be(expectedRisk);
    }

    [Fact]
    public void Justified_Absence_Should_Break_Consecutive_Unexcused_Absence_Streak()
    {
        // Arrange: Student absent, then excused (medical certificate), then absent
        var history = new List<AttendanceStatus>
        {
            AttendanceStatus.Present,
            AttendanceStatus.Present,
            AttendanceStatus.Absent,
            AttendanceStatus.Excused, // Medical certificate breaks unexcused streak
            AttendanceStatus.Absent
        };

        // Act
        var assessment = EvaluateEvasionRisk(history, overdueActivitiesCount: 0);

        // Assert: Trailing consecutive unexcused absence is only 1, not 2
        assessment.ConsecutiveAbsences.Should().Be(1);
    }
}
