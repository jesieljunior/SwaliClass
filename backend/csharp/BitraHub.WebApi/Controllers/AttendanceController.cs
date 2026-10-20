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
[Route("api/v1/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly BitraHubDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AttendanceController(BitraHubDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet("roster")]
    public async Task<ActionResult<AttendanceSessionDto>> GetRoster(
        [FromQuery] Guid classId,
        [FromQuery] DateOnly date)
    {
        var classGroup = await _context.Classes
            .Include(c => c.Enrollments)
                .ThenInclude(e => e.Student)
            .FirstOrDefaultAsync(c => c.Id == classId);

        if (classGroup == null)
            return NotFound(new { message = "Turma não encontrada." });

        var session = await _context.AttendanceSessions
            .Include(s => s.Records)
            .FirstOrDefaultAsync(s => s.ClassGroupId == classId && s.SessionDate == date);

        var existingRecords = session?.Records.ToDictionary(r => r.StudentId) ?? new Dictionary<Guid, AttendanceRecord>();

        var enrolledStudents = classGroup.Enrollments
            .Where(e => e.Student != null && e.Student.Status == StudentStatus.Active)
            .Select(e => e.Student!)
            .OrderBy(s => s.FullName)
            .ToList();

        var recordDtos = enrolledStudents.Select(s =>
        {
            if (existingRecords.TryGetValue(s.Id, out var rec))
            {
                return new AttendanceRecordDto(s.Id, s.FullName, s.EnrollmentNumber, rec.Status.ToString().ToLower(), rec.Notes);
            }
            return new AttendanceRecordDto(s.Id, s.FullName, s.EnrollmentNumber, "absent", null);
        }).ToList();

        var total = recordDtos.Count;
        var present = recordDtos.Count(r => r.Status == "present" || r.Status == "late");
        var absent = total - present;
        var rate = total > 0 ? Math.Round((double)present / total * 100, 1) : 0.0;

        return Ok(new AttendanceSessionDto(
            session?.Id ?? Guid.Empty,
            classGroup.Id,
            classGroup.Name,
            date,
            session?.Topic,
            recordDtos,
            total,
            present,
            absent,
            rate
        ));
    }

    [HttpPost("save")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator},{Roles.Teacher}")]
    public async Task<IActionResult> Save([FromBody] SaveAttendanceRequest request)
    {
        var session = await _context.AttendanceSessions
            .Include(s => s.Records)
            .FirstOrDefaultAsync(s => s.ClassGroupId == request.ClassGroupId && s.SessionDate == request.SessionDate);

        if (session == null)
        {
            session = new AttendanceSession
            {
                ClassGroupId = request.ClassGroupId,
                SessionDate = request.SessionDate,
                Topic = request.Topic,
                CreatedByUserId = _currentUserService.UserId
            };
            _context.AttendanceSessions.Add(session);
        }
        else
        {
            session.Topic = request.Topic;
            session.UpdatedAt = DateTime.UtcNow;
        }

        // Synchronize records
        foreach (var item in request.Records)
        {
            var status = Enum.TryParse<AttendanceStatus>(item.Status, true, out var st) ? st : AttendanceStatus.Absent;
            var record = session.Records.FirstOrDefault(r => r.StudentId == item.StudentId);
            if (record != null)
            {
                record.Status = status;
                record.Notes = item.Notes;
            }
            else
            {
                session.Records.Add(new AttendanceRecord
                {
                    StudentId = item.StudentId,
                    Status = status,
                    Notes = item.Notes
                });
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            sessionId = session.Id,
            message = "Chamada registrada com sucesso. Alunos não assinalados foram marcados como ausentes."
        });
    }
}
