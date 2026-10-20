using BitraHub.Application.Common.Interfaces;
using BitraHub.Application.DTOs;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly BitraHubDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DashboardController(BitraHubDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var totalStudents = await _context.Students.CountAsync(s => s.Status == StudentStatus.Active);
        var totalClasses = await _context.Classes.CountAsync();
        var totalCourses = await _context.Courses.CountAsync();

        var recentActivities = await _context.Activities
            .Include(a => a.ClassGroup)
            .Include(a => a.Submissions)
            .OrderByDescending(a => a.DueDate)
            .Take(5)
            .Select(a => new ActivityDto(
                a.Id,
                a.ClassGroupId,
                a.ClassGroup != null ? a.ClassGroup.Name : null,
                a.Title,
                a.Description,
                a.DueDate,
                a.MaxScore,
                a.Weight,
                a.Status.ToString().ToLower(),
                a.Submissions.Count,
                a.Submissions.Count(s => s.Score.HasValue),
                a.CreatedAt
            ))
            .ToListAsync();

        var pendingGradingCount = await _context.Submissions
            .CountAsync(s => !s.Score.HasValue);

        var classPerformance = await _context.Classes
            .Include(c => c.Enrollments)
            .Take(5)
            .Select(c => new ClassPerformanceDto(
                c.Id,
                c.Name,
                94.5,
                c.Enrollments.Count
            ))
            .ToListAsync();

        return Ok(new DashboardStatsDto(
            totalStudents,
            totalClasses,
            totalCourses,
            94.2,
            pendingGradingCount,
            recentActivities,
            classPerformance
        ));
    }

    [HttpGet("teacher")]
    public async Task<ActionResult<TeacherDashboardDto>> GetTeacherStats()
    {
        var teacherId = _currentUserService.UserId;

        var myClassesQuery = _context.Classes
            .Include(c => c.Course)
            .Include(c => c.Enrollments)
            .AsQueryable();

        if (teacherId.HasValue && _currentUserService.UserRole == Roles.Teacher)
        {
            myClassesQuery = myClassesQuery.Where(c => c.TeacherId == teacherId.Value);
        }

        var classes = await myClassesQuery
            .Select(c => new ClassGroupDto(
                c.Id,
                c.CourseId,
                c.Course != null ? c.Course.Name : null,
                c.Name,
                c.AcademicTerm,
                c.Schedule,
                c.MaxCapacity,
                c.TeacherId,
                null,
                c.Enrollments.Count,
                c.CreatedAt
            ))
            .ToListAsync();

        var pendingSubmissions = await _context.Submissions
            .Include(s => s.Activity)
            .CountAsync(s => !s.Score.HasValue && (teacherId == null || s.Activity!.ClassGroup!.TeacherId == teacherId.Value));

        var upcoming = classes.Select(c => new UpcomingSessionDto(
            c.Id,
            c.Name,
            DateTime.UtcNow.ToString("dd/MM/yyyy"),
            c.Schedule ?? "08:00 - 11:30"
        )).ToList();

        return Ok(new TeacherDashboardDto(
            classes,
            pendingSubmissions,
            upcoming
        ));
    }
}
