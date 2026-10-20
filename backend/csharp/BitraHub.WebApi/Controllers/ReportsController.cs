using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly BitraHubDbContext _context;

    public ReportsController(BitraHubDbContext context)
    {
        _context = context;
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendanceReport(
        [FromQuery] Guid? classId = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null)
    {
        var sessionsQuery = _context.AttendanceSessions
            .Include(s => s.ClassGroup)
            .Include(s => s.Records)
                .ThenInclude(r => r.Student)
            .AsQueryable();

        if (classId.HasValue && classId.Value != Guid.Empty)
        {
            sessionsQuery = sessionsQuery.Where(s => s.ClassGroupId == classId.Value);
        }

        if (startDate.HasValue)
        {
            sessionsQuery = sessionsQuery.Where(s => s.SessionDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            sessionsQuery = sessionsQuery.Where(s => s.SessionDate <= endDate.Value);
        }

        var sessions = await sessionsQuery.OrderBy(s => s.SessionDate).ToListAsync();

        var report = sessions.Select(s => new
        {
            sessionId = s.Id,
            className = s.ClassGroup?.Name,
            date = s.SessionDate,
            topic = s.Topic,
            totalEnrolled = s.Records.Count,
            presentCount = s.Records.Count(r => r.Status == AttendanceStatus.Present || r.Status == AttendanceStatus.Late),
            absentCount = s.Records.Count(r => r.Status == AttendanceStatus.Absent),
            records = s.Records.Select(r => new
            {
                studentName = r.Student?.FullName,
                status = r.Status.ToString().ToLower(),
                notes = r.Notes
            })
        });

        return Ok(report);
    }

    [HttpGet("grades")]
    public async Task<IActionResult> GetGradesReport([FromQuery] Guid? classId = null)
    {
        var activitiesQuery = _context.Activities
            .Include(a => a.ClassGroup)
            .Include(a => a.Submissions)
                .ThenInclude(sub => sub.Student)
            .AsQueryable();

        if (classId.HasValue && classId.Value != Guid.Empty)
        {
            activitiesQuery = activitiesQuery.Where(a => a.ClassGroupId == classId.Value);
        }

        var activities = await activitiesQuery.ToListAsync();

        var report = activities.Select(a => new
        {
            activityId = a.Id,
            className = a.ClassGroup?.Name,
            title = a.Title,
            maxScore = a.MaxScore,
            dueDate = a.DueDate,
            averageScore = a.Submissions.Any(s => s.Score.HasValue)
                ? Math.Round(a.Submissions.Where(s => s.Score.HasValue).Average(s => (double)s.Score!.Value), 1)
                : 0.0,
            submissions = a.Submissions.Select(s => new
            {
                studentName = s.Student?.FullName,
                score = s.Score,
                gradedAt = s.GradedAt
            })
        });

        return Ok(report);
    }
}
