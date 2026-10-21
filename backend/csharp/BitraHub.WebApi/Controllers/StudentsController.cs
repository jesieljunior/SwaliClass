using BitraHub.Application.DTOs;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/students")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly BitraHubDbContext _context;

    public StudentsController(BitraHubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<StudentDto>>> List(
        [FromQuery] Guid? classId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.ClassGroup)
                    .ThenInclude(cg => cg!.Course)
            .Include(s => s.AttendanceRecords)
            .Include(s => s.Submissions)
            .AsQueryable();

        if (classId.HasValue && classId.Value != Guid.Empty)
        {
            query = query.Where(s => s.Enrollments.Any(e => e.ClassGroupId == classId.Value));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<StudentStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(s => s.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(st =>
                st.FullName.ToLower().Contains(s) ||
                st.Email.ToLower().Contains(s) ||
                (st.EnrollmentNumber != null && st.EnrollmentNumber.ToLower().Contains(s)));
        }

        var students = await query
            .OrderBy(s => s.FullName)
            .ToListAsync();

        var result = students.Select(s =>
        {
            var totalPresences = s.AttendanceRecords.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
            var totalSessions = s.AttendanceRecords.Count;
            var attendanceRate = totalSessions > 0 ? Math.Round((double)totalPresences / totalSessions * 100, 1) : 100.0;

            var gradedSubmissions = s.Submissions.Where(sub => sub.Score.HasValue).ToList();
            var avgGrade = gradedSubmissions.Count > 0 ? Math.Round((double)gradedSubmissions.Average(sub => (double)sub.Score!.Value), 1) : 0.0;

            return new StudentDto(
                s.Id,
                s.FullName,
                s.Email,
                s.Phone,
                s.EnrollmentNumber,
                s.Status.ToString().ToLower(),
                s.BirthDate,
                s.GuardianName,
                s.GuardianContact,
                s.Enrollments.Where(e => e.ClassGroup != null).Select(e => new StudentClassDto(
                    e.ClassGroupId,
                    e.ClassGroup!.Name,
                    e.ClassGroup.Course?.Name
                )).ToList(),
                attendanceRate,
                avgGrade,
                s.CreatedAt
            );
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<ActionResult<StudentDto>> Upsert([FromBody] UpsertStudentRequest request)
    {
        Student student;
        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.Students
                .Include(s => s.Enrollments)
                .FirstOrDefaultAsync(s => s.Id == request.Id.Value);

            if (existing == null)
                return NotFound(new { message = "Aluno não encontrado." });

            existing.FullName = request.FullName;
            existing.Email = request.Email;
            existing.Phone = request.Phone;
            existing.EnrollmentNumber = request.EnrollmentNumber;
            if (Enum.TryParse<StudentStatus>(request.Status, true, out var status))
                existing.Status = status;

            existing.BirthDate = request.BirthDate;
            existing.GuardianName = request.GuardianName;
            existing.GuardianContact = request.GuardianContact;

            // Update enrollments
            if (request.ClassIds != null)
            {
                var currentClassIds = existing.Enrollments.Select(e => e.ClassGroupId).ToList();
                var toRemove = existing.Enrollments.Where(e => !request.ClassIds.Contains(e.ClassGroupId)).ToList();
                foreach (var r in toRemove) _context.Enrollments.Remove(r);

                var toAdd = request.ClassIds.Where(id => !currentClassIds.Contains(id)).ToList();
                foreach (var classId in toAdd)
                {
                    _context.Enrollments.Add(new Enrollment
                    {
                        StudentId = existing.Id,
                        ClassGroupId = classId
                    });
                }
            }

            student = existing;
        }
        else
        {
            var parsedStatus = Enum.TryParse<StudentStatus>(request.Status, true, out var s) ? s : StudentStatus.Active;
            student = new Student
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                EnrollmentNumber = request.EnrollmentNumber,
                Status = parsedStatus,
                BirthDate = request.BirthDate,
                GuardianName = request.GuardianName,
                GuardianContact = request.GuardianContact
            };
            _context.Students.Add(student);

            if (request.ClassIds != null)
            {
                foreach (var classId in request.ClassIds)
                {
                    _context.Enrollments.Add(new Enrollment
                    {
                        StudentId = student.Id,
                        ClassGroupId = classId
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new StudentDto(
            student.Id,
            student.FullName,
            student.Email,
            student.Phone,
            student.EnrollmentNumber,
            student.Status.ToString().ToLower(),
            student.BirthDate,
            student.GuardianName,
            student.GuardianContact,
            new List<StudentClassDto>(),
            100.0,
            0.0,
            student.CreatedAt
        ));
    }

    [HttpPost("import-csv")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<IActionResult> ImportCsv([FromBody] ImportStudentsRequest request)
    {
        var imported = 0;
        var errors = new List<object>();

        for (int i = 0; i < request.Students.Count; i++)
        {
            var row = request.Students[i];
            var line = i + 1;

            if (string.IsNullOrWhiteSpace(row.FullName))
            {
                errors.Add(new { line, error = "Nome completo é obrigatório." });
                continue;
            }

            if (string.IsNullOrWhiteSpace(row.Email) || !row.Email.Contains('@'))
            {
                errors.Add(new { line, error = $"E-mail inválido na linha {line}: '{row.Email}'" });
                continue;
            }

            var student = new Student
            {
                FullName = row.FullName.Trim(),
                Email = row.Email.Trim().ToLower(),
                EnrollmentNumber = row.EnrollmentNumber?.Trim(),
                Status = StudentStatus.Active
            };

            _context.Students.Add(student);
            imported++;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            imported,
            totalRows = request.Students.Count,
            errors
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null)
            return NotFound(new { message = "Aluno não encontrado." });

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
