using BitraHub.Application.DTOs;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/classes")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly BitraHubDbContext _context;

    public ClassesController(BitraHubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassGroupDto>>> List(
        [FromQuery] Guid? courseId = null,
        [FromQuery] string? search = null)
    {
        var query = _context.Classes
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.Enrollments)
            .AsQueryable();

        if (courseId.HasValue && courseId.Value != Guid.Empty)
        {
            query = query.Where(c => c.CourseId == courseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) || (c.Course != null && c.Course.Name.ToLower().Contains(s)));
        }

        var classes = await query
            .OrderBy(c => c.Name)
            .Select(c => new ClassGroupDto(
                c.Id,
                c.CourseId,
                c.Course != null ? c.Course.Name : null,
                c.Name,
                c.AcademicTerm,
                c.Schedule,
                c.MaxCapacity,
                c.TeacherId,
                c.Teacher != null ? c.Teacher.FullName : null,
                c.Enrollments.Count,
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(classes);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<ActionResult<ClassGroupDto>> Upsert([FromBody] UpsertClassRequest request)
    {
        ClassGroup classGroup;
        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.Classes.FindAsync(request.Id.Value);
            if (existing == null)
                return NotFound(new { message = "Turma não encontrada." });

            existing.CourseId = request.CourseId;
            existing.Name = request.Name;
            existing.AcademicTerm = request.AcademicTerm;
            existing.Schedule = request.Schedule;
            existing.MaxCapacity = request.MaxCapacity;
            existing.TeacherId = request.TeacherId;
            classGroup = existing;
        }
        else
        {
            classGroup = new ClassGroup
            {
                CourseId = request.CourseId,
                Name = request.Name,
                AcademicTerm = request.AcademicTerm,
                Schedule = request.Schedule,
                MaxCapacity = request.MaxCapacity,
                TeacherId = request.TeacherId
            };
            _context.Classes.Add(classGroup);
        }

        await _context.SaveChangesAsync();

        var course = await _context.Courses.FindAsync(classGroup.CourseId);
        var teacher = classGroup.TeacherId.HasValue ? await _context.Users.FindAsync(classGroup.TeacherId.Value) : null;

        return Ok(new ClassGroupDto(
            classGroup.Id,
            classGroup.CourseId,
            course?.Name,
            classGroup.Name,
            classGroup.AcademicTerm,
            classGroup.Schedule,
            classGroup.MaxCapacity,
            classGroup.TeacherId,
            teacher?.FullName,
            0,
            classGroup.CreatedAt
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var classGroup = await _context.Classes.FindAsync(id);
        if (classGroup == null)
            return NotFound(new { message = "Turma não encontrada." });

        _context.Classes.Remove(classGroup);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
