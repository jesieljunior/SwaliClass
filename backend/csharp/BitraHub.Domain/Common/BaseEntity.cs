namespace BitraHub.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public abstract class TenantEntity : BaseEntity
{
    public Guid TenantId { get; set; }
}

public static class Roles
{
    public const string SuperAdmin = "super_admin";
    public const string Admin = "admin";
    public const string Coordinator = "coordinator";
    public const string Teacher = "teacher";
    public const string Student = "student";

    public static readonly string[] All = [SuperAdmin, Admin, Coordinator, Teacher, Student];
    public static readonly string[] Staff = [SuperAdmin, Admin, Coordinator, Teacher];
    public static readonly string[] Management = [SuperAdmin, Admin, Coordinator];
}

public enum AttendanceStatus
{
    Present,
    Absent,
    Late,
    Excused
}

public enum ActivityStatus
{
    Draft,
    Published,
    Closed
}

public enum StudentStatus
{
    Active,
    Inactive,
    Transferred,
    Graduated
}

public enum TenantPlan
{
    Starter,
    Professional,
    Business,
    Enterprise
}
