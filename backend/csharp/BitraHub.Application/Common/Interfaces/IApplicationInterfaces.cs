using BitraHub.Domain.Entities;

namespace BitraHub.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserEmail { get; }
    string? UserRole { get; }
    Guid? TenantId { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin => UserRole == Domain.Common.Roles.SuperAdmin;
    bool IsStaff => Domain.Common.Roles.Staff.Contains(UserRole ?? "");
}

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, string tenantName, string tenantPlan);
}
