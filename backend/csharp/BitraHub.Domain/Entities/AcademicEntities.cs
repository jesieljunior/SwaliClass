using BitraHub.Domain.Common;

namespace BitraHub.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public Guid? TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    public string Role { get; set; } = Roles.Student;
    public bool IsActive { get; set; } = true;
}

public class Course : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public int? WorkloadHours { get; set; }

    public Tenant? Tenant { get; set; }
    public ICollection<ClassGroup> Classes { get; set; } = new List<ClassGroup>();
}

public class ClassGroup : TenantEntity
{
    public Guid CourseId { get; set; }
    public Course? Course { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AcademicTerm { get; set; }
    public string? Schedule { get; set; }
    public int? MaxCapacity { get; set; }
    public Guid? TeacherId { get; set; }
    public User? Teacher { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = new List<AttendanceSession>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
}

public class Student : TenantEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? EnrollmentNumber { get; set; }
    public StudentStatus Status { get; set; } = StudentStatus.Active;
    public DateTime? BirthDate { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianContact { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class Enrollment : TenantEntity
{
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public Guid ClassGroupId { get; set; }
    public ClassGroup? ClassGroup { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class AttendanceSession : TenantEntity
{
    public Guid ClassGroupId { get; set; }
    public ClassGroup? ClassGroup { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Topic { get; set; }
    public Guid? CreatedByUserId { get; set; }

    public ICollection<AttendanceRecord> Records { get; set; } = new List<AttendanceRecord>();
}

public class AttendanceRecord : TenantEntity
{
    public Guid SessionId { get; set; }
    public AttendanceSession? Session { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? Notes { get; set; }
}

public class Activity : TenantEntity
{
    public Guid ClassGroupId { get; set; }
    public ClassGroup? ClassGroup { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public decimal MaxScore { get; set; } = 10.0m;
    public decimal? Weight { get; set; } = 1.0m;
    public ActivityStatus Status { get; set; } = ActivityStatus.Published;

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class Submission : TenantEntity
{
    public Guid ActivityId { get; set; }
    public Activity? Activity { get; set; }
    public Guid StudentId { get; set; }
    public Student? Student { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }
    public Guid? GradedByUserId { get; set; }
}

public class Invite : TenantEntity
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Teacher;
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, accepted, expired
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
}
