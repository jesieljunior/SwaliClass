using BitraHub.Application.Common.Interfaces;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace SwaliClass.Tests;

public class TenantIsolationTests
{
    private readonly Guid _tenantA = Guid.NewGuid();
    private readonly Guid _tenantB = Guid.NewGuid();

    private BitraHubDbContext CreateDbContext(Guid? currentTenantId, bool isSuperAdmin = false)
    {
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        mockCurrentUserService.Setup(s => s.TenantId).Returns(currentTenantId);
        mockCurrentUserService.Setup(s => s.IsSuperAdmin).Returns(isSuperAdmin);
        mockCurrentUserService.Setup(s => s.IsAuthenticated).Returns(true);
        mockCurrentUserService.Setup(s => s.UserRole).Returns(isSuperAdmin ? Roles.SuperAdmin : Roles.Teacher);

        var options = new DbContextOptionsBuilder<BitraHubDbContext>()
            .UseInMemoryDatabase(databaseName: $"SwaliClassTestDb_{Guid.NewGuid()}")
            .Options;

        return new BitraHubDbContext(options, mockCurrentUserService.Object);
    }

    [Fact]
    public async Task QueryFilter_Should_Only_Return_Data_Belonging_To_Current_Tenant()
    {
        // Arrange: Populate database with courses from two distinct tenants
        var db = CreateDbContext(_tenantA);

        var courseA = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantA,
            Name = "Turma de Programação C# - Tenant A",
            Category = "TI"
        };
        var courseB = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantB,
            Name = "Turma de Gestão - Tenant B",
            Category = "Gestão"
        };

        db.Courses.AddRange(courseA, courseB);
        await db.SaveChangesAsync();

        // Act: Query as Tenant A
        var tenantACourses = await db.Courses.ToListAsync();

        // Assert: Tenant A must NOT see Tenant B's data
        tenantACourses.Should().HaveCount(1);
        tenantACourses.First().Id.Should().Be(courseA.Id);
        tenantACourses.First().Name.Should().Be("Turma de Programação C# - Tenant A");
        tenantACourses.Should().NotContain(c => c.TenantId == _tenantB);
    }

    [Fact]
    public async Task SuperAdmin_Should_Bypass_QueryFilter_And_See_All_Tenants_Data()
    {
        // Arrange: Context configured with SuperAdmin privileges
        var db = CreateDbContext(null, isSuperAdmin: true);

        var courseA = new Course { Id = Guid.NewGuid(), TenantId = _tenantA, Name = "Curso A" };
        var courseB = new Course { Id = Guid.NewGuid(), TenantId = _tenantB, Name = "Curso B" };

        db.Courses.AddRange(courseA, courseB);
        await db.SaveChangesAsync();

        // Act: Query as Super Admin
        var allCourses = await db.Courses.ToListAsync();

        // Assert: SuperAdmin sees both tenants
        allCourses.Should().HaveCount(2);
        allCourses.Select(c => c.TenantId).Should().Contain(new[] { _tenantA, _tenantB });
    }

    [Fact]
    public async Task SaveChangesAsync_Should_Automatically_Assign_TenantId_When_Omitted()
    {
        // Arrange
        var db = CreateDbContext(_tenantA);

        var newStudent = new Student
        {
            Id = Guid.NewGuid(),
            FullName = "Roberto Silva",
            Email = "roberto.silva@exemplo.com",
            EnrollmentNumber = "2026-990",
            TenantId = Guid.Empty // Omitted by caller
        };

        // Act
        db.Students.Add(newStudent);
        await db.SaveChangesAsync();

        // Assert: SaveChangesAsync automatically injected Tenant A ID
        newStudent.TenantId.Should().Be(_tenantA);
        newStudent.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CrossTenant_AttendanceRecords_Must_Remain_Strictly_Isolated()
    {
        // Arrange
        var db = CreateDbContext(_tenantA);

        var sessionTenantA = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantA,
            ClassGroupId = Guid.NewGuid(),
            SessionDate = new DateOnly(2026, 3, 10),
            Topic = "Introdução a Algoritmos"
        };
        var sessionTenantB = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantB,
            ClassGroupId = Guid.NewGuid(),
            SessionDate = new DateOnly(2026, 3, 10),
            Topic = "Logística Reversa"
        };

        db.AttendanceSessions.AddRange(sessionTenantA, sessionTenantB);
        await db.SaveChangesAsync();

        // Act: Query attendance sessions as Tenant A
        var results = await db.AttendanceSessions.ToListAsync();

        // Assert
        results.Should().HaveCount(1);
        results.Single().TenantId.Should().Be(_tenantA);
        results.Single().Topic.Should().Be("Introdução a Algoritmos");
    }
}
