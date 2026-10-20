using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(BitraHubDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Tenants.IgnoreQueryFilters().AnyAsync())
        {
            return; // Already seeded
        }

        var tenantId = Guid.NewGuid();
        var tenant = new Tenant
        {
            Id = tenantId,
            Name = "Colégio Modelo Bitra",
            Slug = "colegio-modelo-bitra",
            Plan = TenantPlan.Professional,
            Status = "active",
            ContactEmail = "contato@colegiomodelo.com.br"
        };
        context.Tenants.Add(tenant);

        // Super Admin (System level)
        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            Email = "superadmin@bitratech.com",
            FullName = "Super Admin Bitra",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
            Role = Roles.SuperAdmin,
            TenantId = null
        };
        context.Users.Add(superAdmin);

        // Tenant Admin
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@colegiomodelo.com.br",
            FullName = "Prof. Carlos Eduardo Silveira",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
            Role = Roles.Admin,
            TenantId = tenantId
        };
        context.Users.Add(admin);

        // Teacher
        var teacher = new User
        {
            Id = Guid.NewGuid(),
            Email = "professor@colegiomodelo.com.br",
            FullName = "Dra. Mariana Costa",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Prof@123456"),
            Role = Roles.Teacher,
            TenantId = tenantId
        };
        context.Users.Add(teacher);

        // Course
        var course = new Course
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Ensino Médio Integrado",
            Description = "Formação geral básica e aprofundamento em ciências e matemática",
            Category = "Educação Básica",
            WorkloadHours = 1200
        };
        context.Courses.Add(course);

        // Class Group
        var classGroup = new ClassGroup
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CourseId = course.Id,
            Name = "3º Ano A - Matutino",
            AcademicTerm = "2026/1",
            Schedule = "Segunda a Sexta, 07:30 - 12:50",
            MaxCapacity = 35,
            TeacherId = teacher.Id
        };
        context.Classes.Add(classGroup);

        // Students
        var student1 = new Student
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Ana Clara Oliveira",
            Email = "ana.clara@estudante.com.br",
            EnrollmentNumber = "2026-001A",
            Status = StudentStatus.Active
        };
        var student2 = new Student
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Lucas Mendes Ferreira",
            Email = "lucas.mendes@estudante.com.br",
            EnrollmentNumber = "2026-002A",
            Status = StudentStatus.Active
        };
        var student3 = new Student
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = "Beatriz Souza Ramos",
            Email = "beatriz.ramos@estudante.com.br",
            EnrollmentNumber = "2026-003A",
            Status = StudentStatus.Active
        };
        context.Students.AddRange(student1, student2, student3);

        // Enrollments
        context.Enrollments.AddRange(
            new Enrollment { Id = Guid.NewGuid(), TenantId = tenantId, StudentId = student1.Id, ClassGroupId = classGroup.Id },
            new Enrollment { Id = Guid.NewGuid(), TenantId = tenantId, StudentId = student2.Id, ClassGroupId = classGroup.Id },
            new Enrollment { Id = Guid.NewGuid(), TenantId = tenantId, StudentId = student3.Id, ClassGroupId = classGroup.Id }
        );

        // Activity
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ClassGroupId = classGroup.Id,
            Title = "Redação Modelo ENEM: Desafios da IA na Educação",
            Description = "Texto dissertativo-argumentativo com proposta de intervenção social. Envio em PDF.",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 10.0m,
            Weight = 2.0m,
            Status = ActivityStatus.Published
        };
        context.Activities.Add(activity);

        await context.SaveChangesAsync();
    }
}
