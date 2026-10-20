using BitraHub.Domain.Common;

namespace BitraHub.Application.DTOs;

public record LoginRequest(string Email, string Password);
public record AcceptInviteRequest(string Token, string Password, string FullName);
public record AuthResponse(string Token, UserDto User, TenantSummaryDto Tenant);

public record UserDto(Guid Id, string Email, string FullName, string Role, Guid? TenantId, string? AvatarUrl);
public record TenantSummaryDto(Guid Id, string Name, string Plan);

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string Plan,
    string Status,
    string ContactEmail,
    DateTime CreatedAt,
    int UserCount,
    int StudentCount
);

public record CreateTenantRequest(
    string Name,
    string Plan,
    string ContactEmail,
    string AdminEmail
);

public record CourseDto(
    Guid Id,
    string Name,
    string? Description,
    string? Category,
    int? WorkloadHours,
    int ClassCount,
    int StudentCount,
    DateTime CreatedAt
);

public record UpsertCourseRequest(
    Guid? Id,
    string Name,
    string? Description,
    string? Category,
    int? WorkloadHours
);

public record ClassGroupDto(
    Guid Id,
    Guid CourseId,
    string? CourseName,
    string Name,
    string? AcademicTerm,
    string? Schedule,
    int? MaxCapacity,
    Guid? TeacherId,
    string? TeacherName,
    int StudentCount,
    DateTime CreatedAt
);

public record UpsertClassRequest(
    Guid? Id,
    Guid CourseId,
    string Name,
    string? AcademicTerm,
    string? Schedule,
    int? MaxCapacity,
    Guid? TeacherId
);

public record StudentDto(
    Guid Id,
    string FullName,
    string Email,
    string? Phone,
    string? EnrollmentNumber,
    string Status,
    DateTime? BirthDate,
    string? GuardianName,
    string? GuardianContact,
    List<StudentClassDto> Classes,
    double AttendanceRate,
    double AverageGrade,
    DateTime CreatedAt
);

public record StudentClassDto(Guid Id, string Name, string? CourseName);

public record UpsertStudentRequest(
    Guid? Id,
    string FullName,
    string Email,
    string? Phone,
    string? EnrollmentNumber,
    string Status,
    DateTime? BirthDate,
    string? GuardianName,
    string? GuardianContact,
    List<Guid>? ClassIds
);

public record ImportStudentsRequest(List<ImportStudentRow> Students);
public record ImportStudentRow(string FullName, string Email, string? EnrollmentNumber, string? ClassName);

public record AttendanceSessionDto(
    Guid Id,
    Guid ClassGroupId,
    string? ClassName,
    DateOnly SessionDate,
    string? Topic,
    List<AttendanceRecordDto> Records,
    int TotalStudents,
    int PresentCount,
    int AbsentCount,
    double AttendanceRate
);

public record AttendanceRecordDto(
    Guid StudentId,
    string StudentName,
    string? EnrollmentNumber,
    string Status,
    string? Notes
);

public record SaveAttendanceRequest(
    Guid ClassGroupId,
    DateOnly SessionDate,
    string? Topic,
    List<SaveAttendanceRecordItem> Records
);

public record SaveAttendanceRecordItem(
    Guid StudentId,
    string Status,
    string? Notes
);

public record ActivityDto(
    Guid Id,
    Guid ClassGroupId,
    string? ClassName,
    string Title,
    string? Description,
    DateTime DueDate,
    decimal MaxScore,
    decimal? Weight,
    string Status,
    int SubmissionCount,
    int GradedCount,
    DateTime CreatedAt
);

public record UpsertActivityRequest(
    Guid? Id,
    Guid ClassGroupId,
    string Title,
    string? Description,
    DateTime DueDate,
    decimal MaxScore,
    decimal? Weight,
    string Status
);

public record SubmissionDto(
    Guid Id,
    Guid ActivityId,
    Guid StudentId,
    string StudentName,
    DateTime SubmittedAt,
    string? FileUrl,
    string? FileName,
    decimal? Score,
    string? Feedback,
    DateTime? GradedAt
);

public record GradeSubmissionRequest(decimal Score, string? Feedback);

public record DashboardStatsDto(
    int TotalStudents,
    int TotalClasses,
    int TotalCourses,
    double AttendanceAverage30d,
    int PendingGradingCount,
    List<ActivityDto> RecentActivities,
    List<ClassPerformanceDto> ClassPerformance
);

public record ClassPerformanceDto(
    Guid ClassId,
    string ClassName,
    double AverageAttendance,
    int StudentCount
);

public record TeacherDashboardDto(
    List<ClassGroupDto> Classes,
    int PendingSubmissionsCount,
    List<UpcomingSessionDto> UpcomingSessions
);

public record UpcomingSessionDto(
    Guid ClassId,
    string ClassName,
    string Date,
    string Schedule
);

public record InviteDto(
    Guid Id,
    string Email,
    string Role,
    string Status,
    string Token,
    string InviteUrl,
    DateTime CreatedAt,
    DateTime ExpiresAt
);

public record CreateInviteRequest(string Email, string Role);
