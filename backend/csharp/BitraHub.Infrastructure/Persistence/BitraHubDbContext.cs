using BitraHub.Application.Common.Interfaces;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.Infrastructure.Persistence;

public class BitraHubDbContext : DbContext
{
    private readonly ICurrentUserService _currentUserService;

    public BitraHubDbContext(DbContextOptions<BitraHubDbContext> options, ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<ClassGroup> Classes => Set<ClassGroup>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Invite> Invites => Set<Invite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Multi-Tenant Global Query Filters
        // If current user is authenticated and has a TenantId, strictly isolate data
        modelBuilder.Entity<Course>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<ClassGroup>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<Student>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<Enrollment>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<AttendanceSession>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<AttendanceRecord>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<Activity>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<Submission>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        modelBuilder.Entity<Invite>()
            .HasQueryFilter(e => _currentUserService.IsSuperAdmin || e.TenantId == _currentUserService.TenantId);

        // Constraints and indexes
        modelBuilder.Entity<Tenant>()
            .HasIndex(t => t.Slug)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Student>()
            .HasIndex(s => new { s.TenantId, s.Email })
            .IsUnique();

        modelBuilder.Entity<Enrollment>()
            .HasIndex(e => new { e.StudentId, e.ClassGroupId })
            .IsUnique();

        modelBuilder.Entity<AttendanceRecord>()
            .HasIndex(ar => new { ar.SessionId, ar.StudentId })
            .IsUnique();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<TenantEntity>();
        var now = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                if (entry.Entity.TenantId == Guid.Empty && _currentUserService.TenantId.HasValue)
                {
                    entry.Entity.TenantId = _currentUserService.TenantId.Value;
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
