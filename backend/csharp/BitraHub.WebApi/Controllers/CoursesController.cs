using BitraHub.Application.DTOs;
using BitraHub.Domain.Common;
using BitraHub.Domain.Entities;
using BitraHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitraHub.WebApi.Controllers;

[ApiController]
[Route("api/v1/courses")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly BitraHubDbContext _context;

    public CoursesController(BitraHubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> List()
    {
        var courses = await _context.Courses
            .Include(c => c.Classes)
                .ThenInclude(cl => cl.Enrollments)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CourseDto(
                c.Id,
                c.Name,
                c.Description,
                c.Category,
                c.WorkloadHours,
                c.Classes.Count,
                c.Classes.SelectMany(cl => cl.Enrollments).Count(),
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(courses);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<ActionResult<CourseDto>> Upsert([FromBody] UpsertCourseRequest request)
    {
        Course course;
        if (request.Id.HasValue && request.Id.Value != Guid.Empty)
        {
            var existing = await _context.Courses.FindAsync(request.Id.Value);
            if (existing == null)
                return NotFound(new { message = "Curso não encontrado." });

            existing.Name = request.Name;
            existing.Description = request.Description;
            existing.Category = request.Category;
            existing.WorkloadHours = request.WorkloadHours;
            course = existing;
        }
        else
        {
            course = new Course
            {
                Name = request.Name,
                Description = request.Description,
                Category = request.Category,
                WorkloadHours = request.WorkloadHours
            };
            _context.Courses.Add(course);
        }

        await _context.SaveChangesAsync();

        return Ok(new CourseDto(
            course.Id,
            course.Name,
            course.Description,
            course.Category,
            course.WorkloadHours,
            0,
            0,
            course.CreatedAt
        ));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin},{Roles.Coordinator}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var course = await _context.Courses
            .Include(c => c.Classes)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (course == null)
            return NotFound(new { message = "Curso não encontrado." });

        if (course.Classes.Any())
        {
            return BadRequest(new
            {
                message = $"Não é possível excluir o curso '{course.Name}' porque existem {course.Classes.Count} turma(s) vinculada(s). Exclua ou transfira as turmas antes de continuar."
            });
        }

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
